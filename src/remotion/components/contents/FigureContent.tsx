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

    case "couple": {
      // 二人の距離がゆっくり開いては縮む。間に破線
      const dist = 130 + Math.sin(t * 0.7) * 60;
      const breath1 = Math.sin(t * 1.7) * 3;
      const breath2 = Math.cos(t * 1.5) * 3;
      return (
        <div style={{ position: "relative", display: "flex", alignItems: "center", height: 340 }}>
          <div style={{ transform: `translateX(${-dist}px) translateY(${breath1}px)` }}>
            <Person tint="rgba(70, 80, 100, 0.95)" />
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: dist * 1.3,
              borderTop: "2.5px dashed rgba(255,255,255,0.3)",
              top: 150,
            }}
          />
          <div style={{ transform: `translateX(${dist}px) translateY(${breath2}px) scaleX(-1)` }}>
            <Person tint="rgba(105, 80, 100, 0.95)" />
          </div>
        </div>
      );
    }

    case "scale": {
      // 揺れ続ける天秤
      const tilt = Math.sin(t * 0.9) * 9;
      const pan = (side: number) => (
        <div
          style={{
            position: "absolute",
            left: side < 0 ? -14 : undefined,
            right: side > 0 ? -14 : undefined,
            top: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translateY(${side * tilt * 3.4}px)`,
          }}
        >
          <div style={{ width: 2, height: 90, backgroundColor: "rgba(255,255,255,0.5)" }} />
          <div
            style={{
              width: 150,
              height: 26,
              borderRadius: "0 0 60px 60px",
              backgroundColor: "rgba(200, 200, 195, 0.35)",
              border: "2px solid rgba(255,255,255,0.5)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: side < 0 ? 52 : 36,
                height: side < 0 ? 52 : 36,
                marginTop: -30,
                borderRadius: side < 0 ? "50%" : 6,
                backgroundColor: side < 0 ? AMBER : "rgba(120,150,200,0.85)",
              }}
            />
          </div>
        </div>
      );
      return (
        <div style={{ position: "relative", width: 560, height: 430 }}>
          {/* 支柱と台座 */}
          <div style={{ position: "absolute", left: 272, top: 60, width: 16, height: 320, backgroundColor: "rgba(200,200,195,0.55)", borderRadius: 6 }} />
          <div style={{ position: "absolute", left: 190, top: 376, width: 180, height: 18, backgroundColor: "rgba(200,200,195,0.55)", borderRadius: 8 }} />
          {/* 梁（回転） */}
          <div
            style={{
              position: "absolute",
              left: 30,
              top: 52,
              width: 500,
              height: 10,
              borderRadius: 5,
              backgroundColor: "rgba(230,230,225,0.7)",
              transform: `rotate(${tilt}deg)`,
              transformOrigin: "center",
            }}
          >
            {pan(-1)}
            {pan(1)}
          </div>
          <div style={{ position: "absolute", left: 265, top: 36, width: 30, height: 30, borderRadius: "50%", backgroundColor: "rgba(230,230,225,0.8)" }} />
        </div>
      );
    }

    case "clock": {
      // 針が回り続ける時計
      const minuteAngle = t * 60; // 6秒で一周
      const hourAngle = t * 5;
      return (
        <div
          style={{
            position: "relative",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "6px solid rgba(230, 230, 225, 0.7)",
            backgroundColor: "rgba(10, 12, 18, 0.6)",
            boxShadow: "0 0 60px rgba(255,255,255,0.08)",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 4,
                height: 18,
                backgroundColor: "rgba(255,255,255,0.5)",
                transform: `rotate(${i * 30}deg) translateY(-172px)`,
                transformOrigin: "center 0",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 8,
              height: 120,
              marginLeft: -4,
              borderRadius: 4,
              backgroundColor: "rgba(240,240,235,0.9)",
              transform: `rotate(${hourAngle}deg)`,
              transformOrigin: "center 0",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 5,
              height: 165,
              marginLeft: -2.5,
              borderRadius: 3,
              backgroundColor: AMBER,
              transform: `rotate(${minuteAngle}deg)`,
              transformOrigin: "center 0",
            }}
          />
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 20, height: 20, margin: -10, borderRadius: "50%", backgroundColor: "rgba(240,240,235,0.95)" }} />
        </div>
      );
    }

    case "eye": {
      // 視線が泳ぎ、ときどき瞬きする大きな目
      const gaze = Math.sin(t * 0.8) * 46;
      const blinkCycle = 3.2;
      const bp = (t % blinkCycle) / blinkCycle;
      const blink = bp > 0.92 ? Math.sin(((bp - 0.92) / 0.08) * Math.PI) : 0;
      return (
        <div
          style={{
            position: "relative",
            width: 520,
            height: 260,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 520,
              height: 260,
              borderRadius: "50%",
              border: "5px solid rgba(230,230,225,0.75)",
              backgroundColor: "rgba(240, 238, 228, 0.12)",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              transform: `scaleY(${1 - blink * 0.94})`,
            }}
          >
            <div
              style={{
                width: 150,
                height: 150,
                borderRadius: "50%",
                background: "radial-gradient(circle at 40% 40%, rgba(140,170,210,0.95), rgba(40,60,100,0.95))",
                transform: `translateX(${gaze}px)`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "rgba(8,10,14,0.95)" }} />
            </div>
          </div>
        </div>
      );
    }

    case "mask": {
      // 顔の前に浮かぶ「笑顔の仮面」が近づいたり離れたりする
      const maskOffset = 90 + Math.sin(t * 0.9) * 55;
      const bob = Math.sin(t * 1.4) * 5;
      return (
        <div style={{ position: "relative", display: "flex", alignItems: "center", height: 380 }}>
          {/* 素顔（無表情） */}
          <div
            style={{
              width: 190,
              height: 240,
              borderRadius: "50% 50% 44% 44%",
              backgroundColor: "rgba(45, 52, 68, 0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", gap: 44 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "rgba(220,220,215,0.7)" }} />
              <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "rgba(220,220,215,0.7)" }} />
            </div>
            <div style={{ width: 44, height: 3, backgroundColor: "rgba(220,220,215,0.5)" }} />
          </div>
          {/* 仮面（笑顔） */}
          <div
            style={{
              position: "absolute",
              left: 130 + maskOffset,
              top: 30 + bob,
              width: 175,
              height: 220,
              borderRadius: "50% 50% 44% 44%",
              backgroundColor: "rgba(240, 236, 224, 0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", gap: 40 }}>
              <div style={{ width: 30, height: 14, borderRadius: "0 0 30px 30px", border: "3px solid #1a1a1e", borderTop: "none" }} />
              <div style={{ width: 30, height: 14, borderRadius: "0 0 30px 30px", border: "3px solid #1a1a1e", borderTop: "none" }} />
            </div>
            <div style={{ width: 70, height: 30, borderRadius: "0 0 60px 60px", border: "3.5px solid #1a1a1e", borderTop: "none" }} />
          </div>
        </div>
      );
    }

    case "dna": {
      // 回転し続ける二重らせん
      const N = 14;
      return (
        <div style={{ position: "relative", width: 360, height: 480 }}>
          {Array.from({ length: N }).map((_, i) => {
            const y = (i / (N - 1)) * 440;
            const phase = t * 1.6 + i * 0.55;
            const x1 = 180 + Math.sin(phase) * 120;
            const x2 = 180 + Math.sin(phase + Math.PI) * 120;
            const z1 = Math.cos(phase);
            const z2 = -z1;
            return (
              <div key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(x1, x2),
                    top: y + 9,
                    width: Math.abs(x2 - x1),
                    height: 2,
                    backgroundColor: "rgba(255,255,255,0.18)",
                  }}
                />
                {[
                  { x: x1, z: z1, c: AMBER },
                  { x: x2, z: z2, c: "rgba(120,160,220,0.9)" },
                ].map((p, j) => (
                  <div
                    key={j}
                    style={{
                      position: "absolute",
                      left: p.x - 10,
                      top: y,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: p.c,
                      opacity: 0.45 + 0.55 * ((p.z + 1) / 2),
                      transform: `scale(${0.7 + 0.4 * ((p.z + 1) / 2)})`,
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    case "cage": {
      // 檻の中で呼吸する人物。上からの光
      const breath = Math.sin(t * 1.6) * 4;
      return (
        <div style={{ position: "relative", width: 460, height: 430, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
          <div
            style={{
              position: "absolute",
              top: -40,
              width: 380,
              height: 320,
              background: "radial-gradient(ellipse at top, rgba(255,225,170,0.14) 0%, rgba(0,0,0,0) 65%)",
            }}
          />
          <div style={{ marginBottom: 30 }}>
            <Person scale={1.05} sway={breath} />
          </div>
          {/* 檻のバー */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 20 + i * 70,
                top: 0,
                width: 13,
                height: 420,
                borderRadius: 7,
                background: "linear-gradient(180deg, rgba(90,95,105,0.95), rgba(50,54,62,0.95))",
                boxShadow: "6px 0 16px rgba(0,0,0,0.45)",
              }}
            />
          ))}
          <div style={{ position: "absolute", top: -6, left: 8, width: 452, height: 14, borderRadius: 7, backgroundColor: "rgba(80,84,94,0.95)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 8, width: 452, height: 14, borderRadius: 7, backgroundColor: "rgba(80,84,94,0.95)" }} />
        </div>
      );
    }

    case "stairs": {
      // 永遠に終わらない階段を登る（階段が下へ流れ、人物は登り続ける）
      const STEP_W = 130;
      const STEP_H = 66;
      const scrollP = (t * 0.55) % 1;
      const bob = Math.abs(Math.sin(t * 3.4)) * 10;
      return (
        <div style={{ position: "relative", width: 900, height: 600, overflow: "hidden" }}>
          {Array.from({ length: 9 }).map((_, i) => {
            const k = i - scrollP;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 60 + k * STEP_W,
                  bottom: 20 + k * STEP_H,
                  width: STEP_W + 4,
                  height: 22,
                  backgroundColor: "rgba(190, 190, 185, 0.5)",
                  borderRadius: 4,
                  opacity: Math.max(0, Math.min(1, 1 - Math.abs(k - 3.5) / 4.5)),
                }}
              />
            );
          })}
          {/* 登る人（画面中央に留まり続ける = シーシュポス） */}
          <div style={{ position: "absolute", left: 60 + 3.5 * STEP_W - 40, bottom: 44 + 3.5 * STEP_H - bob }}>
            <Person scale={0.95} />
          </div>
        </div>
      );
    }

    case "heart": {
      // 鼓動するハート。シーン後半でひびが入る
      const beat = 1 + Math.max(0, Math.sin(t * 3.4)) * 0.08 + Math.max(0, Math.sin(t * 3.4 + 0.5)) * 0.04;
      const crack = interpolate(frame, [fps * 3.2, fps * 4], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return (
        <div style={{ position: "relative", width: 380, height: 360, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ position: "relative", transform: `scale(${beat})` }}>
            <div style={{ position: "absolute", left: -10, top: 0, width: 150, height: 150, borderRadius: "50%", backgroundColor: "rgba(210, 80, 100, 0.92)" }} />
            <div style={{ position: "absolute", left: 100, top: 0, width: 150, height: 150, borderRadius: "50%", backgroundColor: "rgba(210, 80, 100, 0.92)" }} />
            <div
              style={{
                position: "absolute",
                left: 30,
                top: 60,
                width: 180,
                height: 180,
                backgroundColor: "rgba(210, 80, 100, 0.92)",
                transform: "rotate(45deg)",
              }}
            />
            {/* ひび */}
            <div style={{ position: "absolute", left: 108, top: 30, opacity: crack, zIndex: 2 }}>
              {[
                { x: 0, y: 0, r: 18, len: 60 },
                { x: -16, y: 52, r: -24, len: 55 },
                { x: 4, y: 100, r: 14, len: 62 },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: s.x,
                    top: s.y,
                    width: 5,
                    height: s.len,
                    backgroundColor: "rgba(10, 8, 10, 0.85)",
                    transform: `rotate(${s.r}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
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
