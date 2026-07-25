/**
 * 情景レイヤー背景（ギャップ①②⑥の中核）。
 *
 * 参照チャンネルの背景は「平坦なグラデーション1枚」ではなく、
 * 空 / 遠景 / 中景 / 床 の多層構造に、体積光・窓明かり・ヘイズが重なった情景である
 * （docs/reference-style/映像スタイルガイド.md §5-A）。
 *
 * ここでは concept_color（明暗トーン）とテーマパレットを受け取り、
 * シーンIDから決定論的に情景を組み立てる。乱数は使わない（レンダリング再現性のため）。
 */
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { ThemePalette } from "../theme";

/** シーンIDから決定論的な擬似乱数を作る（0〜1） */
function rnd(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 情景の種類。シーンIDで巡回させ、同じ絵が続かないようにする */
export type SceneryKind = "skyline" | "ridge" | "hall" | "shelf" | "ground";

export const SCENERY_ORDER: SceneryKind[] = ["skyline", "ridge", "hall", "shelf", "ground"];

export function sceneryFor(sceneId: number): SceneryKind {
  return SCENERY_ORDER[sceneId % SCENERY_ORDER.length];
}

type Props = {
  sceneId: number;
  palette: ThemePalette;
  /** 明トーンか（明トーンでは情景を淡くし、空を明るくする） */
  bright: boolean;
  /** 全画面イラスト系では情景を出さない */
  plain?: boolean;
};

/** 遠景のビル群（窓明かりがランダムに明滅する） */
const Skyline: React.FC<{ seed: number; palette: ThemePalette; frame: number; opacity: number }> = ({
  seed,
  palette,
  frame,
  opacity,
}) => {
  const buildings = Array.from({ length: 22 }, (_, i) => {
    const r = rnd(seed + i * 7.3);
    const r2 = rnd(seed + i * 3.1);
    return {
      x: (i / 22) * 2100 - 90,
      w: 60 + r * 70,
      h: 150 + r2 * 330,
      seed: seed + i * 11,
    };
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      {buildings.map((b, i) => {
        // 窓格子: 各ビルに数列×数行の窓。明滅は sin の位相をずらして作る
        const cols = Math.max(2, Math.floor(b.w / 22));
        const rows = Math.max(3, Math.floor(b.h / 34));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              bottom: 300,
              width: b.w,
              height: b.h,
              background: palette.far,
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
              gap: 5,
              padding: 7,
              boxSizing: "border-box",
            }}
          >
            {Array.from({ length: cols * rows }, (_, k) => {
              const w = rnd(b.seed + k * 5.7);
              // 6割の窓だけ点灯。さらにゆっくり明滅させる
              if (w < 0.4) return <div key={k} />;
              const flicker = 0.45 + 0.55 * Math.abs(Math.sin(frame / 90 + w * 20));
              return (
                <div
                  key={k}
                  style={{
                    background: palette.window,
                    opacity: 0.18 + flicker * 0.42,
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** 山並みのシルエット（2枚重ねて奥行きを作る） */
const Ridge: React.FC<{ seed: number; palette: ThemePalette; opacity: number }> = ({
  seed,
  palette,
  opacity,
}) => {
  const makePath = (s: number, baseY: number, amp: number) => {
    const pts: string[] = [`0,${baseY + 200}`];
    for (let x = 0; x <= 1920; x += 120) {
      const y = baseY - Math.abs(Math.sin(x / 300 + s)) * amp - rnd(s + x) * 30;
      pts.push(`${x},${y}`);
    }
    pts.push(`1920,${baseY + 200}`);
    return pts.join(" ");
  };
  return (
    <svg
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity }}
    >
      <polygon points={makePath(seed, 690, 170)} fill={palette.far} />
      <polygon points={makePath(seed + 3, 760, 120)} fill={palette.mid} />
    </svg>
  );
};

/** 柱廊・広間（左右対称、奥に明るい扉） */
const Hall: React.FC<{ palette: ThemePalette; opacity: number }> = ({ palette, opacity }) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    {/* 奥の明るい扉。中央のコンテンツの背後に来るため、
        四角い箱に見えないよう強くぼかして淡くする */}
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 300,
        width: 190,
        height: 300,
        marginLeft: -95,
        borderRadius: "46% 46% 0 0",
        background: `linear-gradient(180deg, ${palette.accentSoft} 0%, ${palette.accent} 100%)`,
        filter: "blur(38px)",
        opacity: 0.26,
      }}
    />
    {/* 左右の列柱。奥に行くほど細く・暗く */}
    {[0, 1, 2, 3, 4].map((i) => {
      const t = i / 4;
      const w = 120 - t * 78;
      const h = 560 - t * 250;
      const x = 40 + t * 640;
      const y = 250 + t * 130;
      const dim = 1 - t * 0.45;
      return (
        <div key={i}>
          {[x, 1920 - x - w].map((lx, k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                left: lx,
                top: y,
                width: w,
                height: h,
                background: `linear-gradient(90deg, ${palette.mid} 0%, ${palette.far} 45%, ${palette.mid} 100%)`,
                opacity: dim,
              }}
            />
          ))}
        </div>
      );
    })}
  </div>
);

/** 書架・棚・張り紙の壁（情報密度を稼ぐ） */
const Shelf: React.FC<{ seed: number; palette: ThemePalette; opacity: number }> = ({
  seed,
  palette,
  opacity,
}) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    {[0, 1, 2, 3].map((row) => (
      <div
        key={row}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 180 + row * 165,
          height: 132,
          borderBottom: `3px solid ${palette.far}`,
          display: "flex",
          alignItems: "flex-end",
          gap: 7,
          paddingLeft: 30,
        }}
      >
        {Array.from({ length: 34 }, (_, i) => {
          const r = rnd(seed + row * 40 + i * 2.7);
          return (
            <div
              key={i}
              style={{
                width: 22 + r * 26,
                height: 58 + r * 66,
                background: i % 5 === 0 ? palette.accent : palette.mid,
                opacity: i % 5 === 0 ? 0.32 : 0.62,
              }}
            />
          );
        })}
      </div>
    ))}
  </div>
);

/** 地表の断面（上=樹冠/草地, 下=土。菌類テーマで効く） */
const Ground: React.FC<{ seed: number; palette: ThemePalette; opacity: number }> = ({
  seed,
  palette,
  opacity,
}) => (
  <div style={{ position: "absolute", inset: 0, opacity }}>
    {/* 地中 */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 620,
        bottom: 0,
        background: `linear-gradient(180deg, ${palette.floor} 0%, #000 100%)`,
      }}
    />
    {/* 地表線 */}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 618,
        height: 4,
        background: palette.sub,
        opacity: 0.5,
      }}
    />
    {/* 樹冠 */}
    {Array.from({ length: 9 }, (_, i) => {
      const r = rnd(seed + i * 9.1);
      const w = 150 + r * 190;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (i / 9) * 2000 - 80,
            top: 618 - (110 + r * 120),
            width: w,
            height: 110 + r * 120,
            borderRadius: "50% 50% 42% 42%",
            background: palette.sub,
            opacity: 0.3 + r * 0.2,
          }}
        />
      );
    })}
    {/* 地中の菌糸・根 */}
    <svg viewBox="0 0 1920 460" style={{ position: "absolute", left: 0, top: 620, width: "100%", height: 460 }}>
      {Array.from({ length: 7 }, (_, i) => {
        const x = 140 + i * 260;
        return (
          <path
            key={i}
            d={`M ${x} 0 C ${x - 90} 110, ${x + 130} 190, ${x - 40} 330`}
            stroke={palette.accentSoft}
            strokeWidth={1.4}
            fill="none"
            opacity={0.24}
          />
        );
      })}
    </svg>
  </div>
);

/**
 * 情景・体積光・ヘイズをまとめた背景。
 * SceneFrame の最背面に敷く。
 */
export const Backdrop: React.FC<Props> = ({ sceneId, palette, bright, plain = false }) => {
  const frame = useCurrentFrame();
  if (plain) return null;

  const kind = sceneryFor(sceneId);
  const seed = sceneId * 3.7 + 1;
  // 明トーンでは情景を淡くして、白っぽい空に溶かす
  const sceneryOpacity = bright ? 0.22 : 0.85;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* 床（最奥の水平面） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 300,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${palette.floor} 60%)`,
          opacity: bright ? 0.3 : 1,
        }}
      />

      {/* 情景本体 */}
      {kind === "skyline" && (
        <Skyline seed={seed} palette={palette} frame={frame} opacity={sceneryOpacity} />
      )}
      {kind === "ridge" && <Ridge seed={seed} palette={palette} opacity={sceneryOpacity} />}
      {kind === "hall" && <Hall palette={palette} opacity={sceneryOpacity} />}
      {kind === "shelf" && <Shelf seed={seed} palette={palette} opacity={sceneryOpacity * 0.8} />}
      {kind === "ground" && <Ground seed={seed} palette={palette} opacity={sceneryOpacity} />}

      {/* 体積光: 上から降りるスポットの光円錐（2本、ゆっくり揺れる） */}
      {!bright &&
        [0, 1].map((i) => {
          const sway = Math.sin(frame / 150 + i * 2) * 14;
          const cx = i === 0 ? 620 : 1300;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx + sway,
                top: -60,
                width: 300,
                height: 900,
                marginLeft: -150,
                background: `linear-gradient(180deg, ${palette.accentSoft} 0%, rgba(0,0,0,0) 78%)`,
                opacity: 0.07,
                clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
                filter: "blur(6px)",
              }}
            />
          );
        })}

      {/* ヘイズ（薄い靄がゆっくり流れる） */}
      <div
        style={{
          position: "absolute",
          left: ((frame / 8) % 2400) - 1200,
          top: 0,
          width: 2400,
          height: "100%",
          background: `radial-gradient(ellipse at 50% 60%, ${palette.accentSoft} 0%, rgba(0,0,0,0) 62%)`,
          opacity: bright ? 0.05 : 0.045,
        }}
      />
    </AbsoluteFill>
  );
};
