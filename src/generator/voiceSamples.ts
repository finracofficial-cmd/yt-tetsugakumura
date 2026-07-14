/**
 * 音声サンプル一括生成ツール
 *
 * 候補となるボイス×モデルの組み合わせで同じサンプル文を読み上げたmp3を
 * previews/voice-samples/ に生成する。GitHub上でそのまま再生して聴き比べ、
 * 気に入ったものを Repository Variables（OPENAI_TTS_MODEL / OPENAI_TTS_VOICE）
 * に設定する運用を想定。
 *
 * 実行: npm run voice-samples（要 OPENAI_API_KEY）
 */
import OpenAI from "openai";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OUTPUT_DIR = "previews/voice-samples";
const SPEED = Number(process.env.OPENAI_TTS_SPEED || "0.95");

const SAMPLE_TEXT =
  process.env.VOICE_SAMPLE_TEXT ||
  "深夜2時。モニターの光だけが、部屋を照らしている。我々はなぜ、眠りを削ってまで、他人の人生を眺めてしまうのだろうか。答えは単純だ。そういう風に、できているからである。";

/** 試聴候補。低く落ち着いた声を中心に選定 */
const CANDIDATES: { model: string; voices: string[] }[] = [
  { model: "tts-1-hd", voices: ["onyx", "echo", "fable", "alloy", "nova"] },
  { model: "gpt-4o-mini-tts", voices: ["onyx", "ash", "ballad", "sage", "echo"] },
];

export async function generateVoiceSamples(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) throw new Error("OPENAI_API_KEY が設定されていません。");

  const client = new OpenAI({ apiKey });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`[voiceSamples] サンプル文: ${SAMPLE_TEXT}`);
  for (const { model, voices } of CANDIDATES) {
    for (const voice of voices) {
      const fileName = `${model}--${voice}.mp3`;
      try {
        const response = await client.audio.speech.create({
          model,
          voice,
          input: SAMPLE_TEXT,
          response_format: "mp3",
          speed: SPEED,
        });
        writeFileSync(join(OUTPUT_DIR, fileName), Buffer.from(await response.arrayBuffer()));
        console.log(`  OK: ${OUTPUT_DIR}/${fileName}`);
      } catch (err) {
        console.warn(
          `  失敗: ${fileName}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
  console.log(
    "[voiceSamples] 完了。GitHub上で各mp3を再生して聴き比べ、採用する組み合わせを Repository Variables の OPENAI_TTS_MODEL / OPENAI_TTS_VOICE に設定してください。",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateVoiceSamples().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
