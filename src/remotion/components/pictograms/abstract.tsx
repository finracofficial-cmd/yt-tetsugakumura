/** 抽象・科学・概念のピクトグラム群 */
import {
  AMBER,
  BLUE,
  GREEN,
  Person,
  PictoTable,
  RED,
  STONE,
  WHITE_SOFT,
  WOOD,
  clamp,
  loop,
  osc,
} from "./primitives";

export const abstractPictos: PictoTable = {
  // 回転し続ける二重らせん
  dna: ({ frame, fps }) => {
    const t = frame / fps;
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
              <div style={{ position: "absolute", left: Math.min(x1, x2), top: y + 9, width: Math.abs(x2 - x1), height: 2, backgroundColor: "rgba(255,255,255,0.18)" }} />
              {[
                { x: x1, z: z1, c: AMBER },
                { x: x2, z: z2, c: BLUE },
              ].map((p, j) => (
                <div key={j} style={{ position: "absolute", left: p.x - 10, top: y, width: 20, height: 20, borderRadius: "50%", backgroundColor: p.c, opacity: 0.45 + 0.55 * ((p.z + 1) / 2), transform: `scale(${0.7 + 0.4 * ((p.z + 1) / 2)})` }} />
              ))}
            </div>
          );
        })}
      </div>
    );
  },

  // 原子。原子核の周りを電子が3つの軌道で回る
  atom: ({ frame, fps }) => {
    const t = frame / fps;
    const orbits = [0, 60, 120];
    return (
      <div style={{ position: "relative", width: 460, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {orbits.map((rot, i) => (
          <div key={i} style={{ position: "absolute", width: 360, height: 150, borderRadius: "50%", border: "3px solid rgba(150,180,230,0.4)", transform: `rotate(${rot}deg)` }}>
            <div
              style={{
                position: "absolute",
                left: 180 + Math.cos(t * 2 + i * 2) * 180 - 11,
                top: 75 + Math.sin(t * 2 + i * 2) * 75 - 11,
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: AMBER,
                boxShadow: "0 0 14px rgba(255,200,120,0.7)",
                transform: `rotate(${-rot}deg)`,
              }}
            />
          </div>
        ))}
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,120,0.98), rgba(220,120,90,0.9))", boxShadow: `0 0 ${20 + osc(t, 1) * 20}px rgba(255,160,90,0.7)`, zIndex: 3 }} />
      </div>
    );
  },

  // 進化。四段階のシルエットが直立に近づき、光が横切る
  evolution: ({ frame, fps }) => {
    const t = frame / fps;
    const sweep = loop(t, 3);
    const stages = [0.55, 0.7, 0.85, 1];
    return (
      <div style={{ position: "relative", width: 700, height: 380, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 30 }}>
        {stages.map((s, i) => {
          const lit = clamp(1 - Math.abs(sweep - i / (stages.length - 1)) * 3);
          return (
            <div key={i} style={{ transform: `scale(${s}) rotate(${(1 - s) * 22}deg)`, transformOrigin: "bottom center", opacity: 0.5 + s * 0.5, filter: lit > 0 ? `drop-shadow(0 0 ${lit * 20}px rgba(255,200,120,0.7))` : "none" }}>
              <Person tint={`rgba(${60 + i * 20}, ${70 + i * 12}, ${90 + i * 8}, 0.95)`} />
            </div>
          );
        })}
      </div>
    );
  },

  // 上昇の矢印。段が下から積み上がり、輝きが昇る
  arrowUp: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 360, height: 480, display: "flex", flexDirection: "column-reverse", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
        <div style={{ position: "absolute", bottom: 0, width: 200, height: 200, display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 10 }}>
          {[0, 1, 2].map((i) => {
            const lift = osc(t, 1.2, i * 0.4);
            return <div key={i} style={{ width: 200 - i * 10, height: 44, backgroundColor: `rgba(90, 200, 150, ${0.55 + lift * 0.4})`, borderRadius: 8, transform: `translateY(${-lift * 6}px)` }} />;
          })}
        </div>
        <div style={{ position: "absolute", bottom: 190, width: 0, height: 0, borderLeft: "130px solid transparent", borderRight: "130px solid transparent", borderBottom: `150px solid ${GREEN}`, filter: `drop-shadow(0 -6px 20px rgba(90,200,150,${0.4 + osc(t, 1) * 0.3}))` }} />
      </div>
    );
  },

  // 下落の矢印。段が崩れ落ち、赤い矢が下を指す
  arrowDown: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 360, height: 480, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 10 }}>
        <div style={{ position: "absolute", top: 0, width: 200, height: 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {[0, 1, 2].map((i) => {
            const drop = osc(t, 1.2, i * 0.4);
            return <div key={i} style={{ width: 200 - i * 10, height: 44, backgroundColor: `rgba(210, 90, 90, ${0.55 + drop * 0.4})`, borderRadius: 8, transform: `translateY(${drop * 6}px)` }} />;
          })}
        </div>
        <div style={{ position: "absolute", top: 190, width: 0, height: 0, borderLeft: "130px solid transparent", borderRight: "130px solid transparent", borderTop: `150px solid ${RED}`, filter: `drop-shadow(0 6px 20px rgba(210,90,90,${0.4 + osc(t, 1) * 0.3}))` }} />
      </div>
    );
  },

  // 循環。三つの矢印が円環をなして回り続ける
  cycle: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 440, height: 440, display: "flex", justifyContent: "center", alignItems: "center", transform: `rotate(${t * 90}deg)` }}>
        {[0, 120, 240].map((rot, i) => (
          <div key={i} style={{ position: "absolute", width: 320, height: 320, transform: `rotate(${rot}deg)` }}>
            <div style={{ position: "absolute", left: 30, top: 0, width: 260, height: 260, borderRadius: "50%", border: "22px solid rgba(120,160,220,0.85)", clipPath: "polygon(50% 0, 100% 0, 100% 50%, 50% 50%)" }} />
            <div style={{ position: "absolute", left: 280, top: 90, width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "40px solid rgba(120,160,220,0.9)" }} />
          </div>
        ))}
      </div>
    );
  },

  // 岐路。道が二手に分かれ、人が分岐点に立ち、矢印が交互に点る
  crossroad: ({ frame, fps }) => {
    const t = frame / fps;
    const leftLit = osc(t, 2) > 0.5;
    return (
      <div style={{ position: "relative", width: 640, height: 460, overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 120, height: 220, backgroundColor: "rgba(48,52,62,0.95)" }} />
        <div style={{ position: "absolute", bottom: 180, left: "50%", width: 300, height: 130, backgroundColor: "rgba(48,52,62,0.95)", transformOrigin: "left bottom", transform: "translateX(-10px) rotate(-32deg)" }} />
        <div style={{ position: "absolute", bottom: 180, right: "50%", width: 300, height: 130, backgroundColor: "rgba(48,52,62,0.95)", transformOrigin: "right bottom", transform: "translateX(10px) rotate(32deg)" }} />
        {[-1, 1].map((s) => {
          const lit = s < 0 ? leftLit : !leftLit;
          return (
            <div
              key={s}
              style={{
                position: "absolute",
                top: 150,
                left: s < 0 ? 120 : undefined,
                right: s > 0 ? 120 : undefined,
                width: 0,
                height: 0,
                borderTop: "30px solid transparent",
                borderBottom: "30px solid transparent",
                [s < 0 ? "borderRight" : "borderLeft"]: `44px solid ${AMBER}`,
                opacity: lit ? 0.5 + osc(t, 1) * 0.5 : 0.2,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", bottom: 150, left: "50%", transform: "translateX(-50%) scale(0.6)" }}>
          <Person tint={BLUE} sway={Math.sin(t * 1.6) * 3} />
        </div>
      </div>
    );
  },

  // 問い。大きな「？」が脈打ち、小さな問いが周囲を巡る
  question: ({ frame, fps }) => {
    const t = frame / fps;
    const pulse = 1 + osc(t, 1.4) * 0.08;
    return (
      <div style={{ position: "relative", width: 440, height: 440, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2 + t * 0.6;
          return (
            <div key={i} style={{ position: "absolute", left: `calc(50% + ${Math.cos(a) * 180}px)`, top: `calc(50% + ${Math.sin(a) * 180}px)`, fontSize: 40, color: "rgba(150,180,230,0.6)", transform: "translate(-50%,-50%)" }}>
              ?
            </div>
          );
        })}
        <div style={{ fontSize: 300, fontWeight: 700, lineHeight: 1, color: AMBER, transform: `scale(${pulse})`, textShadow: `0 0 ${20 + osc(t, 1.4) * 30}px rgba(255,200,120,0.5)` }}>
          ?
        </div>
      </div>
    );
  },
};
