import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import { PICTOGRAMS } from "../pictograms";
import type { FigureKind } from "../../../generator/types";

type Props = {
  figure: FigureKind;
  label: string;
  durationInFrames: number;
};

/**
 * 動くフラットピクトグラム: 情景・概念をコードで直接描く。
 * 実体は pictograms/ レジストリ（全59種）に分割定義されている。
 */
export const FigureContent: React.FC<Props> = ({ figure, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const Picto = PICTOGRAMS[figure] ?? PICTOGRAMS.person;

  const appear = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.7 } });
  const labelOpacity = interpolate(frame, [30, 52], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: appear,
          transform: `scale(${0.85 + 0.15 * appear})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <Picto frame={frame} fps={fps} />
        <div
          style={{
            opacity: labelOpacity,
            color: "rgba(238, 238, 232, 0.92)",
            fontFamily: SERIF_FONT,
            fontSize: 46,
            fontWeight: 500,
            letterSpacing: "0.15em",
          }}
        >
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
