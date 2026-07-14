/** 心・感情・思考のピクトグラム群 */
import {
  AMBER,
  BLUE,
  Head,
  PictoTable,
  RED,
  Ripples,
  SKIN,
  WHITE_SOFT,
  clamp,
  loop,
  osc,
} from "./primitives";

export const mindPictos: PictoTable = {
  // 頭部の中の脳が脈打ち、波紋が広がる
  brain: ({ frame, fps }) => {
    const t = frame / fps;
    const pulse = 1 + 0.05 * Math.sin(t * 3.2);
    return (
      <div style={{ position: "relative", width: 620, height: 520, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Ripples t={t} />
        <Head width={230} height={260}>
          <div
            style={{
              width: 130,
              height: 105,
              borderRadius: "48% 52% 50% 50%",
              background: "radial-gradient(circle at 40% 40%, rgba(255,190,120,0.95), rgba(220,120,90,0.9))",
              transform: `scale(${pulse})`,
              boxShadow: `0 0 ${30 + 20 * Math.sin(t * 3.2)}px rgba(255,180,100,0.5)`,
            }}
          />
        </Head>
      </div>
    );
  },

  // 鼓動するハート。シーン後半でひびが入る
  heart: ({ frame, fps }) => {
    const t = frame / fps;
    const beat = 1 + Math.max(0, Math.sin(t * 3.4)) * 0.08 + Math.max(0, Math.sin(t * 3.4 + 0.5)) * 0.04;
    const crack = clamp((t - 3.2) / 0.8);
    return (
      <div style={{ position: "relative", width: 380, height: 360, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "relative", transform: `scale(${beat})` }}>
          <div style={{ position: "absolute", left: -10, top: 0, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED }} />
          <div style={{ position: "absolute", left: 100, top: 0, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED }} />
          <div style={{ position: "absolute", left: 30, top: 60, width: 180, height: 180, backgroundColor: RED, transform: "rotate(45deg)" }} />
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
  },

  // 素顔の前に浮かぶ笑顔の仮面が近づいたり離れたりする
  mask: ({ frame, fps }) => {
    const t = frame / fps;
    const maskOffset = 90 + Math.sin(t * 0.9) * 55;
    const bob = Math.sin(t * 1.4) * 5;
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 380 }}>
        <Head width={190} height={240} style={{ gap: 20 }}>
          <div style={{ display: "flex", gap: 44 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "rgba(220,220,215,0.7)" }} />
            <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "rgba(220,220,215,0.7)" }} />
          </div>
          <div style={{ width: 44, height: 3, backgroundColor: "rgba(220,220,215,0.5)" }} />
        </Head>
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
  },

  // 視線が泳ぎ、ときどき瞬きする大きな目
  eye: ({ frame, fps }) => {
    const t = frame / fps;
    const gaze = Math.sin(t * 0.8) * 46;
    const bp = loop(t, 3.2);
    const blink = bp > 0.92 ? Math.sin(((bp - 0.92) / 0.08) * Math.PI) : 0;
    return (
      <div style={{ position: "relative", width: 520, height: 260, display: "flex", justifyContent: "center", alignItems: "center" }}>
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
  },

  // 不安。頭の中で渦が回り続け、微かに震える
  anxiety: ({ frame, fps }) => {
    const t = frame / fps;
    const jit = Math.sin(t * 22) * 1.6;
    return (
      <div style={{ position: "relative", transform: `translate(${jit}px, ${Math.cos(t * 19) * 1.6}px)` }}>
        <Head width={220} height={250}>
          <div style={{ position: "relative", width: 150, height: 150, transform: `rotate(${t * 90}deg)` }}>
            {Array.from({ length: 26 }).map((_, i) => {
              const a = i * 0.5;
              const r = 6 + i * 2.6;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 75 + Math.cos(a) * r - 3,
                    top: 75 + Math.sin(a) * r - 3,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: `rgba(255, 170, 120, ${0.3 + (i / 26) * 0.6})`,
                  }}
                />
              );
            })}
          </div>
        </Head>
      </div>
    );
  },

  // 気づき。明滅していた電球が閃き、光線が広がる
  lightbulb: ({ frame, fps }) => {
    const t = frame / fps;
    const on = clamp(Math.sin(t * 2.2) * 0.5 + 0.6);
    return (
      <div style={{ position: "relative", width: 460, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 6,
              height: 60 + on * 50,
              borderRadius: 3,
              backgroundColor: `rgba(255, 220, 150, ${on * 0.7})`,
              transform: `rotate(${i * 30}deg) translateY(-${170 + on * 30}px)`,
              transformOrigin: "center 0",
            }}
          />
        ))}
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: "50% 50% 46% 46%",
            background: `radial-gradient(circle at 42% 38%, rgba(255,240,190,${0.4 + on * 0.55}), rgba(230,180,90,${0.5 + on * 0.4}))`,
            boxShadow: `0 0 ${20 + on * 70}px rgba(255,210,120,${on * 0.7})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <div style={{ width: 46, height: 26, borderRadius: "0 0 8px 8px", backgroundColor: "rgba(180,180,175,0.8)", marginBottom: -14 }} />
        </div>
      </div>
    );
  },

  // 依存。中央の光る報酬へ、下から手が繰り返し伸びる
  addiction: ({ frame, fps }) => {
    const t = frame / fps;
    const reach = osc(t, 1.4);
    const glow = 0.5 + 0.5 * osc(t, 0.7);
    return (
      <div style={{ position: "relative", width: 460, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: 3 }).map((_, i) => {
          const p = loop(t, 1.6, (i * 1.6) / 3);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: 120,
                width: 40 + p * 220,
                height: 40 + p * 220,
                borderRadius: "50%",
                border: `2px solid rgba(255,190,120,${(1 - p) * 0.5})`,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            top: 120,
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,230,170,0.95), rgba(230,150,80,0.9))",
            boxShadow: `0 0 ${30 + glow * 40}px rgba(255,200,120,0.7)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30 - reach * 60,
            width: 44,
            height: 150 + reach * 60,
            borderRadius: "22px 22px 8px 8px",
            backgroundColor: SKIN,
          }}
        />
      </div>
    );
  },

  // 思索。頭部から思考の泡が連なって昇る
  thought: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 480, height: 460, display: "flex", alignItems: "flex-end", justifyContent: "flex-start", paddingLeft: 60, paddingBottom: 20 }}>
        <Head width={180} height={210} style={{ marginBottom: 10 }} />
        {[0, 1, 2].map((i) => {
          const rise = osc(t, 3, i * 1);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 180 + i * 46,
                bottom: 200 + i * 60 + rise * 10,
                width: 30 + i * 26,
                height: 30 + i * 26,
                borderRadius: "50%",
                backgroundColor: `rgba(240,240,235,${0.18 + i * 0.14})`,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 300,
            bottom: 360,
            fontSize: 60,
            color: AMBER,
            opacity: 0.5 + 0.5 * osc(t, 1.5),
          }}
        >
          ?
        </div>
      </div>
    );
  },

  // 涙。うつむいた顔から滴が落ち続ける
  tears: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 360, height: 460 }}>
        <div style={{ position: "absolute", left: 60, top: 20 }}>
          <Head width={230} height={250} style={{ gap: 26 }}>
            <div style={{ display: "flex", gap: 50 }}>
              <div style={{ width: 30, height: 6, borderRadius: 4, backgroundColor: "rgba(200,205,215,0.7)", transform: "rotate(12deg)" }} />
              <div style={{ width: 30, height: 6, borderRadius: 4, backgroundColor: "rgba(200,205,215,0.7)", transform: "rotate(-12deg)" }} />
            </div>
            <div style={{ width: 40, height: 18, borderRadius: "30px 30px 0 0", border: "3px solid rgba(200,205,215,0.6)", borderBottom: "none" }} />
          </Head>
        </div>
        {[0, 1, 2, 3].map((i) => {
          const side = i % 2 === 0 ? 120 : 210;
          const p = loop(t, 1.8, (i * 1.8) / 4);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: side,
                top: 150 + p * 260,
                width: 16,
                height: 22,
                borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%",
                background: "linear-gradient(180deg, rgba(150,190,230,0.9), rgba(90,140,210,0.85))",
                opacity: (1 - p) * 0.9,
                transform: "rotate(45deg)",
              }}
            />
          );
        })}
      </div>
    );
  },

  // 夢・眠り。横向きの頭からZが昇る
  dream: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 480, height: 420 }}>
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 160,
            width: 230,
            height: 200,
            borderRadius: "46% 50% 50% 46% / 60% 55% 45% 40%",
            backgroundColor: "rgba(45, 52, 68, 0.95)",
          }}
        />
        <div style={{ position: "absolute", left: 90, top: 230, width: 34, height: 6, borderRadius: 4, backgroundColor: WHITE_SOFT }} />
        {[0, 1, 2].map((i) => {
          const p = loop(t, 3, (i * 3) / 3);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 250 + p * 120,
                top: 200 - p * 150,
                fontSize: 34 + i * 16,
                fontWeight: 700,
                color: BLUE,
                opacity: (1 - p) * 0.9,
              }}
            >
              Z
            </div>
          );
        })}
      </div>
    );
  },
};
