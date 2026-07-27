import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { safeInterpolate } from "../../safeInterpolate";
import { revealAt } from "../../reveal";
import type { SceneryPlace } from "../../../generator/types";

type Props = {
  place: SceneryPlace;
  people: number;
  caption?: string;
  durationInFrames: number;
  sceneId: number;
};

/** 決定論的な擬似乱数（同じシーンなら毎回同じ絵になる） */
function rnd(seed: number): () => number {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * 人物。参照チャンネルの人は「黒いシルエット」ではなく、
 * 服に色があり、顔は肌色の面で、足元に必ず楕円の光だまりがある
 * （映像スタイルガイド §9）。
 */
const Person: React.FC<{
  x: number;
  y: number;
  scale: number;
  coat: string;
  flip?: boolean;
}> = ({ x, y, scale, coat, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${(flip ? -scale : scale)} ${scale})`}>
    {/* 足元の光だまり（接地感） */}
    <ellipse cx="0" cy="2" rx="15" ry="4" fill="#ffe6b0" opacity="0.13" />
    {/* 体（単純な台形） */}
    <path d="M -7 0 L -5.5 -22 L 5.5 -22 L 7 0 Z" fill={coat} />
    {/* 頭 */}
    <circle cx="0" cy="-27" r="5.4" fill="#e8c9a8" />
    {/* 髪 */}
    <path d="M -5.4 -28 a 5.4 5.4 0 0 1 10.8 0 z" fill="#20242e" />
  </g>
);

/** 人を地面のラインに沿って散らす */
const People: React.FC<{
  count: number;
  seed: number;
  baseY: number;
  reveal: number;
}> = ({ count, seed, baseY, reveal }) => {
  const r = rnd(seed + 77);
  const COATS = ["#3f5a6b", "#6b4a4a", "#4a5f45", "#5a4a6b", "#7a6242", "#37485c"];
  const items = Array.from({ length: count }, (_, i) => {
    const depth = r(); // 0=奥, 1=手前
    return {
      x: 120 + r() * 1680,
      y: baseY - 60 + depth * 190,
      // 参照チャンネルの人物は1920幅の画面で頭〜足が100〜160px程度あり、
      // これより小さいと「点」になって情景として読めない（映像スタイルガイド §9）。
      scale: 1.6 + depth * 1.8,
      coat: COATS[Math.floor(r() * COATS.length)],
      flip: r() > 0.5,
      i,
    };
  }).sort((a, b) => a.y - b.y);
  return (
    <>
      {items.map((p) => {
        // 奥の人から順に現れる
        const t = Math.min(1, Math.max(0, reveal * count - p.i * 0.6));
        return (
          <g key={p.i} opacity={t}>
            <Person x={p.x} y={p.y} scale={p.scale} coat={p.coat} flip={p.flip} />
          </g>
        );
      })}
    </>
  );
};

/** 窓の格子（都市・広間の情報密度をつくる） */
const Windows: React.FC<{
  seed: number;
  x: number;
  y: number;
  cols: number;
  rows: number;
  frame: number;
}> = ({ seed, x, y, cols, rows, frame }) => {
  const r = rnd(seed);
  const cells = Array.from({ length: cols * rows }, () => ({
    lit: r() > 0.45,
    phase: r() * 100,
  }));
  return (
    <g transform={`translate(${x} ${y})`}>
      {cells.map((c, i) => {
        if (!c.lit) return null;
        // ランダムな明滅
        const flick = 0.55 + 0.45 * Math.sin(frame / 22 + c.phase);
        return (
          <rect
            key={i}
            x={(i % cols) * 15}
            y={Math.floor(i / cols) * 20}
            width="8"
            height="11"
            fill="#ffd9a0"
            opacity={0.5 * flick}
          />
        );
      })}
    </g>
  );
};

/**
 * 全画面の情景（レジスターA / 映像スタイルガイド §1-3・§5-A）。
 *
 * 参照チャンネルは、暗いデータ画やタイポが続いた後に「ただの風景」を挟んで
 * 呼吸を作っている。図解を載せず、空・遠景・中景・地面の4層と人物だけで構成する。
 * 情景はこのチャンネルで唯一まとまった面積の色が出る場所でもある。
 */
export const SceneryContent: React.FC<Props> = ({
  place,
  people,
  caption,
  durationInFrames,
  sceneId,
}) => {
  const frame = useCurrentFrame();
  const capReveal = revealAt(frame, 0.06, durationInFrames);
  const layerReveal = revealAt(frame, 0.0, durationInFrames);
  const peopleReveal = revealAt(frame, 0.18, durationInFrames);
  // ごくゆっくり横に流れる（参照チャンネルの情景は必ず微動している）
  const drift = safeInterpolate(frame, [0, durationInFrames], [0, -26], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const P = PLACES[place] ?? PLACES.village;

  return (
    <AbsoluteFill>
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={`sky-${sceneId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.sky[0]} />
            <stop offset="100%" stopColor={P.sky[1]} />
          </linearGradient>
          <radialGradient id={`glow-${sceneId}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={P.glow} stopOpacity="0.5" />
            <stop offset="100%" stopColor={P.glow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ① 空 */}
        <rect width="1920" height="1080" fill={`url(#sky-${sceneId})`} />
        {/* 光源（月・灯・水面の光） */}
        <circle
          cx={P.lightX}
          cy={P.lightY}
          r="330"
          fill={`url(#glow-${sceneId})`}
          opacity={layerReveal}
        />
        {P.orb && (
          <circle cx={P.lightX} cy={P.lightY} r="26" fill="#fff3d6" opacity={0.85 * layerReveal} />
        )}

        <g transform={`translate(${drift} 0)`} opacity={layerReveal}>
          {P.render(sceneId, frame)}
        </g>

        {/* ④ 人物 */}
        {people > 0 && (
          <People count={Math.min(12, people)} seed={sceneId} baseY={P.groundY} reveal={peopleReveal} />
        )}

        {/* 地面の手前を締める */}
        <rect y={P.groundY + 90} width="1920" height={1080 - P.groundY - 90} fill="#000" opacity="0.35" />
      </svg>

      {caption && (
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: capReveal * 0.92,
            fontFamily: SERIF_FONT,
            fontSize: 40,
            letterSpacing: "0.18em",
            color: "rgba(245,243,236,0.95)",
            textShadow: "0 2px 16px rgba(0,0,0,0.85)",
          }}
        >
          {caption}
        </div>
      )}
    </AbsoluteFill>
  );
};

type PlaceDef = {
  sky: [string, string];
  glow: string;
  lightX: number;
  lightY: number;
  orb: boolean;
  groundY: number;
  render: (seed: number, frame: number) => React.ReactNode;
};

/**
 * 場所ごとの絵。参照チャンネルで実際に確認できた情景を元にしている:
 * 夜の村（都会の孤独）／都市の窓（同84%）／和室（隠居42%）／
 * 広間（英雄色を好む53%）／夕焼けの草原（頭がデカい奴15%）／
 * 海中（同53%）／森（都会の孤独21%）。
 */
const PLACES: Record<SceneryPlace, PlaceDef> = {
  village: {
    sky: ["#0d1524", "#1d2436"],
    glow: "#ffd9a0",
    lightX: 1480,
    lightY: 230,
    orb: true,
    groundY: 760,
    render: (seed, frame) => {
      const r = rnd(seed + 3);
      return (
        <>
          {/* 遠景の稜線 */}
          <path d="M0 700 L260 610 L520 672 L820 566 L1160 660 L1500 590 L1920 668 L1920 1080 L0 1080 Z" fill="#151d2c" />
          {/* 中景の家 */}
          {Array.from({ length: 7 }, (_, i) => {
            const x = 150 + i * 250 + r() * 60;
            const w = 120 + r() * 60;
            const h = 70 + r() * 40;
            return (
              <g key={i}>
                <rect x={x} y={760 - h} width={w} height={h} fill="#10161f" />
                <path d={`M${x - 12} ${760 - h} L${x + w / 2} ${760 - h - 34} L${x + w + 12} ${760 - h} Z`} fill="#0c1119" />
                <rect
                  x={x + w * 0.3}
                  y={760 - h + 18}
                  width="22"
                  height="18"
                  fill="#ffca7a"
                  opacity={0.55 + 0.35 * Math.sin(frame / 25 + i)}
                />
              </g>
            );
          })}
          <rect y="760" width="1920" height="320" fill="#0a0f18" />
        </>
      );
    },
  },
  city: {
    sky: ["#080d18", "#131a2b"],
    glow: "#8fb6ff",
    lightX: 960,
    lightY: 300,
    orb: false,
    groundY: 880,
    render: (seed, frame) => {
      const r = rnd(seed + 11);
      return (
        <>
          {Array.from({ length: 16 }, (_, i) => {
            const w = 90 + r() * 70;
            const h = 240 + r() * 420;
            const x = i * 122 - 40;
            return (
              <g key={i}>
                <rect x={x} y={880 - h} width={w} height={h} fill="#0b1220" />
                <Windows
                  seed={seed + i}
                  x={x + 12}
                  y={880 - h + 16}
                  cols={Math.max(2, Math.floor(w / 15) - 1)}
                  rows={Math.max(3, Math.floor(h / 20) - 1)}
                  frame={frame}
                />
              </g>
            );
          })}
          <rect y="880" width="1920" height="200" fill="#070b13" />
        </>
      );
    },
  },
  room: {
    sky: ["#20180f", "#2b2016"],
    glow: "#ffc987",
    lightX: 960,
    lightY: 250,
    orb: false,
    groundY: 800,
    render: (seed) => (
      <>
        {/* 障子 */}
        <rect x="260" y="180" width="1400" height="470" fill="#c9b489" opacity="0.14" />
        {Array.from({ length: 5 }, (_, c) =>
          Array.from({ length: 3 }, (_, rw) => (
            <rect
              key={`${c}-${rw}`}
              x={280 + c * 278}
              y={200 + rw * 152}
              width="258"
              height="132"
              fill="#e8dcc0"
              opacity="0.1"
              stroke="#0e0a06"
              strokeWidth="4"
            />
          )),
        )}
        {/* 柱と梁 */}
        <rect x="200" y="120" width="26" height="700" fill="#1a120a" />
        <rect x="1694" y="120" width="26" height="700" fill="#1a120a" />
        <rect x="0" y="120" width="1920" height="26" fill="#1a120a" />
        {/* 畳 */}
        <rect y="800" width="1920" height="280" fill="#3a2e1c" />
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={i * 320} y="800" width="316" height="280" fill="#42351f" opacity="0.6" />
        ))}
      </>
    ),
  },
  hall: {
    sky: ["#251a0e", "#3a2a14"],
    glow: "#ffcf8a",
    lightX: 960,
    lightY: 200,
    orb: true,
    groundY: 830,
    render: (seed) => (
      <>
        {/* 列柱 */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = 90 + i * 355;
          return <rect key={i} x={x} y="150" width="52" height="690" fill="#4a1f1c" />;
        })}
        {/* 行灯 */}
        {[240, 1640].map((x, i) => (
          <g key={i}>
            <rect x={x - 34} y="470" width="68" height="96" fill="#f0dcae" opacity="0.55" />
            <rect x={x - 6} y="566" width="12" height="220" fill="#2a1a10" />
          </g>
        ))}
        {/* 一段高い上座 */}
        <rect x="700" y="700" width="520" height="40" fill="#2b1a12" />
        <rect y="830" width="1920" height="250" fill="#2a1d10" />
      </>
    ),
  },
  field: {
    sky: ["#3a2140", "#c96f42"],
    glow: "#ffb26b",
    lightX: 1320,
    lightY: 560,
    orb: true,
    groundY: 720,
    render: (seed) => {
      const r = rnd(seed + 5);
      return (
        <>
          {/* アカシアの木 */}
          {Array.from({ length: 5 }, (_, i) => {
            const x = 160 + i * 400 + r() * 120;
            const s = 0.7 + r() * 0.6;
            return (
              <g key={i} transform={`translate(${x} 720) scale(${s})`}>
                <rect x="-5" y="-120" width="10" height="120" fill="#241423" />
                <ellipse cx="0" cy="-130" rx="95" ry="26" fill="#241423" />
              </g>
            );
          })}
          <path d="M0 720 L1920 700 L1920 1080 L0 1080 Z" fill="#2b1a2b" />
        </>
      );
    },
  },
  sea: {
    sky: ["#04202b", "#0a3a44"],
    glow: "#7fe3d4",
    lightX: 760,
    lightY: 60,
    orb: false,
    groundY: 900,
    render: (seed, frame) => {
      const r = rnd(seed + 9);
      return (
        <>
          {/* 水中の光条 */}
          {Array.from({ length: 6 }, (_, i) => {
            const x = 180 + i * 300;
            const sway = Math.sin(frame / 55 + i) * 26;
            return (
              <path
                key={i}
                d={`M${x} 0 L${x + 120 + sway} 900 L${x + 190 + sway} 900 L${x + 60} 0 Z`}
                fill="#bdf6ec"
                opacity="0.05"
              />
            );
          })}
          {/* 海底の岩 */}
          {Array.from({ length: 7 }, (_, i) => {
            const x = r() * 1900;
            const w = 120 + r() * 200;
            return (
              <ellipse key={i} cx={x} cy={930 + r() * 60} rx={w} ry={60} fill="#05171f" />
            );
          })}
          <rect y="960" width="1920" height="120" fill="#031015" />
        </>
      );
    },
  },
  forest: {
    sky: ["#0b1710", "#16281a"],
    glow: "#a8d98a",
    lightX: 700,
    lightY: 180,
    orb: false,
    groundY: 820,
    render: (seed, frame) => {
      const r = rnd(seed + 13);
      return (
        <>
          {Array.from({ length: 14 }, (_, i) => {
            const x = i * 145 + r() * 60;
            const w = 26 + r() * 26;
            return <rect key={i} x={x} y="60" width={w} height="780" fill="#08120b" />;
          })}
          {/* 蛍 */}
          {Array.from({ length: 18 }, (_, i) => {
            const bx = r() * 1900;
            const by = 400 + r() * 380;
            const t = 0.35 + 0.65 * Math.abs(Math.sin(frame / 30 + i * 1.7));
            return <circle key={i} cx={bx} cy={by} r="4" fill="#e9ff9e" opacity={t * 0.8} />;
          })}
          <rect y="820" width="1920" height="260" fill="#060d08" />
        </>
      );
    },
  },
};
