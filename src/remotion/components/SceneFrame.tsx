import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Subtitle } from "./Subtitle";
import { Particles } from "./Particles";
import type { SyncSegment } from "../../generator/types";

/**
 * concept_color → 放射状グラデーション背景。
 * 中心はくすんだ暗色、周辺は漆黒に近い闇。幕が進むごとに暗くなる。
 */
const BACKGROUND: Record<string, string> = {
  "dark-navy": "radial-gradient(circle at center, #1a1f2c 0%, #090b0f 100%)",
  charcoal: "radial-gradient(circle at center, #222222 0%, #0d0d0d 100%)",
  "pitch-black": "radial-gradient(circle at center, #141414 0%, #050505 100%)",
};

const ACCENT: Record<string, string> = {
  "dark-navy": "rgba(120, 160, 210, 0.30)",
  charcoal: "rgba(200, 200, 195, 0.22)",
  "pitch-black": "rgba(180, 60, 60, 0.28)",
};

/**
 * 明朝体フォントスタック。GitHub Actionsでは fonts-noto-cjk（apt）で
 * "Noto Serif CJK JP" が使われる。ネットワーク依存を避けるためシステムフォントを正とする。
 */
export const SERIF_FONT =
  '"Noto Serif CJK JP", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif';

type Props = {
  sceneId: number;
  conceptColor: string;
  narration: string;
  durationInFrames: number;
  /** 音声実測に基づく文単位の字幕同期（あれば優先） */
  segments?: SyncSegment[];
  /** 全画面イラスト系のシーンでは背景光を消す */
  plainBackdrop?: boolean;
  children: React.ReactNode;
};

/**
 * 全シーン共通の額縁:
 * - 放射状グラデーション背景 + ゆっくり横切る光の帯
 * - 常時駆動型カメラワーク（微小ズーム + 手持ちドリフト + 微回転）
 * - ナレーションの文頭ごとの「キック」（音声に同期した微小パルス）
 * - 漂う粒子 / ビネット / 下部字幕 / 黒経由のフェード
 * 画面は1フレームたりとも完全静止しない。
 */
export const SceneFrame: React.FC<Props> = ({
  sceneId,
  conceptColor,
  narration,
  durationInFrames,
  segments,
  plainBackdrop = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const bg = BACKGROUND[conceptColor] ?? BACKGROUND["charcoal"];
  const accent = ACCENT[conceptColor] ?? ACCENT["charcoal"];

  const fadeInOut = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 常時駆動型カメラワーク: 微小ズーム（Idle）+ 手持ちのようなドリフト + 微回転
  const idleScale = interpolate(frame, [0, durationInFrames], [1.0, 1.045]);
  const dir = sceneId % 2 === 0 ? 1 : -1;
  const camX = interpolate(frame, [0, durationInFrames], [0, 14 * dir]);
  const camY = Math.cos(frame / 110) * 4;
  const camRot = Math.sin(frame / 150 + sceneId) * 0.25;

  // 文頭キック: 各セグメントの開始で 1.012 → 1.0 に減衰する微小パルス（音声同期の律動）
  let kick = 0;
  if (segments) {
    for (const seg of segments) {
      const d = frame - seg.startFrame;
      if (d >= 0 && d < 14) kick = Math.max(kick, (1 - d / 14) ** 2);
    }
  }
  const kickScale = 1 + kick * 0.012;

  // ゆっくり横切る光の帯（約8秒周期の斜めのスイープ）
  const sweepX = ((frame / (8 * 30)) % 1) * 3400 - 1200;

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {!plainBackdrop && (
        <AbsoluteFill
          style={{
            transform: `scale(${idleScale * 1.05})`,
            background: `radial-gradient(ellipse at 50% 42%, ${accent} 0%, rgba(0,0,0,0) 55%)`,
            opacity: 0.45,
          }}
        />
      )}

      {/* 光の帯: 画面を静止させないための最も低コストな常時運動 */}
      {!plainBackdrop && (
        <div
          style={{
            position: "absolute",
            top: -300,
            left: sweepX,
            width: 480,
            height: 1700,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(220,230,245,0.035) 50%, rgba(255,255,255,0) 100%)",
            transform: "rotate(16deg)",
          }}
        />
      )}

      {/* コンテンツ（常時ズーム＋ドリフト＋文頭キック、字幕領域を避ける） */}
      <AbsoluteFill
        style={{
          paddingBottom: 200,
          transform: `translate(${camX}px, ${camY}px) scale(${idleScale * kickScale}) rotate(${camRot}deg)`,
        }}
      >
        {children}
      </AbsoluteFill>

      <Particles seed={sceneId} count={30} />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <Subtitle
        narration={narration}
        durationInFrames={durationInFrames}
        segments={segments}
      />

      <AbsoluteFill
        style={{ backgroundColor: "#000", opacity: fadeInOut, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};
