import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";

type Props = {
  line: string;
  durationInFrames: number;
};

/** フラットな人物シルエット＋弾む吹き出し（誰かのセリフ・内心） */
export const DialogueContent: React.FC<Props> = ({ line }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bubblePop = spring({
    frame: frame - 20,
    fps,
    config: { damping: 10, mass: 0.7, stiffness: 130 },
  });
  const bubbleFloat = Math.sin((frame / fps) * 1.3) * 6;
  const bubbleTilt = Math.sin((frame / fps) * 0.9) * 1.2;
  const figureOpacity = interpolate(frame, [4, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const breath = Math.sin((frame / fps) * 1.6) * 3;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* 吹き出し */}
        <div
          style={{
            opacity: bubblePop,
            transform: `scale(${0.5 + 0.5 * bubblePop}) translateY(${bubbleFloat}px) rotate(${bubbleTilt}deg)`,
            transformOrigin: "bottom center",
            backgroundColor: "rgba(240, 236, 224, 0.96)",
            color: "#1a1a1e",
            fontFamily: SERIF_FONT,
            fontSize: 52,
            fontWeight: 600,
            letterSpacing: "0.08em",
            padding: "30px 56px",
            borderRadius: 18,
            marginBottom: 30,
            position: "relative",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          {line}
          <div
            style={{
              position: "absolute",
              bottom: -18,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderTop: "20px solid rgba(240, 236, 224, 0.96)",
            }}
          />
        </div>

        {/* 人物シルエット */}
        <div
          style={{
            opacity: figureOpacity,
            transform: `translateY(${breath}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              backgroundColor: "rgba(50, 55, 68, 0.95)",
              boxShadow: "inset -14px -8px 24px rgba(0,0,0,0.4)",
            }}
          />
          <div
            style={{
              width: 230,
              height: 150,
              marginTop: -8,
              borderRadius: "60px 60px 14px 14px",
              backgroundColor: "rgba(44, 48, 60, 0.95)",
              boxShadow: "inset -20px -10px 30px rgba(0,0,0,0.4)",
            }}
          />
        </div>

        {/* 足元の光だまり */}
        <div
          style={{
            opacity: figureOpacity * 0.6,
            width: 420,
            height: 42,
            marginTop: 16,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(255, 230, 170, 0.18) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
