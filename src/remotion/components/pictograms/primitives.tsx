/**
 * ピクトグラム共通キット。
 *
 * 各ピクトグラムはこのファイルの色・素体・小物を組み合わせて定義する。
 * すべてのピクトグラムは PictoProps（frame, fps）を受け取り、
 * 常に動き続けること（静止画を出さない）を絶対の原則とする。
 */
import type React from "react";
import { random } from "remotion";

export { random };

export interface PictoProps {
  frame: number;
  fps: number;
}

export type Picto = React.FC<PictoProps>;

/** 各テーマモジュールが返す部分レジストリの型 */
export type PictoTable = Record<string, Picto>;

// ── 共通カラーパレット ─────────────────────────────
export const BODY = "rgba(70, 80, 100, 0.95)";
export const BODY_ALT = "rgba(105, 80, 100, 0.95)";
export const BODY_HI = "rgba(90, 105, 140, 0.95)";
export const SKIN = "rgba(215, 185, 155, 0.9)";
export const AMBER = "rgba(255, 200, 120, 0.85)";
export const AMBER_SOLID = "rgba(255, 200, 120, 0.95)";
export const HEAD = "rgba(45, 52, 68, 0.95)";
export const STONE = "rgba(200, 200, 195, 0.55)";
export const STONE_HI = "rgba(230, 230, 225, 0.75)";
export const METAL = "linear-gradient(180deg, rgba(90,95,105,0.95), rgba(50,54,62,0.95))";
export const LINE_SOFT = "rgba(255, 255, 255, 0.22)";
export const WHITE_SOFT = "rgba(238, 238, 232, 0.9)";
export const TEAL = "rgba(58, 160, 143, 0.9)";
export const BLUE = "rgba(120, 160, 220, 0.9)";
export const PINK = "rgba(255, 110, 140, 0.9)";
export const RED = "rgba(210, 80, 100, 0.92)";
export const GREEN = "rgba(120, 190, 130, 0.9)";
export const GOLD = "linear-gradient(180deg, rgba(255,210,120,0.95) 0%, rgba(200,150,70,0.95) 100%)";
export const WOOD = "rgba(160, 110, 60, 0.95)";

// ── 小さな数学ヘルパ ──────────────────────────────
export const TAU = Math.PI * 2;
/** 0..1 を三角波で往復させる（ease無しの単純往復） */
export const osc = (t: number, period: number, phase = 0) =>
  (Math.sin((t / period) * TAU + phase) + 1) / 2;
/** ループ位相 0..1 */
export const loop = (t: number, period: number, phase = 0) =>
  (((t + phase) % period) + period) % period / period;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/**
 * フラットな人物。sway で上下動、tint で服の色。
 * ほぼ全てのピクトグラムで使う基本素体。
 */
export const Person: React.FC<{
  scale?: number;
  sway?: number;
  tint?: string;
  armsUp?: number; // 0=下ろす 1=万歳
}> = ({ scale = 1, sway = 0, tint = BODY, armsUp = 0 }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transform: `scale(${scale}) translateY(${sway}px)`,
    }}
  >
    <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: SKIN }} />
    <div style={{ position: "relative", marginTop: -6 }}>
      <div
        style={{
          width: 120,
          height: 130,
          borderRadius: "34px 34px 10px 10px",
          backgroundColor: tint,
        }}
      />
      {armsUp > 0 && (
        <>
          <div
            style={{
              position: "absolute",
              left: -14,
              top: 10,
              width: 22,
              height: 74,
              borderRadius: 11,
              backgroundColor: tint,
              transformOrigin: "top center",
              transform: `rotate(${-25 - armsUp * 120}deg)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -14,
              top: 10,
              width: 22,
              height: 74,
              borderRadius: 11,
              backgroundColor: tint,
              transformOrigin: "top center",
              transform: `rotate(${25 + armsUp * 120}deg)`,
            }}
          />
        </>
      )}
    </div>
    <div style={{ display: "flex", gap: 14, marginTop: -2 }}>
      <div style={{ width: 26, height: 62, backgroundColor: tint, borderRadius: 8 }} />
      <div style={{ width: 26, height: 62, backgroundColor: tint, borderRadius: 8 }} />
    </div>
  </div>
);

/** 無表情の頭部シルエット（脳・仮面・不安・涙などの土台） */
export const Head: React.FC<{
  width?: number;
  height?: number;
  color?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width = 210, height = 250, color = HEAD, children, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: "50% 50% 44% 44%",
      backgroundColor: color,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    }}
  >
    {children}
  </div>
);

/** 広がる同心波紋（脈動・衝撃・注目に使う） */
export const Ripples: React.FC<{
  t: number;
  count?: number;
  period?: number;
  base?: number;
  grow?: number;
  color?: string;
}> = ({ t, count = 3, period = 2.4, base = 200, grow = 360, color = "rgba(255, 200, 120," }) => (
  <>
    {Array.from({ length: count }).map((_, i) => {
      const p = loop(t, period, (i * period) / count);
      const size = base + p * grow;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `2px solid ${color}${(1 - p) * 0.4})`,
          }}
        />
      );
    })}
  </>
);
