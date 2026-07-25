/**
 * 生成されたシーンの値をコード側で検証・補正するモジュール。
 *
 * 構造化出力のスキーマは「コンパイル済み文法」の上限があり、
 * enum を増やしすぎると 400 (compiled grammar is too large) で生成が丸ごと失敗する。
 * 実際、figure の60種enum＋図解型14種で上限を超えて生成が落ちた。
 *
 * そこで figure は enum ではなく自由文字列としてモデルに書かせ、
 * 妥当性の担保をここへ移した。あわせて数値レンジもここで安全側に丸める
 * （スキーマの minimum/maximum も文法を膨らませるため使わない）。
 */
import { FIGURE_KINDS_ENUM } from "./visualSchema";
import { pickPictogram } from "./visualRichness";
import type { FigureKind, Scene, Visual } from "./types";

const VALID_FIGURES = new Set<string>(FIGURE_KINDS_ENUM);

/** 表記ゆれを吸収するための正規化（大文字小文字・記号・空白を無視して突き合わせる） */
const NORMALIZED = new Map<string, FigureKind>();
for (const k of FIGURE_KINDS_ENUM) {
  NORMALIZED.set(k.toLowerCase().replace(/[^a-z0-9]/g, ""), k as FigureKind);
}

/** 数値を範囲内に丸める（NaNは既定値へ） */
function clamp(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * figure名を正当な FigureKind に補正する。
 * 1) そのまま一致 → 採用
 * 2) 表記ゆれ（大小・記号違い）→ 正規化して一致すれば採用
 * 3) それでも不明 → ラベル文からキーワード推定（visualRichness の対応表を再利用）
 */
export function coerceFigure(raw: unknown, label: string, seq: number): FigureKind {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (VALID_FIGURES.has(s)) return s as FigureKind;

  const norm = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const hit = NORMALIZED.get(norm);
  if (hit) return hit;

  // 不明な種類名 → ラベルの意味から最も近いピクトグラムを選ぶ
  return pickPictogram(label || s, seq);
}

/** visual 1件を検証・補正する */
function sanitizeVisual(visual: Visual, seq: number): { visual: Visual; fixed: boolean } {
  switch (visual.type) {
    case "figure": {
      const coerced = coerceFigure(visual.figure, visual.label ?? "", seq);
      if (coerced === visual.figure) return { visual, fixed: false };
      return { visual: { ...visual, figure: coerced }, fixed: true };
    }
    case "donut": {
      const p = clamp(visual.percent, 0, 100, 50);
      if (p === visual.percent) return { visual, fixed: false };
      return { visual: { ...visual, percent: p }, fixed: true };
    }
    case "balance": {
      const t = clamp(visual.tilt, -1, 1, 0);
      if (t === visual.tilt) return { visual, fixed: false };
      return { visual: { ...visual, tilt: t }, fixed: true };
    }
    case "columns": {
      const l = clamp(visual.left?.level, 0, 1, 0.35);
      const r = clamp(visual.right?.level, 0, 1, 0.85);
      if (l === visual.left?.level && r === visual.right?.level) {
        return { visual, fixed: false };
      }
      return {
        visual: { ...visual, left: { ...visual.left, level: l }, right: { ...visual.right, level: r } },
        fixed: true,
      };
    }
    case "pyramid": {
      // 段が多すぎる/空だと描画が破綻するので 2〜4段に収める
      const tiers = (visual.tiers ?? []).filter((t) => t && typeof t.label === "string");
      if (tiers.length >= 2 && tiers.length <= 4 && tiers.length === visual.tiers?.length) {
        return { visual, fixed: false };
      }
      const trimmed = tiers.slice(0, 4);
      while (trimmed.length < 2) trimmed.push({ label: "…", note: "" });
      return { visual: { ...visual, tiers: trimmed }, fixed: true };
    }
    default:
      return { visual, fixed: false };
  }
}

/**
 * シーン列全体を検証・補正する。generateScript / directScript の両経路で呼ぶ。
 * 補正した件数をログに出し、モデル側の傾向が分かるようにする。
 */
export function sanitizeScenes(scenes: Scene[]): Scene[] {
  let fixedCount = 0;
  const out = scenes.map((s, i) => {
    const { visual, fixed } = sanitizeVisual(s.visual, i);
    if (fixed) fixedCount += 1;
    return fixed ? { ...s, visual } : s;
  });
  if (fixedCount > 0) {
    console.log(`[sanitizeScenes] ${fixedCount}件のvisualを補正しました（不正なfigure名・範囲外の数値など）`);
  }
  return out;
}
