import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { revealAt, revealProgress } from "../../reveal";
import { safeInterpolate } from "../../safeInterpolate";

type Item = { label: string; value: number };

/**
 * 項目ごとの棒の色（映像スタイルガイド §6）。
 * 参照チャンネルの棒グラフは、非強調の棒も項目ごとに別の色を持つ
 * （努力と才能18研究 26%: 紫・サーモン・緑・青灰・灰の5本）。
 * 単一のスティールブルーで塗ると実物より単調になる。
 */
const ITEM_COLORS = ["#7e6ba8", "#c97f6b", "#5f9268", "#4a6b8a", "#8a8f99"];

type Props = {
  title: string;
  unit: string;
  items: Item[];
  /** 出典・調査名など（タイトル下に小さく） */
  subtitle?: string;
  /** 強調する項目のindex（金色＋大きな値）。省略時は強調なし */
  highlight?: number;
  /** 下部の注釈ボックス（例: 「46.4% ≒ 2人に1人」） */
  annotation?: string;
  durationInFrames: number;
};

const LABEL_W = 300; // ラベルは棒の「外側左」に置く
const TRACK_W = 900; // トラック（薄い全幅バー）の幅
const ROW_H = 92;

/** 軸の上限をキリのいい値に切り上げる */
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = 10 ** exp;
  const n = v / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * base;
}

/**
 * 横棒グラフ（参照チャンネルの決定版レイアウト）。
 * docs/reference-style/frames-2/tile2_G_hbar_countries.png を基準に:
 *   - ラベルは棒の外側左
 *   - 各行に薄いトラックを敷き、その中を値バーが満たす
 *   - 強調行だけ金グラデ＋大きな白文字の値、他はスティールブルー＋小さめの値
 *   - 下端に目盛り軸
 *   - 行が1本ずつ増える（段階的reveal）
 */
export const ChartContent: React.FC<Props> = ({
  title,
  unit,
  items,
  subtitle,
  highlight,
  annotation,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  if (items.length === 0) return null;

  const maxValue = Math.max(...items.map((i) => i.value));
  const axisMax = niceCeil(maxValue);
  const TICKS = 5;

  const titleIn = revealAt(frame, 0.02, durationInFrames);
  const axisIn = revealAt(frame, 0.1, durationInFrames);
  const annoIn = revealAt(frame, 0.62, durationInFrames);

  const fmt = (v: number): string =>
    Number.isInteger(v) ? v.toLocaleString("ja-JP") : v.toFixed(2);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* タイトル + 出典 */}
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * -14}px)`,
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              color: "var(--ink, rgba(242,240,232,0.96))",
              fontFamily: SERIF_FONT,
              fontSize: 40,
              letterSpacing: "0.08em",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 8,
                color: "var(--ink-soft, rgba(220,220,214,0.65))",
                fontFamily: SERIF_FONT,
                fontSize: 23,
                letterSpacing: "0.05em",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* 行 */}
        <div style={{ position: "relative" }}>
          {items.map((item, i) => {
            const rowIn = revealProgress(frame, i, items.length, durationInFrames, {
              start: 0.12,
              end: 0.58,
            });
            // バーの伸長はイージングをかけて床から伸びる感じに
            const grow = safeInterpolate(rowIn, [0, 1], [0, 1], {
              easing: CUBIC_OUT,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isHi = highlight === i;
            const w = (item.value / axisMax) * TRACK_W * grow;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: ROW_H,
                  opacity: rowIn,
                  transform: `translateY(${(1 - rowIn) * 12}px)`,
                }}
              >
                {/* ラベル（棒の外側左） */}
                <div
                  style={{
                    width: LABEL_W,
                    textAlign: "right",
                    paddingRight: 26,
                    color: isHi
                      ? "var(--ink, rgba(242,240,232,0.96))"
                      : "var(--ink-soft, rgba(220,220,214,0.78))",
                    fontFamily: SERIF_FONT,
                    fontSize: isHi ? 34 : 30,
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.label}
                </div>

                {/* トラック＋値バー */}
                <div
                  style={{
                    width: TRACK_W,
                    height: isHi ? 44 : 34,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: w,
                      // 非強調行は項目ごとに色を変える。参照チャンネルの棒は
                      // 単一色＋強調1本ではなく、項目ごとに別の色を持っている
                      // （映像スタイルガイド §6「縦棒グラフは項目ごとに色を変える」）。
                      background: isHi
                        ? "linear-gradient(90deg, rgba(232,181,99,0.35) 0%, var(--accent, #e8b563) 100%)"
                        : `linear-gradient(90deg, ${ITEM_COLORS[i % ITEM_COLORS.length]}55 0%, ${ITEM_COLORS[i % ITEM_COLORS.length]} 100%)`,
                      boxShadow: isHi ? "0 0 26px var(--accent, #e8b563)" : "none",
                    }}
                  />
                  {/* 値ラベル: 強調行は大きな白文字でバーの右端に */}
                  <div
                    style={{
                      position: "absolute",
                      left: w + 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isHi
                        ? "var(--ink, rgba(255,255,255,0.98))"
                        : "var(--ink-soft, rgba(220,220,214,0.8))",
                      fontFamily: SERIF_FONT,
                      fontSize: isHi ? 46 : 30,
                      fontWeight: isHi ? 700 : 500,
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                      opacity: rowIn,
                      textShadow: isHi ? "0 2px 14px rgba(0,0,0,0.7)" : "none",
                    }}
                  >
                    {fmt(item.value)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 目盛り軸 */}
          <div
            style={{
              marginLeft: LABEL_W,
              width: TRACK_W,
              marginTop: 14,
              opacity: axisIn,
              position: "relative",
              height: 74,
              borderTop: "1px solid var(--ink-line, rgba(255,255,255,0.22))",
            }}
          >
            {Array.from({ length: TICKS + 1 }, (_, i) => {
              const x = (i / TICKS) * 100;
              return (
                <div key={i} style={{ position: "absolute", left: `${x}%`, top: 0 }}>
                  <div style={{ width: 1, height: 8, background: "rgba(255,255,255,0.22)" }} />
                  <div
                    style={{
                      marginTop: 6,
                      transform: "translateX(-50%)",
                      color: "var(--ink-soft, rgba(220,220,214,0.6))",
                      fontFamily: SERIF_FONT,
                      fontSize: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fmt((axisMax * i) / TICKS)}
                  </div>
                </div>
              );
            })}
            {/* 単位は目盛りラベルの下に置く（最右の目盛りと重ならないように） */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 44,
                color: "var(--ink-soft, rgba(220,220,214,0.55))",
                fontFamily: SERIF_FONT,
                fontSize: 20,
              }}
            >
              {unit}
            </div>
          </div>
        </div>

        {/* 下部の注釈ボックス */}
        {annotation && (
          <div
            style={{
              marginTop: 34,
              opacity: annoIn,
              transform: `translateY(${(1 - annoIn) * 12}px)`,
              padding: "16px 34px",
              border: "1px solid var(--ink-line, rgba(255,255,255,0.22))",
              background: "rgba(0,0,0,0.28)",
              color: "var(--ink, rgba(242,240,232,0.94))",
              fontFamily: SERIF_FONT,
              fontSize: 32,
              letterSpacing: "0.06em",
            }}
          >
            {annotation}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
