import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { safeInterpolate } from "../../safeInterpolate";

type Props = {
  value: string;
  label: string;
  durationInFrames: number;
};

/** 統計値・年号が拡大しながら現れ、ラベルが下から続く */
export const StatContent: React.FC<Props> = ({ value, label, durationInFrames }) => {
  const frame = useCurrentFrame();

  const valueOpacity = interpolate(frame, [6, 26], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const valueScale = interpolate(frame, [6, 36], [1.35, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // シーン全体でごく緩やかに拡大し続ける（短尺シーンでも範囲が潰れないよう safe版）
  const slowGrow = safeInterpolate(frame, [36, durationInFrames], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [30, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [30, 52], [18, 0], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 数値部分をカウントアップさせる（"150人" → 0人..150人、"2.7倍" → 0.0倍..2.7倍）
  const match = value.match(/^([^0-9]*)([\d,]+(?:\.\d+)?)(.*)$/);
  let displayValue = value;
  if (match) {
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ""));
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const progress = interpolate(frame, [6, 48], [0, 1], {
      easing: CUBIC_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const current = target * progress;
    const formatted = current.toLocaleString("ja-JP", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    displayValue = `${prefix}${formatted}${suffix}`;
  }

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: valueOpacity,
          transform: `scale(${valueScale * slowGrow})`,
          color: "var(--ink, rgba(240, 238, 228, 0.96))",
          fontFamily: SERIF_FONT,
          fontSize: value.length > 6 ? 150 : 200,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textShadow: "0 0 80px rgba(255,255,255,0.15)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {displayValue}
      </div>
      <div
        style={{
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          marginTop: 36,
          color: "var(--ink-soft, rgba(220, 220, 214, 0.85))",
          fontFamily: SERIF_FONT,
          fontSize: 44,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
