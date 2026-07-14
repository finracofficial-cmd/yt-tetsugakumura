/**
 * Step 2: 音声合成モジュール
 *
 * script.json の各シーンの narration を OpenAI TTS に投げてシーンごとの mp3 を生成し、
 * 実測した音声秒数から各シーンのフレーム数を算出して src/data/timing.json に書き出す。
 * これが音声と映像の同期の要となる。
 *
 * OPENAI_API_KEY が未設定の場合はTTSをスキップし、文字数ベースの推定尺で
 * timing.json を生成する（無音のプレビュー用ビルドが可能）。
 *
 * 実行: npm run generate:audio
 */
import OpenAI from "openai";
import { parseFile } from "music-metadata";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  AUDIO_DIR,
  FPS,
  SCRIPT_JSON_PATH,
  TIMING_JSON_PATH,
  type SceneTiming,
  type Timing,
  type VideoScript,
} from "./types";

const TTS_MODEL = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
/** 落ち着いた低めの声。alloy でも可 */
const TTS_VOICE = process.env.OPENAI_TTS_VOICE ?? "onyx";
/** 読み上げ速度（1.0=標準）。間延び防止のためやや速める */
const TTS_SPEED = Number(process.env.OPENAI_TTS_SPEED ?? "1.15");
/** シーン間の「間」。音声の後に足す余白秒数 */
const SCENE_PADDING_SEC = 0.5;
/** TTSスキップ時の推定: 日本語の読み上げ ≒ 6.5文字/秒 */
const ESTIMATED_CHARS_PER_SEC = 6.5;

export async function generateAudio(): Promise<Timing> {
  const script = JSON.parse(readFileSync(SCRIPT_JSON_PATH, "utf-8")) as VideoScript;
  // Secretsへの貼り付け時に混入しがちな改行・空白を除去する
  const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");
  const useTts = Boolean(apiKey);

  if (!useTts) {
    console.warn(
      "[generateAudio] OPENAI_API_KEY が未設定のためTTSをスキップし、文字数から尺を推定します。",
    );
  } else {
    console.log(
      `[generateAudio] TTSで音声を生成中... (model=${TTS_MODEL}, voice=${TTS_VOICE}, scenes=${script.scenes.length})`,
    );
    mkdirSync(AUDIO_DIR, { recursive: true });
  }

  let client = useTts ? new OpenAI({ apiKey }) : null;
  const sceneTimings: SceneTiming[] = [];

  for (const scene of script.scenes) {
    let durationSec: number;
    let audioFile: string | null = null;

    if (client) {
      try {
        const fileName = `scene-${scene.id}.mp3`;
        const filePath = join(AUDIO_DIR, fileName);

        const response = await client.audio.speech.create({
          model: TTS_MODEL,
          voice: TTS_VOICE,
          input: scene.narration,
          response_format: "mp3",
          speed: TTS_SPEED,
          // gpt-4o-mini-tts は instructions で話し方を制御できる（旧tts-1系では無視される）
          instructions:
            "落ち着いた低いトーンの、感情を抑えた思索的なドキュメンタリーのナレーション。ただしテンポは自然な速度を保ち、間延びさせず淡々と読み上げてください。",
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(filePath, buffer);

        const metadata = await parseFile(filePath);
        durationSec = metadata.format.duration ?? estimateDuration(scene.narration);
        audioFile = `audio/${fileName}`;
        console.log(`  scene ${scene.id}: ${durationSec.toFixed(2)}s -> ${filePath}`);
      } catch (err) {
        // クォータ切れ・認証失敗など回復不能なエラーは以降のTTSを打ち切り、
        // 無音（推定尺）にフォールバックしてパイプラインを完走させる
        console.warn(
          `[generateAudio] 警告: TTSに失敗したため、以降は無音・推定尺で続行します: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        client = null;
        durationSec = estimateDuration(scene.narration);
      }
    } else {
      durationSec = estimateDuration(scene.narration);
    }

    sceneTimings.push({
      id: scene.id,
      durationInFrames: Math.ceil((durationSec + SCENE_PADDING_SEC) * FPS),
      audioFile,
    });
  }

  const timing: Timing = {
    fps: FPS,
    totalDurationInFrames: sceneTimings.reduce((sum, s) => sum + s.durationInFrames, 0),
    scenes: sceneTimings,
  };

  mkdirSync(dirname(TIMING_JSON_PATH), { recursive: true });
  writeFileSync(TIMING_JSON_PATH, JSON.stringify(timing, null, 2) + "\n", "utf-8");

  console.log(
    `[generateAudio] 完了: ${TIMING_JSON_PATH} (合計 ${(
      timing.totalDurationInFrames / FPS
    ).toFixed(1)}秒 / ${timing.totalDurationInFrames}フレーム)`,
  );
  return timing;
}

function estimateDuration(narration: string): number {
  return Math.max(3, narration.length / ESTIMATED_CHARS_PER_SEC);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateAudio().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
