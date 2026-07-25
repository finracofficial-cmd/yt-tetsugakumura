/**
 * テーマ別カラーパレット。
 *
 * 参照チャンネル3本を解析した結果、**構造は全て共通で配色だけがテーマから決まる**
 * ことが判明した（docs/reference-style/映像スタイルガイド.md §1-2）。
 *   - 夜の街（港区女子）  : マゼンタ＋金
 *   - 自然・生態（菌類）  : 緑＋土茶＋琥珀
 *   - 記録・制度（学歴）  : 深紺＋緋色＋クリーム紙
 *
 * concept_color（シーン単位の明暗トーン）と直交する概念で、
 * こちらは**動画1本を通して固定**される。
 */

export type ThemePalette = {
  /** 空・最奥の背景グラデーション（上→下） */
  skyTop: string;
  skyBottom: string;
  /** 遠景シルエット（ビル群・山並み） */
  far: string;
  /** 中景シルエット */
  mid: string;
  /** 床・地面 */
  floor: string;
  /** 主役の光（強調データ・スポットライト・大きな数値） */
  accent: string;
  /** 主役の光の淡い側（グラデーション用） */
  accentSoft: string;
  /** 副アクセント（テーマ固有の色。夜=マゼンタ / 自然=緑 / 記録=緋色） */
  sub: string;
  /** 非強調データ（比較対象の棒など） */
  muted: string;
  /** 窓明かり・光点の色 */
  window: string;
};

export type ThemeName = "night-city" | "nature" | "archive";

export const THEMES: Record<ThemeName, ThemePalette> = {
  /** 夜の街・都市・欲望（港区女子タイプ） */
  "night-city": {
    skyTop: "#0a0d16",
    skyBottom: "#1d1424",
    far: "#141a2c",
    mid: "#0e1220",
    floor: "#0a0c14",
    accent: "#e8b563",
    accentSoft: "#ffd9a0",
    sub: "#e8558f",
    muted: "#4a6b8a",
    window: "#ffcf8a",
  },
  /** 森・生態・協力（菌類生態学タイプ） */
  nature: {
    skyTop: "#0a1016",
    skyBottom: "#12241c",
    far: "#16301f",
    mid: "#1b2a18",
    floor: "#2a1d10",
    accent: "#e8b563",
    accentSoft: "#ffe0aa",
    sub: "#5ea86a",
    muted: "#40606a",
    window: "#9fe0a0",
  },
  /** 記録・制度・選別（学歴タイプ） */
  archive: {
    skyTop: "#080b14",
    skyBottom: "#161320",
    far: "#121728",
    mid: "#0d1120",
    floor: "#0b0d16",
    accent: "#e8c07a",
    accentSoft: "#f0dcb0",
    sub: "#d9433f",
    muted: "#4a5a78",
    window: "#e8dfc8",
  },
};

/**
 * テーマ判定に使うキーワードと重み。
 *
 * 注意: このチャンネルのタイトルは「【生態学×進化心理学】」のように
 * 学問名を必ず併記するため、「進化」「生態」だけで自然テーマと判定すると
 * 都市や学歴の動画まで緑色になってしまう（実際に起きた）。
 * よって学問名は弱い手がかりとし、題材そのものを指す語を強くする。
 */
const THEME_KEYWORDS: { re: RegExp; theme: ThemeName; weight: number }[] = [
  // 自然: 題材が本当に自然物であることを示す語だけを強くする
  { re: /菌|きのこ|森|樹|林|土壌|根|苗|種子|植物|生物多様性|狼|オオカミ|鹿|river|川|海|山/, theme: "nature", weight: 3 },
  { re: /生態|自然|農|環境/, theme: "nature", weight: 1 },

  // 記録・制度
  { re: /学歴|受験|試験|資格|制度|官僚|政策|法律|裁判|統計|記録|文書|選別|階級|教育/, theme: "archive", weight: 3 },
  { re: /歴史|社会学|経済学/, theme: "archive", weight: 1 },

  // 夜の街・欲望
  { re: /港区|タワー|マンション|夜|街|都市|恋愛|結婚|婚活|消費|欲望|SNS|承認|ブランド|不動産|money|金/, theme: "night-city", weight: 3 },
  { re: /心理|人間関係|孤独/, theme: "night-city", weight: 1 },
];

/**
 * テーマ文字列（script.theme / title）からパレットを決める。
 * 各テーマのキーワード出現を重み付きで数え、最も点の高いものを採る。
 * 同点・無得点なら night-city（最も汎用的な夜の劇場）。
 */
export function resolveTheme(themeText: string, title = ""): ThemeName {
  const text = `${themeText} ${title}`;
  const score: Record<ThemeName, number> = { "night-city": 0, nature: 0, archive: 0 };
  for (const { re, theme, weight } of THEME_KEYWORDS) {
    const g = new RegExp(re.source, "g");
    const hits = text.match(g);
    if (hits) score[theme] += hits.length * weight;
  }
  let best: ThemeName = "night-city";
  for (const t of ["nature", "archive"] as ThemeName[]) {
    if (score[t] > score[best]) best = t;
  }
  return best;
}

export function getPalette(themeText: string, title = ""): ThemePalette {
  return THEMES[resolveTheme(themeText, title)];
}

/** パレットをCSS変数の形にする（SceneFrameのルートに流し込む） */
export function paletteVars(p: ThemePalette): Record<string, string> {
  return {
    "--sky-top": p.skyTop,
    "--sky-bottom": p.skyBottom,
    "--far": p.far,
    "--mid": p.mid,
    "--floor": p.floor,
    "--accent": p.accent,
    "--accent-soft": p.accentSoft,
    "--sub": p.sub,
    "--muted": p.muted,
    "--window": p.window,
  };
}
