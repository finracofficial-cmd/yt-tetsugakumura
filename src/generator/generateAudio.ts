/**
 * Step 2: 音声合成モジュール（文法ベースの「間」挿入つき）
 *
 * 台本の各シーンを句読点で分割し、フラグメントごとにTTSを実行。
 * 文法に応じたミリ秒単位の無音バッファを挟んでFFmpegで結合し、
 * シーンごとの音声トラックと完全同期マップ（sync-map.json）を出力する。
 *
 *   - 読点（、）の直後: 400ms の無音
 *   - 句点（。）の直後: 1000ms の無音
 *   - 三点リーダー（…）: 1800ms の無音
 *   - 幕の変わり目・最終シーン末尾: 1800ms の長い余韻
 *
 * OPENAI_API_KEY 未設定・TTS失敗時は文字数ベースの推定尺にフォールバックする。
 *
 * 実行: npm run generate:audio
 */
import OpenAI from "openai";
import { parseFile } from "music-metadata";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  ASSETS_DIR,
  ASSETS_JSON_PATH,
  AUDIO_DIR,
  FPS,
  SCRIPT_JSON_PATH,
  SYNC_MAP_PATH,
  type AssetsManifest,
  type SceneSync,
  type SyncMap,
  type SyncSegment,
  type VideoScript,
} from "./types";

const TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "tts-1-hd";
/** 最も深く落ち着いた低音男性ボイス */
const TTS_VOICE = process.env.OPENAI_TTS_VOICE ?? "onyx";
/** 通常より5%遅くして語りの重厚感を出す */
const TTS_SPEED = Number(process.env.OPENAI_TTS_SPEED ?? "0.95");

/** 文法ポーズ（ミリ秒） */
const PAUSE_COMMA_MS = 400;
const PAUSE_PERIOD_MS = 1000;
const PAUSE_ELLIPSIS_MS = 1800;
/** シーン末尾の余韻: 通常 / 幕の変わり目・最終シーン */
const SCENE_TAIL_MS = 1000;
const SCENE_TAIL_ACT_CHANGE_MS = 1800;
/** TTSスキップ時の推定: 日本語 ≒ 6.5文字/秒（speed 0.95で割り引く） */
const ESTIMATED_CHARS_PER_SEC = 6.5 * TTS_SPEED;

interface Fragment {
  text: string;
  pauseMs: number;
}

/** ナレーションを句読点で分割し、それぞれの後に入れるポーズを決める */
export function splitIntoFragments(narration: string): Fragment[] {
  const parts = narration
    .split(/(?<=[。、！？]|…+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return parts.map((text) => {
    if (/…+$/.test(text)) return { text, pauseMs: PAUSE_ELLIPSIS_MS };
    const last = text.slice(-1);
    if (last === "、") return { text, pauseMs: PAUSE_COMMA_MS };
    if (last === "。" || last === "！" || last === "？")
      return { text, pauseMs: PAUSE_PERIOD_MS };
    return { text, pauseMs: PAUSE_COMMA_MS };
  });
}

/** フラグメント列を文（。区切り）単位の字幕セグメントにまとめる */
function groupIntoSegments(
  fragments: { text: string; durationMs: number; pauseMs: number }[],
): { text: string; startMs: number; durationMs: number }[] {
  const segments: { text: string; startMs: number; durationMs: number }[] = [];
  let cursorMs = 0;
  let current = { text: "", startMs: 0, durationMs: 0 };

  for (const frag of fragments) {
    if (current.text === "") current.startMs = cursorMs;
    current.text += frag.text;
    current.durationMs = cursorMs + frag.durationMs - current.startMs;
    cursorMs += frag.durationMs + frag.pauseMs;

    const isSentenceEnd = /[。！？]$/.test(frag.text) || /…+$/.test(frag.text);
    if (isSentenceEnd) {
      segments.push({ ...current });
      current = { text: "", startMs: 0, durationMs: 0 };
    }
  }
  if (current.text !== "") segments.push(current);
  return segments;
}

/** システムのffmpegを使う（GitHub Actionsではaptで導入済み）。FFMPEG_PATHで上書き可 */
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";

function ffmpeg(args: string[]): void {
  execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", ...args]);
}

/** public/assets/ の音響アセットの有無を検査してマニフェストを書き出す */
export function writeAssetsManifest(): AssetsManifest {
  const manifest: AssetsManifest = {
    bgm: existsSync(join(ASSETS_DIR, "bgm.mp3")),
    noise: existsSync(join(ASSETS_DIR, "ambient-noise.mp3")),
    sfx: existsSync(join(ASSETS_DIR, "sfx-transition.mp3")),
  };
  mkdirSync(dirname(ASSETS_JSON_PATH), { recursive: true });
  writeFileSync(ASSETS_JSON_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
  console.log(
    `[generateAudio] 音響アセット: BGM=${manifest.bgm} ノイズ=${manifest.noise} SFX=${manifest.sfx}`,
  );
  return manifest;
}

export async function generateAudio(): Promise<SyncMap> {
  const script = JSON.parse(readFileSync(SCRIPT_JSON_PATH, "utf-8")) as VideoScript;
  const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");

  writeAssetsManifest();

  let client = apiKey ? new OpenAI({ apiKey }) : null;
  if (!client) {
    console.warn(
      "[generateAudio] OPENAI_API_KEY が未設定のためTTSをスキップし、推定尺で同期マップを生成します。",
    );
  } else {
    console.log(
      `[generateAudio] TTS音声を生成中... (model=${TTS_MODEL}, voice=${TTS_VOICE}, speed=${TTS_SPEED}, scenes=${script.scenes.length})`,
    );
    mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const tmp = mkdtempSync(join(tmpdir(), "tts-"));
  const silenceCache = new Map<number, string>();
  const silenceWav = (ms: number): string => {
    const cached = silenceCache.get(ms);
    if (cached) return cached;
    const path = join(tmp, `silence-${ms}.wav`);
    ffmpeg([
      "-f", "lavfi",
      "-i", "anullsrc=r=24000:cl=mono",
      "-t", String(ms / 1000),
      "-c:a", "pcm_s16le",
      path,
    ]);
    silenceCache.set(ms, path);
    return path;
  };

  const sceneSyncs: SceneSync[] = [];
  let globalMs = 0;

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const nextScene = script.scenes[i + 1];
    const isActChange = !nextScene || nextScene.act !== scene.act;
    const tailMs = isActChange ? SCENE_TAIL_ACT_CHANGE_MS : SCENE_TAIL_MS;

    const fragments = splitIntoFragments(scene.narration);
    // 最後のフラグメントの文法ポーズはシーン末尾の余韻に置き換える
    if (fragments.length > 0) fragments[fragments.length - 1].pauseMs = tailMs;

    let audioFile: string | null = null;
    let timedFragments: { text: string; durationMs: number; pauseMs: number }[] = [];
    let sceneDurationMs = 0;

    if (client) {
      try {
        const wavList: string[] = [];
        timedFragments = [];
        for (let f = 0; f < fragments.length; f++) {
          const frag = fragments[f];
          const mp3Path = join(tmp, `s${scene.id}-f${f}.mp3`);
          const wavPath = join(tmp, `s${scene.id}-f${f}.wav`);

          const response = await client.audio.speech.create({
            model: TTS_MODEL,
            voice: TTS_VOICE,
            input: frag.text,
            response_format: "mp3",
            speed: TTS_SPEED,
          });
          writeFileSync(mp3Path, Buffer.from(await response.arrayBuffer()));
          // 全フラグメントを同一フォーマットのwavに揃えて結合可能にする
          ffmpeg(["-i", mp3Path, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", wavPath]);

          const meta = await parseFile(wavPath);
          const durationMs = Math.round((meta.format.duration ?? 0) * 1000);
          timedFragments.push({ text: frag.text, durationMs, pauseMs: frag.pauseMs });

          wavList.push(wavPath);
          if (frag.pauseMs > 0) wavList.push(silenceWav(frag.pauseMs));
        }

        // concatデマルチプレクサで結合し、シーンのmp3にエンコード
        const listPath = join(tmp, `s${scene.id}-list.txt`);
        writeFileSync(
          listPath,
          wavList.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n") + "\n",
        );
        const sceneWav = join(tmp, `s${scene.id}.wav`);
        ffmpeg(["-f", "concat", "-safe", "0", "-i", listPath, "-c:a", "pcm_s16le", sceneWav]);

        const fileName = `scene-${scene.id}.mp3`;
        ffmpeg(["-i", sceneWav, "-c:a", "libmp3lame", "-b:a", "160k", join(AUDIO_DIR, fileName)]);
        audioFile = `audio/${fileName}`;

        const finalMeta = await parseFile(join(AUDIO_DIR, fileName));
        sceneDurationMs = Math.round(
          (finalMeta.format.duration ?? 0) * 1000 ||
            timedFragments.reduce((s, x) => s + x.durationMs + x.pauseMs, 0),
        );
        console.log(
          `  scene ${scene.id}: ${(sceneDurationMs / 1000).toFixed(2)}s (${fragments.length}フラグメント) -> ${AUDIO_DIR}/${fileName}`,
        );
      } catch (err) {
        console.warn(
          `[generateAudio] 警告: TTSに失敗したため、以降は無音・推定尺で続行します: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        client = null;
        audioFile = null;
      }
    }

    if (!client || !audioFile) {
      // 推定フォールバック
      timedFragments = fragments.map((frag) => ({
        text: frag.text,
        durationMs: Math.round((frag.text.length / ESTIMATED_CHARS_PER_SEC) * 1000),
        pauseMs: frag.pauseMs,
      }));
      sceneDurationMs = timedFragments.reduce((s, x) => s + x.durationMs + x.pauseMs, 0);
      audioFile = null;
    }

    const segments: SyncSegment[] = groupIntoSegments(timedFragments).map((seg) => ({
      text: seg.text,
      startFrame: Math.round((seg.startMs / 1000) * FPS),
      durationInFrames: Math.max(1, Math.round((seg.durationMs / 1000) * FPS)),
    }));

    const durationInFrames = Math.ceil((sceneDurationMs / 1000) * FPS);
    sceneSyncs.push({
      id: scene.id,
      startMs: globalMs,
      startFrame: Math.round((globalMs / 1000) * FPS),
      durationMs: sceneDurationMs,
      durationInFrames,
      audioFile,
      segments,
    });
    globalMs += sceneDurationMs;
  }

  rmSync(tmp, { recursive: true, force: true });

  const syncMap: SyncMap = {
    fps: FPS,
    totalDurationInFrames: sceneSyncs.reduce((s, x) => s + x.durationInFrames, 0),
    scenes: sceneSyncs,
  };

  mkdirSync(dirname(SYNC_MAP_PATH), { recursive: true });
  writeFileSync(SYNC_MAP_PATH, JSON.stringify(syncMap, null, 2) + "\n", "utf-8");

  console.log(
    `[generateAudio] 完了: ${SYNC_MAP_PATH} (合計 ${(globalMs / 1000 / 60).toFixed(1)}分 / ${syncMap.totalDurationInFrames}フレーム)`,
  );
  return syncMap;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateAudio().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
