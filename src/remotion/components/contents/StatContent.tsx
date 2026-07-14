import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";

type Props = {
  value: string;
  label: string;
  durationInFrames: number;
};

/** 統計値・年号が拡大しながら現れ、ラベルが下から続く */
export const StatContent: React.FC<Props> = ({ value, label, durationInFrames }) => {
  const frame = useCurrentFrame();

  const valueOpacity = interpolate(frame, [6, 26], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const valueScale = interpolate(frame, [6, 36], [1.35, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // シーン全体でごく緩やかに拡大し続ける
  const slowGrow = interpolate(frame, [36, durationInFrames], [1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [30, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [30, 52], [18, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: valueOpacity,
          transform: `scale(${valueScale * slowGrow})`,
          color: "rgba(240, 238, 228, 0.96)",
          fontFamily: SERIF_FONT,
          fontSize: value.length > 6 ? 150 : 200,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textShadow: "0 0 80px rgba(255,255,255,0.15)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          marginTop: 36,
          color: "rgba(220, 220, 214, 0.85)",
          fontFamily: SERIF_FONT,
          fontSize: 44,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
};
