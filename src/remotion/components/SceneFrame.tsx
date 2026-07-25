import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Subtitle } from "./Subtitle";
import { Particles } from "./Particles";
import { Backdrop } from "./Backdrop";
import { safeInterpolate } from "../safeInterpolate";
import { revealAt } from "../reveal";
import { paletteVars, type ThemePalette } from "../theme";
import type { SyncSegment } from "../../generator/types";

/**
 * concept_color → 背景の明暗トーン。
 * 参照チャンネルは全編の約9割が暗トーン。明トーンは日常・対比の場面に限定される。
 * 色そのものはテーマパレット（theme.ts）から供給し、ここでは「暗さの度合い」だけを決める。
 */
const TONE_OVERLAY: Record<string, string> = {
  "dark-navy": "rgba(10, 13, 22, 0.55)",
  charcoal: "rgba(14, 14, 16, 0.62)",
  "pitch-black": "rgba(4, 4, 6, 0.74)",
  daylight: "rgba(220, 234, 244, 0.86)",
  dusk: "rgba(120, 74, 96, 0.42)",
  warm: "rgba(120, 92, 70, 0.44)",
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
  /** テーマ由来のカラーパレット（動画1本を通して固定） */
  palette: ThemePalette;
  /** 左上の章タグ（例: "Ch3・構造"）。幕が変わる箇所で渡す */
  chapterTag?: string;
  /** 上部中央の概念ラベル（例: "統計的差別"）。概念の切り替わりで渡す */
  headingLabel?: string;
  /** 音声実測に基づく文単位の字幕同期（あれば優先） */
  segments?: SyncSegment[];
  /** 全画面イラスト系のシーンでは背景光を消す */
  plainBackdrop?: boolean;
  children: React.ReactNode;
};

/**
 * 全シーン共通の額縁:
 * - 情景レイヤー背景（空/遠景/中景/床）＋体積光＋ヘイズ
 * - 左上の章タグ / 上部中央の概念ラベル / 四隅のコーナーマーク
 * - 常時駆動型カメラワーク（微小ズーム + 手持ちドリフト + 微回転）
 * - ナレーションの文頭ごとの「キック」（音声に同期した微小パルス）
 * - 漂う粒子 / ビネット / 下部字幕 / コンテンツの短いフェード（背景は暗転させない）
 * 画面は1フレームたりとも完全静止せず、シーン転換で真っ黒を経由しない。
 */
export const SceneFrame: React.FC<Props> = ({
  sceneId,
  conceptColor,
  narration,
  durationInFrames,
  palette,
  chapterTag,
  headingLabel,
  segments,
  plainBackdrop = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const bright = isBrightTone(conceptColor);
  const toneOverlay = TONE_OVERLAY[conceptColor] ?? TONE_OVERLAY.charcoal;

  // コンテンツだけを短くフェードで出し入れする。背景は常に不透明のまま残すので、
  // シーン転換で「真っ黒」を経由しない（＝暗転の点滅が起きない）。
  const contentReveal = safeInterpolate(
    frame,
    [0, 9, durationInFrames - 9, durationInFrames],
    [0, 1, 1, 0],
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

  const ink = bright ? "rgba(28, 34, 46, 0.95)" : "rgba(242, 240, 232, 0.96)";
  const inkSoft = bright ? "rgba(45, 52, 68, 0.75)" : "rgba(216, 216, 210, 0.85)";
  const outline = bright ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.8)";

  // 章タグ・見出しは少し遅れて出す
  const tagReveal = revealAt(frame, 0.03, durationInFrames);
  const headingReveal = revealAt(frame, 0.07, durationInFrames);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${palette.skyTop} 0%, ${palette.skyBottom} 100%)`,
        overflow: "hidden",
        ...paletteVars(palette),
        ["--ink" as never]: ink,
        ["--ink-soft" as never]: inkSoft,
        ["--ink-line" as never]: bright ? "rgba(30, 36, 48, 0.35)" : "rgba(255, 255, 255, 0.25)",
      }}
    >
      {/* 情景レイヤー（空/遠景/中景/床）＋体積光＋ヘイズ */}
      <Backdrop sceneId={sceneId} palette={palette} bright={bright} plain={plainBackdrop} />

      {/* concept_color による明暗トーンの調整。情景の上に薄く掛ける */}
      <AbsoluteFill style={{ background: toneOverlay }} />

      {/* 主役を浮かせる中央のグロー */}
      {!plainBackdrop && (
        <AbsoluteFill
          style={{
            transform: `scale(${idleScale * 1.05})`,
            background: `radial-gradient(ellipse at 50% 46%, ${palette.accentSoft} 0%, rgba(0,0,0,0) 52%)`,
            opacity: bright ? 0.14 : 0.2,
          }}
        />
      )}

      {/* コンテンツ（常時ズーム＋ドリフト＋文頭キック、字幕領域を避ける） */}
      <AbsoluteFill
        style={{
          paddingBottom: 200,
          opacity: contentReveal,
          transform: `translate(${camX}px, ${camY}px) scale(${idleScale * kickScale}) rotate(${camRot}deg)`,
        }}
      >
        {children}
      </AbsoluteFill>

      <Particles seed={sceneId} count={bright ? 14 : 30} />

      {/* 四隅のコーナーマーク（記録文書・ビューファインダーの質感） */}
      {[
        { top: 34, left: 40, bt: 2, bl: 2 },
        { top: 34, right: 40, bt: 2, br: 2 },
        { bottom: 34, left: 40, bb: 2, bl: 2 },
        { bottom: 34, right: 40, bb: 2, br: 2 },
      ].map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: 26,
            height: 26,
            borderTop: c.bt ? `2px solid ${ink}` : undefined,
            borderBottom: c.bb ? `2px solid ${ink}` : undefined,
            borderLeft: c.bl ? `2px solid ${ink}` : undefined,
            borderRight: c.br ? `2px solid ${ink}` : undefined,
            opacity: 0.22,
          }}
        />
      ))}

      {/* 左上の章タグ */}
      {chapterTag && (
        <div
          style={{
            position: "absolute",
            top: 62,
            left: 78,
            opacity: tagReveal * 0.85,
            fontFamily: SERIF_FONT,
            fontSize: 25,
            letterSpacing: 3,
            color: ink,
            textShadow: `0 2px 8px ${outline}`,
          }}
        >
          {chapterTag}
        </div>
      )}

      {/* 上部中央の概念ラベル（飾り罫つき） */}
      {headingLabel && (
        <div
          style={{
            position: "absolute",
            top: 74,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: headingReveal,
            fontFamily: SERIF_FONT,
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: 8,
            color: ink,
            textShadow: `0 2px 10px ${outline}`,
          }}
        >
          <span style={{ opacity: 0.5, marginRight: 22 }}>─</span>
          {headingLabel}
          <span style={{ opacity: 0.5, marginLeft: 22 }}>─</span>
        </div>
      )}

      {/* ビネット */}
      <AbsoluteFill
        style={{
          background: bright
            ? "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(30,30,50,0.22) 100%)"
            : "radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.62) 100%)",
        }}
      />

      <Subtitle
        narration={narration}
        durationInFrames={durationInFrames}
        segments={segments}
      />
    </AbsoluteFill>
  );
};
