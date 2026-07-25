/**
 * Step 1: AIエージェントモジュール
 *
 * Claude API を呼び出し、チャンネルの成功法則（prompts.ts）に従った
 * 台本を構造化JSON（VideoScript）として生成し、src/data/script.json に保存する。
 *
 * 実行: npm run generate:script -- --topic="承認欲求"（topic省略時はAIがテーマを自動選定）
 * 必要な環境変数: ANTHROPIC_API_KEY
 */
import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { SCRIPT_SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { VISUAL_JSON_FIELD, CONCEPT_COLOR_SCHEMA } from "./visualSchema";
import { enforceToneVariety, summarizeTones } from "./toneVariety";
import { enforceVisualRichness, summarizeVisuals } from "./visualRichness";
import { sanitizeScenes, parseVisual } from "./sanitizeScenes";
import { SCRIPT_JSON_PATH, type VideoScript } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

/**
 * 構造化出力用のJSONスキーマ。
 * output_config.format に渡すことで、モデル出力がこの形に強制される。
 */
const VIDEO_SCRIPT_SCHEMA = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      theme: {
        type: "string",
        description: "テーマの要約（扱う社会事象・心理現象を一文で）",
      },
      title: {
        type: "string",
        description:
          "動画タイトル。「なぜ〜は〜なのか【学問A×学問B】」の構文に従う",
      },
      bgm_direction: {
        type: "string",
        description:
          "BGM生成AIへの音楽指示（英語1〜2文）。テーマの情動に合う暗く静かな劇伴を指定する。例: 'Dark minimal ambient underscore, slow evolving pads, sparse melancholic piano, quiet and contemplative.'",
      },
      scenes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer", description: "1始まりの連番" },
            act: {
              type: "integer",
              enum: [1, 2, 3, 4, 5],
              description:
                "幕番号。1:情景フック 2:学術的解剖 3:構造の暴露 4:自己への反転 5:結び",
            },
            narration: {
              type: "string",
              description: "読み上げるナレーション本文（80〜220文字、だ・である調）",
            },
            reading: {
              type: "string",
              description:
                "TTS読み上げ専用テキスト。narrationと同一の文だが、誤読しやすい漢字・熟語・固有名詞・数字＋助数詞をすべてひらがな（またはカタカナ）に開く。句読点（。、！？…）の位置と数はnarrationと完全に一致させること。例: narration「他人事ではない。」→ reading「ひとごとではない。」",
            },
            visual: VISUAL_JSON_FIELD,
            concept_color: CONCEPT_COLOR_SCHEMA,
          },
          required: ["id", "act", "narration", "reading", "visual", "concept_color"],
          additionalProperties: false,
        },
      },
    },
    required: ["theme", "title", "bgm_direction", "scenes"],
    additionalProperties: false,
  },
} as const;

export async function generateScript(topic?: string): Promise<VideoScript> {
  // Secretsへの貼り付け時に混入しがちな改行・空白を除去する（改行入りのキーはHTTPヘッダーに載せられない）
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY が設定されていません。GitHub Secrets またはローカルの環境変数に設定してください。",
    );
  }

  const client = new Anthropic({ apiKey });

  console.log(
    `[generateScript] 台本を生成中... (model=${MODEL}, topic=${topic?.trim() || "AI自動選定"})`,
  );

  // 20分尺の台本（200+シーン × narration+reading）は10万トークン級になるため、
  // 出力上限をモデルの限界(128K)近くまで確保しストリーミングで受け取る
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 127000,
    thinking: { type: "adaptive" },
    output_config: { format: VIDEO_SCRIPT_SCHEMA },
    system: SCRIPT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(topic) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error(
      "[generateScript] 出力がトークン上限で途切れました。max_tokens を増やして再実行してください。",
    );
  }
  if (message.stop_reason === "refusal") {
    throw new Error(
      "[generateScript] モデルがこのテーマの生成を拒否しました。別のテーマで再実行してください。",
    );
  }

  const text = message.content.find((b) => b.type === "text")?.text;
  if (!text) {
    throw new Error("[generateScript] 応答にテキストが含まれていません。");
  }

  const script = JSON.parse(text) as VideoScript;
  validateScript(script);

  // visualはJSON文字列で来る（文法上限回避）。まずVisualへ変換してから検証・補正する
  script.scenes = script.scenes.map((s, i) => ({
    ...s,
    visual: parseVisual(s.visual as unknown, s.narration, i),
  }));
  script.scenes = sanitizeScenes(script.scenes);
  // 図解・アニメ比率を7割以上に底上げ（LLM任せだとkeyword＝文字だけが増えがち）
  script.scenes = enforceVisualRichness(script.scenes);
  // 背景トーンの明暗バランスを機械的に保証（LLM任せだと「ずっと暗い」になりがちなため）
  script.scenes = enforceToneVariety(script.scenes);

  mkdirSync(dirname(SCRIPT_JSON_PATH), { recursive: true });
  writeFileSync(SCRIPT_JSON_PATH, JSON.stringify(script, null, 2) + "\n", "utf-8");

  const totalChars = script.scenes.reduce((sum, s) => sum + s.narration.length, 0);
  console.log(`[generateScript] 完了: ${SCRIPT_JSON_PATH}`);
  console.log(`  タイトル: ${script.title}`);
  console.log(`  シーン数: ${script.scenes.length} / ナレーション合計: ${totalChars}文字`);
  console.log(`  画面構成: ${summarizeVisuals(script.scenes)}`);
  console.log(`  背景トーン: ${summarizeTones(script.scenes)}`);
  console.log(
    `  トークン: in=${message.usage.input_tokens} out=${message.usage.output_tokens}`,
  );

  return script;
}

/** スキーマでは表現しきれない業務ルールの検証 */
function validateScript(script: VideoScript): void {
  if (script.scenes.length < 5) {
    throw new Error(`シーン数が少なすぎます (${script.scenes.length})`);
  }
  if (script.scenes.length < 150) {
    console.warn(
      `[generateScript] 警告: シーン数が${script.scenes.length}で20分尺の目標(200〜250)に届いていません。動画は短めになります。`,
    );
  }
  const acts = new Set(script.scenes.map((s) => s.act));
  for (const act of [1, 2, 3, 4, 5] as const) {
    if (!acts.has(act)) {
      throw new Error(`第${act}幕のシーンが存在しません。5幕構成が守られていません。`);
    }
  }
  const last = script.scenes[script.scenes.length - 1];
  if (!last.narration.includes("考えすぎてみました")) {
    console.warn(
      "[generateScript] 警告: 結びの決まり文句「そんなことを、考えすぎてみました。」が最終シーンに含まれていません。",
    );
  }
}

/** CLI引数（--topic=xxx）または npm config（npm_config_topic）からテーマを取得 */
export function resolveTopic(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith("--topic="));
  if (arg) return arg.slice("--topic=".length);
  return process.env.npm_config_topic || process.env.TOPIC || undefined;
}

// 直接実行された場合のみCLIとして動く
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateScript(resolveTopic()).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
