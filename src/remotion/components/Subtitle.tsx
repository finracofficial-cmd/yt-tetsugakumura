import { interpolate, useCurrentFrame } from "remotion";
import type { SyncSegment } from "../../generator/types";

const SERIF_FONT =
  '"Noto Serif JP", "Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif';

/**
 * ナレーションを字幕用のチャンクに分割する（同期セグメントがない場合の推定用）。
 * 文（。！？）単位で区切り、maxLen を超える場合は読点で折る。
 */
export function splitNarration(text: string, maxLen = 32): string[] {
  const sentences = text.split(/(?<=[。！？])/).filter((s) => s.trim().length > 0);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    if (current.trim().length > 0) chunks.push(current.trim());
    current = "";
  };

  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLen) {
      current += sentence;
      continue;
    }
    pushCurrent();
    if (sentence.length <= maxLen) {
      current = sentence;
      continue;
    }
    let rest = sentence;
    while (rest.length > maxLen) {
      const commaIdx = rest.lastIndexOf("、", maxLen);
      const cut = commaIdx > 10 ? commaIdx + 1 : maxLen;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut);
    }
    current = rest;
  }
  pushCurrent();
  return chunks;
}

type Props = {
  narration: string;
  durationInFrames: number;
  /** 音声実測に基づく文単位の同期情報。あればこちらを優先する */
  segments?: SyncSegment[];
};

type Active = { text: string; from: number; to: number };

/**
 * 画面下部の字幕。sync-map のセグメント（音声実測）があればそれに完全同期し、
 * なければ文字数比の推定タイミングで順次表示する。
 */
export const Subtitle: React.FC<Props> = ({
  narration,
  durationInFrames,
  segments,
}) => {
  const frame = useCurrentFrame();

  let active: Active | null = null;

  if (segments && segments.length > 0) {
    for (const seg of segments) {
      // 次のセグメントが始まるまで表示を残す（ポーズ中も文が読める）
      const holdUntil = seg.startFrame + seg.durationInFrames + 18;
      if (frame >= seg.startFrame && frame < holdUntil) {
        active = { text: seg.text, from: seg.startFrame, to: holdUntil };
        break;
      }
    }
  } else {
    const chunks = splitNarration(narration);
    if (chunks.length === 0) return null;
    const speakingFrames = Math.max(1, durationInFrames - 12);
    const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
    let start = 0;
    for (const chunk of chunks) {
      const len = Math.round((chunk.length / totalChars) * speakingFrames);
      const to = Math.min(start + len, speakingFrames);
      if (frame >= start && frame < to) {
        active = { text: chunk, from: start, to };
        break;
      }
      start = to;
    }
  }

  if (!active) return null;

  const fade = 6;
  const opacity = interpolate(
    frame,
    [active.from, active.from + fade, active.to - fade, active.to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // 長い文は2行に折り返しても読めるよう、文字数でサイズを落とす
  const fontSize = active.text.length > 34 ? 36 : 40;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        padding: "0 160px",
      }}
    >
      <div
        style={{
          opacity,
          color: "rgba(232, 232, 226, 0.95)",
          fontFamily: SERIF_FONT,
          fontSize,
          fontWeight: 400,
          letterSpacing: "0.06em",
          lineHeight: 1.8,
          textAlign: "center",
          textShadow: "0 2px 16px rgba(0,0,0,0.8)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
