import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { revealAt } from "../../reveal";
import { safeInterpolate } from "../../safeInterpolate";

type Props = {
  title?: string;
  /** 0〜100。中央に大きく表示される主役の割合 */
  percent: number;
  label: string;
  /** 残り側の説明（凡例に出す） */
  restLabel?: string;
  durationInFrames: number;
};

const R = 190;
const STROKE = 46;
const CX = 960;
const CY = 500;

/**
 * ドーナツ（リング）チャート。
 * 参照チャンネルでは中央に大きな%、セグメントは主役色＋補色で描かれる。
 * リングは0から目標値まで描き足されていく。
 */
export const DonutContent: React.FC<Props> = ({
  title,
  percent,
  label,
  restLabel,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const titleIn = revealAt(frame, 0.03, durationInFrames);
  const ringIn = revealAt(frame, 0.12, durationInFrames);
  const centerIn = revealAt(frame, 0.34, durationInFrames);
  const legendIn = revealAt(frame, 0.54, durationInFrames);

  const pct = Math.max(0, Math.min(100, percent));
  const grow = safeInterpolate(ringIn, [0, 1], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const circumference = 2 * Math.PI * R;
  const shown = (pct / 100) * circumference * grow;
  const displayPct = (pct * centerIn).toFixed(pct % 1 === 0 ? 0 : 1);

  return (
    <AbsoluteFill>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 176,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: titleIn,
            color: "var(--ink, rgba(242,240,232,0.96))",
            fontFamily: SERIF_FONT,
            fontSize: 42,
            letterSpacing: "0.12em",
          }}
        >
          {title}
        </div>
      )}

      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* 残り側のリング */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--muted, #4a6b8a)"
          strokeWidth={STROKE}
          opacity={0.42 * ringIn}
        />
        {/* 主役セグメント（12時から時計回りに描き足す） */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--accent, #e8b563)"
          strokeWidth={STROKE}
          strokeDasharray={`${shown} ${circumference}`}
          transform={`rotate(-90 ${CX} ${CY})`}
          strokeLinecap="butt"
          style={{ filter: "drop-shadow(0 0 18px rgba(232,181,99,0.6))" }}
        />
      </svg>

      {/* 中央の大きな% */}
      <div
        style={{
          position: "absolute",
          left: CX - 200,
          top: CY - 76,
          width: 400,
          textAlign: "center",
          opacity: centerIn,
          color: "var(--ink, rgba(255,255,255,0.98))",
          fontFamily: SERIF_FONT,
          fontSize: 104,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 0 40px rgba(232,181,99,0.5)",
        }}
      >
        {displayPct}
        <span style={{ fontSize: 46, marginLeft: 4 }}>%</span>
      </div>

      {/* 凡例 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CY + R + 78,
          display: "flex",
          justifyContent: "center",
          gap: 54,
          opacity: legendIn,
          fontFamily: SERIF_FONT,
          fontSize: 30,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 26,
              height: 14,
              background: "var(--accent, #e8b563)",
              display: "inline-block",
            }}
          />
          <span style={{ color: "var(--ink, rgba(242,240,232,0.96))" }}>{label}</span>
        </span>
        {restLabel && (
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 26,
                height: 14,
                background: "var(--muted, #4a6b8a)",
                display: "inline-block",
                opacity: 0.6,
              }}
            />
            <span style={{ color: "var(--ink-soft, rgba(220,220,214,0.75))" }}>{restLabel}</span>
          </span>
        )}
      </div>
    </AbsoluteFill>
  );
};
