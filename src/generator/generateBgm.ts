/**
 * BGM・環境音・転換SFXの自動生成
 *
 * 台本(script.json)の bgm_direction（テーマに合わせた英語の音楽指示）をもとに:
 *   - ELEVENLABS_API_KEY があれば ElevenLabs Music で台本に沿ったBGMを生成（約900クレジット/分）
 *   - なければ ffmpeg のシンセサイザで暗いアンビエント・ドローンを合成（無料）
 * 環境ノイズ(Room Tone)と転換SFXは常にffmpegで合成する（無料）。
 * いずれも public/assets/ に既にファイルが置いてある場合は上書きしない
 * （手動で用意した音源を優先する）。
 *
 * 実行: npm run generate:bgm（パイプラインでは台本生成後に自動実行）
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ASSETS_DIR, SCRIPT_JSON_PATH, type VideoScript } from "./types";

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg";
/** "elevenlabs"（キーがあれば自動選択） | "procedural"（強制ffmpeg） | "off"（BGM無し） */
const BGM_PROVIDER = process.env.BGM_PROVIDER || "";
/** ElevenLabs Music で生成するBGMの長さ（ミリ秒）。ループ再生されるので90秒で十分 */
const BGM_LENGTH_MS = Number(process.env.BGM_LENGTH_MS || "90000");

const BGM_PATH = join(ASSETS_DIR, "bgm.mp3");
const NOISE_PATH = join(ASSETS_DIR, "ambient-noise.mp3");
const SFX_PATH = join(ASSETS_DIR, "sfx-transition.mp3");

/** 台本が bgm_direction を持たない場合の既定の音楽指示 */
const DEFAULT_DIRECTION =
  "Dark minimal ambient underscore for a philosophical documentary. Slow evolving synth pads, sparse melancholic felt piano notes, quiet and contemplative.";

/** ElevenLabs Music API でBGMを生成する */
async function elevenLabsMusic(prompt: string, apiKey: string): Promise<Buffer> {
  const res = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      music_length_ms: Math.max(10000, Math.min(300000, BGM_LENGTH_MS)),
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs Music error ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * ffmpegでAマイナーの暗いアンビエント・ドローンを合成する（無料フォールバック）。
 * 各倍音にゆっくりしたLFOをかけ、うなり（わずかなデチューン）で揺らぎを作る。
 */
function proceduralDrone(outPath: string): void {
  const expr = [
    "0.16*sin(2*PI*55.0*t)*(0.62+0.38*sin(2*PI*0.041*t))",
    "0.11*sin(2*PI*82.41*t)*(0.55+0.45*sin(2*PI*0.031*t+1.3))",
    "0.10*sin(2*PI*110.35*t)*(0.55+0.45*sin(2*PI*0.049*t+2.1))",
    "0.07*sin(2*PI*130.81*t)*(0.50+0.50*sin(2*PI*0.027*t+3.4))",
    "0.06*sin(2*PI*164.81*t)*(0.50+0.50*sin(2*PI*0.036*t+4.2))",
    "0.045*sin(2*PI*220.6*t)*(0.45+0.55*sin(2*PI*0.022*t+0.7))",
  ].join("+");
  execFileSync(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi",
    "-i", `aevalsrc=${expr}:s=44100:d=96`,
    "-af",
    "lowpass=f=750,aecho=0.7:0.55:60|130:0.24|0.16,afade=t=in:d=2,afade=t=out:st=94:d=2,volume=1.6",
    "-c:a", "libmp3lame", "-b:a", "160k",
    outPath,
  ]);
}

/** 質感用のRoom Tone（ごく静かなブラウンノイズ） */
function proceduralRoomTone(outPath: string): void {
  execFileSync(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi",
    "-i", "anoisesrc=colour=brown:amplitude=0.28:seed=7:d=60",
    "-af", "lowpass=f=320,afade=t=in:d=1,afade=t=out:st=59:d=1,volume=0.8",
    "-c:a", "libmp3lame", "-b:a", "128k",
    outPath,
  ]);
}

/** シーン転換のSub Bass SFX（沈み込む低音） */
function proceduralTransitionSfx(outPath: string): void {
  execFileSync(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi",
    "-i", "aevalsrc=0.9*sin(2*PI*(52-16*t)*t)*exp(-2.4*t):s=44100:d=1.8",
    "-af", "lowpass=f=130,afade=t=in:d=0.02,volume=1.4",
    "-c:a", "libmp3lame", "-b:a", "128k",
    outPath,
  ]);
}

export async function generateBgm(): Promise<void> {
  if (BGM_PROVIDER === "off") {
    console.log("[generateBgm] BGM_PROVIDER=off のためスキップ。");
    return;
  }
  mkdirSync(ASSETS_DIR, { recursive: true });

  // 環境ノイズと転換SFX（無料・軽量なので無ければ常に合成する）
  if (!existsSync(NOISE_PATH)) {
    proceduralRoomTone(NOISE_PATH);
    console.log(`[generateBgm] Room Tone を合成: ${NOISE_PATH}`);
  }
  if (!existsSync(SFX_PATH)) {
    proceduralTransitionSfx(SFX_PATH);
    console.log(`[generateBgm] 転換SFX を合成: ${SFX_PATH}`);
  }

  if (existsSync(BGM_PATH)) {
    console.log(`[generateBgm] ${BGM_PATH} が既に存在するためBGM生成をスキップ（手動音源を優先）。`);
    return;
  }

  // 台本の音楽指示を読む（無ければ既定の暗いアンビエント）
  let direction = DEFAULT_DIRECTION;
  let theme = "";
  try {
    const script = JSON.parse(readFileSync(SCRIPT_JSON_PATH, "utf-8")) as VideoScript;
    if (script.bgm_direction && script.bgm_direction.trim().length > 0) {
      direction = script.bgm_direction.trim();
    }
    theme = script.theme ?? "";
  } catch {
    // script.json が無くても既定指示で続行
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.replace(/\s+/g, "");
  const useElevenLabs = Boolean(apiKey) && BGM_PROVIDER !== "procedural";

  if (useElevenLabs && apiKey) {
    const prompt =
      `${direction} ` +
      `Instrumental only, no vocals, no drums or very minimal percussion, ` +
      `quiet consistent dynamics suitable as a background loop under narration. ` +
      (theme ? `The video's theme: ${theme}` : "");
    try {
      console.log(`[generateBgm] ElevenLabs Music で生成中... (${BGM_LENGTH_MS / 1000}秒)`);
      console.log(`  prompt: ${prompt.slice(0, 140)}...`);
      const buffer = await elevenLabsMusic(prompt, apiKey);
      writeFileSync(BGM_PATH, buffer);
      console.log(`[generateBgm] 完了: ${BGM_PATH} (${(buffer.length / 1024).toFixed(0)}KB)`);
      return;
    } catch (err) {
      console.warn(
        `[generateBgm] ElevenLabs Music が失敗したためffmpeg合成にフォールバック: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else if (!apiKey) {
    console.log("[generateBgm] ELEVENLABS_API_KEY 未設定のためffmpegでドローンBGMを合成します。");
  }

  proceduralDrone(BGM_PATH);
  console.log(`[generateBgm] 完了（プロシージャル）: ${BGM_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateBgm().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
