/**
 * Step 1.5: シーンイラスト生成モジュール
 *
 * script.json のうち illustration / dialogue 型のシーンについて、
 * 台本AIが書いた image_prompt をもとに OpenAI の画像生成API で
 * フラットデザインのイラスト背景を生成し public/images/ に保存する。
 * シーンID→画像パスの対応表を src/data/images.json に書き出す。
 *
 * 生成に失敗したシーンは null となり、Remotion側はシルエット等の
 * フォールバック描画で対応する（パイプラインは止めない）。
 *
 * 実行: npm run generate:images
 */
import OpenAI from "openai";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  IMAGES_DIR,
  IMAGES_JSON_PATH,
  SCRIPT_JSON_PATH,
  type ImageManifest,
  type VideoScript,
} from "./types";

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
/** low | medium | high。品質と料金のバランス（mediumで1枚あたり約$0.06） */
const IMAGE_QUALITY = (process.env.OPENAI_IMAGE_QUALITY ?? "medium") as
  | "low"
  | "medium"
  | "high";

/**
 * 全シーンで統一する画風。台本AIのimage_promptの前に付与する。
 * 参考: フラットベクター × ダークトーン × ノワール調のYouTube解説アニメ画風
 */
const STYLE_PREFIX =
  "Flat vector illustration for a philosophical YouTube explainer video. " +
  "Dark cinematic mood: deep navy and charcoal palette with warm amber accent lighting. " +
  "Minimalist geometric shapes, clean silhouettes, film-noir atmosphere, subtle grain. " +
  "Absolutely no text, no letters, no logos, no watermarks. 16:9 composition. Scene: ";

export async function generateImages(): Promise<ImageManifest> {
  const script = JSON.parse(readFileSync(SCRIPT_JSON_PATH, "utf-8")) as VideoScript;
  const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");

  const targets = script.scenes.filter(
    (s) => s.visual.type === "illustration" || s.visual.type === "dialogue",
  );
  const manifest: ImageManifest = {};

  if (!apiKey) {
    console.warn(
      "[generateImages] OPENAI_API_KEY が未設定のため画像生成をスキップします（フォールバック描画になります）。",
    );
    for (const s of targets) manifest[String(s.id)] = null;
    writeManifest(manifest);
    return manifest;
  }

  const client = new OpenAI({ apiKey });
  mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(
    `[generateImages] イラストを生成中... (model=${IMAGE_MODEL}, quality=${IMAGE_QUALITY}, scenes=${targets.length})`,
  );

  let disabled = false;
  for (const scene of targets) {
    if (disabled) {
      manifest[String(scene.id)] = null;
      continue;
    }
    const prompt =
      STYLE_PREFIX +
      ("image_prompt" in scene.visual ? scene.visual.image_prompt : "");
    try {
      const result = await client.images.generate({
        model: IMAGE_MODEL,
        prompt,
        size: "1536x1024",
        quality: IMAGE_QUALITY,
        n: 1,
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error("画像データが返されませんでした");

      const fileName = `scene-${scene.id}.png`;
      writeFileSync(join(IMAGES_DIR, fileName), Buffer.from(b64, "base64"));
      manifest[String(scene.id)] = `images/${fileName}`;
      console.log(`  scene ${scene.id}: ${IMAGES_DIR}/${fileName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[generateImages] 警告: scene ${scene.id} の画像生成に失敗しました: ${message}`,
      );
      manifest[String(scene.id)] = null;
      // クォータ切れ・認証・モデル利用不可は以降も失敗するため打ち切る
      if (/quota|billing|401|403|verif|not allowed|must be verified/i.test(message)) {
        console.warn("[generateImages] 回復不能なエラーのため、以降の画像生成を打ち切ります。");
        disabled = true;
      }
    }
  }

  writeManifest(manifest);
  const generated = Object.values(manifest).filter(Boolean).length;
  console.log(
    `[generateImages] 完了: ${generated}/${targets.length}枚 -> ${IMAGES_JSON_PATH}`,
  );
  return manifest;
}

function writeManifest(manifest: ImageManifest): void {
  mkdirSync(dirname(IMAGES_JSON_PATH), { recursive: true });
  writeFileSync(IMAGES_JSON_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateImages().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
