/**
 * 段階的reveal（要素を1つずつ足していく演出）の共通ヘルパー。
 *
 * 参照チャンネル最大の特徴は「1シーンを長く持たせ、その中で情報が育つ」こと
 * （docs/reference-style/映像スタイルガイド.md §7-1）。
 * 画面を切り替えて飽きさせるのではなく、同じ構図のまま
 * 棒が1本ずつ増える／柱が立つ→線が結ぶ→数値が出る、という進み方をする。
 *
 * ここでは「シーン尺のどこで何番目の要素を出すか」を一元管理する。
 */
import { safeInterpolate } from "./safeInterpolate";

/** 要素の出現に使う既定のタイミング（シーン尺に対する比率） */
const DEFAULT_START = 0.06;
/** 最後の要素が出そろう位置。以降は余韻 */
const DEFAULT_END = 0.62;
/** 1要素あたりのフェード長（フレーム） */
const FADE_FRAMES = 12;

/**
 * i番目（0始まり）の要素の出現進捗 0→1 を返す。
 *
 * @param frame           シーン先頭からの現在フレーム
 * @param index           要素の番号（0始まり）
 * @param count           要素の総数
 * @param durationInFrames シーンの長さ
 */
export function revealProgress(
  frame: number,
  index: number,
  count: number,
  durationInFrames: number,
  opts: { start?: number; end?: number; fade?: number } = {},
): number {
  const start = opts.start ?? DEFAULT_START;
  const end = opts.end ?? DEFAULT_END;
  const fade = opts.fade ?? FADE_FRAMES;

  const startFrame = durationInFrames * start;
  const endFrame = durationInFrames * end;
  const span = Math.max(1, endFrame - startFrame);
  // 要素が1つだけなら先頭で出す。複数なら等間隔に配置。
  const at = count <= 1 ? startFrame : startFrame + (span * index) / count;

  return safeInterpolate(frame, [at, at + fade], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * 「段」で出す用。0〜1の比率を直接指定して、その位置からのフェード進捗を返す。
 * 例: 見出し=0.02、本体=0.12、注釈=0.45 のように段を作る。
 */
export function revealAt(
  frame: number,
  ratio: number,
  durationInFrames: number,
  fade = FADE_FRAMES,
): number {
  const at = durationInFrames * ratio;
  return safeInterpolate(frame, [at, at + fade], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** 出現時の「下から浮上」量（px）。進捗1で0になる */
export function riseY(progress: number, distance = 18): number {
  return (1 - progress) * distance;
}

/** カウントアップした数値を返す（進捗に比例） */
export function countUp(value: number, progress: number): number {
  return value * progress;
}
