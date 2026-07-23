import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

type Props = {
  /** 母数（ドットの総数、最大200） */
  total: number;
  /** そのうち強調される数（残る・該当する側） */
  value: number;
  label: string;
  durationInFrames: number;
};

/**
 * ドットの集団で「全体の中の割合」を見せる（アイソタイプ表現）。
 * 全ドットが波状に現れたあと、対象外のドットが赤く点滅して消えていき、
 * 「100人中96人」のような量の実感を作る。
 */
export const UnitsContent: React.FC<Props> = ({ total, value, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safeTotal = Math.max(1, Math.min(200, Math.round(total)));
  const safeValue = Math.max(0, Math.min(safeTotal, Math.round(value)));
  const removed = safeTotal - safeValue;

  // なるべく正方形に近いグリッド
  const cols = Math.ceil(Math.sqrt(safeTotal * 2.2));
  const rows = Math.ceil(safeTotal / cols);
  const DOT = safeTotal > 120 ? 22 : 30;
  const GAP = safeTotal > 120 ? 12 : 16;

  const titleIn = interpolate(frame, [0, 18], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 消えるドットはグリッド全体からランダムに選ぶ（決定論的）
  const removedSet = new Set<number>();
  const order = Array.from({ length: safeTotal }, (_, i) => i).sort(
    (a, b) => random(`u-ord-${a}`) - random(`u-ord-${b}`),
  );
  for (let i = 0; i < removed; i++) removedSet.add(order[i]);

  // 数字のカウント（消滅の進行に同期）
  const fadeStart = 60;
  const fadePer = removed > 0 ? Math.max(4, Math.round(50 / removed)) : 0;
  const fadeProgress = removed > 0
    ? interpolate(frame, [fadeStart, fadeStart + removed * fadePer + 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const counted = Math.round(safeTotal - removed * fadeProgress);

  let removedIdx = 0;
  const removalRank = new Map<number, number>();
  for (const idx of order.slice(0, removed)) removalRank.set(idx, removedIdx++);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        {/* 大きな数字 */}
        <div style={{ opacity: titleIn, display: "flex", alignItems: "baseline", gap: 14 }}>
          <span
            style={{
              color: "var(--ink, rgba(240, 238, 230, 0.97))",
              fontFamily: SERIF_FONT,
              fontSize: 120,
              fontWeight: 700,
              letterSpacing: "0.02em",
              textShadow: "0 0 60px rgba(190,215,240,0.25)",
            }}
          >
            {counted}
          </span>
          <span style={{ color: "var(--ink-soft, rgba(200, 200, 195, 0.65))", fontFamily: SERIF_FONT, fontSize: 44 }}>
            / {safeTotal}
          </span>
        </div>

        {/* ドットのグリッド */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${DOT}px)`,
            gap: GAP,
          }}
        >
          {Array.from({ length: rows * cols }).map((_, i) => {
            if (i >= safeTotal) return <div key={i} style={{ width: DOT, height: DOT }} />;
            const appear = spring({
              frame: frame - 6 - (Math.floor(i / cols) + (i % cols)) * 1.6,
              fps,
              config: { damping: 13, mass: 0.5 },
            });
            const isRemoved = removedSet.has(i);
            let opacity = 1;
            let color = "rgba(228, 230, 235, 0.92)";
            let scale = appear;
            if (isRemoved) {
              const myStart = fadeStart + (removalRank.get(i) ?? 0) * fadePer;
              const flash = interpolate(frame, [myStart, myStart + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const gone = interpolate(frame, [myStart + 8, myStart + 26], [0, 1], {
                easing: CUBIC_OUT,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              color = flash > 0 ? "rgba(225, 110, 100, 0.95)" : color;
              opacity = 1 - gone * 0.85;
              scale = appear * (1 - gone * 0.55);
            }
            return (
              <div
                key={i}
                style={{
                  width: DOT,
                  height: DOT,
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: opacity * Math.min(1, appear),
                  transform: `scale(${scale})`,
                }}
              />
            );
          })}
        </div>

        <div
          style={{
            opacity: titleIn,
            color: "var(--ink-soft, rgba(215, 215, 210, 0.88))",
            fontFamily: SERIF_FONT,
            fontSize: 36,
            letterSpacing: "0.14em",
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
