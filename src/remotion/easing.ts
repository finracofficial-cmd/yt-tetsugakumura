import { Easing } from "remotion";

/**
 * 共通イージング: 動き出しは鋭く、停止直前は極限まで滑らかに減速する。
 * 全てのテキスト・オブジェクトの出現アニメーションに適用する。
 */
export const CUBIC_OUT = Easing.bezier(0.22, 1, 0.36, 1);
