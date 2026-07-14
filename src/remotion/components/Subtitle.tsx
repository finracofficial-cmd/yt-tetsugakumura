import { interpolate, useCurrentFrame } from "remotion";

const SERIF_FONT =
  '"Noto Serif CJK JP", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif';

/**
 * ナレーションを字幕用のチャンクに分割する。
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
    // 1文が長すぎる場合は読点で折り、それも無理なら固定長で切る
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
};

/**
 * 画面下部の字幕。ナレーションを文単位で分割し、
 * 各チャンクの文字数に比例した時間で順次表示する（音声とおおよそ同期）。
 */
export const Subtitle: React.FC<Props> = ({ narration, durationInFrames }) => {
  const frame = useCurrentFrame();
  const chunks = splitNarration(narration);
  if (chunks.length === 0) return null;

  // シーン末尾の余韻ぶんを差し引いた実発話時間に、文字数比で割り当てる
  const speakingFrames = Math.max(1, durationInFrames - 12);
  const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);

  let start = 0;
  let active: { text: string; from: number; to: number } | null = null;
  for (const chunk of chunks) {
    const len = Math.round((chunk.length / totalChars) * speakingFrames);
    const to = Math.min(start + len, speakingFrames);
    if (frame >= start && frame < to) {
      active = { text: chunk, from: start, to };
      break;
    }
    start = to;
  }
  if (!active) return null;

  const fade = 6;
  const opacity = interpolate(
    frame,
    [active.from, active.from + fade, active.to - fade, active.to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

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
          fontSize: 40,
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
