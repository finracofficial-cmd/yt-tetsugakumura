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
                      enum: [
                        "person",
                        "crowd",
                        "couple",
                        "family",
                        "handshake",
                        "conflict",
                        "isolation",
                        "hierarchy",
                        "queue",
                        "blame",
                        "applause",
                        "leader",
                        "bystander",
                        "brain",
                        "heart",
                        "mask",
                        "eye",
                        "anxiety",
                        "lightbulb",
                        "addiction",
                        "thought",
                        "tears",
                        "dream",
                        "money",
                        "city",
                        "factory",
                        "scale",
                        "gavel",
                        "stairs",
                        "cage",
                        "chains",
                        "target",
                        "trophy",
                        "podium",
                        "contract",
                        "shopping",
                        "crown",
                        "clock",
                        "hourglass",
                        "candle",
                        "tree",
                        "seed",
                        "path",
                        "door",
                        "mountain",
                        "smartphone",
                        "notification",
                        "screen",
                        "camera",
                        "network",
                        "echo",
                        "dna",
                        "atom",
                        "evolution",
                        "arrowUp",
                        "arrowDown",
                        "cycle",
                        "crossroad",
                        "question",
                      ],
                      description:
                        "ナレーションの中心イメージに最も近い動くピクトグラム。person:個人 crowd:群衆・競争 couple:二者関係 family:家族 handshake:協力・契約 conflict:対立 isolation:孤立 hierarchy:階層・格差 queue:行列・順番待ち blame:非難 applause:賞賛 leader:扇動者と追従 bystander:傍観・同調圧力 brain:本能・報酬系 heart:恋愛・喪失 mask:建前・ペルソナ eye:視線・監視 anxiety:不安・思考のループ lightbulb:気づき addiction:依存 thought:思索 tears:悲しみ dream:夢・眠り money:金・資本 city:都市・夜 factory:労働・大量生産 scale:比較・天秤 gavel:裁き・法 stairs:徒労・出世 cage:不自由・家畜化 chains:束縛 target:目標・的 trophy:勝利 podium:順位・競争 contract:契約・規則 shopping:消費 crown:権力 clock:時間 hourglass:有限の時間 candle:儚さ・死 tree:成長・自然 seed:芽生え・可能性 path:人生の道 door:選択・機会 mountain:困難・目標 smartphone:SNS notification:通知・いいね screen:情報・メディア camera:監視 network:繋がり・アルゴリズム echo:エコーチェンバー dna:遺伝子・進化 atom:科学・物質 evolution:進化 arrowUp:上昇・成長 arrowDown:下落・衰退 cycle:循環・反復 crossroad:岐路・分岐 question:問い・謎",
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
                    type: { type: "string", const: "line" },
                    title: { type: "string", description: "グラフのタイトル" },
                    unit: { type: "string", description: "数値の単位（%, 人, 倍 など。無ければ空文字）" },
                    points: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: { type: "string", description: "X軸ラベル（年号・時点など2〜8文字）" },
                          value: { type: "number" },
                        },
                        required: ["label", "value"],
                        additionalProperties: false,
                      },
                      description: "3〜6点の推移。最終点が自動で強調される",
                    },
                  },
                  required: ["type", "title", "unit", "points"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "units" },
                    total: {
                      type: "integer",
                      description: "ドットの総数（10〜200。例: 100人の村なら100）",
                    },
                    value: {
                      type: "integer",
                      description: "そのうち残る・該当する数。total との差分が赤く消えていく",
                    },
                    label: { type: "string", description: "意味の説明（20文字以内）" },
                  },
                  required: ["type", "total", "value", "label"],
                  additionalProperties: false,
                },
                {
                  type: "object",
                  properties: {
                    type: { type: "string", const: "table" },
                    title: { type: "string", description: "表のタイトル" },
                    headers: {
                      type: "array",
                      items: { type: "string" },
                      description: "列見出し（2〜3列、各2〜8文字）",
                    },
                    rows: {
                      type: "array",
                      items: { type: "array", items: { type: "string" } },
                      description: "行データ（2〜5行。各セル2〜12文字）",
                    },
                  },
                  required: ["type", "title", "headers", "rows"],
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
