import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { safeInterpolate } from "../../safeInterpolate";
import { revealAt, riseY } from "../../reveal";

type Props = {
  value: string;
  label: string;
  /** 左上の文脈タグ（例: "1995→2025"） */
  context?: string;
  /** 単位（例: "件"）。数値と別文字で置く。省略時は value の末尾から自動抽出 */
  unit?: string;
  /** 補助の目盛り軸（例: 年号の並び）。数値の下に細く敷く */
  axis?: { label?: string; ticks: string[] };
  durationInFrames: number;
};

/**
 * 大きな数値（参照チャンネルの決定版レイアウト）。
 * docs/reference-style/frames-3/tile2_M_bignum.png を基準に:
 *   左上の文脈タグ → 強くグローする巨大数字＋別文字の単位 → サブラベル → 補助の目盛り軸
 * の4段を順に出す。
 */
export const StatContent: React.FC<Props> = ({
  value,
  label,
  context,
  unit,
  axis,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // 数値部分をカウントアップさせ、単位は分離して別文字で置く
  const match = value.match(/^([^0-9]*)([\d,]+(?:\.\d+)?)(.*)$/);
  let displayValue = value;
  let displayUnit = unit ?? "";
  if (match) {
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ""));
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
    const progress = interpolate(frame, [8, 52], [0, 1], {
      easing: CUBIC_OUT,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const formatted = (target * progress).toLocaleString("ja-JP", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    displayValue = `${prefix}${formatted}`;
    if (!unit) displayUnit = suffix;
  }

  const ctxReveal = revealAt(frame, 0.04, durationInFrames);
  const numReveal = revealAt(frame, 0.1, durationInFrames);
  const labelReveal = revealAt(frame, 0.3, durationInFrames);
  const axisReveal = revealAt(frame, 0.45, durationInFrames);

  const valueScale = interpolate(frame, [8, 40], [1.28, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // シーン全体でごく緩やかに拡大し続ける（短尺シーンでも範囲が潰れないよう safe版）
  const slowGrow = safeInterpolate(frame, [40, durationInFrames], [1, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const big = displayValue.length > 6 ? 150 : 210;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 左上の文脈タグ */}
      {context && (
        <div
          style={{
            position: "absolute",
            top: 190,
            left: 150,
            opacity: ctxReveal * 0.9,
            fontFamily: SERIF_FONT,
            fontSize: 34,
            letterSpacing: 4,
            color: "var(--ink-soft, rgba(220,220,214,0.85))",
            borderBottom: "1px solid var(--ink-line, rgba(255,255,255,0.25))",
            paddingBottom: 6,
          }}
        >
          {context}
        </div>
      )}

      {/* 巨大数字＋単位 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          opacity: numReveal,
          transform: `scale(${valueScale * slowGrow})`,
        }}
      >
        <span
          style={{
            color: "var(--accent, #e8b563)",
            fontFamily: SERIF_FONT,
            fontSize: big,
            fontWeight: 700,
            letterSpacing: "0.04em",
            // 強いグロー（参照チャンネルの数値は必ず発光している）
            textShadow:
              "0 0 40px var(--accent-soft, #ffd9a0), 0 0 110px var(--accent, #e8b563), 0 4px 12px rgba(0,0,0,0.6)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayValue}
        </span>
        {displayUnit && (
          <span
            style={{
              color: "var(--ink, rgba(242,240,232,0.96))",
              fontFamily: SERIF_FONT,
              fontSize: big * 0.42,
              fontWeight: 500,
              letterSpacing: "0.06em",
            }}
          >
            {displayUnit}
          </span>
        )}
      </div>

      {/* サブラベル */}
      <div
        style={{
          opacity: labelReveal,
          transform: `translateY(${riseY(labelReveal)}px)`,
          marginTop: 26,
          color: "var(--ink-soft, rgba(220, 220, 214, 0.85))",
          fontFamily: SERIF_FONT,
          fontSize: 42,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>

      {/* 補助の目盛り軸 */}
      {axis && axis.ticks.length > 0 && (
        <div style={{ marginTop: 78, width: 1180, opacity: axisReveal }}>
          {axis.label && (
            <div
              style={{
                textAlign: "center",
                color: "var(--ink-soft, rgba(220,220,214,0.7))",
                fontFamily: SERIF_FONT,
                fontSize: 26,
                letterSpacing: 4,
                marginBottom: 12,
              }}
            >
              {axis.label}
            </div>
          )}
          <div
            style={{
              height: 1,
              background: "var(--ink-line, rgba(255,255,255,0.3))",
              position: "relative",
            }}
          >
            {axis.ticks.map((t, i) => {
              const x = axis.ticks.length === 1 ? 50 : (i / (axis.ticks.length - 1)) * 100;
              return (
                <div key={i} style={{ position: "absolute", left: `${x}%`, top: -4 }}>
                  <div
                    style={{
                      width: 1,
                      height: 9,
                      background: "var(--ink-line, rgba(255,255,255,0.4))",
                      margin: "0 auto",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 10,
                      transform: "translateX(-50%)",
                      color: "var(--ink-soft, rgba(220,220,214,0.7))",
                      fontFamily: SERIF_FONT,
                      fontSize: 22,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
