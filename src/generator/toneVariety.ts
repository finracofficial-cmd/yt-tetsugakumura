/**
 * 背景トーン（concept_color）の多様性を機械的に保証するモジュール。
 *
 * 背景の明暗はプロンプトでLLMに指示しているが、実際の生成では
 * 「ずっと暗い」トーンばかりが選ばれることが繰り返し起きた
 * （明トーンがコード上で使えても、LLMが1シーンも選ばないことがある）。
 *
 * そこで、AI生成後のシーン列に対して決定論的な後処理を掛け、
 *   1) 明トーン(daylight/dusk/warm)を全体の一定割合以上に引き上げる
 *   2) 同じトーンが4シーン以上連続しないよう分断する
 *   3) 暗トーン同士も dark-navy / charcoal / pitch-black を混ぜて単調さを避ける
 * を保証する。
 *
 * ※ ユーザーが手書きした完全台本（mode B / normalizeScript）には適用しない。
 *    あくまで AI が付けたトーン（generateScript / directScript）を整えるためのもの。
 */
import type { ConceptColor, Scene } from "./types";

const BRIGHT: ConceptColor[] = ["daylight", "dusk", "warm"];
const DARK: ConceptColor[] = ["dark-navy", "charcoal", "pitch-black"];

const isBright = (t: ConceptColor): boolean => BRIGHT.includes(t);

/** 明トーンの目標比率（全体に対して）。「3〜4割」の下限に寄せて 0.38。 */
const BRIGHT_TARGET_RATIO = 0.38;
/** 同一トーンの許容連続数（これを超えたら分断する） */
const MAX_RUN = 3;

/**
 * シーン列の concept_color を、明暗のバランスと連続の分断を満たすよう調整する。
 * ナレーションや visual には一切触れない（背景トーンのみ差し替える）。
 */
export function enforceToneVariety(scenes: Scene[]): Scene[] {
  const n = scenes.length;
  if (n < 4) return scenes; // 短すぎる場合は調整不要

  const tones: ConceptColor[] = scenes.map((s) => s.concept_color);

  // 1) 明トーンが目標比率に満たなければ、暗トーンのシーンを等間隔で明トーンに昇格。
  const target = Math.round(n * BRIGHT_TARGET_RATIO);
  const brightCount = tones.filter(isBright).length;
  if (brightCount < target) {
    const darkIdx = tones
      .map((t, i) => (isBright(t) ? -1 : i))
      .filter((i) => i >= 0);
    const need = Math.min(target - brightCount, darkIdx.length);
    for (let k = 0; k < need; k++) {
      // 等間隔サンプリング（Math.random不使用・決定論的）
      const pick = darkIdx[Math.floor(((k + 0.5) / need) * darkIdx.length)];
      tones[pick] = BRIGHT[k % BRIGHT.length];
    }
  }

  // 2) 同一トーンが MAX_RUN を超えて連続したら、対照的な系統へ差し替えて分断。
  //    連続が暗なら明へ、明なら暗へ。系統内はローテーションで単調さを避ける。
  let run = 1;
  for (let i = 1; i < n; i++) {
    if (tones[i] === tones[i - 1]) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > MAX_RUN) {
      tones[i] = isBright(tones[i]) ? DARK[i % DARK.length] : BRIGHT[i % BRIGHT.length];
      run = 1;
    }
  }

  // 3) 暗トーンが同じ種類ばかり続く単調さを避け、暗トーン内でも種類を回す。
  //    （明/暗の別は変えず、暗→暗の中で dark-navy/charcoal/pitch-black を分散）
  let darkSeq = 0;
  for (let i = 0; i < n; i++) {
    if (!isBright(tones[i])) {
      // 直前と同じ暗トーンなら、別の暗トーンにローテーション
      if (i > 0 && tones[i] === tones[i - 1]) {
        tones[i] = DARK[(DARK.indexOf(tones[i]) + 1 + darkSeq) % DARK.length];
      }
      darkSeq += 1;
    }
  }

  return scenes.map((s, i) =>
    s.concept_color === tones[i] ? s : { ...s, concept_color: tones[i] },
  );
}

/** デバッグ用: トーン分布を集計して文字列で返す */
export function summarizeTones(scenes: Scene[]): string {
  const counts = new Map<ConceptColor, number>();
  for (const s of scenes) counts.set(s.concept_color, (counts.get(s.concept_color) ?? 0) + 1);
  const brightN = scenes.filter((s) => isBright(s.concept_color)).length;
  const parts = [...counts.entries()].map(([t, c]) => `${t}:${c}`).join(", ");
  const pct = scenes.length ? Math.round((brightN / scenes.length) * 100) : 0;
  return `明トーン ${brightN}/${scenes.length} (${pct}%) — ${parts}`;
}
