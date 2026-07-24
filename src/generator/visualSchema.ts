/**
 * visual（画面構成）の共有JSONスキーマ。
 * 台本生成（generateScript）と、Gist台本へのAI演出付け（directScript）の両方が使う。
 * ここを更新すれば両経路に同時に反映される（figure種の追加など）。
 */

export const FIGURE_KINDS_ENUM = [
  "person", "crowd", "couple", "family", "handshake", "conflict", "isolation",
  "hierarchy", "queue", "blame", "applause", "leader", "bystander",
  "brain", "heart", "mask", "eye", "anxiety", "lightbulb", "addiction", "thought", "tears", "dream",
  "money", "city", "factory", "scale", "gavel", "stairs", "cage", "chains", "target", "trophy",
  "podium", "contract", "shopping", "crown",
  "clock", "hourglass", "candle", "tree", "seed", "path", "door", "mountain",
  "smartphone", "notification", "screen", "camera", "network", "echo",
  "dna", "atom", "evolution", "arrowUp", "arrowDown", "cycle", "crossroad", "question", "village",
] as const;

const FIGURE_DESC =
  "ナレーションの中心イメージに最も近い動くピクトグラム。person:個人 crowd:群衆・競争 couple:二者関係 family:家族 handshake:協力・契約 conflict:対立 isolation:孤立 hierarchy:階層・格差 queue:行列・順番待ち blame:非難 applause:賞賛 leader:扇動者と追従 bystander:傍観・同調圧力 brain:本能・報酬系 heart:恋愛・喪失 mask:建前・ペルソナ eye:視線・監視 anxiety:不安・思考のループ lightbulb:気づき addiction:依存 thought:思索 tears:悲しみ dream:夢・眠り money:金・資本 city:都市・夜 factory:労働・大量生産 scale:比較・天秤 gavel:裁き・法 stairs:徒労・出世 cage:不自由・家畜化 chains:束縛 target:目標・的 trophy:勝利 podium:順位・競争 contract:契約・規則 shopping:消費 crown:権力 clock:時間 hourglass:有限の時間 candle:儚さ・死 tree:成長・自然 seed:芽生え・可能性 path:人生の道 door:選択・機会 mountain:困難・目標 smartphone:SNS notification:通知・いいね screen:情報・メディア camera:監視 network:繋がり・アルゴリズム echo:エコーチェンバー dna:遺伝子・進化 atom:科学・物質 evolution:進化 arrowUp:上昇・成長 arrowDown:下落・衰退 cycle:循環・反復 crossroad:岐路・分岐 question:問い・謎 village:村・地方・共同体・郷愁（明トーン向けの情景）";

/** visual プロパティの値（description + anyOf の10型） */
export const VISUAL_SCHEMA = {
  description: "画面構成。ナレーション内容に最も合う型を選ぶ（同じ型を3連続させない）",
  anyOf: [
    {
      type: "object",
      properties: {
        type: { type: "string", const: "keyword" },
        keyword: { type: "string", description: "中央に浮かぶ抽象的な短い言葉（2〜10文字）" },
      },
      required: ["type", "keyword"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { type: "string", const: "figure" },
        figure: { type: "string", enum: FIGURE_KINDS_ENUM, description: FIGURE_DESC },
        label: { type: "string", description: "画面下部に添える短い言葉（2〜12文字）" },
      },
      required: ["type", "figure", "label"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { type: "string", const: "dialogue" },
        line: { type: "string", description: "吹き出しに表示する短いセリフ・内心（5〜20文字）" },
      },
      required: ["type", "line"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { type: "string", const: "stat" },
        value: { type: "string", description: "大きく表示する数値・年号（例: 150人, 1971年）" },
        label: { type: "string", description: "数値の意味の説明（20文字以内）" },
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
              label: { type: "string", description: "項目名（2〜10文字）" },
              value: { type: "number" },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
          description: "2〜6本の横棒",
        },
        subtitle: { type: "string", description: "出典・調査名の注記（例: 「青森県『県外へ転出した理由』調査」。無ければ空文字）" },
        highlight: { type: "integer", description: "強調する項目のindex(0始まり)。話の核心の項目をアンバー色で強調する。強調不要なら-1" },
        annotation: { type: "string", description: "下部の注釈ボックス。「説明 + 数値」形式（例: 「進学で出た若者は 46.4% ≒ 2人に1人」）。無ければ空文字" },
      },
      required: ["type", "title", "unit", "items", "subtitle", "highlight", "annotation"],
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
        total: { type: "integer", description: "ドットの総数（10〜200。例: 100人の村なら100）" },
        value: { type: "integer", description: "そのうち残る・該当する数。total との差分が赤く消えていく" },
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
        headers: { type: "array", items: { type: "string" }, description: "列見出し（2〜3列、各2〜8文字）" },
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
        left_items: { type: "array", items: { type: "string" }, description: "左側の特徴ボックス（2〜4項目、各2〜8文字）" },
        right_items: { type: "array", items: { type: "string" }, description: "右側の特徴ボックス（2〜4項目、各2〜8文字）" },
        center_label: { type: "string", description: "中央の関係性ラベル（vs, ≠, → など）" },
      },
      required: ["type", "left_title", "right_title", "left_items", "right_items", "center_label"],
      additionalProperties: false,
    },
    {
      type: "object",
      properties: {
        type: { type: "string", const: "list" },
        title: { type: "string" },
        items: { type: "array", items: { type: "string" }, description: "列挙する項目（2〜5個、各3〜14文字）" },
      },
      required: ["type", "title", "items"],
      additionalProperties: false,
    },
  ],
} as const;

export const CONCEPT_COLOR_SCHEMA = {
  type: "string",
  enum: ["dark-navy", "charcoal", "pitch-black", "daylight", "dusk", "warm"],
  description:
    "シーンの背景トーン。暗: dark-navy(夜・思索) charcoal(データ) pitch-black(断定・結び) / 明: daylight(昼の情景・日常) dusk(夕暮れ・郷愁) warm(人の営み・回想)。【重要】明トーンを全体の3〜4割使う。第1幕の情景・導入、人の暮らし・過去・日常の描写は必ず明トーン。同じトーンを4シーン以上連続させず、明暗を数シーンごとに切り替えて画面に呼吸を作る。ずっと暗いのは最大の失敗",
} as const;
