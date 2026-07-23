import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

type Item = { label: string; value: number };

type Props = {
  title: string;
  unit: string;
  items: Item[];
  /** 出典・調査名など（タイトル下に小さく） */
  subtitle?: string;
  /** 強調する項目のindex（アンバー表示）。省略時は強調なし */
  highlight?: number;
  /** 下部の注釈ボックス（例: 「46.4% ≒ 2人に1人」） */
  annotation?: string;
  durationInFrames: number;
};

const BAR_AREA_W = 520; // バー本体の最大幅
const LABEL_W = 520;

/**
 * 横棒グラフ。参考チャンネル準拠のリッチ表示:
 * タイトル + 出典 + グリッド線つき軸 + 値ラベル + 強調バー(アンバー) +
 * 最大値の「最多」タグ + 下部の注釈ボックス。
 */
export const ChartContent: React.FC<Props> = ({
  title,
  unit,
  items,
  subtitle,
  highlight,
  annotation,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (items.length === 0) return null;
  const maxValue = Math.max(...items.map((i) => i.value));
  const maxIndex = items.findIndex((i) => i.value === maxValue);
  // 軸の上限: 最大値を少し超えるキリのいい値
  const axisMax = niceCeil(maxValue);
  const TICKS = 5;

  const titleIn = interpolate(frame, [0, 16], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fmt = (v: number): string =>
    Number.isInteger(v) ? v.toLocaleString("ja-JP") : v.toFixed(1);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {/* タイトル + 出典 */}
        <div style={{ opacity: titleIn, transform: `translateY(${(1 - titleIn) * -16}px)`, textAlign: "center" }}>
          <div
            style={{
              color: "var(--ink, rgba(240, 238, 230, 0.96))",
              fontFamily: SERIF_FONT,
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 8,
                color: "var(--ink-soft, rgba(210, 210, 205, 0.75))",
                fontFamily: SERIF_FONT,
                fontSize: 26,
                letterSpacing: "0.06em",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* グラフ本体 */}
        <div style={{ position: "relative", width: LABEL_W + BAR_AREA_W + 220, marginTop: 18 }}>
          {/* グリッド線（縦） */}
          {Array.from({ length: TICKS + 1 }).map((_, t) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: LABEL_W + (t / TICKS) * BAR_AREA_W,
                top: -6,
                bottom: 34,
                width: 1,
                backgroundColor: "var(--ink-line, rgba(255,255,255,0.14))",
                opacity: t === 0 ? 0.9 : 0.45,
              }}
            />
          ))}

          {/* バー行 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 44 }}>
            {items.map((item, i) => {
              const isHi = highlight === i;
              const isMax = i === maxIndex;
              const grow = spring({ frame: frame - 14 - i * 8, fps, config: { damping: 15, mass: 0.6 } });
              const w = (item.value / axisMax) * BAR_AREA_W * grow;
              const countUp = interpolate(frame, [14 + i * 8, 50 + i * 8], [0, item.value], {
                easing: CUBIC_OUT,
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const rowH = isHi ? 64 : 52;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", height: rowH, opacity: Math.min(1, grow * 1.4) }}>
                  {/* 項目ラベル */}
                  <div
                    style={{
                      width: LABEL_W - 24,
                      paddingRight: 24,
                      textAlign: "right",
                      color: "var(--ink, rgba(235, 235, 229, 0.94))",
                      fontFamily: SERIF_FONT,
                      fontSize: isHi ? 32 : 28,
                      fontWeight: isHi ? 700 : 400,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </div>
                  {/* バー */}
                  <div style={{ position: "relative", width: BAR_AREA_W, height: isHi ? 44 : 34 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: Math.max(0, w),
                        height: "100%",
                        borderRadius: 6,
                        background: isHi
                          ? "linear-gradient(180deg, rgba(255,205,110,0.98), rgba(230,165,70,0.98))"
                          : "linear-gradient(180deg, rgba(90,130,190,0.92), rgba(60,95,150,0.92))",
                        boxShadow: isHi ? "0 0 30px rgba(255,195,100,0.35)" : "none",
                      }}
                    />
                  </div>
                  {/* 値 + 最多タグ */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 16, whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        color: "var(--ink, rgba(240, 238, 230, 0.96))",
                        fontFamily: SERIF_FONT,
                        fontSize: isHi ? 44 : 30,
                        fontWeight: isHi ? 700 : 500,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {fmt(countUp)}
                      {unit}
                    </span>
                    {isMax && !isHi ? (
                      <span
                        style={{
                          backgroundColor: "rgba(235, 235, 230, 0.92)",
                          color: "#1c2230",
                          borderRadius: 6,
                          padding: "3px 12px",
                          fontFamily: SERIF_FONT,
                          fontSize: 22,
                          fontWeight: 700,
                          opacity: grow,
                        }}
                      >
                        最多
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 軸目盛 */}
          <div style={{ position: "absolute", left: LABEL_W, bottom: 0, width: BAR_AREA_W }}>
            {Array.from({ length: TICKS + 1 }).map((_, t) => (
              <span
                key={t}
                style={{
                  position: "absolute",
                  left: (t / TICKS) * BAR_AREA_W - 30,
                  width: 60,
                  textAlign: "center",
                  color: "var(--ink-soft, rgba(210, 210, 205, 0.7))",
                  fontFamily: SERIF_FONT,
                  fontSize: 24,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt((axisMax / TICKS) * t)}
                {unit}
              </span>
            ))}
          </div>
        </div>

        {/* 注釈ボックス */}
        {annotation ? <Annotation text={annotation} frame={frame} fps={fps} /> : null}
      </div>
    </AbsoluteFill>
  );
};

/** 下部の注釈ボックス。「説明 数値」の形なら数値部分を大きくアンバーで表示 */
const Annotation: React.FC<{ text: string; frame: number; fps: number }> = ({ frame, fps, text }) => {
  const appear = spring({ frame: frame - 55, fps, config: { damping: 14, mass: 0.7 } });
  // 末尾の数値・比喩部分（例: "46.4% ≒ 2人に1人"）を強調表示するため分割を試みる
  const m = text.match(/^(.*?)([\d.,]+[%％倍人円年]?\s*[≒=→].*|[\d.,]+[%％倍人円年]?)$/);
  const [desc, big] = m ? [m[1].trim(), m[2].trim()] : [text, ""];
  return (
    <div
      style={{
        marginTop: 20,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px)`,
        display: "flex",
        alignItems: "center",
        gap: 28,
        backgroundColor: "rgba(18, 22, 32, 0.92)",
        border: "2px solid rgba(255, 195, 100, 0.75)",
        borderRadius: 10,
        padding: "18px 38px",
        boxShadow: "0 10px 50px rgba(0,0,0,0.35)",
      }}
    >
      {desc ? (
        <span style={{ color: "rgba(238, 238, 232, 0.95)", fontFamily: SERIF_FONT, fontSize: 30, letterSpacing: "0.04em" }}>
          {desc}
        </span>
      ) : null}
      {big ? (
        <span
          style={{
            color: "rgba(255, 200, 110, 0.98)",
            fontFamily: SERIF_FONT,
            fontSize: 52,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {big}
        </span>
      ) : null}
    </div>
  );
};

/** 最大値の少し上のキリのいい軸上限を返す（32→40, 46.4→50, 120→150 など） */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (v <= m * mag) return m * mag;
  }
  return 10 * mag;
}
