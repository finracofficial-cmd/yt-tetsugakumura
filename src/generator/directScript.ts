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
import { enforceVisualRichness, summarizeVisuals } from "./visualRichness";
import { sanitizeScenes } from "./sanitizeScenes";
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

/**
 * reading（かな）が必要かどうか。
 * ElevenLabs/OpenAI は漢字仮名交じりの自然文をそのまま読ませる方が自然なので
 * reading を使わない（generateAudio の speakTextFor と同じ判定）。
 * 不要なときは生成させないことで出力トークンを大幅に節約し、
 * 「出力がトークン上限で途切れる」失敗も起きにくくする。
 */
const NEEDS_READING =
  (process.env.TTS_PROVIDER ||
    (process.env.ELEVENLABS_API_KEY?.replace(/\s+/g, "") ? "elevenlabs" : "voicevox")) ===
  "voicevox";

/**
 * 1回のAPI呼び出しで演出を付けるシーン数。
 * 200シーン超を一度に投げると、図解型(chart/table/comparison)のJSONが大きいため
 * 出力がトークン上限を超えて丸ごと失敗する。小さく分けて確実に通す。
 */
const CHUNK_SIZE = Math.max(5, Number(process.env.DIRECT_CHUNK_SIZE || "35"));
/** チャンクの並列実行数（レート制限とのバランス） */
const CHUNK_CONCURRENCY = Math.max(1, Number(process.env.DIRECT_CONCURRENCY || "3"));
/** 1チャンクあたりの出力上限 */
const CHUNK_MAX_TOKENS = 32000;

/** 各シーンの演出（narrationは含めない）。readingの要否でスキーマを組み立てる */
function buildDirectionSchema(withReading: boolean) {
  const itemProps: Record<string, unknown> = {
    act: {
      type: "integer",
      enum: [1, 2, 3, 4, 5],
      description: "幕番号。物語の位置から推定（1:情景フック 2:解剖 3:構造 4:反転 5:結び）",
    },
    visual: VISUAL_SCHEMA,
    concept_color: CONCEPT_COLOR_SCHEMA,
  };
  const required = ["act", "visual", "concept_color"];
  if (withReading) {
    itemProps.reading = {
      type: "string",
      description:
        "この文のTTS読み上げ専用テキスト。誤読しやすい漢字・数字＋助数詞・年号をひらがな/カタカナに開く。句読点の位置と数は元の文と一致させる",
    };
    required.splice(1, 0, "reading");
  }
  return {
    type: "json_schema" as const,
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
            properties: itemProps,
            required,
            additionalProperties: false,
          },
        },
      },
      required: ["title", "bgm_direction", "directions"],
      additionalProperties: false,
    },
  };
}

interface Direction {
  act: 1 | 2 | 3 | 4 | 5;
  reading?: string;
  visual: Visual;
  concept_color: Scene["concept_color"];
}

interface ChunkResult {
  title: string;
  bgm_direction: string;
  directions: Direction[];
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
  const schema = buildDirectionSchema(NEEDS_READING);
  const total = narrations.length;

  /**
   * 1チャンク分の演出を取得する。
   * 出力がトークン上限で途切れた場合は、そのチャンクを半分に割って再帰的に処理し、
   * 全体を落とさずに必ず完走させる。
   */
  const runChunk = async (
    slice: string[],
    globalStart: number,
    depth = 0,
  ): Promise<ChunkResult> => {
    const numbered = slice.map((n, i) => `${globalStart + i + 1}. ${n}`).join("\n");
    const userPrompt = `以下は動画のナレーションの一部である。1行が1シーン。
これは全${total}シーンのうち ${globalStart + 1}〜${globalStart + slice.length} 番目（このまとまりで${slice.length}シーン）。
各シーンに、内容に最も合う visual・${NEEDS_READING ? "reading・" : ""}act・concept_color を割り当てよ。
**ナレーション本文は絶対に変更・要約・追加・削除しない。** directions 配列は必ず${slice.length}個、同じ順序で返すこと。
act は全体${total}シーン中の位置から判断せよ（序盤=1、終盤=5）。

${numbered}`;

    let message;
    try {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: CHUNK_MAX_TOKENS,
        thinking: { type: "adaptive" },
        output_config: { format: schema },
        system: DIRECTOR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      message = await stream.finalMessage();
    } catch (err) {
      // 構造化出力のスキーマが複雑すぎると 400 で丸ごと失敗する。
      // 生のスタックトレースだと原因が分からないので、対処法を示して落とす。
      const msg = err instanceof Error ? err.message : String(err);
      if (/compiled grammar is too large|grammar/i.test(msg)) {
        throw new Error(
          "[directScript] visualスキーマが複雑すぎて構造化出力の上限を超えました。" +
            "src/generator/visualSchema.ts の図解型を減らすか、enum（列挙）をやめて" +
            "descriptionでの指定に変え、sanitizeScenes.ts 側で検証してください。\n  " +
            msg,
        );
      }
      throw err;
    }

    if (message.stop_reason === "max_tokens") {
      if (slice.length <= 2 || depth >= 4) {
        throw new Error(
          `[directScript] シーン${globalStart + 1}付近で出力がトークン上限に達しました。DIRECT_CHUNK_SIZE を小さくして再実行してください。`,
        );
      }
      const half = Math.ceil(slice.length / 2);
      console.warn(
        `[directScript] シーン${globalStart + 1}〜${globalStart + slice.length}が上限超過。${half}件ずつに分割して再試行します。`,
      );
      const a = await runChunk(slice.slice(0, half), globalStart, depth + 1);
      const b = await runChunk(slice.slice(half), globalStart + half, depth + 1);
      return {
        title: a.title || b.title,
        bgm_direction: a.bgm_direction || b.bgm_direction,
        directions: [...a.directions, ...b.directions],
      };
    }

    const text = message.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("[directScript] 応答にテキストがありません。");
    const parsed = JSON.parse(text) as ChunkResult;
    return {
      title: parsed.title ?? "",
      bgm_direction: parsed.bgm_direction ?? "",
      directions: parsed.directions ?? [],
    };
  };

  // シーンをチャンクに分割し、並列数を絞って処理する
  const chunks: { slice: string[]; start: number }[] = [];
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    chunks.push({ slice: narrations.slice(i, i + CHUNK_SIZE), start: i });
  }
  console.log(
    `[directScript] ${total}シーンに演出を付与中... (model=${MODEL}, ${chunks.length}チャンク×最大${CHUNK_SIZE}シーン, 並列${CHUNK_CONCURRENCY}, reading=${NEEDS_READING ? "あり" : "なし(自然文で読み上げ)"})`,
  );

  const results: ChunkResult[] = new Array(chunks.length);
  for (let i = 0; i < chunks.length; i += CHUNK_CONCURRENCY) {
    const batch = chunks.slice(i, i + CHUNK_CONCURRENCY);
    const done = await Promise.all(
      batch.map(async (c, k) => ({ idx: i + k, res: await runChunk(c.slice, c.start) })),
    );
    for (const d of done) {
      // チャンクが要求数と違う個数を返すと、以降のシーンとの対応が全てズレる。
      // チャンク単位で長さを合わせ、ズレを局所化する（不足分は後段でfigureに補完）。
      const want = chunks[d.idx].slice.length;
      const got = d.res.directions.length;
      if (got !== want) {
        console.warn(
          `[directScript] 警告: チャンク${d.idx + 1}の演出数が${got}件（要求${want}件）。長さを揃えます。`,
        );
        d.res.directions = d.res.directions.slice(0, want);
        while (d.res.directions.length < want) {
          d.res.directions.push({
            act: 1,
            visual: { type: "keyword", keyword: "…" },
            concept_color: "charcoal",
          });
        }
      }
      results[d.idx] = d.res;
    }
    console.log(
      `[directScript] 進捗: ${Math.min(i + CHUNK_CONCURRENCY, chunks.length)}/${chunks.length}チャンク完了`,
    );
  }

  const dirs = results.flatMap((r) => r.directions);
  const parsed = {
    title: results.find((r) => r.title)?.title ?? "",
    bgm_direction: results.find((r) => r.bgm_direction)?.bgm_direction ?? "",
  };
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

  // figure名など、スキーマで縛らなくなった値をコード側で検証・補正する
  const sanitized = sanitizeScenes(scenes);
  // 図解・アニメ比率を7割以上に底上げ（keyword＝文字だけを減らす）
  const enriched = enforceVisualRichness(sanitized);
  // 背景トーンの明暗バランスを機械的に保証（LLM任せだと「ずっと暗い」になりがちなため）
  const balanced = enforceToneVariety(enriched);
  console.log(
    `[directScript] 完了: ${balanced.length}シーン / タイトル: ${meta.title || parsed.title}`,
  );
  console.log(`[directScript] 画面構成: ${summarizeVisuals(balanced)}`);
  console.log(`[directScript] 背景トーン: ${summarizeTones(balanced)}`);
  return {
    theme: meta.theme ?? "（Gist台本）",
    title: meta.title || parsed.title || "無題",
    bgm_direction: meta.bgm_direction || parsed.bgm_direction,
    scenes: balanced,
  };
}
