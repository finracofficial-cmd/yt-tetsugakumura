import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";

const LEFT_COLOR = "#4da3ff";
const RIGHT_COLOR = "#ff5fa2";

type Props = {
  leftTitle: string;
  rightTitle: string;
  leftItems: string[];
  rightItems: string[];
  centerLabel: string;
  durationInFrames: number;
};

const ItemBox: React.FC<{
  text: string;
  color: string;
  delay: number;
}> = ({ text, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });

  return (
    <div
      style={{
        opacity: pop,
        transform: `scale(${0.7 + 0.3 * pop})`,
        border: `2.5px solid ${color}`,
        borderRadius: 6,
        padding: "26px 18px",
        minWidth: 240,
        textAlign: "center",
        color: "rgba(240, 240, 236, 0.95)",
        backgroundColor: "rgba(0,0,0,0.35)",
        fontFamily: SERIF_FONT,
        fontSize: 40,
        fontWeight: 500,
        letterSpacing: "0.08em",
        boxShadow: `0 0 24px ${color}22`,
      }}
    >
      {text}
    </div>
  );
};

/** 参考動画の「家庭 vs トー横」型の左右対比図解 */
export const ComparisonContent: React.FC<Props> = ({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
  centerLabel,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [6, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const centerPop = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, mass: 0.6 },
  });
  // 中央ラベルはシーン後半でゆっくり明滅する
  const centerPulse =
    1 + 0.05 * Math.sin((frame / durationInFrames) * Math.PI * 6);

  const column = (
    title: string,
    items: string[],
    color: string,
    baseDelay: number,
  ) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 36,
        width: 640,
      }}
    >
      <div
        style={{
          opacity: titleOpacity,
          color,
          fontFamily: SERIF_FONT,
          fontSize: 54,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textShadow: `0 0 30px ${color}66`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {items.map((item, i) => (
          <ItemBox key={i} text={item} color={color} delay={baseDelay + i * 7} />
        ))}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 40,
      }}
    >
      {column(leftTitle, leftItems, LEFT_COLOR, 14)}

      <div
        style={{
          opacity: centerPop,
          transform: `scale(${(0.5 + 0.5 * centerPop) * centerPulse})`,
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "rgba(240,240,236,0.95)",
          fontFamily: SERIF_FONT,
          fontSize: centerLabel.length > 2 ? 34 : 44,
          fontWeight: 600,
          backgroundColor: "rgba(0,0,0,0.4)",
          flexShrink: 0,
        }}
      >
        {centerLabel}
      </div>

      {column(rightTitle, rightItems, RIGHT_COLOR, 21)}
    </AbsoluteFill>
  );
};
