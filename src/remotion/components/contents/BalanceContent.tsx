import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { revealAt } from "../../reveal";
import { safeInterpolate } from "../../safeInterpolate";

type Props = {
  title?: string;
  leftLabel: string;
  rightLabel: string;
  /** -1(左に大きく傾く) 〜 +1(右に大きく傾く) */
  tilt: number;
  /** 傾きに添える注記（例: "95%"） */
  note?: string;
  durationInFrames: number;
};

const BEAM_W = 760;
const PIVOT_X = 960;
const PIVOT_Y = 470;

/**
 * 天秤（参照チャンネルで頻出する物理メタファー図解）。
 * 水平の状態からゆっくり傾く。傾きが結論を視覚的に示す。
 */
export const BalanceContent: React.FC<Props> = ({
  title,
  leftLabel,
  rightLabel,
  tilt,
  note,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const titleIn = revealAt(frame, 0.03, durationInFrames);
  const beamIn = revealAt(frame, 0.1, durationInFrames);
  const tiltIn = revealAt(frame, 0.36, durationInFrames);
  const noteIn = revealAt(frame, 0.58, durationInFrames);

  // 最大14度まで傾ける
  const angle =
    safeInterpolate(tiltIn, [0, 1], [0, Math.max(-1, Math.min(1, tilt)) * 14], {
      easing: CUBIC_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) + Math.sin(frame / 120) * 0.35; // 微揺れで静止させない

  const rad = (angle * Math.PI) / 180;
  const half = BEAM_W / 2;
  const lx = PIVOT_X - half * Math.cos(rad);
  const ly = PIVOT_Y - half * Math.sin(rad);
  const rx = PIVOT_X + half * Math.cos(rad);
  const ry = PIVOT_Y + half * Math.sin(rad);

  const Pan: React.FC<{ x: number; y: number; label: string }> = ({ x, y, label }) => (
    <>
      {/* 吊り紐 */}
      <div
        style={{
          position: "absolute",
          left: x - 1,
          top: y,
          width: 2,
          height: 84,
          background: "rgba(255,255,255,0.45)",
          opacity: beamIn,
        }}
      />
      {/* 皿 */}
      <div
        style={{
          position: "absolute",
          left: x - 92,
          top: y + 82,
          width: 184,
          height: 14,
          borderRadius: "0 0 46% 46%",
          background:
            "linear-gradient(180deg, var(--accent-soft, #ffd9a0) 0%, var(--accent, #e8b563) 100%)",
          boxShadow: "0 0 22px rgba(232,181,99,0.4)",
          opacity: beamIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 160,
          top: y + 112,
          width: 320,
          textAlign: "center",
          opacity: beamIn,
          color: "var(--ink, rgba(242,240,232,0.96))",
          fontFamily: SERIF_FONT,
          fontSize: 32,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
    </>
  );

  return (
    <AbsoluteFill>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: titleIn,
            color: "var(--ink, rgba(242,240,232,0.96))",
            fontFamily: SERIF_FONT,
            fontSize: 44,
            letterSpacing: "0.14em",
          }}
        >
          {title}
        </div>
      )}

      {/* 支柱 */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 4,
          top: PIVOT_Y,
          width: 8,
          height: 250,
          background: "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 100%)",
          opacity: beamIn,
        }}
      />
      {/* 台座 */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - 120,
          top: PIVOT_Y + 244,
          width: 240,
          height: 12,
          borderRadius: "50%",
          background: "rgba(232,181,99,0.2)",
          filter: "blur(4px)",
          opacity: beamIn,
        }}
      />

      {/* 梁 */}
      <div
        style={{
          position: "absolute",
          left: PIVOT_X - half,
          top: PIVOT_Y - 3,
          width: BEAM_W,
          height: 6,
          background:
            "linear-gradient(90deg, var(--accent, #e8b563) 0%, var(--accent-soft, #ffd9a0) 50%, var(--accent, #e8b563) 100%)",
          transform: `rotate(${angle}deg)`,
          transformOrigin: "50% 50%",
          boxShadow: "0 0 24px rgba(232,181,99,0.45)",
          opacity: beamIn,
        }}
      />

      <Pan x={lx} y={ly} label={leftLabel} />
      <Pan x={rx} y={ry} label={rightLabel} />

      {note && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: PIVOT_Y - 130,
            textAlign: "center",
            opacity: noteIn,
            color: "var(--accent, #e8b563)",
            fontFamily: SERIF_FONT,
            fontSize: 54,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textShadow: "0 0 34px var(--accent, #e8b563), 0 2px 12px rgba(0,0,0,0.7)",
          }}
        >
          {note}
        </div>
      )}
    </AbsoluteFill>
  );
};
