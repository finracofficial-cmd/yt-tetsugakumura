import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

type Props = {
  keyword: string;
  sceneId?: number;
  durationInFrames: number;
};

/** 2.5秒周期で入れ替わる抽象オーナメント（幾何学図形）。画面の単調さを消す */
const Ornament: React.FC<{ kind: number; progress: number }> = ({ kind, progress }) => {
  // progress: 0→1（出現→退場）
  const appear = interpolate(progress, [0, 0.25], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateRight: "clamp",
  });
  const exit = interpolate(progress, [0.7, 1], [1, 0], {
    extrapolateLeft: "clamp",
  });
  const opacity = 0.1 * appear * exit;
  const rise = interpolate(progress, [0, 0.3], [60, 0], {
    easing: CUBIC_OUT,
    extrapolateRight: "clamp",
  });
  const slowSpin = progress * 24;

  const base: React.CSSProperties = {
    position: "absolute",
    opacity,
    border: "2px solid rgba(255, 255, 255, 0.9)",
  };

  switch (kind % 4) {
    case 0: // 大円
      return (
        <div
          style={{
            ...base,
            width: 560,
            height: 560,
            borderRadius: "50%",
            transform: `translateY(${rise}px) scale(${0.9 + 0.15 * progress})`,
          }}
        />
      );
    case 1: // 回転する菱形
      return (
        <div
          style={{
            ...base,
            width: 400,
            height: 400,
            transform: `translateY(${rise}px) rotate(${45 + slowSpin}deg)`,
          }}
        />
      );
    case 2: // 二重リング
      return (
        <div
          style={{
            ...base,
            width: 480,
            height: 480,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `translateY(${rise}px)`,
          }}
        >
          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
          />
        </div>
      );
    default: // 水平線の帯
      return (
        <div
          style={{
            position: "absolute",
            opacity,
            width: 720,
            height: 120,
            transform: `translateY(${rise}px)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ height: 1.5, backgroundColor: "rgba(255,255,255,0.8)" }} />
          <div style={{ height: 1.5, backgroundColor: "rgba(255,255,255,0.5)" }} />
        </div>
      );
  }
};

/** 抽象キーワード: 一文字ずつ立ち上がり、背後で幾何学図形が次々と入れ替わる */
export const KeywordContent: React.FC<Props> = ({
  keyword,
  sceneId = 0,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const drift = interpolate(frame, [0, durationInFrames], [8, -10]);

  const ruleWidth = interpolate(frame, [8, 50], [0, 320], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleOpacity = interpolate(frame, [8, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 75フレーム（2.5秒）周期でオーナメントが入れ替わる
  const CYCLE = 75;
  const cycleIndex = Math.floor(frame / CYCLE);
  const cycleProgress = (frame % CYCLE) / CYCLE;

  const chars = Array.from(keyword);
  const fontSize = keyword.length > 8 ? 92 : 124;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 背後の幾何学オーナメント */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Ornament kind={sceneId + cycleIndex} progress={cycleProgress} />
      </AbsoluteFill>

      <div
        style={{
          transform: `translateY(${drift}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            color: "var(--ink, rgba(238, 238, 232, 0.94))",
            fontFamily: SERIF_FONT,
            fontSize,
            fontWeight: 500,
            letterSpacing: "0.15em",
            lineHeight: 1.4,
            padding: "0 80px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {chars.map((char, i) => {
            const delay = 10 + i * 4;
            const opacity = interpolate(frame, [delay, delay + 22], [0, 1], {
              easing: CUBIC_OUT,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame, [delay, delay + 26], [26, 0], {
              easing: CUBIC_OUT,
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
