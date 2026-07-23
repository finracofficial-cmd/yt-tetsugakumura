/** 人物・社会関係のピクトグラム群 */
import {
  AMBER,
  BODY,
  BODY_ALT,
  BODY_HI,
  GOLD,
  HEAD,
  LINE_SOFT,
  Person,
  PictoTable,
  STONE,
  WOOD,
  clamp,
  loop,
  osc,
} from "./primitives";

export const peoplePictos: PictoTable = {
  // 一人の人物がスポットライトの下で静かに呼吸する
  person: ({ frame, fps }) => {
    const t = frame / fps;
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
  },

  // 6人が中央の椅子(空席)の周りを回り続ける
  crowd: ({ frame, fps }) => {
    const t = frame / fps;
    const N = 6;
    return (
      <div style={{ position: "relative", width: 900, height: 480 }}>
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
              border: `1.5px solid ${LINE_SOFT}`,
            }}
          />
        ))}
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
          <div style={{ width: 14, height: 52, backgroundColor: WOOD, borderRadius: 3 }} />
          <div style={{ width: 60, height: 12, backgroundColor: WOOD, borderRadius: 3 }} />
          <div style={{ display: "flex", gap: 32 }}>
            <div style={{ width: 10, height: 30, backgroundColor: WOOD }} />
            <div style={{ width: 10, height: 30, backgroundColor: WOOD }} />
          </div>
        </div>
        {/* シーン後半: 中央と人々を結ぶ関係線が浮かび上がる（段階演出） */}
        {t > 3.6 &&
          Array.from({ length: N }).map((_, i) => {
            const angle = (i / N) * Math.PI * 2 + t * 0.5;
            const dx = Math.cos(angle) * 300;
            const dy = Math.sin(angle) * 110 - 40;
            const len = Math.hypot(dx, dy);
            const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
            const lineIn = Math.min(1, Math.max(0, (t - 3.6 - i * 0.15) / 0.8));
            if (lineIn <= 0) return null;
            return (
              <div
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: 450,
                  top: 250,
                  width: len * lineIn,
                  borderTop: "2px dashed rgba(255,255,255,0.35)",
                  transformOrigin: "left center",
                  transform: `rotate(${deg}deg)`,
                }}
              />
            );
          })}
        {Array.from({ length: N }).map((_, i) => {
          const angle = (i / N) * Math.PI * 2 + t * 0.5;
          const x = 450 + Math.cos(angle) * 300;
          const y = 250 + Math.sin(angle) * 110;
          const depth = (Math.sin(angle) + 1) / 2;
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
              <Person tint={i === 0 ? BODY_HI : BODY} />
            </div>
          );
        })}
      </div>
    );
  },

  // 二人の距離がゆっくり開いては縮む。間に破線
  couple: ({ frame, fps }) => {
    const t = frame / fps;
    const dist = 130 + Math.sin(t * 0.7) * 60;
    const breath1 = Math.sin(t * 1.7) * 3;
    const breath2 = Math.cos(t * 1.5) * 3;
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 340 }}>
        <div style={{ transform: `translateX(${-dist}px) translateY(${breath1}px)` }}>
          <Person tint={BODY} />
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
          <Person tint={BODY_ALT} />
        </div>
      </div>
    );
  },

  // 家族。二人の大人と小さな子。ゆっくり呼吸し、子が跳ねる
  family: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 340 }}>
        <div style={{ transform: `translateY(${Math.sin(t * 1.6) * 3}px)` }}>
          <Person tint={BODY} />
        </div>
        <div style={{ transform: `translateY(${-Math.abs(Math.sin(t * 3.1)) * 14}px)` }}>
          <Person scale={0.6} tint={AMBER} />
        </div>
        <div style={{ transform: `translateY(${Math.cos(t * 1.4) * 3}px) scaleX(-1)` }}>
          <Person tint={BODY_ALT} />
        </div>
      </div>
    );
  },

  // 二本の腕が中央で握手し、接点が脈打つ
  handshake: ({ frame, fps }) => {
    const t = frame / fps;
    const glow = 0.5 + 0.5 * osc(t, 1.6);
    return (
      <div style={{ position: "relative", width: 560, height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              left: s < 0 ? 40 : undefined,
              right: s > 0 ? 40 : undefined,
              top: 130,
              width: 210,
              height: 40,
              borderRadius: 20,
              backgroundColor: s < 0 ? BODY : BODY_HI,
              transform: `rotate(${s * 14}deg)`,
              transformOrigin: s < 0 ? "left center" : "right center",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            width: 96,
            height: 96,
            borderRadius: "50%",
            backgroundColor: "rgba(215, 185, 155, 0.95)",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 150 + glow * 70,
            height: 150 + glow * 70,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(255,215,150,${glow * 0.4}) 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
      </div>
    );
  },

  // 対立する二人。間で衝突の閃光が明滅
  conflict: ({ frame, fps }) => {
    const t = frame / fps;
    const flash = Math.pow(osc(t, 0.9), 3);
    const shake = flash * 6;
    return (
      <div style={{ position: "relative", width: 620, height: 340, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", left: 60, transform: `translateX(${-shake}px)` }}>
          <Person tint={BODY} />
        </div>
        <div style={{ position: "absolute", right: 60, transform: `translateX(${shake}px) scaleX(-1)` }}>
          <Person tint="rgba(150, 80, 80, 0.95)" />
        </div>
        <div
          style={{
            position: "relative",
            width: 70,
            height: 150,
            opacity: 0.4 + flash * 0.6,
            transform: `scale(${0.8 + flash * 0.5})`,
            clipPath:
              "polygon(50% 0%, 70% 35%, 100% 40%, 62% 62%, 78% 100%, 50% 72%, 22% 100%, 38% 62%, 0% 40%, 30% 35%)",
            backgroundColor: AMBER,
          }}
        />
      </div>
    );
  },

  // 孤立。中央の一人だけ明るく、周囲の群れは背を向け遠ざかる
  isolation: ({ frame, fps }) => {
    const t = frame / fps;
    const breath = Math.sin(t * 1.7) * 4;
    return (
      <div style={{ position: "relative", width: 820, height: 420 }}>
        <div
          style={{
            position: "absolute",
            left: 410 - 220,
            top: -30,
            width: 440,
            height: 440,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(150,180,230,${0.14 + 0.05 * Math.sin(t * 1.1)}) 0%, rgba(0,0,0,0) 62%)`,
          }}
        />
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2 + 0.5;
          const drift = 30 + osc(t, 4) * 24;
          const x = 410 + Math.cos(angle) * (250 + drift);
          const y = 200 + Math.sin(angle) * (150 + drift * 0.4);
          return (
            <div key={i} style={{ position: "absolute", left: x - 30, top: y - 90, opacity: 0.3, transform: "scale(0.7)" }}>
              <Person tint="rgba(70,74,86,0.9)" />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 410 - 34, top: 150, transform: `translateY(${breath}px)` }}>
          <Person scale={1.1} tint={BODY_HI} />
        </div>
      </div>
    );
  },

  // 階層のピラミッド。頂点の一人だけ金色で少し浮く
  hierarchy: ({ frame, fps }) => {
    const t = frame / fps;
    const rows = [1, 2, 3];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        {rows.map((count, r) => (
          <div key={r} style={{ display: "flex", gap: 34, justifyContent: "center" }}>
            {Array.from({ length: count }).map((_, i) => {
              const top = r === 0;
              const float = top ? Math.sin(t * 1.6) * 8 : Math.sin(t * 1.6 + r) * 2;
              return (
                <div key={i} style={{ transform: `translateY(${float}px) scale(${0.62})` }}>
                  <Person tint={top ? undefined : BODY} />
                  {top && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle, rgba(255,210,120,${0.35 + 0.15 * Math.sin(t * 2)}) 0%, rgba(0,0,0,0) 70%)`,
                        mixBlendMode: "screen",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{ width: 360, height: 8, backgroundColor: STONE, borderRadius: 4, marginTop: 6 }} />
      </div>
    );
  },

  // 行列。奥から手前へ並ぶ人々が一定間隔で前進
  queue: ({ frame, fps }) => {
    const t = frame / fps;
    const N = 6;
    const advance = loop(t, 2.2);
    return (
      <div style={{ position: "relative", width: 860, height: 420 }}>
        <div style={{ position: "absolute", right: 40, top: 120, width: 70, height: 220, background: GOLD, borderRadius: "8px 8px 0 0", opacity: 0.5 }} />
        {Array.from({ length: N }).map((_, i) => {
          const k = i + advance;
          const depth = k / N;
          const x = 60 + k * 130;
          const bob = Math.abs(Math.sin(t * 4 + i)) * 6;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: 260 - depth * 120 - bob,
                transform: `scale(${0.5 + depth * 0.5})`,
                opacity: clamp(0.3 + depth, 0, 1) * (i === N - 1 ? 1 - advance : 1),
                zIndex: Math.round(depth * 10),
              }}
            >
              <Person tint={BODY} />
            </div>
          );
        })}
      </div>
    );
  },

  // 非難。中央の一人へ四方から矢印(指)が向く
  blame: ({ frame, fps }) => {
    const t = frame / fps;
    const N = 5;
    return (
      <div style={{ position: "relative", width: 640, height: 420, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: N }).map((_, i) => {
          const angle = Math.PI + (i / (N - 1)) * Math.PI; // 上半周
          const push = osc(t, 1.2, i * 0.6);
          const dist = 210 - push * 40;
          const x = Math.cos(angle) * dist;
          const y = Math.sin(angle) * dist * 0.72;
          const deg = (angle * 180) / Math.PI;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 90,
                height: 16,
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: `translate(-50%,-50%) rotate(${deg + 180}deg)`,
                opacity: 0.4 + push * 0.5,
              }}
            >
              <div style={{ height: 10, backgroundColor: "rgba(210, 90, 90, 0.85)", borderRadius: 5 }} />
              <div
                style={{
                  position: "absolute",
                  right: -4,
                  top: -6,
                  width: 0,
                  height: 0,
                  borderTop: "14px solid transparent",
                  borderBottom: "14px solid transparent",
                  borderLeft: "20px solid rgba(210, 90, 90, 0.9)",
                }}
              />
            </div>
          );
        })}
        <div style={{ transform: `scale(${1 + osc(t, 1.2) * 0.03})` }}>
          <Person tint={BODY_HI} sway={Math.sin(t * 2) * 3} />
        </div>
      </div>
    );
  },

  // 賞賛。舞台上の一人を、下の群衆が手を上げて拍手する
  applause: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 820, height: 440 }}>
        <div style={{ position: "absolute", left: 410 - 60, top: 20 }}>
          <Person scale={1.0} tint={undefined} armsUp={0.5 + 0.5 * osc(t, 1.4)} />
        </div>
        <div style={{ position: "absolute", left: 250, top: 150, width: 320, height: 16, background: STONE, borderRadius: 6 }} />
        {Array.from({ length: 7 }).map((_, i) => {
          const clap = osc(t, 0.5, i * 0.9);
          return (
            <div key={i} style={{ position: "absolute", left: 120 + i * 90, top: 220, transform: "scale(0.62)" }}>
              <Person tint={BODY} armsUp={0.4 + clap * 0.6} />
            </div>
          );
        })}
      </div>
    );
  },

  // 扇動者。先頭の一人が腕を上げ、後ろに追従の列が続く
  leader: ({ frame, fps }) => {
    const t = frame / fps;
    return (
      <div style={{ position: "relative", width: 820, height: 420 }}>
        <div style={{ position: "absolute", left: 90, top: 40, width: 130, height: 24, background: STONE, borderRadius: 6 }} />
        <div style={{ position: "absolute", left: 110, top: -60 }}>
          <Person scale={1.05} tint={undefined} armsUp={0.7 + 0.3 * osc(t, 1.2)} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => {
          const bob = Math.abs(Math.sin(t * 3.5 + i * 0.7)) * 10;
          return (
            <div key={i} style={{ position: "absolute", left: 300 + i * 100, top: 120 - bob, transform: "scale(0.72)", opacity: 0.85 - i * 0.1 }}>
              <Person tint={BODY} />
            </div>
          );
        })}
      </div>
    );
  },

  // 傍観者。中央の異変(!)を、円環状に背を向けた人々が黙って囲む
  bystander: ({ frame, fps }) => {
    const t = frame / fps;
    const N = 7;
    const pulse = osc(t, 0.8);
    return (
      <div style={{ position: "relative", width: 640, height: 440, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: N }).map((_, i) => {
          const angle = (i / N) * Math.PI * 2 + t * 0.15;
          const x = Math.cos(angle) * 230;
          const y = Math.sin(angle) * 150;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px - 90px)`,
                transform: `translateX(-50%) scale(0.6) scaleX(${Math.cos(angle) < 0 ? -1 : 1})`,
                opacity: 0.6,
              }}
            >
              <Person tint="rgba(70,74,86,0.9)" />
            </div>
          );
        })}
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "rgba(210, 90, 90, 0.9)",
            opacity: 0.5 + pulse * 0.5,
            transform: `scale(${0.9 + pulse * 0.15})`,
          }}
        >
          !
        </div>
      </div>
    );
  },
};
