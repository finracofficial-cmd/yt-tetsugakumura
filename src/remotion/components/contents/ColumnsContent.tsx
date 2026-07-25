import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { revealAt } from "../../reveal";

type Node = { label: string; value: string; /** 0(下)〜1(上) の高さ位置 */ level: number };

type Props = {
  title?: string;
  left: Node;
  right: Node;
  /** 2点を結ぶ線に添える注記（例: "逆転"） */
  note?: string;
  durationInFrames: number;
};

const COL_W = 26;
const COL_H = 420;

/**
 * 光る柱（参照チャンネルの看板図解）。
 * docs/reference-style/frames/tile_B_columns2.png を基準に:
 *   床に立つ2本の金色の柱 → 頭部の光球 → 2点を結ぶ線 → 数値、の順に出る。
 *   線の傾きが「関係の逆転」を一目で見せる。
 */
export const ColumnsContent: React.FC<Props> = ({ title, left, right, note, durationInFrames }) => {
  const frame = useCurrentFrame();

  const titleIn = revealAt(frame, 0.03, durationInFrames);
  const colL = revealAt(frame, 0.1, durationInFrames);
  const colR = revealAt(frame, 0.24, durationInFrames);
  const lineIn = revealAt(frame, 0.4, durationInFrames);
  const valIn = revealAt(frame, 0.52, durationInFrames);

  // 柱上のノード位置（画面座標）
  const baseY = 700;
  const lx = 620;
  const rx = 1300;
  const ly = baseY - COL_H * left.level;
  const ry = baseY - COL_H * right.level;

  const Column: React.FC<{ x: number; y: number; node: Node; appear: number; vIn: number }> = ({
    x,
    y,
    node,
    appear,
    vIn,
  }) => (
    <>
      {/* 柱本体（下から伸びる） */}
      <div
        style={{
          position: "absolute",
          left: x - COL_W / 2,
          top: baseY - COL_H * appear,
          width: COL_W,
          height: COL_H * appear,
          background:
            "linear-gradient(180deg, var(--accent-soft, #ffd9a0) 0%, var(--accent, #e8b563) 35%, rgba(120,90,50,0.5) 100%)",
          boxShadow: "0 0 30px rgba(232,181,99,0.45)",
        }}
      />
      {/* 台座 */}
      <div
        style={{
          position: "absolute",
          left: x - 52,
          top: baseY - 6,
          width: 104,
          height: 12,
          borderRadius: "50%",
          background: "rgba(232,181,99,0.22)",
          filter: "blur(5px)",
          opacity: appear,
        }}
      />
      {/* 頭部の光球 */}
      <div
        style={{
          position: "absolute",
          left: x - 17,
          top: y - 17,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--accent-soft, #ffd9a0)",
          boxShadow:
            "0 0 24px var(--accent-soft, #ffd9a0), 0 0 70px var(--accent, #e8b563)",
          opacity: appear,
        }}
      />
      {/* 上のラベル */}
      <div
        style={{
          position: "absolute",
          left: x - 190,
          top: y - 78,
          width: 380,
          textAlign: "center",
          opacity: appear,
          color: "var(--ink, rgba(242,240,232,0.96))",
          fontFamily: SERIF_FONT,
          fontSize: 30,
          letterSpacing: "0.08em",
        }}
      >
        {node.label}
      </div>
      {/* 数値 */}
      <div
        style={{
          position: "absolute",
          left: x + 34,
          top: y - 26,
          opacity: vIn,
          color: "var(--ink, rgba(255,255,255,0.98))",
          fontFamily: SERIF_FONT,
          fontSize: 42,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          textShadow: "0 2px 14px rgba(0,0,0,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        {node.value}
      </div>
    </>
  );

  return (
    <AbsoluteFill>
      {title && (
        <div
          style={{
            position: "absolute",
            top: 196,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: titleIn,
            color: "var(--ink, rgba(242,240,232,0.96))",
            fontFamily: SERIF_FONT,
            fontSize: 44,
            letterSpacing: "0.14em",
          }}
        >
          {title}
        </div>
      )}

      {/* 2点を結ぶ線（左から右へ描かれる） */}
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <line
          x1={lx}
          y1={ly}
          x2={lx + (rx - lx) * lineIn}
          y2={ly + (ry - ly) * lineIn}
          stroke="rgba(255,255,255,0.72)"
          strokeWidth={2}
        />
      </svg>

      <Column x={lx} y={ly} node={left} appear={colL} vIn={valIn} />
      <Column x={rx} y={ry} node={right} appear={colR} vIn={valIn} />

      {note && (
        <div
          style={{
            position: "absolute",
            left: (lx + rx) / 2 - 200,
            top: (ly + ry) / 2 - 74,
            width: 400,
            textAlign: "center",
            opacity: lineIn,
            color: "var(--sub, #e8558f)",
            fontFamily: SERIF_FONT,
            fontSize: 32,
            letterSpacing: "0.1em",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          }}
        >
          {note}
        </div>
      )}
    </AbsoluteFill>
  );
};
