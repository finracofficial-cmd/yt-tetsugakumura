/** 時間・生・自然のピクトグラム群 */
import {
  AMBER,
  GREEN,
  Person,
  PictoTable,
  STONE,
  STONE_HI,
  WHITE_SOFT,
  WOOD,
  clamp,
  loop,
  osc,
  random,
} from "./primitives";

export const timeNaturePictos: PictoTable = {
  // 針が回り続ける時計
  clock: ({ frame, fps }) => {
    const t = frame / fps;
    const minuteAngle = t * 60;
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
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 8, height: 120, marginLeft: -4, borderRadius: 4, backgroundColor: "rgba(240,240,235,0.9)", transform: `rotate(${hourAngle}deg)`, transformOrigin: "center 0" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 5, height: 165, marginLeft: -2.5, borderRadius: 3, backgroundColor: AMBER, transform: `rotate(${minuteAngle}deg)`, transformOrigin: "center 0" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 20, height: 20, margin: -10, borderRadius: "50%", backgroundColor: "rgba(240,240,235,0.95)" }} />
      </div>
    );
  },

  // 砂時計。砂が落ち続け、上が減り下が積もる。周期で反転
  hourglass: ({ frame, fps }) => {
    const t = frame / fps;
    const p = loop(t, 4);
    const flip = Math.floor((t / 4) % 2) === 1;
    return (
      <div style={{ position: "relative", width: 300, height: 460, transform: flip ? "rotate(180deg)" : "none" }}>
        <div style={{ position: "absolute", top: 0, left: 20, width: 260, height: 20, backgroundColor: WOOD, borderRadius: 6 }} />
        <div style={{ position: "absolute", bottom: 0, left: 20, width: 260, height: 20, backgroundColor: WOOD, borderRadius: 6 }} />
        {/* ガラス */}
        <div style={{ position: "absolute", top: 20, left: 60, width: 180, height: 190, background: "rgba(180,200,220,0.08)", borderRadius: "0 0 90px 90px", clipPath: "polygon(0 0, 100% 0, 55% 100%, 45% 100%)", border: "2px solid rgba(200,210,220,0.4)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 60, width: 180, height: 190, background: "rgba(180,200,220,0.08)", clipPath: "polygon(45% 0, 55% 0, 100% 100%, 0 100%)", border: "2px solid rgba(200,210,220,0.4)" }} />
        {/* 上の砂（減る） */}
        <div style={{ position: "absolute", top: 24, left: 62, width: 176, height: 180 * (1 - p), background: "rgba(230,190,120,0.85)", clipPath: "polygon(0 0, 100% 0, 55% 100%, 45% 100%)" }} />
        {/* 落ちる筋 */}
        <div style={{ position: "absolute", top: 210, left: 148, width: 4, height: 40, backgroundColor: "rgba(230,190,120,0.8)" }} />
        {/* 下の砂（積もる） */}
        <div style={{ position: "absolute", bottom: 22, left: 62, width: 176, height: 160 * p, background: "rgba(230,190,120,0.85)", clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }} />
      </div>
    );
  },

  // 蝋燭。炎が揺らぎ明滅し、少しずつ融ける
  candle: ({ frame, fps }) => {
    const t = frame / fps;
    const sway = Math.sin(t * 6) * 6 + Math.sin(t * 13) * 3;
    const flick = 0.8 + 0.2 * Math.sin(t * 18);
    const melt = clamp(t / 12) * 40;
    return (
      <div style={{ position: "relative", width: 300, height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", bottom: 100 + 200 - melt, width: 220 + flick * 40, height: 220, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,200,120,${flick * 0.3}) 0%, rgba(0,0,0,0) 65%)` }} />
        <div
          style={{
            position: "absolute",
            bottom: 150 + 200 - melt,
            width: 34,
            height: 70 * flick,
            borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%",
            background: "radial-gradient(circle at 50% 70%, rgba(255,240,190,0.98), rgba(255,160,60,0.9))",
            transform: `translateX(${sway}px) rotate(${sway * 0.3}deg)`,
            boxShadow: "0 0 30px rgba(255,180,90,0.7)",
          }}
        />
        <div style={{ width: 90, height: 300 - melt, background: "linear-gradient(180deg, rgba(238,232,220,0.96), rgba(210,202,188,0.96))", borderRadius: "10px 10px 4px 4px" }} />
      </div>
    );
  },

  // 木。梢が風に揺れ、葉が舞い落ちる
  tree: ({ frame, fps }) => {
    const t = frame / fps;
    const sway = Math.sin(t * 1.1) * 4;
    return (
      <div style={{ position: "relative", width: 460, height: 480, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const p = loop(t, 3.4, (i * 3.4) / 6);
          const x = 180 + random(`lf-${i}`) * 120;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x + Math.sin(t * 2 + i) * 26,
                top: 120 + p * 300,
                width: 16,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "rgba(200,150,80,0.8)",
                opacity: (1 - p) * 0.9,
                transform: `rotate(${p * 360}deg)`,
              }}
            />
          );
        })}
        <div style={{ transformOrigin: "bottom center", transform: `rotate(${sway}deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", width: 300, height: 260 }}>
            <div style={{ position: "absolute", left: 60, top: 40, width: 180, height: 180, borderRadius: "50%", backgroundColor: "rgba(80,150,100,0.92)" }} />
            <div style={{ position: "absolute", left: 20, top: 90, width: 130, height: 130, borderRadius: "50%", backgroundColor: "rgba(70,140,92,0.92)" }} />
            <div style={{ position: "absolute", left: 150, top: 90, width: 130, height: 130, borderRadius: "50%", backgroundColor: "rgba(90,160,108,0.92)" }} />
          </div>
          <div style={{ width: 40, height: 150, background: WOOD, borderRadius: 6, marginTop: -30 }} />
        </div>
      </div>
    );
  },

  // 芽生え。土から茎が伸び、双葉が開く（周期でやり直す）
  seed: ({ frame, fps }) => {
    const t = frame / fps;
    const g = clamp(loop(t, 5) * 1.4);
    const sway = Math.sin(t * 2) * 3;
    return (
      <div style={{ position: "relative", width: 400, height: 460, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", bottom: 40, width: 260, height: 40, borderRadius: "50%", background: "rgba(90,70,55,0.9)" }} />
        <div style={{ transformOrigin: "bottom center", transform: `rotate(${sway}deg)`, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 56 }}>
          <div style={{ position: "relative", width: 200, height: 120 * g }}>
            <div style={{ position: "absolute", left: -10, top: 0, width: 70 * clamp(g - 0.4), height: 44 * clamp(g - 0.4), borderRadius: "0 100% 0 100%", backgroundColor: GREEN, transform: "rotate(-20deg)", transformOrigin: "bottom right" }} />
            <div style={{ position: "absolute", right: -10, top: 0, width: 70 * clamp(g - 0.4), height: 44 * clamp(g - 0.4), borderRadius: "100% 0 100% 0", backgroundColor: GREEN, transform: "rotate(20deg)", transformOrigin: "bottom left" }} />
          </div>
          <div style={{ width: 10, height: 150 * g, background: "rgba(90,160,100,0.95)", borderRadius: 6 }} />
        </div>
      </div>
    );
  },

  // 人生の道。蛇行する道が地平へ伸び、中央線が手前へ流れる
  path: ({ frame, fps }) => {
    const t = frame / fps;
    const scroll = loop(t, 1.6);
    return (
      <div style={{ position: "relative", width: 700, height: 480, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 40, left: 350 - 25, width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,220,160,0.9), rgba(230,180,110,0.6))" }} />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "340px solid transparent",
            borderRight: "340px solid transparent",
            borderBottom: "440px solid rgba(48,52,62,0.9)",
          }}
        />
        {Array.from({ length: 7 }).map((_, i) => {
          const k = (i + scroll) / 7;
          const y = 440 - k * 400;
          const w = 40 * (1 - k) + 4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(50% + ${Math.sin(k * 4) * 30 * (1 - k)}px)`,
                bottom: 440 - y,
                width: w,
                height: 24 * (1 - k) + 3,
                marginLeft: -w / 2,
                backgroundColor: "rgba(240,220,150,0.8)",
                borderRadius: 4,
              }}
            />
          );
        })}
      </div>
    );
  },

  // 選択の扉。細く開いた扉から光が漏れ、隙間が呼吸する
  door: ({ frame, fps }) => {
    const t = frame / fps;
    const open = 20 + osc(t, 2.4) * 40;
    return (
      <div style={{ position: "relative", width: 400, height: 500, display: "flex", justifyContent: "center", alignItems: "center", perspective: 800 }}>
        <div style={{ position: "relative", width: 240, height: 400, backgroundColor: "rgba(40,44,54,0.98)", borderRadius: "8px 8px 0 0", border: "6px solid rgba(90,70,50,0.9)", overflow: "visible" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: open, background: "linear-gradient(90deg, rgba(255,240,200,0.9), rgba(255,220,150,0.2))", filter: "blur(2px)" }} />
          <div
            style={{
              position: "absolute",
              left: open,
              top: -6,
              bottom: -6,
              width: 234,
              background: WOOD,
              borderRadius: "6px 6px 0 0",
              transformOrigin: "left center",
              transform: `rotateY(${-25 - open}deg)`,
              boxShadow: "0 0 40px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ position: "absolute", right: 22, top: "50%", width: 14, height: 14, borderRadius: "50%", backgroundColor: AMBER }} />
          </div>
        </div>
      </div>
    );
  },

  // 山。頂へジグザグに登る小さな人。旗がはためき雲が流れる
  mountain: ({ frame, fps }) => {
    const t = frame / fps;
    const climb = loop(t, 6);
    const zig = Math.sin(climb * Math.PI * 5) * 90;
    const cx = 350 + zig;
    const cy = 420 - climb * 300;
    return (
      <div style={{ position: "relative", width: 700, height: 480, overflow: "hidden" }}>
        {[0, 1].map((i) => {
          const p = loop(t, 8, i * 4);
          return <div key={i} style={{ position: "absolute", top: 40 + i * 40, left: -120 + p * 900, width: 140, height: 50, borderRadius: 40, backgroundColor: "rgba(200,205,215,0.12)" }} />;
        })}
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "350px solid transparent", borderRight: "350px solid transparent", borderBottom: "420px solid rgba(52,58,70,0.95)" }} />
        <div style={{ position: "absolute", bottom: 380, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "60px solid transparent", borderRight: "60px solid transparent", borderBottom: "60px solid rgba(235,238,242,0.9)" }} />
        <div style={{ position: "absolute", left: 340, bottom: 380, width: 4, height: 60, backgroundColor: STONE_HI }} />
        <div style={{ position: "absolute", left: 344, bottom: 420, width: 40, height: 26, backgroundColor: "rgba(210,90,90,0.9)", transformOrigin: "left center", transform: `skewX(${Math.sin(t * 8) * 12}deg)` }} />
        <div style={{ position: "absolute", left: cx, top: cy, transform: "scale(0.4)" }}>
          <Person tint={AMBER} />
        </div>
      </div>
    );
  },
};
