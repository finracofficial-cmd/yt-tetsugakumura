import { AbsoluteFill, random, useCurrentFrame } from "remotion";

type Props = {
  /** シーンごとに配置を変えるためのシード */
  seed: number;
  count?: number;
};

/**
 * 画面全体をゆっくり漂う塵のような粒子。
 * すべて remotion の決定論的 random で配置されるためレンダリングは安定する。
 */
export const Particles: React.FC<Props> = ({ seed, count = 18 }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const rx = random(`p-x-${seed}-${i}`);
        const ry = random(`p-y-${seed}-${i}`);
        const rs = random(`p-s-${seed}-${i}`);
        const rv = random(`p-v-${seed}-${i}`);

        const size = 2 + rs * 4;
        const speed = 0.15 + rv * 0.35; // px/frame（上昇）
        const swayAmp = 10 + rs * 24;

        const x = rx * 1920 + Math.sin((frame / 60 + i) * (0.6 + rv)) * swayAmp;
        const y = (((ry * 1080 - frame * speed) % 1140) + 1140) % 1140 - 30;
        const twinkle =
          0.1 + 0.14 * (0.5 + 0.5 * Math.sin(frame / 25 + i * 2.1));

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 250, 235, 1)",
              opacity: twinkle,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
