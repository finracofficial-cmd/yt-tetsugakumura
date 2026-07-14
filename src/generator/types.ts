/**
 * パイプライン全体で共有する型定義。
 * generateScript が script.json を、generateAudio が timing.json を書き出し、
 * Remotion 側は両方を import して動画を組み立てる。
 */

export type ConceptColor = "dark-navy" | "charcoal" | "pitch-black";

/** 黄金の5幕構成における幕番号 */
export type Act = 1 | 2 | 3 | 4 | 5;

/**
 * シーンの画面構成の型。台本AIがナレーション内容に応じて選択する。
 * - keyword:    抽象キーワードが中央に浮かぶ（思索・断定・余韻）
 * - dialogue:   人物シルエット＋吹き出し（情景描写・セリフ）
 * - stat:       大きな数字・統計値の提示（研究データの引用）
 * - comparison: 左右対比の図解（2つの概念・集団・環境の比較）
 * - list:       項目の列挙（要因・特徴・段階の整理）
 */
export type Visual =
  | { type: "keyword"; keyword: string }
  | { type: "dialogue"; line: string }
  | { type: "stat"; value: string; label: string }
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
  /** 読み上げるナレーション本文（だ・である調） */
  narration: string;
  /** 画面構成（シーン型と型ごとの表示データ） */
  visual: Visual;
  /** シーンの背景トーン */
  concept_color: ConceptColor;
}

export interface VideoScript {
  theme: string;
  title: string;
  scenes: Scene[];
}

export interface SceneTiming {
  id: number;
  /** このシーンの表示フレーム数（音声長 + 余白） */
  durationInFrames: number;
  /** public/ からの相対パス。TTSをスキップした場合は null */
  audioFile: string | null;
}

export interface Timing {
  fps: number;
  totalDurationInFrames: number;
  scenes: SceneTiming[];
}

export const FPS = 30;
export const SCRIPT_JSON_PATH = "src/data/script.json";
export const TIMING_JSON_PATH = "src/data/timing.json";
export const AUDIO_DIR = "public/audio";
