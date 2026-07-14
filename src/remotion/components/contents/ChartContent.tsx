import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { CUBIC_OUT } from "../../easing";

const BAR_COLOR = "#3aa08f";

type Props = {
  title: string;
  unit: string;
  items: { label: string; value: number }[];
  durationInFrames: number;
};

/** 棒が順に伸び、数値がカウントアップする棒グラフ */
export const ChartContent: React.FC<Props> = ({ title, unit, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [6, 26], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const maxValue = Math.max(...items.map((i) => i.value), 1);
  const BAR_MAX_HEIGHT = 380;
  const BAR_WIDTH = items.length > 4 ? 120 : 150;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            opacity: titleOpacity,
            color: "rgba(240, 238, 230, 0.95)",
            fontFamily: SERIF_FONT,
            fontSize: 54,
            fontWeight: 600,
            letterSpacing: "0.15em",
            marginBottom: 70,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 70,
            height: BAR_MAX_HEIGHT + 90,
            borderBottom: "2px solid rgba(255,255,255,0.35)",
            padding: "0 40px",
          }}
        >
          {items.map((item, i) => {
            const delay = 24 + i * 10;
            const grow = spring({
              frame: frame - delay,
              fps,
              config: { damping: 16, mass: 0.8 },
            });
            const height = (item.value / maxValue) * BAR_MAX_HEIGHT * grow;

            // 数値のカウントアップ
            const progress = interpolate(frame, [delay, delay + 34], [0, 1], {
              easing: CUBIC_OUT,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const isInt = Number.isInteger(item.value);
            const shown = isInt
              ? Math.round(item.value * progress).toLocaleString("ja-JP")
              : (item.value * progress).toFixed(1);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    opacity: grow,
                    color: "rgba(240, 240, 236, 0.95)",
                    fontFamily: SERIF_FONT,
                    fontSize: 42,
                    fontWeight: 600,
                    marginBottom: 14,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {shown}
                  <span style={{ fontSize: 26, marginLeft: 4, opacity: 0.7 }}>{unit}</span>
                </div>
                <div
                  style={{
                    width: BAR_WIDTH,
                    height: Math.max(4, height),
                    backgroundColor: BAR_COLOR,
                    borderRadius: "4px 4px 0 0",
                    boxShadow: `0 0 30px ${BAR_COLOR}44`,
                  }}
                />
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 70, padding: "18px 40px 0" }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                width: BAR_WIDTH,
                textAlign: "center",
                color: "rgba(225, 225, 220, 0.85)",
                fontFamily: SERIF_FONT,
                fontSize: 32,
                letterSpacing: "0.08em",
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
