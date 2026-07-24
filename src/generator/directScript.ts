/**
 * AI演出付けモジュール（Gist台本 → 完全な台本JSON）
 *
 * ナレーション本文だけの台本（Gistの平文 or narrationのみのJSON）を受け取り、
 * Claude が内容を理解して各シーンに visual（ピクトグラム・グラフ等）・reading（ふりがな）・
 * act（幕）・concept_color（背景色）を割り当てる。ナレーション本文は一字一句変更しない。
 *
 * これにより、視聴者は「文章だけ」書けば、演出は自動で付く。
 */
import Anthropic from "@anthropic-ai/sdk";
import { DIRECTOR_SYSTEM_PROMPT } from "./prompts";
import { VISUAL_SCHEMA, CONCEPT_COLOR_SCHEMA } from "./visualSchema";
import { enforceToneVariety, summarizeTones } from "./toneVariety";
import type { Scene, VideoScript, Visual } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/** 平文をシーン（1文＝1シーン）に分割する。改行と文末（。！？）で区切る */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .flatMap((line) => line.split(/(?<=[。！？])/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** 各シーンの演出（narrationは含めない） */
const DIRECTION_SCHEMA = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "動画タイトル。台本の内容から「なぜ〜なのか【学問A×学問B】」構文で付ける",
      },
      bgm_direction: {
        type: "string",
        description: "BGM生成AIへの音楽指示（英語1〜2文、暗く静かな劇伴）",
      },
      directions: {
        type: "array",
        description: "各シーンの演出。入力の文と同じ順序・同じ個数で返す",
        items: {
          type: "object",
          properties: {
            act: {
              type: "integer",
              enum: [1, 2, 3, 4, 5],
              description: "幕番号。物語の位置から推定（1:情景フック 2:解剖 3:構造 4:反転 5:結び）",
            },
            reading: {
              type: "string",
              description:
                "この文のTTS読み上げ専用テキスト。誤読しやすい漢字・数字＋助数詞・年号をひらがな/カタカナに開く。句読点の位置と数は元の文と一致させる",
            },
            visual: VISUAL_SCHEMA,
            concept_color: CONCEPT_COLOR_SCHEMA,
          },
          required: ["act", "reading", "visual", "concept_color"],
          additionalProperties: false,
        },
      },
    },
    required: ["title", "bgm_direction", "directions"],
    additionalProperties: false,
  },
} as const;

interface Direction {
  act: 1 | 2 | 3 | 4 | 5;
  reading: string;
  visual: Visual;
  concept_color: Scene["concept_color"];
}

/**
 * ナレーション列に演出を付けて完全な VideoScript を返す。
 * @param narrations 1シーン1文のナレーション配列（本文は変更しない）
 * @param meta 既に判っているタイトル/テーマ/BGM指示（あれば優先）
 */
export async function directScript(
  narrations: string[],
  meta: { title?: string; theme?: string; bgm_direction?: string } = {},
): Promise<VideoScript> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY が設定されていません（AI演出付けに必要）。");
  }
  if (narrations.length === 0) {
    throw new Error("[directScript] ナレーションが空です。");
  }

  const client = new Anthropic({ apiKey });
  console.log(
    `[directScript] ${narrations.length}シーンに演出を付与中... (model=${MODEL})`,
  );

  const numbered = narrations.map((n, i) => `${i + 1}. ${n}`).join("\n");
  const userPrompt = `以下は動画のナレーションである。1行が1シーン（合計${narrations.length}シーン）。
各シーンに、内容に最も合う visual・reading・act・concept_color を割り当てよ。
**ナレーション本文は絶対に変更・要約・追加・削除しない。** directions 配列は必ず${narrations.length}個、同じ順序で返すこと。

${numbered}`;

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { format: DIRECTION_SCHEMA },
    system: DIRECTOR_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error("[directScript] 出力がトークン上限で途切れました。台本を分割してください。");
  }
  const text = message.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("[directScript] 応答にテキストがありません。");

  const parsed = JSON.parse(text) as {
    title: string;
    bgm_direction: string;
    directions: Direction[];
  };
  const dirs = parsed.directions ?? [];
  if (dirs.length !== narrations.length) {
    console.warn(
      `[directScript] 警告: 演出数(${dirs.length})とシーン数(${narrations.length})が不一致。可能な範囲で対応付けます。`,
    );
  }

  const scenes: Scene[] = narrations.map((narration, i) => {
    const d = dirs[i];
    // 演出が欠けたシーンは keyword で穏当にフォールバック
    const visual: Visual = d?.visual ?? { type: "keyword", keyword: "…" };
    return {
      id: i + 1,
      act: d?.act ?? (i === narrations.length - 1 ? 5 : 1),
      narration, // ← AIの出力ではなく、渡された本文をそのまま使う（改変防止）
      reading: d?.reading,
      visual,
      concept_color: d?.concept_color ?? "charcoal",
    };
  });

  // 背景トーンの明暗バランスを機械的に保証（LLM任せだと「ずっと暗い」になりがちなため）
  const balanced = enforceToneVariety(scenes);
  console.log(
    `[directScript] 完了: ${balanced.length}シーン / タイトル: ${meta.title || parsed.title}`,
  );
  console.log(`[directScript] 背景トーン: ${summarizeTones(balanced)}`);
  return {
    theme: meta.theme ?? "（Gist台本）",
    title: meta.title || parsed.title || "無題",
    bgm_direction: meta.bgm_direction || parsed.bgm_direction,
    scenes: balanced,
  };
}
