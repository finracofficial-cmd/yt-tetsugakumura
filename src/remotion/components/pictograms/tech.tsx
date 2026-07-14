/** テクノロジー・メディアのピクトグラム群 */
import {
  AMBER,
  BLUE,
  PINK,
  PictoTable,
  RED,
  WHITE_SOFT,
  clamp,
  loop,
  osc,
  random,
} from "./primitives";

export const techPictos: PictoTable = {
  // スマホの画面をフィードが流れ続け、ハートが浮かぶ
  smartphone: ({ frame, fps }) => {
    const t = frame / fps;
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
                color: PINK,
              }}
            >
              ♥
            </div>
          );
        })}
      </div>
    );
  },

  // 通知。鈴が振れて鳴り、通知バブルが弾け出る
  notification: ({ frame, fps }) => {
    const t = frame / fps;
    const ring = Math.sin(t * 10) * (8 + osc(t, 1.6) * 10);
    return (
      <div style={{ position: "relative", width: 460, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: 4 }).map((_, i) => {
          const p = loop(t, 1.5, (i * 1.5) / 4);
          const a = -0.6 + i * 0.4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(50% + ${Math.cos(a) * (60 + p * 160)}px)`,
                top: `calc(50% - ${80 + p * 120}px)`,
                width: 40,
                height: 30,
                borderRadius: 10,
                backgroundColor: [BLUE, PINK, AMBER, "rgba(120,200,150,0.9)"][i],
                opacity: (1 - p) * 0.9,
                transform: `scale(${0.6 + p * 0.6})`,
              }}
            />
          );
        })}
        <div style={{ position: "relative", transform: `rotate(${ring}deg)`, transformOrigin: "top center" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: WHITE_SOFT, margin: "0 auto" }} />
          <div style={{ width: 130, height: 150, borderRadius: "60px 60px 20px 20px", background: "linear-gradient(180deg, rgba(255,215,140,0.95), rgba(220,170,90,0.95))", marginTop: -4 }} />
          <div style={{ width: 160, height: 16, borderRadius: 8, backgroundColor: "rgba(220,170,90,0.95)", marginLeft: -15 }} />
          <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: "rgba(220,170,90,0.95)", margin: "2px auto 0" }} />
        </div>
        <div style={{ position: "absolute", top: 120, right: 120, minWidth: 44, height: 44, borderRadius: 22, backgroundColor: RED, color: "#fff", display: "flex", justifyContent: "center", alignItems: "center", fontSize: 26, fontWeight: 700, padding: "0 6px" }}>
          {1 + Math.floor(loop(t, 1.5) * 9)}
        </div>
      </div>
    );
  },

  // 画面。走査線が流れ、色が明滅するモニター
  screen: ({ frame, fps }) => {
    const t = frame / fps;
    const hue = (Math.sin(t * 0.7) + 1) / 2;
    const scan = loop(t, 1.2);
    return (
      <div style={{ position: "relative", width: 520, height: 440, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            position: "relative",
            width: 480,
            height: 300,
            borderRadius: 14,
            border: "10px solid rgba(50,54,64,0.98)",
            overflow: "hidden",
            background: `linear-gradient(135deg, rgba(${60 + hue * 100},${120},${200 - hue * 80},0.5), rgba(${140},${80 + hue * 80},${180},0.5))`,
            boxShadow: `0 0 60px rgba(120,160,220,${0.2 + hue * 0.2})`,
          }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ position: "absolute", left: 0, right: 0, top: i * 16, height: 8, backgroundColor: "rgba(0,0,0,0.12)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, top: scan * 300, height: 40, background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0))" }} />
        </div>
        <div style={{ width: 60, height: 40, backgroundColor: "rgba(50,54,64,0.98)" }} />
        <div style={{ width: 200, height: 16, borderRadius: 8, backgroundColor: "rgba(50,54,64,0.98)" }} />
      </div>
    );
  },

  // 監視カメラ。首を左右に振り、赤い録画ランプが明滅、走査光
  camera: ({ frame, fps }) => {
    const t = frame / fps;
    const pan = Math.sin(t * 0.8) * 26;
    const rec = osc(t, 0.8) > 0.5 ? 1 : 0.2;
    return (
      <div style={{ position: "relative", width: 520, height: 420 }}>
        <div style={{ position: "absolute", top: 20, left: 250, width: 16, height: 90, backgroundColor: "rgba(70,74,86,0.95)" }} />
        <div style={{ position: "absolute", top: 100, left: 230, transformOrigin: "30px 20px", transform: `rotate(${pan}deg)` }}>
          <div style={{ width: 200, height: 90, borderRadius: "16px 40px 40px 16px", background: "linear-gradient(180deg, rgba(120,126,138,0.98), rgba(80,84,96,0.98))" }} />
          <div style={{ position: "absolute", right: -6, top: 20, width: 44, height: 50, borderRadius: "50%", backgroundColor: "rgba(20,24,32,0.98)", border: "5px solid rgba(150,155,165,0.9)" }} />
          <div style={{ position: "absolute", left: 16, top: 16, width: 16, height: 16, borderRadius: "50%", backgroundColor: `rgba(230,70,70,${rec})`, boxShadow: `0 0 ${rec * 16}px rgba(230,70,70,0.8)` }} />
          <div style={{ position: "absolute", right: -220, top: -20, width: 260, height: 130, background: "linear-gradient(90deg, rgba(255,240,190,0.16), rgba(255,240,190,0))", clipPath: "polygon(0 40%, 100% 0, 100% 100%, 0 60%)" }} />
        </div>
      </div>
    );
  },

  // ネットワーク。節点が繋がり、辺に沿って光が走る
  network: ({ frame, fps }) => {
    const t = frame / fps;
    const nodes = [
      [250, 220],
      [90, 90],
      [420, 110],
      [70, 320],
      [440, 330],
      [250, 400],
    ];
    const edges = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [1, 2],
      [3, 5],
      [4, 5],
    ];
    return (
      <div style={{ position: "relative", width: 520, height: 460 }}>
        {edges.map(([a, b], i) => {
          const [x1, y1] = nodes[a];
          const [x2, y2] = nodes[b];
          const len = Math.hypot(x2 - x1, y2 - y1);
          const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          const p = loop(t, 2, (i * 2) / edges.length);
          return (
            <div key={i}>
              <div style={{ position: "absolute", left: x1, top: y1, width: len, height: 2, backgroundColor: "rgba(150,170,210,0.28)", transformOrigin: "left center", transform: `rotate(${ang}deg)` }} />
              <div style={{ position: "absolute", left: x1 + (x2 - x1) * p - 5, top: y1 + (y2 - y1) * p - 5, width: 10, height: 10, borderRadius: "50%", backgroundColor: AMBER, boxShadow: "0 0 12px rgba(255,200,120,0.8)" }} />
            </div>
          );
        })}
        {nodes.map(([x, y], i) => {
          const pulse = i === 0 ? 1 + osc(t, 1) * 0.15 : 1;
          const r = i === 0 ? 34 : 22;
          return (
            <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: i === 0 ? "radial-gradient(circle, rgba(150,190,240,0.98), rgba(80,120,200,0.9))" : "rgba(120,150,210,0.9)", transform: `scale(${pulse})` }} />
          );
        })}
      </div>
    );
  },

  // エコーチェンバー。中心の口から同じ形の声が反響して広がる
  echo: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 520, height: 460, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const p = loop(t, 2.6, (i * 2.6) / 5);
          const size = 90 + p * 380;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: size,
                height: size * 0.8,
                borderRadius: "40px 40px 40px 6px",
                border: `3px solid rgba(150,180,230,${(1 - p) * 0.55})`,
                transform: "rotate(0deg)",
              }}
            />
          );
        })}
        <div style={{ width: 90, height: 72, borderRadius: "24px 24px 24px 4px", background: "linear-gradient(180deg, rgba(150,190,240,0.98), rgba(90,130,210,0.95))", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 40, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.8)" }} />
        </div>
      </div>
    );
  },
};
