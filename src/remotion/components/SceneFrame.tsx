import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Subtitle } from "./Subtitle";
import { Particles } from "./Particles";
import { safeInterpolate } from "../safeInterpolate";
import type { SyncSegment } from "../../generator/types";

/**
 * concept_color → 背景。暗トーン3種＋明トーン3種。
 * 暗: 幕が進むごとに暗く。明: 情景・日常・郷愁の場面で画面に呼吸を作る。
 */
const BACKGROUND: Record<string, string> = {
  "dark-navy": "radial-gradient(circle at center, #1a1f2c 0%, #090b0f 100%)",
  charcoal: "radial-gradient(circle at center, #222222 0%, #0d0d0d 100%)",
  "pitch-black": "radial-gradient(circle at center, #141414 0%, #050505 100%)",
  daylight: "linear-gradient(180deg, #7ab3d9 0%, #a8cde4 55%, #cfe3ec 100%)",
  dusk: "linear-gradient(180deg, #3a3153 0%, #6b4a66 45%, #c97b52 85%, #e8a05c 100%)",
  warm: "linear-gradient(180deg, #4a3d45 0%, #6e5449 55%, #93705a 100%)",
};

const ACCENT: Record<string, string> = {
  "dark-navy": "rgba(120, 160, 210, 0.30)",
  charcoal: "rgba(200, 200, 195, 0.22)",
  "pitch-black": "rgba(180, 60, 60, 0.28)",
  daylight: "rgba(255, 252, 240, 0.5)",
  dusk: "rgba(255, 190, 130, 0.35)",
  warm: "rgba(255, 214, 160, 0.3)",
};

/** 明トーンの背景か（文字色・ビネットの強さを切り替える） */
export const isBrightTone = (tone: string): boolean =>
  tone === "daylight" || tone === "dusk" || tone === "warm";

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
  const bright = isBrightTone(conceptColor);

  const fadeInOut = safeInterpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 常時駆動型カメラワーク: シーンごとにパターンを変えて単調さを消す
  // 0:ズームイン 1:ズームアウト 2:右パン 3:左パン 4:ゆっくり上昇 の5パターン巡回
  const pattern = sceneId % 5;
  const p = interpolate(frame, [0, durationInFrames], [0, 1]);
  let idleScale = 1;
  let camX = 0;
  let camY = Math.cos(frame / 110) * 4;
  switch (pattern) {
    case 0:
      idleScale = 1.0 + p * 0.05;
      break;
    case 1:
      idleScale = 1.055 - p * 0.05;
      break;
    case 2:
      idleScale = 1.03;
      camX = interpolate(p, [0, 1], [-22, 22]);
      break;
    case 3:
      idleScale = 1.03;
      camX = interpolate(p, [0, 1], [22, -22]);
      break;
    default:
      idleScale = 1.0 + p * 0.035;
      camY += interpolate(p, [0, 1], [10, -10]);
      break;
  }
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

      {/* 明トーン: ゆっくり流れる雲（背景の常時モーション） */}
      {bright &&
        !plainBackdrop &&
        [0, 1, 2].map((i) => {
          const speed = 0.25 + i * 0.12;
          const cw = 420 + i * 160;
          const x = ((frame * speed + i * 700) % (1920 + cw)) - cw;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: 24 + i * 78,
                width: cw,
                height: 90 + i * 24,
                borderRadius: 999,
                background: "rgba(255,255,255,0.22)",
                filter: "blur(18px)",
              }}
            />
          );
        })}

      {/* コンテンツ（常時ズーム＋ドリフト＋文頭キック、字幕領域を避ける）
          --ink 系のCSS変数で、明トーンでは文字色が自動で濃色に切り替わる */}
      <AbsoluteFill
        style={{
          paddingBottom: 200,
          transform: `translate(${camX}px, ${camY}px) scale(${idleScale * kickScale}) rotate(${camRot}deg)`,
          ["--ink" as never]: bright ? "rgba(30, 36, 48, 0.94)" : "rgba(240, 238, 230, 0.95)",
          ["--ink-soft" as never]: bright ? "rgba(45, 52, 68, 0.75)" : "rgba(215, 215, 210, 0.85)",
          ["--ink-line" as never]: bright ? "rgba(30, 36, 48, 0.35)" : "rgba(255, 255, 255, 0.25)",
        }}
      >
        {children}
      </AbsoluteFill>

      <Particles seed={sceneId} count={bright ? 14 : 30} />

      <AbsoluteFill
        style={{
          background: bright
            ? "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(30,30,50,0.22) 100%)"
            : "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
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
