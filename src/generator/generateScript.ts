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
            visual: {
              description:
                "画面構成。ナレーション内容に最も合う型を選ぶ（同じ型を3連続させない）",
              anyOf: [
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "keyword" },
                    keyword: {
                      type: "string",
                      description: "中央に浮かぶ抽象的な短い言葉（2〜10文字）",
                    },
                  },
                  required: ["type", "keyword"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "figure" },
                    figure: {
                      type: "string",
                      enum: ["person", "crowd", "smartphone", "brain", "money", "city"],
                      description:
                        "person:個人 crowd:群衆・競争 smartphone:SNS brain:本能・報酬系 money:金・資本 city:都市・夜",
                    },
                    label: {
                      type: "string",
                      description: "画面下部に添える短い言葉（2〜12文字）",
                    },
                  },
                  required: ["type", "figure", "label"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "dialogue" },
                    line: {
                      type: "string",
                      description: "吹き出しに表示する短いセリフ・内心（5〜20文字）",
                    },
                  },
                  required: ["type", "line"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "stat" },
                    value: {
                      type: "string",
                      description: "大きく表示する数値・年号（例: 150人, 1971年）",
                    },
                    label: {
                      type: "string",
                      description: "数値の意味の説明（20文字以内）",
                    },
                  },
                  required: ["type", "value", "label"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "chart" },
                    title: { type: "string", description: "グラフのタイトル" },
                    unit: { type: "string", description: "数値の単位（時間, %, 人 など）" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string", description: "項目名（2〜8文字）" },
                          value: { type: "number" },
                        },
                        required: ["label", "value"],
                        additionalProperties: false,
                      },
                      description: "2〜6本の棒",
                    },
                  },
                  required: ["type", "title", "unit", "items"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "comparison" },
                    left_title: { type: "string" },
                    right_title: { type: "string" },
                    left_items: {
                      type: "array",
                      items: { type: "string" },
                      description: "左側の特徴ボックス（2〜4項目、各2〜8文字）",
                    },
                    right_items: {
                      type: "array",
                      items: { type: "string" },
                      description: "右側の特徴ボックス（2〜4項目、各2〜8文字）",
                    },
                    center_label: {
                      type: "string",
                      description: "中央の関係性ラベル（vs, ≠, → など）",
                    },
                  },
                  required: [
                    "type",
                    "left_title",
                    "right_title",
                    "left_items",
                    "right_items",
                    "center_label",
                  ],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "list" },
                    title: { type: "string" },
                    items: {
                      type: "array",
                      items: { type: "string" },
                      description: "列挙する項目（2〜5個、各3〜14文字）",
                    },
                  },
                  required: ["type", "title", "items"],
                  additionalProperties: false,
                },
              ],
            },
            concept_color: {
              type: "string",
              enum: ["dark-navy", "charcoal", "pitch-black"],
              description: "シーンの背景トーン",
            },
          },
          required: ["id", "act", "narration", "visual", "concept_color"],
          additionalProperties: false,
        },
      },
    },
    required: ["theme", "title", "scenes"],
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

  // 台本は長文になるため、SDKのHTTPタイムアウトを避けてストリーミングで受け取る
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
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

  mkdirSync(dirname(SCRIPT_JSON_PATH), { recursive: true });
  writeFileSync(SCRIPT_JSON_PATH, JSON.stringify(script, null, 2) + "\n", "utf-8");

  const totalChars = script.scenes.reduce((sum, s) => sum + s.narration.length, 0);
  console.log(`[generateScript] 完了: ${SCRIPT_JSON_PATH}`);
  console.log(`  タイトル: ${script.title}`);
  console.log(`  シーン数: ${script.scenes.length} / ナレーション合計: ${totalChars}文字`);
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
