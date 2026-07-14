/** 検証用: 全ピクトグラムを一枚に並べたコンタクトシート（本番では未使用） */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { PICTOGRAMS, FIGURE_KINDS } from "./components/pictograms";

const COLS = 8;
const CELL = 380;

export const PictogramGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#0c0e13", padding: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {FIGURE_KINDS.map((kind) => {
          const Picto = PICTOGRAMS[kind];
          return (
            <div
              key={kind}
              style={{
                width: CELL,
                height: CELL,
                border: "1px solid rgba(255,255,255,0.12)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div style={{ transform: "scale(0.34)" }}>
                <Picto frame={frame} fps={fps} />
              </div>
              <div style={{ position: "absolute", bottom: 6, left: 8, color: "rgba(255,255,255,0.6)", fontSize: 18, fontFamily: "monospace" }}>
                {kind}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
