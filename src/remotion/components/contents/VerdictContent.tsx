import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "../SceneFrame";
import { revealAt, riseY } from "../../reveal";

type Props = {
  caption?: string;
  statement: string;
  note?: string;
  durationInFrames: number;
};

/**
 * 結論カード（映像スタイルガイド §5-C）。
 *
 * 参照チャンネルは終盤に必ず「主張を額装する」カードを置く
 * （努力と才能18研究 95%: 才能ある人 = 測ってもらえた人）。
 * 塗りのない細い角丸の枠だけを描き、中に3段:
 *   小さく字間の広いグレーの注記 → 太い白の主張 → 小さなグレーの補足
 * 主張に "=" が含まれるときは、= だけをアンバーにする（実物がそうなっている）。
 */
export const VerdictContent: React.FC<Props> = ({
  caption,
  statement,
  note,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const boxReveal = revealAt(frame, 0.05, durationInFrames);
  const capReveal = revealAt(frame, 0.18, durationInFrames);
  const stReveal = revealAt(frame, 0.3, durationInFrames);
  const noteReveal = revealAt(frame, 0.55, durationInFrames);

  // "A = B" の = だけを色分けする
  const parts = statement.split(/(\s*=\s*)/);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          opacity: boxReveal,
          transform: `translateY(${riseY(boxReveal)}px)`,
          border: "1px solid var(--ink-line, rgba(200,214,235,0.45))",
          borderRadius: 18,
          padding: "62px 92px",
          minWidth: 1180,
          textAlign: "center",
          background: "rgba(255,255,255,0.015)",
          boxShadow: "0 0 90px rgba(0,0,0,0.5) inset",
        }}
      >
        {caption && (
          <div
            style={{
              opacity: capReveal * 0.72,
              fontFamily: SERIF_FONT,
              fontSize: 26,
              letterSpacing: "0.42em",
              color: "var(--ink-soft, rgba(210,214,222,0.75))",
              marginBottom: 34,
            }}
          >
            {caption}
          </div>
        )}

        <div
          style={{
            opacity: stReveal,
            fontFamily: SERIF_FONT,
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "var(--ink, rgba(245,243,236,0.98))",
            textShadow: "0 2px 24px rgba(0,0,0,0.7)",
            lineHeight: 1.35,
          }}
        >
          {parts.map((p, i) =>
            /^\s*=\s*$/.test(p) ? (
              <span
                key={i}
                style={{
                  color: "var(--accent, #e8b563)",
                  textShadow: "0 0 34px var(--accent-soft, #ffd9a0)",
                  margin: "0 0.28em",
                }}
              >
                =
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </div>

        {note && (
          <div
            style={{
              opacity: noteReveal * 0.8,
              marginTop: 36,
              fontFamily: SERIF_FONT,
              fontSize: 28,
              letterSpacing: "0.16em",
              color: "var(--ink-soft, rgba(210,214,222,0.7))",
            }}
          >
            {note}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
