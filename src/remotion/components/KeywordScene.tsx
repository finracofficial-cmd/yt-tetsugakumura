import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

/**
 * concept_color → 実際の背景色のマッピング。
 * 幕が進むごとに徐々に暗くなる設計（dark-navy → charcoal → pitch-black）。
 */
const BACKGROUND: Record<string, string> = {
  "dark-navy": "#0d1b2a",
  charcoal: "#1b1b1e",
  "pitch-black": "#050505",
};

const SERIF_FONT =
  '"Noto Serif CJK JP", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif';

type Props = {
  keyword: string;
  conceptColor: string;
  durationInFrames: number;
};

/**
 * 抽象キーワードがイーズイン・アウトでゆっくり浮かび上がり、
 * シーンの終わりで静かに消えていく「静かで哲学的な」画面。
 */
export const KeywordScene: React.FC<Props> = ({
  keyword,
  conceptColor,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = Math.min(30, Math.floor(durationInFrames / 3));
  const fadeOut = Math.min(24, Math.floor(durationInFrames / 4));

  const opacity = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // ごくわずかに浮上しながら現れる（過剰な動きは避ける）
  const translateY = interpolate(frame, [0, fadeIn], [16, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // 全編を通したゆっくりとしたズレ（画面の「呼吸」）
  const drift = interpolate(frame, [0, durationInFrames], [0, -6]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND[conceptColor] ?? BACKGROUND["charcoal"],
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* 中央からわずかに滲む光。フラットさを保ちつつ奥行きを一段だけ足す */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.045) 0%, rgba(0,0,0,0) 60%)",
        }}
      />
      <div
        style={{
          opacity,
          transform: `translateY(${translateY + drift}px)`,
          color: "rgba(235, 235, 230, 0.92)",
          fontFamily: SERIF_FONT,
          fontSize: keyword.length > 8 ? 96 : 128,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textAlign: "center",
          padding: "0 120px",
          lineHeight: 1.4,
        }}
      >
        {keyword}
      </div>
    </AbsoluteFill>
  );
};
