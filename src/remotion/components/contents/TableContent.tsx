import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

type Props = {
  title: string;
  headers: string[];
  rows: string[][];
  durationInFrames: number;
};

/**
 * 表。ヘッダーが先に現れ、行が上から順にスライドインする。
 * 1列目は項目名として左寄せ・強調、以降は中央寄せ。
 */
export const TableContent: React.FC<Props> = ({ title, headers, rows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = interpolate(frame, [0, 18], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cols = Math.max(headers.length, ...rows.map((r) => r.length));
  const width = Math.min(1240, 360 * cols + 120);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
        <div
          style={{
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * -16}px)`,
            color: "rgba(238, 238, 232, 0.95)",
            fontFamily: SERIF_FONT,
            fontSize: 44,
            fontWeight: 600,
            letterSpacing: "0.16em",
          }}
        >
          {title}
        </div>

        <div
          style={{
            width,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 16px 60px rgba(0,0,0,0.45)",
          }}
        >
          {/* ヘッダー行 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `1.2fr repeat(${cols - 1}, 1fr)`,
              backgroundColor: "rgba(52, 66, 92, 0.92)",
              opacity: titleIn,
            }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                style={{
                  padding: "20px 30px",
                  color: "rgba(240, 240, 236, 0.95)",
                  fontFamily: SERIF_FONT,
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textAlign: c === 0 ? "left" : "center",
                  borderLeft: c > 0 ? "1px solid rgba(255,255,255,0.12)" : "none",
                }}
              >
                {headers[c] ?? ""}
              </div>
            ))}
          </div>

          {/* データ行 */}
          {rows.map((row, r) => {
            const rowIn = spring({ frame: frame - 16 - r * 12, fps, config: { damping: 14, mass: 0.6 } });
            return (
              <div
                key={r}
                style={{
                  display: "grid",
                  gridTemplateColumns: `1.2fr repeat(${cols - 1}, 1fr)`,
                  backgroundColor: r % 2 === 0 ? "rgba(24, 30, 42, 0.88)" : "rgba(18, 23, 33, 0.88)",
                  opacity: rowIn,
                  transform: `translateX(${(1 - rowIn) * -40}px)`,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {Array.from({ length: cols }).map((_, c) => (
                  <div
                    key={c}
                    style={{
                      padding: "20px 30px",
                      color: c === 0 ? "rgba(255, 214, 150, 0.92)" : "rgba(225, 225, 220, 0.9)",
                      fontFamily: SERIF_FONT,
                      fontSize: 31,
                      fontWeight: c === 0 ? 600 : 400,
                      letterSpacing: "0.05em",
                      textAlign: c === 0 ? "left" : "center",
                      borderLeft: c > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                    }}
                  >
                    {row[c] ?? ""}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
