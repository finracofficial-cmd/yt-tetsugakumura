import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";

type Props = {
  keyword: string;
  durationInFrames: number;
};

/** 抽象キーワードが一文字ずつ立ち上がり、罫線が左右に伸びる */
export const KeywordContent: React.FC<Props> = ({ keyword, durationInFrames }) => {
  const frame = useCurrentFrame();

  const wordScale = interpolate(frame, [0, durationInFrames], [1.0, 1.05]);
  const drift = interpolate(frame, [0, durationInFrames], [8, -10]);

  const ruleWidth = interpolate(frame, [8, 50], [0, 320], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleOpacity = interpolate(frame, [8, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chars = Array.from(keyword);
  const fontSize = keyword.length > 8 ? 92 : 124;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${wordScale}) translateY(${drift}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "rgba(238, 238, 232, 0.94)",
            fontFamily: SERIF_FONT,
            fontSize,
            fontWeight: 500,
            letterSpacing: "0.16em",
            lineHeight: 1.4,
            padding: "0 80px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {chars.map((char, i) => {
            const delay = 10 + i * 4;
            const opacity = interpolate(frame, [delay, delay + 22], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame, [delay, delay + 26], [26, 0], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const blur = interpolate(frame, [delay, delay + 20], [8, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${y}px)`,
                  filter: `blur(${blur}px)`,
                  display: "inline-block",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 44,
            width: ruleWidth,
            height: 2,
            opacity: ruleOpacity,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
