import { interpolate } from "remotion";

type InterpolateOptions = Parameters<typeof interpolate>[3];

/**
 * interpolate の安全ラッパ。
 * 入力レンジ（inputRange）が厳密な単調増加でないと Remotion はクラッシュするため、
 * 各点が直前の点より必ず大きくなるように補正してから interpolate する。
 * durationInFrames が極端に小さいシーンでも落ちない保険。
 */
export function safeInterpolate(
  frame: number,
  inputRange: number[],
  outputRange: number[],
  options?: InterpolateOptions,
): number {
  const fixed = [...inputRange];
  for (let i = 1; i < fixed.length; i++) {
    if (fixed[i] <= fixed[i - 1]) fixed[i] = fixed[i - 1] + 1;
  }
  return interpolate(frame, fixed, outputRange, options);
}
