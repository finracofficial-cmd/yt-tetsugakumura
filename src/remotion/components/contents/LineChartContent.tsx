import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

type Point = { label: string; value: number };

type Props = {
  title: string;
  unit: string;
  points: Point[];
  durationInFrames: number;
};

const W = 1100;
const H = 460;
const PAD_X = 90;
const PAD_Y = 60;

/**
 * 折れ線グラフ。線が左から右へ描かれ、点が弾んで現れ、値タグが浮かぶ。
 * 最終点は強調カードとして上部に大きく表示し、下降時は警告色の矢印を添える。
 */
export const LineChartContent: React.FC<Props> = ({ title, unit, points }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  // 上下に余白を持たせた正規化
  const yOf = (v: number) => PAD_Y + (1 - (v - min + span * 0.18) / (span * 1.36)) * (H - PAD_Y * 2);
  const xOf = (i: number) => PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2);

  // 線の描画進行（0→1）
  const draw = interpolate(frame, [14, 74], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleIn = interpolate(frame, [0, 18], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const last = points[points.length - 1];
  const declining = last.value < points[0].value;
  const lastAppear = spring({ frame: frame - 74, fps, config: { damping: 12, mass: 0.6 } });

  // カードの数値は線の到達に合わせてカウントする
  const cardValue = interpolate(draw, [0, 1], [points[0].value, last.value]);
  const decimals = String(last.value).includes(".")
    ? String(last.value).split(".")[1].length
    : 0;

  // SVGパス（描画進行に応じて部分表示）
  const segLen = 1 / (points.length - 1);
  const visibleCount = Math.min(points.length - 1, Math.floor(draw / segLen) + 1);
  const pathPoints: [number, number][] = [];
  for (let i = 0; i <= visibleCount; i++) {
    if (i === visibleCount) {
      const segP = Math.min(1, (draw - (i - 1) * segLen) / segLen);
      if (i === 0 || segP <= 0) {
        pathPoints.push([xOf(0), yOf(points[0].value)]);
      } else {
        const x = xOf(i - 1) + (xOf(i) - xOf(i - 1)) * segP;
        const y = yOf(points[i - 1].value) + (yOf(points[i].value) - yOf(points[i - 1].value)) * segP;
        pathPoints.push([x, y]);
      }
    } else {
      pathPoints.push([xOf(i), yOf(points[i].value)]);
    }
  }
  const d = pathPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  const baselineY = yOf(points[0].value);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        {/* 強調カード（最終値） */}
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * -20}px)`,
            backgroundColor: "rgba(20, 26, 38, 0.92)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 10,
            padding: "14px 46px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              color: "rgba(240, 238, 230, 0.96)",
              fontFamily: SERIF_FONT,
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {cardValue.toFixed(decimals)}
          </span>
          {unit ? (
            <span style={{ color: "rgba(200, 200, 195, 0.7)", fontFamily: SERIF_FONT, fontSize: 30, marginLeft: 10 }}>
              {unit}
            </span>
          ) : null}
        </div>

        <div style={{ position: "relative", width: W, height: H }}>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            {/* 軸 */}
            <line x1={PAD_X - 20} y1={H - PAD_Y + 14} x2={W - PAD_X + 30} y2={H - PAD_Y + 14} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
            <line x1={PAD_X - 20} y1={PAD_Y - 20} x2={PAD_X - 20} y2={H - PAD_Y + 14} stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
            {/* 初期値の破線（基準線） */}
            <line
              x1={PAD_X - 10}
              y1={baselineY}
              x2={(W - PAD_X * 2) * draw + PAD_X}
              y2={baselineY}
              stroke="rgba(200, 205, 215, 0.3)"
              strokeWidth={1.5}
              strokeDasharray="7 7"
            />
            {/* 線の下の面（うっすら） */}
            <path
              d={`${d} L${pathPoints[pathPoints.length - 1][0]},${H - PAD_Y + 14} L${PAD_X},${H - PAD_Y + 14} Z`}
              fill="rgba(150, 190, 230, 0.07)"
            />
            {/* 折れ線本体 */}
            <path d={d} fill="none" stroke="rgba(190, 215, 240, 0.92)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            {/* 下降時の警告矢印 */}
            {declining && (
              <g opacity={lastAppear} transform={`translate(${xOf(points.length - 1)}, ${yOf(last.value)})`}>
                <path
                  d="M 8 10 Q 30 40 22 78"
                  fill="none"
                  stroke="rgba(235, 140, 70, 0.9)"
                  strokeWidth={4}
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                />
                <path d="M 12 72 L 24 84 L 32 68" fill="none" stroke="rgba(235, 140, 70, 0.95)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </svg>

          {/* 点と値タグ・ラベル */}
          {points.map((p, i) => {
            const reached = draw >= i * segLen - 0.001;
            const pop = spring({ frame: frame - 14 - i * (60 / points.length), fps, config: { damping: 11, mass: 0.5 } });
            const isLast = i === points.length - 1;
            if (!reached && i > 0) return null;
            return (
              <div key={i}>
                {/* 点 */}
                <div
                  style={{
                    position: "absolute",
                    left: xOf(i) - (isLast ? 13 : 9),
                    top: yOf(p.value) - (isLast ? 13 : 9),
                    width: isLast ? 26 : 18,
                    height: isLast ? 26 : 18,
                    borderRadius: "50%",
                    backgroundColor: isLast ? "rgba(240, 244, 250, 0.98)" : "rgba(210, 225, 240, 0.95)",
                    border: `${isLast ? 5 : 4}px solid rgba(90, 120, 160, 0.9)`,
                    transform: `scale(${pop})`,
                    boxShadow: isLast ? "0 0 30px rgba(190,215,240,0.5)" : "none",
                  }}
                />
                {/* 値タグ */}
                <div
                  style={{
                    position: "absolute",
                    left: xOf(i) - 60,
                    top: yOf(p.value) - 76,
                    width: 120,
                    display: "flex",
                    justifyContent: "center",
                    opacity: pop,
                    transform: `translateY(${(1 - pop) * 14}px)`,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: isLast ? "rgba(28, 36, 52, 0.95)" : "rgba(22, 27, 38, 0.85)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 7,
                      padding: "5px 16px",
                      color: "rgba(238, 238, 232, 0.95)",
                      fontFamily: SERIF_FONT,
                      fontSize: isLast ? 34 : 28,
                      fontWeight: isLast ? 700 : 500,
                    }}
                  >
                    {p.value}
                  </span>
                </div>
                {/* X軸ラベル */}
                <div
                  style={{
                    position: "absolute",
                    left: xOf(i) - 90,
                    top: H - PAD_Y + 28,
                    width: 180,
                    textAlign: "center",
                    opacity: pop,
                    color: "rgba(210, 210, 205, 0.8)",
                    fontFamily: SERIF_FONT,
                    fontSize: 28,
                    letterSpacing: "0.05em",
                  }}
                >
                  {p.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* タイトル */}
        <div
          style={{
            opacity: titleIn,
            color: "rgba(215, 215, 210, 0.85)",
            fontFamily: SERIF_FONT,
            fontSize: 34,
            letterSpacing: "0.14em",
          }}
        >
          {title}
        </div>
      </div>
    </AbsoluteFill>
  );
};
