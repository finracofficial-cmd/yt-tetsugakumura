import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Subtitle } from "./Subtitle";

/**
 * concept_color → 背景色。幕が進むごとに暗くなる設計。
 */
const BACKGROUND: Record<string, string> = {
  "dark-navy": "#0d1b2a",
  charcoal: "#1b1b1e",
  "pitch-black": "#050505",
};

const ACCENT: Record<string, string> = {
  "dark-navy": "rgba(120, 160, 210, 0.35)",
  charcoal: "rgba(200, 200, 195, 0.28)",
  "pitch-black": "rgba(180, 60, 60, 0.32)",
};

export const SERIF_FONT =
  '"Noto Serif CJK JP", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif';

type Props = {
  conceptColor: string;
  narration: string;
  durationInFrames: number;
  children: React.ReactNode;
};

/**
 * 全シーン共通の額縁: 呼吸する背景光・ビネット・下部字幕・黒経由のフェード。
 * シーン型ごとのコンテンツは children として中央領域に描画される。
 */
export const SceneFrame: React.FC<Props> = ({
  conceptColor,
  narration,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const bg = BACKGROUND[conceptColor] ?? BACKGROUND["charcoal"];
  const accent = ACCENT[conceptColor] ?? ACCENT["charcoal"];

  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.12]);
  const fadeInOut = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          background: `radial-gradient(ellipse at 50% 42%, ${accent} 0%, rgba(0,0,0,0) 55%)`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* シーン型ごとのコンテンツ（字幕領域を避けて上部に寄せる） */}
      <AbsoluteFill style={{ paddingBottom: 200 }}>{children}</AbsoluteFill>

      <Subtitle narration={narration} durationInFrames={durationInFrames} />

      <AbsoluteFill
        style={{ backgroundColor: "#000", opacity: fadeInOut, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};
