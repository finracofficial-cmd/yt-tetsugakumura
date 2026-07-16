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

// 環境変数はGitHub Actionsから空文字で渡ることがあるため || でデフォルトに落とす
/**
 * "openai" | "voicevox" | "elevenlabs"
 * 未指定時は ELEVENLABS_API_KEY があれば elevenlabs、なければ openai を自動選択。
 */
const TTS_PROVIDER =
  process.env.TTS_PROVIDER ||
  (process.env.ELEVENLABS_API_KEY?.trim() ? "elevenlabs" : "openai");
/** 正式採用: gpt-4o-mini-tts × echo（話し方指示が効く4o系 + 落ち着いた男性声） */
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const TTS_VOICE = process.env.OPENAI_TTS_VOICE || "echo";
/**
 * 再生テンポ。tts-1系はAPIのspeed、gpt-4o系はAPIが速度指定に対応しないため
 * ffmpegのatempoフィルタで確実に適用する（VOICEVOXはspeedScale）。
 */
const TTS_SPEED = Number(process.env.OPENAI_TTS_SPEED || "1.1");
/** gpt-4o系モデルのみ有効な話し方の指示 */
const TTS_INSTRUCTIONS =
  process.env.OPENAI_TTS_INSTRUCTIONS ||
  "低めの落ち着いたトーンのドキュメンタリーナレーション。やや速めのテンポで歯切れよく、間延びさせずに読み上げる。";

/** VOICEVOX設定（無料・ローカルエンジン。CIではサービスコンテナで起動） */
const VOICEVOX_URL = process.env.VOICEVOX_URL || "http://127.0.0.1:50021";
/** デフォルトは青山龍星（ノーマル）= 深めの男性ナレーション向き */
const VOICEVOX_SPEAKER = Number(process.env.VOICEVOX_SPEAKER || "13");

/** ElevenLabs設定（ほぼ人間品質。ELEVENLABS_API_KEY の設定だけで自動有効化） */
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
/**
 * 正式採用ボイス（ユーザーがVoice Libraryから選定した日本語男性ボイス）。
 * 差し替えは Repository Variables の ELEVENLABS_VOICE_ID で。
 * ※ Voice Libraryのボイスは、契約アカウントで「Add to My Voices」しておくこと。
 */
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "ss9cJxDAEMXP4wfQ3GPr";

/** 文法ポーズ（ミリ秒）。テンポ重視で短めに設定 */
const PAUSE_COMMA_MS = 180;
const PAUSE_PERIOD_MS = 400;
const PAUSE_ELLIPSIS_MS = 800;
/** シーン末尾の余韻: 通常 / 幕の変わり目・最終シーン */
const SCENE_TAIL_MS = 300;
const SCENE_TAIL_ACT_CHANGE_MS = 700;
/** TTSスキップ時の推定: 日本語 ≒ 6.5文字/秒 × テンポ */
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

/**
 * VOICEVOX TTS（無料）。audio_query → synthesis の2段階でwavを得る。
 * 男性ナレーション向きの話者: 青山龍星(13), 玄野武宏(11) など。
 */
export async function voicevoxSpeech(
  text: string,
  speaker: number = VOICEVOX_SPEAKER,
  speedScale: number = TTS_SPEED,
): Promise<Buffer> {
  const queryRes = await fetch(
    `${VOICEVOX_URL}/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`,
    { method: "POST" },
  );
  if (!queryRes.ok) {
    throw new Error(`VOICEVOX audio_query error ${queryRes.status}: ${await queryRes.text()}`);
  }
  const query = (await queryRes.json()) as Record<string, unknown>;
  query.speedScale = speedScale;

  const synthRes = await fetch(`${VOICEVOX_URL}/synthesis?speaker=${speaker}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) {
    throw new Error(`VOICEVOX synthesis error ${synthRes.status}: ${await synthRes.text()}`);
  }
  return Buffer.from(await synthRes.arrayBuffer());
}

/**
 * ElevenLabs TTS。multilingual v2 は日本語でもほぼ人間品質。
 * 速度はAPIでは弄らず、後段のffmpeg atempoで一括適用する。
 */
export async function elevenLabsSpeech(
  text: string,
  apiKey: string,
  voiceId: string = ELEVENLABS_VOICE_ID,
): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs error ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
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
  const openaiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY?.replace(/\s+/g, "");

  writeAssetsManifest();

  const openaiClient = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
  let ttsEnabled =
    TTS_PROVIDER === "voicevox"
      ? true
      : TTS_PROVIDER === "elevenlabs"
        ? Boolean(elevenLabsKey)
        : Boolean(openaiClient);

  /** プロバイダに応じて1フラグメントを音声化する（戻り値は音声バッファと拡張子） */
  const synthesize = async (
    text: string,
  ): Promise<{ buffer: Buffer; ext: "mp3" | "wav" }> => {
    if (TTS_PROVIDER === "voicevox") {
      return { buffer: await voicevoxSpeech(text), ext: "wav" };
    }
    if (TTS_PROVIDER === "elevenlabs") {
      if (!elevenLabsKey) throw new Error("ELEVENLABS_API_KEY が設定されていません。");
      return { buffer: await elevenLabsSpeech(text, elevenLabsKey), ext: "mp3" };
    }
    if (!openaiClient) throw new Error("OPENAI_API_KEY が設定されていません。");
    const isGpt4o = TTS_MODEL.startsWith("gpt-4o");
    const response = await openaiClient.audio.speech.create({
      model: TTS_MODEL,
      voice: TTS_VOICE,
      input: text,
      response_format: "mp3",
      // speed はtts-1系のみ有効。gpt-4o系はffmpegのatempoで速度を適用する
      ...(isGpt4o ? { instructions: TTS_INSTRUCTIONS } : { speed: TTS_SPEED }),
    });
    return { buffer: Buffer.from(await response.arrayBuffer()), ext: "mp3" };
  };

  /**
   * gpt-4o系とElevenLabsは、wav変換時にffmpegでテンポ加工を挟む
   * （tts-1/VOICEVOXはAPI側のspeed指定で適用済み）
   */
  const needsAtempo =
    (TTS_PROVIDER === "openai" && TTS_MODEL.startsWith("gpt-4o")) ||
    TTS_PROVIDER === "elevenlabs";
  const atempoArgs =
    needsAtempo && TTS_SPEED !== 1 ? ["-filter:a", `atempo=${TTS_SPEED}`] : [];

  if (!ttsEnabled) {
    console.warn(
      "[generateAudio] TTSのAPIキーが未設定のためスキップし、推定尺で同期マップを生成します。",
    );
  } else {
    const desc =
      TTS_PROVIDER === "voicevox"
        ? `provider=voicevox, speaker=${VOICEVOX_SPEAKER}, speed=${TTS_SPEED}`
        : TTS_PROVIDER === "elevenlabs"
          ? `provider=elevenlabs, model=${ELEVENLABS_MODEL}, voice=${ELEVENLABS_VOICE_ID}, speed=${TTS_SPEED}`
          : `provider=openai, model=${TTS_MODEL}, voice=${TTS_VOICE}, speed=${TTS_SPEED}`;
    console.log(
      `[generateAudio] TTS音声を生成中... (${desc}, scenes=${script.scenes.length})`,
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

    if (ttsEnabled) {
      try {
        const wavList: string[] = [];
        timedFragments = [];
        for (let f = 0; f < fragments.length; f++) {
          const frag = fragments[f];
          const wavPath = join(tmp, `s${scene.id}-f${f}.wav`);

          const { buffer, ext } = await synthesize(frag.text);
          const rawPath = join(tmp, `s${scene.id}-f${f}-raw.${ext}`);
          writeFileSync(rawPath, buffer);
          // 全フラグメントを同一フォーマットのwavに揃えて結合可能にする（必要ならテンポ加工）
          ffmpeg([
            "-i", rawPath,
            ...atempoArgs,
            "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le",
            wavPath,
          ]);

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
        ttsEnabled = false;
        audioFile = null;
      }
    }

    if (!ttsEnabled || !audioFile) {
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
