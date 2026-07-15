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
 * 舞台演出として天井からのスポットライト光錐と床の楕円を敷き、
 * ラベルは一文字ずつ立ち上がる。
 */
export const FigureContent: React.FC<Props> = ({ figure, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const Picto = PICTOGRAMS[figure] ?? PICTOGRAMS.person;

  const appear = spring({ frame: frame - 4, fps, config: { damping: 14, mass: 0.7 } });
  const lightBreath = 0.75 + 0.25 * Math.sin(frame / 40);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* 天井からのスポットライト光錐（ゆっくり呼吸する） */}
      <div
        style={{
          position: "absolute",
          top: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1150,
          height: 900,
          opacity: appear * lightBreath * 0.5,
          background:
            "radial-gradient(ellipse 42% 62% at 50% 0%, rgba(235, 240, 250, 0.16) 0%, rgba(220,230,245,0.05) 55%, rgba(0,0,0,0) 78%)",
          clipPath: "polygon(38% 0%, 62% 0%, 96% 100%, 4% 100%)",
        }}
      />

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
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          {/* 床の楕円（ステージ） */}
          <div
            style={{
              position: "absolute",
              bottom: -46,
              width: 760,
              height: 130,
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse at center, rgba(200,215,235,0.10) 0%, rgba(160,175,200,0.04) 55%, rgba(0,0,0,0) 75%)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <Picto frame={frame} fps={fps} />
        </div>

        {/* ラベル: 一文字ずつ立ち上がる */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {label.split("").map((ch, i) => {
            const chIn = interpolate(frame, [28 + i * 3, 44 + i * 3], [0, 1], {
              easing: CUBIC_OUT,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={i}
                style={{
                  opacity: chIn,
                  transform: `translateY(${(1 - chIn) * 18}px)`,
                  color: "rgba(238, 238, 232, 0.92)",
                  fontFamily: SERIF_FONT,
                  fontSize: 46,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  display: "inline-block",
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
