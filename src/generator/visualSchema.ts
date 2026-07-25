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
  "ナレーションの中心イメージに最も近い動くピクトグラム。**必ず次の60種のキー名をそのまま使うこと（他の語を書かない）。**person:個人 crowd:群衆・競争 couple:二者関係 family:家族 handshake:協力・契約 conflict:対立 isolation:孤立 hierarchy:階層・格差 queue:行列・順番待ち blame:非難 applause:賞賛 leader:扇動者と追従 bystander:傍観・同調圧力 brain:本能・報酬系 heart:恋愛・喪失 mask:建前・ペルソナ eye:視線・監視 anxiety:不安・思考のループ lightbulb:気づき addiction:依存 thought:思索 tears:悲しみ dream:夢・眠り money:金・資本 city:都市・夜 factory:労働・大量生産 scale:比較・天秤 gavel:裁き・法 stairs:徒労・出世 cage:不自由・家畜化 chains:束縛 target:目標・的 trophy:勝利 podium:順位・競争 contract:契約・規則 shopping:消費 crown:権力 clock:時間 hourglass:有限の時間 candle:儚さ・死 tree:成長・自然 seed:芽生え・可能性 path:人生の道 door:選択・機会 mountain:困難・目標 smartphone:SNS notification:通知・いいね screen:情報・メディア camera:監視 network:繋がり・アルゴリズム echo:エコーチェンバー dna:遺伝子・進化 atom:科学・物質 evolution:進化 arrowUp:上昇・成長 arrowDown:下落・衰退 cycle:循環・反復 crossroad:岐路・分岐 question:問い・謎 village:村・地方・共同体・郷愁（明トーン向けの情景）";

/**
 * visual を「JSON文字列」として書かせるスキーマ。
 *
 * 【なぜ文字列なのか】
 * 構造化出力にはコンパイル済み文法のサイズ上限があり、14種の判別共用体
 * （合計80プロパティ）を渡すと 400 "compiled grammar is too large" で
 * 生成が丸ごと失敗する。図解型を増やすたびに上限に近づく設計は破綻するため、
 * visual だけを自由文字列にして文法から外し、形の検証はコード側
 * （sanitizeScenes.ts の parseVisual）で行う。
 *
 * これにより:
 *   - 文法は act(5) / concept_color(6) だけになり、上限の心配が消える
 *   - directions 配列の「個数」は構造化出力が保証し続けるので、
 *     シーンとの対応ズレは起きない（ここが崩れると全体が破綻する）
 *   - 1シーンのJSONが壊れても、そのシーンだけフォールバックすれば済む
 */
export const VISUAL_JSON_FIELD = {
  type: "string",
  description: `画面構成を「1行のJSON」で書く。次のいずれか1つの形にすること（余計なキーを足さない）。
{"type":"keyword","keyword":"2〜10文字の概念の核"}
{"type":"figure","figure":"<下記60種のキー名>","label":"2〜12文字"}
{"type":"dialogue","line":"セリフ・内心"}
{"type":"stat","value":"150人","label":"数値の意味","context":"左上の文脈タグ(不要なら空文字)","unit":"単位だけ分離(不要なら空文字)","axis":{"label":"30年間(不要なら空文字)","ticks":["1995","2005","2015","2025"]}}
{"type":"chart","title":"","subtitle":"出典(不要なら空文字)","unit":"%","items":[{"label":"項目","value":12.3}],"highlight":0,"annotation":"補足(不要なら空文字)"}
{"type":"line","title":"","unit":"","points":[{"label":"2020","value":10}]}
{"type":"units","total":100,"value":96,"label":"100人中96人"}
{"type":"table","title":"","headers":["列1","列2"],"rows":[["a","b"]]}
{"type":"comparison","left_title":"","right_title":"","left_items":["a"],"right_items":["b"],"center_label":"対比の軸"}
{"type":"list","title":"","items":["項目1","項目2"]}
{"type":"columns","title":"価値の逆転","left":{"label":"選び手","value":"0.50","level":0.35},"right":{"label":"被選手","value":"-0.50","level":0.85},"note":"逆転(不要なら空文字)"}
{"type":"balance","title":"","left_label":"個人の努力","right_label":"環境の恩恵","tilt":0.7,"note":"95%(不要なら空文字)"}
{"type":"donut","title":"","percent":7,"label":"到達した人","rest_label":"届かなかった人"}
{"type":"pyramid","title":"","tiers":[{"label":"頂点","note":"ごく少数(不要なら空文字)"},{"label":"中位","note":""},{"label":"底辺","note":""}]}
※ columns は left.level と right.level に必ず差をつける（傾きが意味になる）。
※ balance の tilt は -1.0〜1.0。donut の percent は 0〜100。pyramid の tiers は2〜4段。
※ ${FIGURE_DESC}`,
} as const;

/**
 * 参照用の完全なvisualスキーマ（判別共用体）。
 * ※ 文法サイズの都合でAPIリクエストには使わない。型の一覧と説明の正本として残す。
 */
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
        // ここは enum にしない。60種のenumは構造化出力のコンパイル済み文法を
        // 肥大させ、図解型を増やした際に "compiled grammar is too large" (400) で
        // 生成が丸ごと失敗した。種類の一覧は description で示し、
        // 実際の妥当性は sanitizeScenes() がコード側で検証・補正する。
        figure: { type: "string", description: FIGURE_DESC },
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
        context: {
          type: "string",
          description: "左上に小さく置く文脈タグ（例: 1995→2025, 全国調査2021）。無ければ空文字",
        },
        unit: {
          type: "string",
          description: "単位だけを分離して別の大きさで置く（例: 件, 人, %）。無ければ空文字",
        },
        axis: {
          type: "object",
          description: "数値の下に敷く補助の目盛り軸。時間推移や範囲を示すときだけ使う",
          properties: {
            label: { type: "string", description: "軸の説明（例: 30年間）。無ければ空文字" },
            ticks: {
              type: "array",
              items: { type: "string" },
              description: "目盛りのラベル（例: 1995,2005,2015,2025）。3〜7個。使わないなら空配列",
            },
          },
          required: ["label", "ticks"],
          additionalProperties: false,
        },
      },
      required: ["type", "value", "label", "context", "unit", "axis"],
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
    {
      type: "object",
      description:
        "光る柱2本を線で結び、傾きで2つの立場の関係（とくに逆転）を見せる。参照チャンネルの看板図解",
      properties: {
        type: { type: "string", const: "columns" },
        title: { type: "string", description: "図解のタイトル（例: 価値の逆転）" },
        left: {
          type: "object",
          properties: {
            label: { type: "string", description: "左の柱の名前（2〜8文字）" },
            value: { type: "string", description: "左の値（例: 0.50, 高い）" },
            level: { type: "number", description: "高さ 0.0(低い)〜1.0(高い)" },
          },
          required: ["label", "value", "level"],
          additionalProperties: false,
        },
        right: {
          type: "object",
          properties: {
            label: { type: "string", description: "右の柱の名前（2〜8文字）" },
            value: { type: "string", description: "右の値" },
            level: { type: "number", description: "高さ 0.0〜1.0。leftと差をつけて傾きを作る" },
          },
          required: ["label", "value", "level"],
          additionalProperties: false,
        },
        note: { type: "string", description: "線に添える短い注記（例: 逆転）。無ければ空文字" },
      },
      required: ["type", "title", "left", "right", "note"],
      additionalProperties: false,
    },
    {
      type: "object",
      description: "天秤。2つの価値の釣り合い/不均衡を物理的に見せる",
      properties: {
        type: { type: "string", const: "balance" },
        title: { type: "string", description: "図解のタイトル" },
        left_label: { type: "string", description: "左の皿に載るもの（2〜8文字）" },
        right_label: { type: "string", description: "右の皿に載るもの（2〜8文字）" },
        tilt: {
          type: "number",
          description: "傾き -1.0(左に大きく傾く)〜1.0(右に大きく傾く)。0は釣り合い",
        },
        note: { type: "string", description: "傾きに添える数値・注記（例: 95%）。無ければ空文字" },
      },
      required: ["type", "title", "left_label", "right_label", "tilt", "note"],
      additionalProperties: false,
    },
    {
      type: "object",
      description: "ドーナツ（リング）チャート。1つの割合を中央の大きな%で見せる",
      properties: {
        type: { type: "string", const: "donut" },
        title: { type: "string", description: "図解のタイトル" },
        percent: { type: "number", description: "主役の割合 0〜100" },
        label: { type: "string", description: "主役側の説明（2〜12文字）" },
        rest_label: { type: "string", description: "残り側の説明。無ければ空文字" },
      },
      required: ["type", "title", "percent", "label", "rest_label"],
      additionalProperties: false,
    },
    {
      type: "object",
      description: "ピラミッド。階層・栄養段階・構造の上下関係を見せる",
      properties: {
        type: { type: "string", const: "pyramid" },
        title: { type: "string", description: "図解のタイトル" },
        tiers: {
          type: "array",
          description: "頂点から順に3〜4段",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "その段の名前（2〜10文字）" },
              note: { type: "string", description: "右に添える補足。無ければ空文字" },
            },
            required: ["label", "note"],
            additionalProperties: false,
          },
        },
      },
      required: ["type", "title", "tiers"],
      additionalProperties: false,
    },
  ],
} as const;

export const CONCEPT_COLOR_SCHEMA = {
  type: "string",
  enum: ["dark-navy", "charcoal", "pitch-black", "daylight", "dusk", "warm"],
  description:
    "シーンの背景トーン。暗: dark-navy(夜・思索) charcoal(データ) pitch-black(断定・結び) / 明: daylight(昼の情景・日常) dusk(夕暮れ・郷愁) warm(人の営み・回想)。【重要】この動画は「夜の劇場」であり、9割は暗トーンで作る。明トーンは全体の1割程度、日常の情景や強い対比を作る場面だけに絞って使う。暗トーン内では dark-navy / charcoal / pitch-black を混ぜ、同じトーンを4シーン以上連続させないこと",
} as const;
