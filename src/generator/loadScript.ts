/**
 * 外部（GitHub Gist / 生JSON URL）から台本を読み込むモジュール。
 *
 * 台本を手元で用意する運用向け。Claude での生成をスキップし、
 * 指定された Gist / URL の JSON を script.json として取り込む。
 *
 * 対応する入力（--gist= / SCRIPT_GIST / npm_config_gist）:
 *   - Gist ページURL:      https://gist.github.com/user/<id>
 *   - Gist ID（16進）:     a1b2c3d4e5f6...
 *   - Raw / 任意のJSON URL: https://gist.githubusercontent.com/.../raw/script.json など
 *
 * 手書き台本の負担を減らすため、欠けている項目は自動補完する:
 *   - scene.id 未指定 → 1始まりの連番
 *   - scene.act 未指定 → 直前の幕を引き継ぎ（先頭は1）
 *   - scene.concept_color 未指定 → "charcoal"
 *   - scene.reading 未指定 → narration をそのまま読み上げ（generateAudio側で吸収）
 *
 * 実行: npm run generate:script -- --gist=<url|id>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import {
  SCRIPT_JSON_PATH,
  type Scene,
  type VideoScript,
} from "./types";

/** GitHub Gist API のレスポンス（必要な部分のみ） */
interface GistResponse {
  files: Record<string, { filename: string; language: string | null; content: string; raw_url: string }>;
}

/** 入力文字列から台本JSONの文字列を取得する */
async function fetchRawScript(source: string): Promise<string> {
  const src = source.trim();

  // 直接JSONを返すURL（raw / *.json）はそのまま取得
  const isDirectUrl =
    /^https?:\/\//.test(src) &&
    (src.includes("gist.githubusercontent.com") || /\.json(\?|$)/.test(src) || src.includes("/raw/"));
  if (isDirectUrl) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`台本URLの取得に失敗しました (${res.status}): ${src}`);
    return await res.text();
  }

  // それ以外は Gist ID を抽出して Gist API から取得
  const idMatch = src.match(/([0-9a-f]{20,})/i) || src.match(/([0-9a-f]{7,})\/?$/i);
  const gistId = idMatch ? idMatch[1] : src.replace(/\/+$/, "").split("/").pop();
  if (!gistId) throw new Error(`Gist ID を特定できませんでした: ${source}`);

  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_TOKEN?.replace(/\s+/g, "");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
  if (!res.ok) throw new Error(`Gist API の取得に失敗しました (${res.status}): gist=${gistId}`);
  const data = (await res.json()) as GistResponse;
  const files = Object.values(data.files ?? {});
  if (files.length === 0) throw new Error(`Gist ${gistId} にファイルがありません。`);

  // script を含む .json → 任意の .json → 先頭ファイル の優先順で選ぶ
  const pick =
    files.find((f) => /script/i.test(f.filename) && /\.json$/i.test(f.filename)) ||
    files.find((f) => /\.json$/i.test(f.filename)) ||
    files.find((f) => f.language === "JSON") ||
    files[0];
  return pick.content;
}

/** 手書き・簡易JSONを VideoScript として正規化し、欠損を補完する */
export function normalizeScript(raw: unknown): VideoScript {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("台本JSONがオブジェクトではありません。");
  }
  const obj = raw as Record<string, unknown>;
  const scenesRaw = obj.scenes;
  if (!Array.isArray(scenesRaw) || scenesRaw.length === 0) {
    throw new Error("台本JSONに scenes 配列がありません。");
  }

  let prevAct = 1;
  const scenes: Scene[] = scenesRaw.map((s, i) => {
    if (typeof s !== "object" || s === null) {
      throw new Error(`scenes[${i}] がオブジェクトではありません。`);
    }
    const sc = s as Record<string, unknown>;
    if (typeof sc.narration !== "string" || sc.narration.trim() === "") {
      throw new Error(`scenes[${i}] に narration がありません。`);
    }
    if (typeof sc.visual !== "object" || sc.visual === null) {
      throw new Error(`scenes[${i}] に visual がありません（type と型ごとのデータが必要）。`);
    }
    const act = typeof sc.act === "number" ? sc.act : prevAct;
    prevAct = act;
    return {
      id: typeof sc.id === "number" ? sc.id : i + 1,
      act: Math.min(5, Math.max(1, act)) as Scene["act"],
      narration: sc.narration,
      reading: typeof sc.reading === "string" ? sc.reading : undefined,
      visual: sc.visual as Scene["visual"],
      concept_color:
        sc.concept_color === "dark-navy" || sc.concept_color === "charcoal" || sc.concept_color === "pitch-black"
          ? sc.concept_color
          : "charcoal",
    };
  });

  return {
    theme: typeof obj.theme === "string" ? obj.theme : "（Gist台本）",
    title: typeof obj.title === "string" ? obj.title : "無題",
    bgm_direction: typeof obj.bgm_direction === "string" ? obj.bgm_direction : undefined,
    scenes,
  };
}

export async function loadScriptFromSource(source: string): Promise<VideoScript> {
  console.log(`[loadScript] 外部台本を読み込み中... source=${source}`);
  const text = await fetchRawScript(source);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `台本JSONのパースに失敗しました。JSONとして正しいか確認してください: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const script = normalizeScript(parsed);

  mkdirSync(dirname(SCRIPT_JSON_PATH), { recursive: true });
  writeFileSync(SCRIPT_JSON_PATH, JSON.stringify(script, null, 2) + "\n", "utf-8");

  const totalChars = script.scenes.reduce((sum, s) => sum + s.narration.length, 0);
  console.log(`[loadScript] 完了: ${SCRIPT_JSON_PATH}`);
  console.log(`  タイトル: ${script.title}`);
  console.log(`  シーン数: ${script.scenes.length} / ナレーション合計: ${totalChars}文字`);
  return script;
}

/** CLI引数（--gist=xxx）または env（SCRIPT_GIST/npm_config_gist）から台本ソースを取得 */
export function resolveScriptSource(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith("--gist="));
  if (arg) return arg.slice("--gist=".length);
  const v = process.env.SCRIPT_GIST || process.env.npm_config_gist;
  return v && v.trim() ? v.trim() : undefined;
}

// 直接実行された場合のみCLIとして動く
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = resolveScriptSource();
  if (!source) {
    console.error("使い方: npm run load:script -- --gist=<GistのURLまたはID>");
    process.exit(1);
  }
  loadScriptFromSource(source).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
