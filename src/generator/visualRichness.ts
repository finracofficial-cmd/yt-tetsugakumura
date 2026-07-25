/**
 * 画面構成（visual）の「図解・アニメ比率」を機械的に保証するモジュール。
 *
 * ユーザー要望: 図・表・ピクトグラムなどアニメーションが効くシーンを全体の7割以上に。
 * だが実際の生成では keyword（大きな文字だけ）が4割前後を占め、
 * 「文字だけのシーンが多い」状態になりがち。
 *
 * そこで生成後のシーン列に後処理を掛け、rich（figure/chart/line/units/table/
 * comparison/list）の比率が目標未満なら、text系（まず keyword、次に dialogue）を
 * figure（動くピクトグラム）へ変換して比率を底上げする。
 * 変換時は元のキーワード文を figure の label に残すので、意味は保たれたまま
 * 中央に動くピクトグラムが乗り、単調な「文字だけ」を解消する。
 *
 * ※ stat（研究データの数値）は情報価値が高いので変換しない。
 * ※ ユーザー手書きの完全台本（normalizeScript）には適用しない。
 */
import type { FigureKind, Scene, Visual } from "./types";

/** アニメが効く「図解」系の型 */
const RICH_TYPES = new Set<Visual["type"]>([
  "figure",
  "chart",
  "line",
  "units",
  "table",
  "comparison",
  "list",
  "columns",
  "balance",
  "donut",
  "pyramid",
]);

const isRich = (v: Visual): boolean => RICH_TYPES.has(v.type);

/** 目標: rich を全体の7割以上に */
const RICH_TARGET_RATIO = 0.7;

/**
 * キーワード文 → ピクトグラム種 の対応（部分一致・優先順）。
 * 上にあるものほど優先。ヒットしなければ抽象ピクトグラムのローテーションに回す。
 */
const KEYWORD_MAP: { re: RegExp; kind: FigureKind }[] = [
  { re: /通知|SNS|いいね|フォロ/, kind: "notification" },
  { re: /スマホ|携帯|端末/, kind: "smartphone" },
  { re: /画面|スクリーン|ディスプレイ/, kind: "screen" },
  { re: /カメラ|撮|写真/, kind: "camera" },
  { re: /つながり|ネットワーク|網|接続/, kind: "network" },
  { re: /反響|こだま|エコー|響/, kind: "echo" },
  { re: /金|カネ|価格|値段|富|資産|報酬|給料|円|コスト|費用/, kind: "money" },
  { re: /買|消費|ショッピング|購入/, kind: "shopping" },
  { re: /契約|署名|約束|制度化/, kind: "contract" },
  { re: /工場|生産|大量|効率/, kind: "factory" },
  { re: /都市|街|マンション|ビル|不動産|部屋/, kind: "city" },
  { re: /階級|序列|格差|ヒエラルキー|上下/, kind: "hierarchy" },
  { re: /階段|段|登|上り|昇/, kind: "stairs" },
  { re: /山|頂|高み|高さ/, kind: "mountain" },
  { re: /上昇|増加|伸び|成長|向上/, kind: "arrowUp" },
  { re: /下降|減少|低下|転落|落/, kind: "arrowDown" },
  { re: /天秤|比較|比べ|バランス|公平|不公平|釣り合/, kind: "scale" },
  { re: /裁|法|判決|正義|罰/, kind: "gavel" },
  { re: /王|君臨|支配|権力|頂点/, kind: "crown" },
  { re: /檻|閉じ込|囚|監獄/, kind: "cage" },
  { re: /鎖|縛|束縛|依存関係/, kind: "chains" },
  { re: /標的|目標|狙|ターゲット/, kind: "target" },
  { re: /勝|トロフィー|栄光|栄誉/, kind: "trophy" },
  { re: /表彰|壇上|登壇/, kind: "podium" },
  { re: /拍手|称賛|承認|評価され|認められ/, kind: "applause" },
  { re: /孤独|独り|ひとり|孤立|疎外/, kind: "isolation" },
  { re: /群れ|大衆|みんな|世間|他人|人々|集団|周囲/, kind: "crowd" },
  { re: /行列|並|順番|待/, kind: "queue" },
  { re: /対立|争|衝突|敵/, kind: "conflict" },
  { re: /責|非難|バッシング|叩/, kind: "blame" },
  { re: /傍観|見て見ぬ|無関心/, kind: "bystander" },
  { re: /指導|導|リーダー|先導/, kind: "leader" },
  { re: /握手|協力|和解|つなが/, kind: "handshake" },
  { re: /家族|親|子/, kind: "family" },
  { re: /夫婦|恋|二人|パートナー/, kind: "couple" },
  { re: /仮面|建前|演じ|偽|見せかけ|体裁|世間体/, kind: "mask" },
  { re: /脳|思考|考え|理性|認知/, kind: "brain" },
  { re: /心|感情|気持ち|情/, kind: "heart" },
  { re: /目|視線|まなざし|見られ|監視|観察/, kind: "eye" },
  { re: /不安|恐|怖|焦り|プレッシャー/, kind: "anxiety" },
  { re: /涙|悲|嘆|苦/, kind: "tears" },
  { re: /夢|理想|憧/, kind: "dream" },
  { re: /ひらめき|気づき|発見|アイデア|光明/, kind: "lightbulb" },
  { re: /依存|中毒|やめられ|沼/, kind: "addiction" },
  { re: /時間|時|瞬間|毎日|毎朝|日々/, kind: "clock" },
  { re: /砂時計|残り時間|寿命|期限/, kind: "hourglass" },
  { re: /命|死|終わり|消え|儚/, kind: "candle" },
  { re: /木|育|自然|根/, kind: "tree" },
  { re: /種|始まり|芽|起源/, kind: "seed" },
  { re: /道|人生|歩|進む/, kind: "path" },
  { re: /扉|ドア|入口|出口|選択肢/, kind: "door" },
  { re: /分岐|岐路|選択|どちら/, kind: "crossroad" },
  { re: /循環|繰り返|ループ|また|再び/, kind: "cycle" },
  { re: /遺伝|受け継|血筋|DNA/, kind: "dna" },
  { re: /原子|要素|最小|粒/, kind: "atom" },
  { re: /進化|適応|変化し続/, kind: "evolution" },
  { re: /村|田舎|故郷|集落/, kind: "village" },
  { re: /問|疑問|なぜ|だろうか|？|\?/, kind: "question" },
];

/** ヒットしなかったキーワードに割り当てる抽象ピクト（順に循環させる） */
const ABSTRACT_FALLBACK: FigureKind[] = [
  "question",
  "thought",
  "path",
  "cycle",
  "eye",
  "scale",
  "crossroad",
  "door",
  "echo",
  "mask",
  "brain",
  "hourglass",
];

/** キーワード文から最適なピクトグラム種を選ぶ（決定論的） */
function pickPictogram(keyword: string, fallbackSeq: number): FigureKind {
  for (const { re, kind } of KEYWORD_MAP) {
    if (re.test(keyword)) return kind;
  }
  return ABSTRACT_FALLBACK[fallbackSeq % ABSTRACT_FALLBACK.length];
}

/** keyword/dialogue シーンを figure（ピクトグラム＋元テキストのlabel）に変換する */
function toFigure(scene: Scene, fallbackSeq: number): Scene {
  const text =
    scene.visual.type === "keyword"
      ? scene.visual.keyword
      : scene.visual.type === "dialogue"
        ? scene.visual.line
        : "";
  const figure = pickPictogram(text, fallbackSeq);
  return { ...scene, visual: { type: "figure", figure, label: text } };
}

/**
 * rich（図解・アニメ）比率を目標(=0.7)以上へ引き上げる。
 * text系（keyword優先, 次にdialogue）を等間隔で figure に変換する。
 * stat は情報価値が高いので変換しない。
 */
export function enforceVisualRichness(scenes: Scene[]): Scene[] {
  const n = scenes.length;
  if (n < 4) return scenes;

  const target = Math.ceil(n * RICH_TARGET_RATIO);
  const richNow = scenes.filter((s) => isRich(s.visual)).length;
  let need = target - richNow;
  if (need <= 0) return scenes;

  // 変換候補: keyword を優先し、足りなければ dialogue も。等間隔で選ぶため index を保持。
  const keywordIdx = scenes.map((s, i) => (s.visual.type === "keyword" ? i : -1)).filter((i) => i >= 0);
  const dialogueIdx = scenes.map((s, i) => (s.visual.type === "dialogue" ? i : -1)).filter((i) => i >= 0);

  const chosen = new Set<number>();
  const takeSpread = (pool: number[], count: number) => {
    if (count <= 0 || pool.length === 0) return;
    const take = Math.min(count, pool.length);
    for (let k = 0; k < take; k++) {
      chosen.add(pool[Math.floor(((k + 0.5) / take) * pool.length)]);
    }
  };
  // まず keyword から等間隔で必要数を確保（余韻用に最低数シーンは keyword を残す）
  const keepKeyword = Math.min(keywordIdx.length, Math.max(0, Math.round(n * 0.08)));
  takeSpread(keywordIdx, Math.min(need, keywordIdx.length - keepKeyword));
  need -= chosen.size;
  if (need > 0) takeSpread(dialogueIdx, need);

  let seq = 0;
  return scenes.map((s, i) => (chosen.has(i) ? toFigure(s, seq++) : s));
}

/** デバッグ用: 画面構成の分布とrich比率 */
export function summarizeVisuals(scenes: Scene[]): string {
  const counts = new Map<string, number>();
  for (const s of scenes) counts.set(s.visual.type, (counts.get(s.visual.type) ?? 0) + 1);
  const richN = scenes.filter((s) => isRich(s.visual)).length;
  const pct = scenes.length ? Math.round((richN / scenes.length) * 100) : 0;
  const parts = [...counts.entries()].map(([t, c]) => `${t}:${c}`).join(", ");
  return `図解比率 ${richN}/${scenes.length} (${pct}%) — ${parts}`;
}
