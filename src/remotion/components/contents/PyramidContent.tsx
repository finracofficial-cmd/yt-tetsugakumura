import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { revealProgress, revealAt } from "../../reveal";

type Props = {
  title?: string;
  /** 上の段から順に並べる（頂点が先頭）。3〜4段を想定 */
  tiers: { label: string; note?: string }[];
  durationInFrames: number;
};

const BASE_W = 820;
const TIER_H = 118;
const CX = 960;

/** 段ごとの色（頂点＝主役色、下に行くほど落ち着いた色に） */
const TIER_COLORS = [
  "var(--accent, #e8b563)",
  "var(--sub, #d9433f)",
  "#5ea86a",
  "var(--muted, #4a6b8a)",
];

/**
 * ピラミッド（階層・栄養段階・構造の可視化）。
 * 参照チャンネルでは「補食者解放仮説」の栄養段階などで使われる。
 * 下の段から順に積み上がる。
 */
export const PyramidContent: React.FC<Props> = ({ title, tiers, durationInFrames }) => {
  const frame = useCurrentFrame();
  if (tiers.length === 0) return null;

  const titleIn = revealAt(frame, 0.03, durationInFrames);
  const n = tiers.length;
  const totalH = n * TIER_H;
  const topY = 560 - totalH / 2;

  return (
    <AbsoluteFill>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 186,
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

      {tiers.map((tier, i) => {
        // 下の段（配列の末尾）から先に出す
        const orderFromBottom = n - 1 - i;
        const appear = revealProgress(frame, orderFromBottom, n, durationInFrames, {
          start: 0.1,
          end: 0.56,
        });

        // 台形の上底・下底。i=0 が頂点
        const wTop = (BASE_W * i) / n;
        const wBottom = (BASE_W * (i + 1)) / n;
        const y = topY + i * TIER_H;

        return (
          <div key={i} style={{ opacity: appear }}>
            <svg
              viewBox="0 0 1920 1080"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <polygon
                points={`${CX - wTop / 2},${y} ${CX + wTop / 2},${y} ${CX + wBottom / 2},${y + TIER_H - 5} ${CX - wBottom / 2},${y + TIER_H - 5}`}
                fill={TIER_COLORS[i % TIER_COLORS.length]}
                opacity={0.82}
                transform={`translate(0 ${(1 - appear) * 22})`}
              />
            </svg>
            {/* 段のラベル */}
            <div
              style={{
                position: "absolute",
                left: CX - 300,
                top: y + TIER_H / 2 - 24,
                width: 600,
                textAlign: "center",
                color: "rgba(18,20,26,0.92)",
                fontFamily: SERIF_FONT,
                fontSize: i === 0 ? 28 : 32,
                fontWeight: 600,
                letterSpacing: "0.06em",
                transform: `translateY(${(1 - appear) * 22}px)`,
              }}
            >
              {tier.label}
            </div>
            {/* 右側の注記 */}
            {tier.note && (
              <div
                style={{
                  position: "absolute",
                  left: CX + BASE_W / 2 + 30,
                  top: y + TIER_H / 2 - 20,
                  color: "var(--ink-soft, rgba(220,220,214,0.8))",
                  fontFamily: SERIF_FONT,
                  fontSize: 28,
                  whiteSpace: "nowrap",
                  opacity: appear,
                }}
              >
                {tier.note}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
