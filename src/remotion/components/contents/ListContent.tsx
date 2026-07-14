import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

type Props = {
  title: string;
  items: string[];
  durationInFrames: number;
};

/** 項目が1つずつ左から滑り込む列挙シーン */
export const ListContent: React.FC<Props> = ({ title, items }) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [6, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleWidth = interpolate(frame, [10, 40], [0, 420], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            opacity: titleOpacity,
            color: "rgba(240, 238, 230, 0.95)",
            fontFamily: SERIF_FONT,
            fontSize: 60,
            fontWeight: 600,
            letterSpacing: "0.18em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: ruleWidth,
            height: 2,
            margin: "28px 0 48px",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 34 }}>
          {items.map((item, i) => {
            const delay = 34 + i * 14;
            const opacity = interpolate(frame, [delay, delay + 18], [0, 1], {
              easing: CUBIC_OUT,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const x = interpolate(frame, [delay, delay + 20], [-46, 0], {
              easing: CUBIC_OUT,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${x}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 2,
                    backgroundColor: "rgba(255,255,255,0.45)",
                  }}
                />
                <div
                  style={{
                    color: "rgba(235, 235, 229, 0.93)",
                    fontFamily: SERIF_FONT,
                    fontSize: 52,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                  }}
                >
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
