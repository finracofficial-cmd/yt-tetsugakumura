/**
 * 音声サンプル一括生成ツール（リアルな男性ナレーション候補）
 *
 * OpenAI TTS と VOICEVOX の男性ボイス候補で同じサンプル文を読み上げた
 * mp3 を previews/voice-samples/ に生成する。GitHub上で再生して聴き比べ、
 * 採用する組み合わせを Repository Variables に設定する運用を想定:
 *   - OpenAI:   TTS_PROVIDER=openai(既定), OPENAI_TTS_MODEL, OPENAI_TTS_VOICE
 *   - VOICEVOX: TTS_PROVIDER=voicevox, VOICEVOX_SPEAKER（スタイルID）
 *
 * 実行: npm run voice-samples（OpenAI分は要 OPENAI_API_KEY。
 *       VOICEVOX分は VOICEVOX_URL のエンジンが起動している場合のみ生成）
 */
import OpenAI from "openai";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { elevenLabsSpeech, voicevoxSpeech } from "./generateAudio";

const OUTPUT_DIR = "previews/voice-samples";
const SPEED = Number(process.env.OPENAI_TTS_SPEED || "0.95");
const VOICEVOX_URL = process.env.VOICEVOX_URL || "http://127.0.0.1:50021";
const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";

const SAMPLE_TEXT =
  process.env.VOICE_SAMPLE_TEXT ||
  "深夜2時。モニターの光だけが、部屋を照らしている。我々はなぜ、眠りを削ってまで、他人の人生を眺めてしまうのだろうか。答えは単純だ。そういう風に、できているからである。";

const NARRATION_INSTRUCTIONS =
  "低く落ち着いたトーンの、感情を抑えた思索的なドキュメンタリーのナレーション。自然な速度で、間延びさせず淡々と。";

/** OpenAIの男性・低音寄りボイス候補 */
const OPENAI_CANDIDATES: { model: string; voices: string[] }[] = [
  { model: "tts-1-hd", voices: ["onyx", "echo"] },
  { model: "gpt-4o-mini-tts", voices: ["onyx", "echo", "ash", "ballad", "verse"] },
];

/** VOICEVOXの男性話者候補（/speakers から名前で解決する） */
const VOICEVOX_CANDIDATES = ["青山龍星", "玄野武宏", "剣崎雌雄", "麒ヶ島宗麟"];

/** ElevenLabsの男性・低音寄りプリメイドボイス候補（multilingual v2は日本語対応） */
const ELEVENLABS_CANDIDATES: { name: string; voiceId: string }[] = [
  { name: "George", voiceId: "JBFqnCBsd6RMkjVDRZzb" },
  { name: "Daniel", voiceId: "onwK4e9ZLuTAKqWW03F9" },
  { name: "Adam", voiceId: "pNInz6obpgDQGcFmaJgB" },
  { name: "Brian", voiceId: "nPczCjzI2devNBz1zQrb" },
];

/**
 * Voice Library で見つけたボイスを試聴リストに追加する。
 * ELEVENLABS_VOICE_IDS="名前=ボイスID,名前2=ボイスID2"（名前省略可: "ボイスID,ボイスID2"）
 * ※ コミュニティボイスはElevenLabsのサイトで「Add to My Voices」してからIDを指定すること。
 */
function extraElevenLabsCandidates(): { name: string; voiceId: string }[] {
  const raw = process.env.ELEVENLABS_VOICE_IDS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const [a, b] = entry.split("=").map((s) => s.trim());
      return b ? { name: a, voiceId: b } : { name: a.slice(0, 8), voiceId: a };
    });
}

async function generateElevenLabsSamples(): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) {
    console.warn("[voiceSamples] ELEVENLABS_API_KEY 未設定のためElevenLabsサンプルをスキップ。");
    return;
  }
  const candidates = [...ELEVENLABS_CANDIDATES, ...extraElevenLabsCandidates()];
  for (const { name, voiceId } of candidates) {
    const fileName = `elevenlabs--${name}--${voiceId}.mp3`;
    try {
      const buffer = await elevenLabsSpeech(SAMPLE_TEXT, apiKey, voiceId);
      writeFileSync(join(OUTPUT_DIR, fileName), buffer);
      console.log(`  OK: ${OUTPUT_DIR}/${fileName}`);
    } catch (err) {
      console.warn(`  失敗: ${fileName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function generateOpenAiSamples(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) {
    console.warn("[voiceSamples] OPENAI_API_KEY 未設定のためOpenAIサンプルをスキップ。");
    return;
  }
  const client = new OpenAI({ apiKey });

  for (const { model, voices } of OPENAI_CANDIDATES) {
    for (const voice of voices) {
      const fileName = `openai--${model}--${voice}.mp3`;
      try {
        const response = await client.audio.speech.create({
          model,
          voice,
          input: SAMPLE_TEXT,
          response_format: "mp3",
          speed: SPEED,
          ...(model.startsWith("gpt-4o") ? { instructions: NARRATION_INSTRUCTIONS } : {}),
        });
        writeFileSync(join(OUTPUT_DIR, fileName), Buffer.from(await response.arrayBuffer()));
        console.log(`  OK: ${OUTPUT_DIR}/${fileName}`);
      } catch (err) {
        console.warn(`  失敗: ${fileName}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}

async function generateVoicevoxSamples(): Promise<void> {
  let speakers: { name: string; styles: { name: string; id: number }[] }[];
  try {
    const res = await fetch(`${VOICEVOX_URL}/speakers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    speakers = (await res.json()) as typeof speakers;
  } catch {
    console.warn(
      `[voiceSamples] VOICEVOXエンジン(${VOICEVOX_URL})に接続できないためVOICEVOXサンプルをスキップ。`,
    );
    return;
  }

  for (const name of VOICEVOX_CANDIDATES) {
    const speaker = speakers.find((s) => s.name === name);
    const style =
      speaker?.styles.find((st) => st.name === "ノーマル") ?? speaker?.styles[0];
    if (!speaker || !style) {
      console.warn(`  スキップ: VOICEVOXに話者「${name}」が見つかりません`);
      continue;
    }
    const fileName = `voicevox--${name}--id${style.id}.mp3`;
    try {
      const wav = await voicevoxSpeech(SAMPLE_TEXT, style.id, SPEED);
      const wavPath = join(OUTPUT_DIR, `.tmp-${style.id}.wav`);
      writeFileSync(wavPath, wav);
      execFileSync(FFMPEG, [
        "-hide_banner", "-loglevel", "error", "-y",
        "-i", wavPath,
        "-c:a", "libmp3lame", "-b:a", "160k",
        join(OUTPUT_DIR, fileName),
      ]);
      rmSync(wavPath);
      console.log(`  OK: ${OUTPUT_DIR}/${fileName} (スタイルID=${style.id})`);
    } catch (err) {
      console.warn(`  失敗: ${fileName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export async function generateVoiceSamples(): Promise<void> {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`[voiceSamples] サンプル文: ${SAMPLE_TEXT}`);
  await generateOpenAiSamples();
  await generateVoicevoxSamples();
  await generateElevenLabsSamples();
  console.log(
    "[voiceSamples] 完了。GitHub上で各mp3を再生して聴き比べ、採用する組み合わせを Repository Variables に設定してください。",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateVoiceSamples().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
