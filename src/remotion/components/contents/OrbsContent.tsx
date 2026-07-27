import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { revealAt } from "../../reveal";

type Item = { label: string; value: number; display?: string };

type Props = {
  title?: string;
  items: Item[];
  shafts: boolean;
  durationInFrames: number;
  sceneId: number;
};

/** 決定論的な擬似乱数（球の中の光点を毎回同じ配置にする） */
function rnd(seed: number): () => number {
  let s = seed * 4001 + 13;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const ORB_COLORS = [
  { core: "#4f7fd6", edge: "#0d1e3f" },
  { core: "#d4506b", edge: "#3d0d1c" },
  { core: "#d98a3c", edge: "#3d2109" },
];

/**
 * 発光する球で数量・概念を比較する（レジスターC / 映像スタイルガイド §6）。
 *
 * 参照チャンネルは数量を棒グラフではなく「球の大きさ」で見せる場面が多い
 * （頭がデカい奴 42%: ５６億 と １６３億 を球の大小で／666と999 32%: 3つの球に光の柱）。
 * 棒より情緒があり、2〜3項の比較に向く。
 *
 * 構成:
 *   球（縁がぼけて発光・中に無数の光点）
 *   → 球の中央にベージュの名札（数値）
 *   → 球の下に細い枠線だけのラベル箱
 *   → shafts=true なら球の真上から光の柱が降りる
 */
export const OrbsContent: React.FC<Props> = ({
  title,
  items,
  shafts,
  durationInFrames,
  sceneId,
}) => {
  const frame = useCurrentFrame();
  const list = items.slice(0, 3);
  if (list.length === 0) return null;

  const titleReveal = revealAt(frame, 0.04, durationInFrames);
  const max = Math.max(...list.map((i) => Math.abs(i.value)), 1);

  // 面積ではなく半径を値に比例させると差が誇張されるため、
  // 半径は値の平方根に比例させる（面積が量を表す）。
  const radiusFor = (v: number) => 90 + 160 * Math.sqrt(Math.abs(v) / max);

  const gap = 1920 / (list.length + 1);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 168,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: titleReveal * 0.8,
            fontFamily: SERIF_FONT,
            fontSize: 32,
            letterSpacing: "0.16em",
            color: "var(--ink-soft, rgba(220,220,214,0.8))",
          }}
        >
          {title}
        </div>
      )}

      <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          {list.map((_, i) => {
            const c = ORB_COLORS[i % ORB_COLORS.length];
            return (
              <radialGradient key={i} id={`orb-${sceneId}-${i}`} cx="42%" cy="38%">
                <stop offset="0%" stopColor={c.core} stopOpacity="1" />
                <stop offset="62%" stopColor={c.core} stopOpacity="0.72" />
                <stop offset="100%" stopColor={c.edge} stopOpacity="0" />
              </radialGradient>
            );
          })}
        </defs>

        {list.map((item, i) => {
          const t = revealAt(frame, 0.1 + i * 0.14, durationInFrames);
          const cx = gap * (i + 1);
          const cy = 520;
          const r = radiusFor(item.value);
          // 立ち上がりで少し弾む＋常時ゆっくり呼吸する
          const pop = interpolate(t, [0, 1], [0.55, 1], { easing: CUBIC_OUT });
          const breath = 1 + 0.02 * Math.sin(frame / 38 + i);
          const rr = r * pop * breath;
          const dots = rnd(sceneId * 7 + i);

          return (
            <g key={i} opacity={t}>
              {/* 真上から降りる光の柱 */}
              {shafts && (
                <path
                  d={`M${cx - 26} 40 L${cx - rr * 0.55} ${cy - rr * 0.75} L${cx + rr * 0.55} ${cy - rr * 0.75} L${cx + 26} 40 Z`}
                  fill="#ffe9c4"
                  opacity={0.09 * t}
                />
              )}
              {/* 球本体（縁がぼける） */}
              <circle cx={cx} cy={cy} r={rr} fill={`url(#orb-${sceneId}-${i})`} />
              {/* 球の中の光点 */}
              {Array.from({ length: 46 }, (_, k) => {
                const a = dots() * Math.PI * 2;
                const rad = Math.sqrt(dots()) * rr * 0.86;
                return (
                  <circle
                    key={k}
                    cx={cx + Math.cos(a) * rad}
                    cy={cy + Math.sin(a) * rad}
                    r={1.6}
                    fill="#ffffff"
                    opacity={0.25 + 0.5 * Math.abs(Math.sin(frame / 40 + k))}
                  />
                );
              })}
              {/* 中央のベージュの名札 */}
              <rect
                x={cx - 78}
                y={cy - 34}
                width="156"
                height="68"
                rx="4"
                fill="#e5d6b4"
                opacity="0.92"
              />
              <text
                x={cx}
                y={cy + 15}
                textAnchor="middle"
                fontSize="42"
                fontFamily={SERIF_FONT}
                fill="#1c1712"
                fontWeight="700"
              >
                {item.display ?? String(item.value)}
              </text>
            </g>
          );
        })}

        {/* 球どうしを結ぶ細い横線（参照チャンネルの三球構図） */}
        {list.length > 1 && (
          <line
            x1={gap}
            y1="520"
            x2={gap * list.length}
            y2="520"
            stroke="#ffe9c4"
            strokeWidth="1"
            opacity={0.2 * revealAt(frame, 0.5, durationInFrames)}
          />
        )}
      </svg>

      {/* 球の下の、枠線だけのラベル箱 */}
      {list.map((item, i) => {
        const t = revealAt(frame, 0.3 + i * 0.1, durationInFrames);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${((gap * (i + 1)) / 1920) * 100}%`,
              top: 790,
              transform: "translateX(-50%)",
              opacity: t,
              border: "1px solid var(--ink-line, rgba(255,255,255,0.4))",
              padding: "10px 26px",
              fontFamily: SERIF_FONT,
              fontSize: 34,
              letterSpacing: "0.1em",
              color: "var(--ink, rgba(242,240,232,0.96))",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
