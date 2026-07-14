import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";
import type { FigureKind } from "../../../generator/types";

const BODY = "rgba(70, 80, 100, 0.95)";
const SKIN = "rgba(215, 185, 155, 0.9)";
const AMBER = "rgba(255, 200, 120, 0.85)";

/** フラットな人物。sway で歩行のような上下動を付ける */
const Person: React.FC<{
  scale?: number;
  sway?: number;
  tint?: string;
}> = ({ scale = 1, sway = 0, tint = BODY }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      transform: `scale(${scale}) translateY(${sway}px)`,
    }}
  >
    <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: SKIN }} />
    <div
      style={{
        width: 120,
        height: 130,
        marginTop: -6,
        borderRadius: "34px 34px 10px 10px",
        backgroundColor: tint,
      }}
    />
    <div style={{ display: "flex", gap: 14, marginTop: -2 }}>
      <div style={{ width: 26, height: 62, backgroundColor: tint, borderRadius: 8 }} />
      <div style={{ width: 26, height: 62, backgroundColor: tint, borderRadius: 8 }} />
    </div>
  </div>
);

const FigureBody: React.FC<{ figure: FigureKind; frame: number; fps: number }> = ({
  figure,
  frame,
  fps,
}) => {
  const t = frame / fps;

  switch (figure) {
    case "person": {
      // 一人の人物がスポットライトの下で静かに呼吸する
      const breath = Math.sin(t * 1.8) * 4;
      const lightPulse = 0.5 + 0.15 * Math.sin(t * 1.1);
      return (
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              top: -140,
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: `radial-gradient(circle at center, rgba(255,215,150,${lightPulse * 0.22}) 0%, rgba(0,0,0,0) 60%)`,
            }}
          />
          <Person scale={1.25} sway={breath} />
        </div>
      );
    }

    case "crowd": {
      // 6人が中央の椅子(空席)の周りを回り続ける
      const N = 6;
      return (
        <div style={{ position: "relative", width: 900, height: 480 }}>
          {/* 床の同心円 */}
          {[300, 430].map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 450 - d / 2,
                top: 300 - d / 5,
                width: d,
                height: d * 0.4,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.22)",
              }}
            />
          ))}
          {/* 中央の椅子 */}
          <div
            style={{
              position: "absolute",
              left: 450 - 30,
              top: 210,
              width: 60,
              height: 90,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ width: 14, height: 52, backgroundColor: "rgba(160,110,60,0.95)", borderRadius: 3 }} />
            <div style={{ width: 60, height: 12, backgroundColor: "rgba(160,110,60,0.95)", borderRadius: 3 }} />
            <div style={{ display: "flex", gap: 32, marginTop: 0 }}>
              <div style={{ width: 10, height: 30, backgroundColor: "rgba(160,110,60,0.95)" }} />
              <div style={{ width: 10, height: 30, backgroundColor: "rgba(160,110,60,0.95)" }} />
            </div>
          </div>
          {/* 回る群衆 */}
          {Array.from({ length: N }).map((_, i) => {
            const angle = (i / N) * Math.PI * 2 + t * 0.5;
            const x = 450 + Math.cos(angle) * 300;
            const y = 250 + Math.sin(angle) * 110;
            const depth = (Math.sin(angle) + 1) / 2; // 手前ほど大きい
            const bob = Math.abs(Math.sin(t * 4 + i)) * 8;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x - 40,
                  top: y - 120 - bob,
                  transform: `scale(${0.55 + depth * 0.35})`,
                  opacity: 0.55 + depth * 0.45,
                  zIndex: Math.round(depth * 10),
                }}
              >
                <Person tint={i === 0 ? "rgba(90, 105, 140, 0.95)" : BODY} />
              </div>
            );
          })}
        </div>
      );
    }

    case "smartphone": {
      // スマホの画面をフィードが流れ続け、ハートが浮かぶ
      const scroll = (t * 90) % 190;
      return (
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 300,
              height: 560,
              borderRadius: 40,
              border: "3px solid rgba(255,255,255,0.35)",
              backgroundColor: "rgba(12, 16, 24, 0.9)",
              overflow: "hidden",
              padding: 22,
              boxShadow: "0 0 80px rgba(120,160,220,0.15)",
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 22,
                  right: 22,
                  top: 30 + i * 190 - scroll,
                  height: 160,
                  borderRadius: 14,
                  backgroundColor: `rgba(120, 150, 200, ${0.14 + 0.06 * (i % 2)})`,
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: 14,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.25)" }} />
                <div style={{ marginTop: 12, height: 10, width: "80%", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5 }} />
                <div style={{ marginTop: 8, height: 10, width: "55%", backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 5 }} />
              </div>
            ))}
          </div>
          {/* 浮かび上がるハート */}
          {Array.from({ length: 4 }).map((_, i) => {
            const cycle = 2.2;
            const p = ((t + i * 0.55) % cycle) / cycle;
            const x = 320 + random(`h-${i}`) * 60;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  bottom: 80 + p * 300,
                  opacity: (1 - p) * 0.8,
                  fontSize: 34 + random(`hs-${i}`) * 14,
                  transform: `rotate(${(random(`hr-${i}`) - 0.5) * 30}deg)`,
                }}
              >
                <span style={{ color: "rgba(255, 110, 140, 0.9)" }}>♥</span>
              </div>
            );
          })}
        </div>
      );
    }

    case "brain": {
      // 頭部の輪郭の中の脳が脈打ち、波紋が広がる
      const pulse = 1 + 0.05 * Math.sin(t * 3.2);
      return (
        <div style={{ position: "relative", width: 620, height: 520, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {/* 波紋 */}
          {[0, 1, 2].map((i) => {
            const cycle = 2.4;
            const p = ((t + i * 0.8) % cycle) / cycle;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 240 + p * 360,
                  height: 240 + p * 360,
                  borderRadius: "50%",
                  border: `2px solid rgba(255, 200, 120, ${(1 - p) * 0.4})`,
                }}
              />
            );
          })}
          {/* 頭部シルエット + 脳 */}
          <div
            style={{
              width: 230,
              height: 260,
              borderRadius: "50% 50% 42% 42%",
              backgroundColor: "rgba(45, 52, 68, 0.95)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 130,
                height: 105,
                borderRadius: "48% 52% 50% 50%",
                background: `radial-gradient(circle at 40% 40%, rgba(255,190,120,0.95), rgba(220,120,90,0.9))`,
                transform: `scale(${pulse})`,
                boxShadow: `0 0 ${30 + 20 * Math.sin(t * 3.2)}px rgba(255,180,100,0.5)`,
              }}
            />
          </div>
        </div>
      );
    }

    case "money": {
      // コインが積み上がり続ける3本の塔
      const stacks = [7, 11, 5];
      return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 90, height: 460 }}>
          {stacks.map((count, s) => (
            <div key={s} style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center" }}>
              {Array.from({ length: count }).map((_, i) => {
                const appear = (t * 2.2 - i * 0.35 - s * 0.8) > 0 ? 1 : 0;
                const dropP = Math.min(1, Math.max(0, (t * 2.2 - i * 0.35 - s * 0.8) * 3));
                return (
                  <div
                    key={i}
                    style={{
                      width: 130,
                      height: 30,
                      marginTop: -6,
                      opacity: appear * Math.min(1, dropP),
                      transform: `translateY(${(1 - dropP) * -60}px)`,
                      borderRadius: "50%/45%",
                      background: "linear-gradient(180deg, rgba(255,210,120,0.95) 0%, rgba(200,150,70,0.95) 100%)",
                      border: "2px solid rgba(120, 90, 40, 0.8)",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    case "city": {
      // 夜のスカイライン。窓の明かりが瞬き、月が浮かぶ
      const buildings = [180, 300, 240, 380, 210, 330, 260];
      return (
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 18, height: 480 }}>
          {/* 月 */}
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -40,
              width: 90,
              height: 90,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, rgba(255,245,220,0.95), rgba(220,205,170,0.85))",
              boxShadow: "0 0 60px rgba(255,240,200,0.35)",
            }}
          />
          {buildings.map((h, b) => (
            <div
              key={b}
              style={{
                position: "relative",
                width: 110,
                height: h,
                backgroundColor: `rgba(${26 + b * 3}, ${32 + b * 2}, ${46 + b * 3}, 0.97)`,
                borderRadius: "4px 4px 0 0",
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                padding: 10,
                alignContent: "start",
              }}
            >
              {Array.from({ length: Math.floor(h / 40) * 3 }).map((_, w) => {
                const flicker =
                  random(`w-${b}-${w}`) > 0.45 &&
                  Math.sin(t * (0.5 + random(`wf-${b}-${w}`) * 2) + w) > -0.6;
                return (
                  <div
                    key={w}
                    style={{
                      height: 16,
                      borderRadius: 2,
                      backgroundColor: flicker ? AMBER : "rgba(255,255,255,0.06)",
                      opacity: flicker ? 0.55 + 0.35 * random(`wo-${b}-${w}`) : 1,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
};

type Props = {
  figure: FigureKind;
  label: string;
  durationInFrames: number;
};

/** 動くフラットピクトグラム: 情景・概念をコードで直接描く */
export const FigureContent: React.FC<Props> = ({ figure, label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
        <FigureBody figure={figure} frame={frame} fps={fps} />
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
