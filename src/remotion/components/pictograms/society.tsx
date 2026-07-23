/** 社会・経済・権力・構造のピクトグラム群 */
import {
  AMBER,
  BLUE,
  GOLD,
  METAL,
  PictoTable,
  Person,
  STONE,
  STONE_HI,
  WHITE_SOFT,
  WOOD,
  clamp,
  loop,
  osc,
  random,
} from "./primitives";

export const societyPictos: PictoTable = {
  // コインが積み上がり続ける3本の塔
  money: ({ frame, fps }) => {
    const t = frame / fps;
    const stacks = [7, 11, 5];
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 90, height: 460 }}>
        {stacks.map((count, s) => (
          <div key={s} style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center" }}>
            {Array.from({ length: count }).map((_, i) => {
              const appear = t * 2.2 - i * 0.35 - s * 0.8 > 0 ? 1 : 0;
              const dropP = clamp((t * 2.2 - i * 0.35 - s * 0.8) * 3);
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
                    background: GOLD,
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
  },

  // 夜のスカイライン。窓の明かりが瞬き、月が浮かぶ
  city: ({ frame, fps }) => {
    const t = frame / fps;
    const buildings = [180, 300, 240, 380, 210, 330, 260];
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 18, height: 480 }}>
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
              const flicker = random(`w-${b}-${w}`) > 0.45 && Math.sin(t * (0.5 + random(`wf-${b}-${w}`) * 2) + w) > -0.6;
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
  },

  // 工場。煙突から煙が昇り、歯車が回る
  factory: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 620, height: 460 }}>
        {[80, 180].map((x, i) => (
          <div key={i}>
            <div style={{ position: "absolute", left: x, top: 120, width: 60, height: 200, backgroundColor: "rgba(60, 66, 78, 0.97)", borderRadius: "6px 6px 0 0" }} />
            {[0, 1, 2, 3].map((j) => {
              const p = loop(t, 2.4, i * 0.6 + (j * 2.4) / 4);
              return (
                <div
                  key={j}
                  style={{
                    position: "absolute",
                    left: x + 8 - p * 20,
                    top: 110 - p * 120,
                    width: 44 + p * 60,
                    height: 44 + p * 60,
                    borderRadius: "50%",
                    backgroundColor: `rgba(150,155,165,${(1 - p) * 0.35})`,
                  }}
                />
              );
            })}
          </div>
        ))}
        <div style={{ position: "absolute", left: 40, top: 300, width: 500, height: 160, backgroundColor: "rgba(48, 54, 66, 0.97)", borderRadius: 6 }} />
        {[[320, 340, 60], [430, 360, 42]].map(([cx, cy, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              transform: `rotate(${t * (i === 0 ? 60 : -90)}deg)`,
            }}
          >
            {Array.from({ length: 8 }).map((_, k) => (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: r - 6,
                  top: -4,
                  width: 12,
                  height: r + 8,
                  backgroundColor: STONE,
                  transformOrigin: `6px ${r + 4}px`,
                  transform: `rotate(${k * 45}deg)`,
                  borderRadius: 3,
                }}
              />
            ))}
            <div style={{ position: "absolute", left: r - r * 0.55, top: r - r * 0.55, width: r * 1.1, height: r * 1.1, borderRadius: "50%", backgroundColor: "rgba(90,96,108,0.98)" }} />
          </div>
        ))}
      </div>
    );
  },

  // 揺れ続ける天秤
  scale: ({ frame, fps }) => {
    const t = frame / fps;
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
              backgroundColor: side < 0 ? AMBER : BLUE,
            }}
          />
        </div>
      </div>
    );
    return (
      <div style={{ position: "relative", width: 560, height: 430 }}>
        <div style={{ position: "absolute", left: 272, top: 60, width: 16, height: 320, backgroundColor: STONE, borderRadius: 6 }} />
        <div style={{ position: "absolute", left: 190, top: 376, width: 180, height: 18, backgroundColor: STONE, borderRadius: 8 }} />
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
  },

  // 裁きの木槌。振り上げて打ち下ろし、着弾で波紋
  gavel: ({ frame, fps }) => {
    const t = frame / fps;
    const p = loop(t, 1.6);
    const swing = p < 0.5 ? -30 + p * 2 * 30 : 30 - (p - 0.5) * 2 * 60;
    const hit = p > 0.5 && p < 0.62 ? 1 : 0;
    return (
      <div style={{ position: "relative", width: 520, height: 440, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", bottom: 90, width: 180, height: 30, background: WOOD, borderRadius: 8 }} />
        {hit > 0 &&
          [0, 1].map((i) => {
            const rp = loop(t, 1.6, (i * 1.6) / 2 + 0.5);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: 100,
                  width: 60 + rp * 200,
                  height: 24 + rp * 60,
                  borderRadius: "50%",
                  border: `2px solid rgba(255,200,120,${(1 - rp) * 0.5})`,
                }}
              />
            );
          })}
        <div style={{ position: "absolute", bottom: 120, left: 150, transform: `rotate(${swing}deg)`, transformOrigin: "40px 160px" }}>
          <div style={{ width: 120, height: 60, background: WOOD, borderRadius: 12 }} />
          <div style={{ width: 20, height: 140, background: WOOD, borderRadius: 8, marginLeft: 50 }} />
        </div>
      </div>
    );
  },

  // 登っても進まない無限の階段（シーシュポス）
  stairs: ({ frame, fps }) => {
    const t = frame / fps;
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
        <div style={{ position: "absolute", left: 60 + 3.5 * STEP_W - 40, bottom: 44 + 3.5 * STEP_H - bob }}>
          <Person scale={0.95} />
        </div>
      </div>
    );
  },

  // 檻の中で呼吸する人物。上からの光
  cage: ({ frame, fps }) => {
    const t = frame / fps;
    const breath = Math.sin(t * 1.6) * 4;
    return (
      <div style={{ position: "relative", width: 460, height: 430, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", top: -40, width: 380, height: 320, background: "radial-gradient(ellipse at top, rgba(255,225,170,0.14) 0%, rgba(0,0,0,0) 65%)" }} />
        <div style={{ marginBottom: 30 }}>
          <Person scale={1.05} sway={breath} />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", left: 20 + i * 70, top: 0, width: 13, height: 420, borderRadius: 7, background: METAL, boxShadow: "6px 0 16px rgba(0,0,0,0.45)" }} />
        ))}
        <div style={{ position: "absolute", top: -6, left: 8, width: 452, height: 14, borderRadius: 7, backgroundColor: "rgba(80,84,94,0.95)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 8, width: 452, height: 14, borderRadius: 7, backgroundColor: "rgba(80,84,94,0.95)" }} />
      </div>
    );
  },

  // 束縛の鎖。振り子のように揺れ、一つの環が軋む
  chains: ({ frame, fps }) => {
    const t = frame / fps;
    const swing = Math.sin(t * 1.1) * 12;
    const N = 6;
    return (
      <div style={{ position: "relative", width: 400, height: 500, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "absolute", top: 0, width: 120, height: 14, backgroundColor: "rgba(70,74,86,0.95)", borderRadius: 6 }} />
        <div style={{ position: "absolute", top: 14, transformOrigin: "top center", transform: `rotate(${swing}deg)` }}>
          {Array.from({ length: N }).map((_, i) => {
            const strain = i === 3 ? 1 + osc(t, 0.9) * 0.12 : 1;
            return (
              <div
                key={i}
                style={{
                  width: 56 * (i % 2 === 0 ? 1 : 0.7),
                  height: 74,
                  marginTop: -22,
                  marginLeft: i % 2 === 0 ? 0 : 8,
                  borderRadius: "50%",
                  border: `12px solid ${i === 3 ? "rgba(150,120,90,0.95)" : "rgba(120,124,134,0.95)"}`,
                  transform: `scaleY(${strain})`,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  },

  // 的。矢が飛来し中心近くに当たり、環が脈打つ
  target: ({ frame, fps }) => {
    const t = frame / fps;
    const p = loop(t, 2);
    const arrowX = p < 0.7 ? -400 + (p / 0.7) * 400 : 0;
    const hit = p >= 0.7 ? 1 : 0;
    const rings = ["rgba(210,80,90,0.9)", "rgba(240,240,235,0.9)", "rgba(210,80,90,0.9)", "rgba(240,240,235,0.9)"];
    return (
      <div style={{ position: "relative", width: 500, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {rings.map((c, i) => {
          const size = 360 - i * 84;
          const pulse = hit ? 1 + osc(t, 0.6) * 0.03 : 1;
          return (
            <div key={i} style={{ position: "absolute", width: size * pulse, height: size * pulse, borderRadius: "50%", backgroundColor: c }} />
          );
        })}
        <div style={{ position: "absolute", width: 48, height: 48, borderRadius: "50%", backgroundColor: AMBER, zIndex: 3 }} />
        <div style={{ position: "absolute", left: `calc(50% + ${arrowX}px)`, top: "50%", transform: "translateY(-50%)", zIndex: 4 }}>
          <div style={{ width: 160, height: 8, backgroundColor: "rgba(120,124,134,0.98)", borderRadius: 4 }} />
          <div style={{ position: "absolute", right: -18, top: -9, width: 0, height: 0, borderTop: "13px solid transparent", borderBottom: "13px solid transparent", borderLeft: "22px solid rgba(230,230,225,0.98)" }} />
        </div>
      </div>
    );
  },

  // トロフィー。台座の上で光沢が横切り、火花が昇る
  trophy: ({ frame, fps }) => {
    const t = frame / fps;
    const bob = Math.sin(t * 1.4) * 6;
    const shine = loop(t, 2.4);
    return (
      <div style={{ position: "relative", width: 400, height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const p = loop(t, 1.8, (i * 1.8) / 6);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 120 + random(`sp-${i}`) * 160,
                top: 220 - p * 180,
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: AMBER,
                opacity: (1 - p) * 0.8,
              }}
            />
          );
        })}
        <div style={{ transform: `translateY(${bob}px)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: 200, height: 170, borderRadius: "16px 16px 100px 100px", background: GOLD, overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: -80 + shine * 360, width: 50, height: "100%", background: "linear-gradient(90deg, rgba(255,255,255,0) , rgba(255,255,255,0.6), rgba(255,255,255,0))", transform: "skewX(-20deg)" }} />
          </div>
          <div style={{ width: 26, height: 50, background: GOLD }} />
          <div style={{ width: 130, height: 28, background: GOLD, borderRadius: 6 }} />
          <div style={{ width: 150, height: 20, backgroundColor: WOOD, borderRadius: 4 }} />
        </div>
      </div>
    );
  },

  // 表彰台。1-2-3の順位台に立つ人。上位ほど遅れて競り上がる
  podium: ({ frame, fps }) => {
    const t = frame / fps;
    const heights = [
      { h: 220, rank: 1, x: 200, tint: undefined as string | undefined, delay: 0.6 },
      { h: 150, rank: 2, x: 40, tint: STONE, delay: 0.2 },
      { h: 100, rank: 3, x: 360, tint: WOOD, delay: 0 },
    ];
    return (
      <div style={{ position: "relative", width: 560, height: 460 }}>
        {heights.map((b, i) => {
          const grow = clamp((t - b.delay) * 2);
          const arm = b.rank === 1 ? 0.4 + 0.6 * osc(t, 1.4) : 0;
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: b.x, bottom: 0, width: 150, height: b.h * grow, background: b.tint ?? GOLD, borderRadius: "6px 6px 0 0", display: "flex", justifyContent: "center", alignItems: "flex-start", color: WHITE_SOFT, fontSize: 44, fontWeight: 700, paddingTop: 10, opacity: grow }}>
                {b.rank}
              </div>
              <div style={{ position: "absolute", left: b.x + 40, bottom: b.h * grow - 6, transform: "scale(0.62)", opacity: grow }}>
                <Person tint={b.rank === 1 ? undefined : "rgba(70,80,100,0.95)"} armsUp={arm} />
              </div>
            </div>
          );
        })}
      </div>
    );
  },

  // 契約書。条文の紙に判が繰り返し押される
  contract: ({ frame, fps }) => {
    const t = frame / fps;
    const p = loop(t, 2);
    const stampDrop = p < 0.35 ? p / 0.35 : 1;
    const stamped = p >= 0.35 ? 1 : 0;
    const flutter = Math.sin(t * 1.3) * 2;
    return (
      <div style={{ position: "relative", width: 420, height: 500, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 300, height: 400, backgroundColor: "rgba(236, 232, 222, 0.96)", borderRadius: 6, transform: `rotate(${flutter}deg)`, padding: 30, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ height: 8, marginTop: 18, width: `${90 - (i % 3) * 18}%`, backgroundColor: "rgba(60,66,78,0.4)", borderRadius: 4 }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 200 - (1 - stampDrop) * 160,
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "6px solid rgba(200, 70, 70, 0.9)",
            opacity: stampDrop,
            transform: `scale(${1 - (1 - stampDrop) * 0.2})`,
            boxShadow: stamped ? "0 0 0 rgba(0,0,0,0)" : undefined,
          }}
        />
      </div>
    );
  },

  // 消費。買い物袋に商品が次々落ちて入る
  shopping: ({ frame, fps }) => {
    const t = frame / fps;
    const bounce = Math.abs(Math.sin(t * 2)) * 6;
    return (
      <div style={{ position: "relative", width: 420, height: 480 }}>
        {[0, 1, 2].map((i) => {
          const p = loop(t, 1.2, (i * 1.2) / 3);
          const fall = p < 0.6 ? p / 0.6 : 1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 150 + i * 40,
                top: 40 + fall * 220,
                width: 44,
                height: 44,
                borderRadius: 8,
                backgroundColor: [BLUE, AMBER, "rgba(210,90,120,0.9)"][i],
                opacity: p < 0.6 ? 1 : clamp(1 - (p - 0.6) / 0.2),
                transform: `rotate(${p * 180}deg)`,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: 90, bottom: 20 + bounce }}>
          <div style={{ width: 240, height: 260, background: "linear-gradient(180deg, rgba(200,170,120,0.95), rgba(170,140,95,0.95))", borderRadius: "10px 10px 20px 20px" }} />
          <div style={{ position: "absolute", top: -50, left: 40, width: 60, height: 70, borderRadius: "40px 40px 0 0", border: "10px solid rgba(190,160,110,0.95)", borderBottom: "none" }} />
          <div style={{ position: "absolute", top: -50, left: 140, width: 60, height: 70, borderRadius: "40px 40px 0 0", border: "10px solid rgba(190,160,110,0.95)", borderBottom: "none" }} />
        </div>
      </div>
    );
  },

  // 村。丘と家並み。窓が順に灯り、木々が揺れ、鳥が横切る（明トーン向けの情景）
  village: ({ frame, fps }) => {
    const t = frame / fps;
    const houses = [
      { x: 40, s: 1.0 }, { x: 200, s: 0.85 }, { x: 340, s: 1.1 },
      { x: 520, s: 0.9 }, { x: 660, s: 1.0 }, { x: 820, s: 0.8 },
    ];
    return (
      <div style={{ position: "relative", width: 960, height: 480, overflow: "hidden" }}>
        {/* 丘 */}
        <div style={{ position: "absolute", left: -100, bottom: 90, width: 700, height: 340, borderRadius: "50%", backgroundColor: "rgba(110, 160, 105, 0.55)" }} />
        <div style={{ position: "absolute", right: -140, bottom: 70, width: 800, height: 380, borderRadius: "50%", backgroundColor: "rgba(95, 145, 92, 0.65)" }} />
        {/* 木々（風で揺れる） */}
        {[130, 610, 760, 880].map((x, i) => (
          <div key={i} style={{ position: "absolute", left: x, bottom: 170, transformOrigin: "bottom center", transform: `rotate(${Math.sin(t * 1.2 + i) * 2.5}deg)` }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", backgroundColor: "rgba(70, 120, 72, 0.9)" }} />
            <div style={{ width: 10, height: 26, backgroundColor: "rgba(100, 75, 50, 0.9)", margin: "0 auto" }} />
          </div>
        ))}
        {/* 鳥（ときどき横切る） */}
        {[0, 1].map((i) => {
          const p = loop(t, 9, i * 4.5);
          return (
            <div key={i} style={{ position: "absolute", left: p * 1100 - 80, top: 50 + i * 40 + Math.sin(t * 6 + i) * 8, fontSize: 22, color: "rgba(40, 50, 60, 0.7)", transform: "scaleX(-1)" }}>
              ⌵
            </div>
          );
        })}
        {/* 家並み */}
        {houses.map((h, i) => {
          const lit = osc(t, 3.5, i * 0.9) > 0.45;
          return (
            <div key={i} style={{ position: "absolute", left: h.x, bottom: 40, transform: `scale(${h.s})`, transformOrigin: "bottom center" }}>
              <div style={{ width: 0, height: 0, borderLeft: "78px solid transparent", borderRight: "78px solid transparent", borderBottom: "58px solid rgba(52, 62, 80, 0.96)", marginLeft: -8 }} />
              <div style={{ width: 140, height: 96, backgroundColor: "rgba(96, 72, 56, 0.96)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <div style={{ width: 62, height: 46, borderRadius: 4, backgroundColor: lit ? "rgba(255, 216, 140, 0.95)" : "rgba(50, 44, 40, 0.9)", boxShadow: lit ? "0 0 24px rgba(255, 205, 120, 0.5)" : "none" }} />
              </div>
            </div>
          );
        })}
        {/* 地面 */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 44, backgroundColor: "rgba(85, 70, 58, 0.85)" }} />
      </div>
    );
  },

  // 王冠。空の玉座の上で回転し輝く
  crown: ({ frame, fps }) => {
    const t = frame / fps;
    const bob = Math.sin(t * 1.5) * 10;
    const gleam = 0.5 + 0.5 * osc(t, 1.2);
    return (
      <div style={{ position: "relative", width: 420, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", width: 260 + gleam * 80, height: 260 + gleam * 80, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,215,140,${gleam * 0.35}) 0%, rgba(0,0,0,0) 65%)` }} />
        <div style={{ transform: `translateY(${bob}px) perspective(600px) rotateY(${Math.sin(t * 0.9) * 25}deg)` }}>
          <div style={{ position: "relative", width: 200, height: 120 }}>
            <div style={{ position: "absolute", bottom: 0, width: 200, height: 46, background: GOLD, borderRadius: 6 }} />
            <div
              style={{
                position: "absolute",
                bottom: 30,
                width: 200,
                height: 90,
                background: GOLD,
                clipPath: "polygon(0% 100%, 0% 20%, 20% 60%, 50% 0%, 80% 60%, 100% 20%, 100% 100%)",
              }}
            />
            {[20, 100, 180].map((x, i) => (
              <div key={i} style={{ position: "absolute", bottom: 96, left: x - 8, width: 16, height: 16, borderRadius: "50%", backgroundColor: "rgba(210,80,90,0.95)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  },
};
