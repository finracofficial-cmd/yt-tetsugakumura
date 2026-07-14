/**
 * パイプライン統合エントリポイント
 *
 * 実行: npm run generate -- --topic="承認欲求"
 *   1. Claude API で台本(JSON)を生成 → src/data/script.json
 *   2. TTS で音声を生成し実測秒数から尺を計算 → public/audio/*.mp3, src/data/timing.json
 *   3. (--render 指定時) Remotion をサブプロセスで起動し MP4 を書き出し → out/video.mp4
 *
 * GitHub Actions ではレンダリングを独立ステップ（npx remotion render）として
 * 実行するため、デフォルトでは 1〜2 のみを行う。
 */
import { spawnSync } from "node:child_process";
import { generateScript, resolveTopic } from "./generator/generateScript";
import { generateAudio } from "./generator/generateAudio";

const OUTPUT_PATH = "out/video.mp4";

async function main(): Promise<void> {
  const topic = resolveTopic();
  const shouldRender =
    process.argv.includes("--render") || process.env.RENDER === "true";

  // 1. 台本生成
  const script = await generateScript(topic);

  // 2. 音声合成 + 尺の計算
  const timing = await generateAudio();

  // 3. レンダリング（任意）
  if (shouldRender) {
    console.log(`[pipeline] Remotion でレンダリング中... -> ${OUTPUT_PATH}`);
    const result = spawnSync(
      "npx",
      ["remotion", "render", "src/remotion/index.ts", "Main", OUTPUT_PATH],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error(`[pipeline] remotion render が失敗しました (exit=${result.status})`);
    }
  } else {
    console.log(
      "[pipeline] レンダリングはスキップしました。`npm run render` または --render で実行できます。",
    );
  }

  console.log("\n========================================");
  console.log(`  ${script.title}`);
  console.log(`  ${(timing.totalDurationInFrames / timing.fps / 60).toFixed(1)}分 / ${script.scenes.length}シーン`);
  console.log("========================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
