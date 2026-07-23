/**
 * パイプライン全体で共有する型定義。
 * generateScript が script.json を、generateAudio が timing.json を書き出し、
 * Remotion 側は両方を import して動画を組み立てる。
 */

export type ConceptColor =
  | "dark-navy"
  | "charcoal"
  | "pitch-black"
  | "daylight" // 明るい昼空。情景描写・日常・導入に
  | "dusk" // 夕暮れのグラデーション。郷愁・物語的な場面に
  | "warm"; // 暖色の薄明かり。人の営み・回想に

/** 黄金の5幕構成における幕番号 */
export type Act = 1 | 2 | 3 | 4 | 5;

/**
 * figure型で使えるピクトグラムの種類（全59種）。
 * 実体は src/remotion/components/pictograms/ に定義され、
 * index.tsx の PICTOGRAMS レジストリと必ず一致させること。
 */
export type FigureKind =
  // 人物・社会関係
  | "person"
  | "crowd"
  | "couple"
  | "family"
  | "handshake"
  | "conflict"
  | "isolation"
  | "hierarchy"
  | "queue"
  | "blame"
  | "applause"
  | "leader"
  | "bystander"
  // 心・感情・思考
  | "brain"
  | "heart"
  | "mask"
  | "eye"
  | "anxiety"
  | "lightbulb"
  | "addiction"
  | "thought"
  | "tears"
  | "dream"
  // 社会・経済・権力・構造
  | "money"
  | "city"
  | "factory"
  | "scale"
  | "gavel"
  | "stairs"
  | "cage"
  | "chains"
  | "target"
  | "trophy"
  | "podium"
  | "contract"
  | "shopping"
  | "crown"
  // 時間・生・自然
  | "clock"
  | "hourglass"
  | "candle"
  | "tree"
  | "seed"
  | "path"
  | "door"
  | "mountain"
  // テクノロジー・メディア
  | "smartphone"
  | "notification"
  | "screen"
  | "camera"
  | "network"
  | "echo"
  // 抽象・科学・概念
  | "dna"
  | "atom"
  | "evolution"
  | "arrowUp"
  | "arrowDown"
  | "cycle"
  | "crossroad"
  | "question"
  // 情景
  | "village";

/**
 * シーンの画面構成の型。台本AIがナレーション内容に応じて選択する。
 * - keyword:    抽象キーワードが中央に浮かぶ（思索・断定・余韻）
 * - figure:     動くフラットピクトグラム（人物・群衆・スマホ・脳・金・都市）
 * - dialogue:   人物シルエット＋吹き出し（誰かのセリフ・内心）
 * - stat:       大きな数字・統計値の提示（研究データの引用）
 * - chart:      棒グラフ（複数の数値の比較）
 * - line:       折れ線グラフ（推移・変化。最終点を強調）
 * - units:      ドットの集団（全体の中の割合・減少を人の単位で見せる）
 * - table:      表（行が順に現れる。段階・分類の整理）
 * - comparison: 左右対比の図解（2つの概念・集団・環境の比較）
 * - list:       項目の列挙（要因・特徴・段階の整理）
 */
export type Visual =
  | { type: "keyword"; keyword: string }
  | { type: "figure"; figure: FigureKind; label: string }
  | { type: "dialogue"; line: string }
  | { type: "stat"; value: string; label: string }
  | {
      type: "chart";
      title: string;
      unit: string;
      items: { label: string; value: number }[];
      /** 出典・調査名などの注記（タイトル下に小さく表示） */
      subtitle?: string;
      /** 強調する項目のindex（アンバー色+太字表示。省略時は強調なし） */
      highlight?: number;
      /** 下部の注釈ボックス（「46.4% ≒ 2人に1人」のような補足。省略可） */
      annotation?: string;
    }
  | {
      type: "line";
      title: string;
      unit: string;
      points: { label: string; value: number }[];
    }
  | { type: "units"; total: number; value: number; label: string }
  | {
      type: "table";
      title: string;
      headers: string[];
      rows: string[][];
    }
  | {
      type: "comparison";
      left_title: string;
      right_title: string;
      left_items: string[];
      right_items: string[];
      center_label: string;
    }
  | { type: "list"; title: string; items: string[] };

export interface Scene {
  /** 1始まりの連番 */
  id: number;
  /** このシーンが属する幕（1:情景フック 2:学術的解剖 3:構造の暴露 4:自己への反転 5:結び） */
  act: Act;
  /** 読み上げるナレーション本文（だ・である調）。字幕にはこちらを表示する */
  narration: string;
  /**
   * TTS読み上げ専用テキスト。誤読しやすい漢字・固有名詞・数字の読みを
   * ひらがなに開いたもの（句読点の位置は narration と完全に一致させる）
   */
  reading?: string;
  /** 画面構成（シーン型と型ごとの表示データ） */
  visual: Visual;
  /** シーンの背景トーン */
  concept_color: ConceptColor;
}

export interface VideoScript {
  theme: string;
  title: string;
  /** BGM生成用の音楽指示（英語）。テーマの情動に合わせて台本AIが書く */
  bgm_direction?: string;
  scenes: Scene[];
}

/** 字幕・演出の同期単位（文レベル）。フレームはシーン先頭からの相対値 */
export interface SyncSegment {
  text: string;
  startFrame: number;
  durationInFrames: number;
}

export interface SceneSync {
  id: number;
  /** 動画全体の中での開始位置 */
  startMs: number;
  startFrame: number;
  /** このシーンの長さ（音声 + 文法ポーズ + シーン末尾の余韻） */
  durationMs: number;
  durationInFrames: number;
  /** public/ からの相対パス。TTSをスキップした場合は null */
  audioFile: string | null;
  /** 文単位の字幕同期情報 */
  segments: SyncSegment[];
}

/** 音声実測に基づく完全同期マップ。Remotionはこれを唯一の尺の情報源とする */
export interface SyncMap {
  fps: number;
  totalDurationInFrames: number;
  scenes: SceneSync[];
}

/** BGM等の音響アセットの有無（public/assets/ を検査して生成される） */
export interface AssetsManifest {
  bgm: boolean;
  noise: boolean;
  sfx: boolean;
}

export const FPS = 30;
export const SCRIPT_JSON_PATH = "src/data/script.json";
export const SYNC_MAP_PATH = "src/data/sync-map.json";
export const ASSETS_JSON_PATH = "src/data/assets.json";
export const AUDIO_DIR = "public/audio";
export const ASSETS_DIR = "public/assets";
