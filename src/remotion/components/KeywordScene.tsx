import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { Subtitle } from "./Subtitle";

/**
 * concept_color → 実際の背景色のマッピング。
 * 幕が進むごとに徐々に暗くなる設計（dark-navy → charcoal → pitch-black）。
 */
const BACKGROUND: Record<string, string> = {
  "dark-navy": "#0d1b2a",
  charcoal: "#1b1b1e",
  "pitch-black": "#050505",
};

const ACCENT: Record<string, string> = {
  "dark-navy": "rgba(120, 160, 210, 0.35)",
  charcoal: "rgba(200, 200, 195, 0.3)",
  "pitch-black": "rgba(180, 60, 60, 0.35)",
};

const SERIF_FONT =
  '"Noto Serif CJK JP", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif';

type Props = {
  keyword: string;
  narration: string;
  conceptColor: string;
  durationInFrames: number;
};

/**
 * 各シーンの画面構成:
 * - 背景: ゆっくりとしたズームと明滅（画面の呼吸）
 * - キーワード: 一文字ずつ立ち上がり、罫線が左右に伸びる
 * - 字幕: ナレーション全文を文単位で下部に順次表示
 * - シーンの出入りは黒を経由したフェード
 */
export const KeywordScene: React.FC<Props> = ({
  keyword,
  narration,
  conceptColor,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const bg = BACKGROUND[conceptColor] ?? BACKGROUND["charcoal"];
  const accent = ACCENT[conceptColor] ?? ACCENT["charcoal"];

  // 背景全体のゆっくりとしたズーム（Ken Burns風の呼吸）
  const bgScale = interpolate(frame, [0, durationInFrames], [1, 1.12]);

  // キーワード全体のごく緩やかな拡大と浮遊
  const wordScale = interpolate(frame, [0, durationInFrames], [1.0, 1.05]);
  const drift = interpolate(frame, [0, durationInFrames], [8, -10]);

  // 罫線が中央から左右に伸びる
  const ruleWidth = interpolate(frame, [8, 50], [0, 320], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleOpacity = interpolate(frame, [8, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // シーンの出入り: 黒を経由するフェード
  const fadeInOut = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const chars = Array.from(keyword);
  const fontSize = keyword.length > 8 ? 92 : 124;

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      {/* 呼吸する背景光 */}
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale})`,
          background: `radial-gradient(ellipse at 50% 42%, ${accent} 0%, rgba(0,0,0,0) 55%)`,
          opacity: 0.5,
        }}
      />
      {/* 微細なビネット */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* キーワード（一文字ずつ立ち上がる） */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 120,
        }}
      >
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
              const charOpacity = interpolate(frame, [delay, delay + 22], [0, 1], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const charY = interpolate(frame, [delay, delay + 26], [26, 0], {
                easing: Easing.out(Easing.cubic),
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const charBlur = interpolate(frame, [delay, delay + 20], [8, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <span
                  key={i}
                  style={{
                    opacity: charOpacity,
                    transform: `translateY(${charY}px)`,
                    filter: `blur(${charBlur}px)`,
                    display: "inline-block",
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
          {/* 中央から伸びる罫線 */}
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

      {/* 字幕 */}
      <Subtitle narration={narration} durationInFrames={durationInFrames} />

      {/* シーンの出入り（黒経由フェード） */}
      <AbsoluteFill
        style={{ backgroundColor: "#000", opacity: fadeInOut, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};
