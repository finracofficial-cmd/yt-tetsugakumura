/**
 * ピクトグラム・レジストリ。
 * FigureKind → 描画コンポーネントの対応表を一元管理する。
 * 台本AIはここにあるキーの中からナレーションに最も合うものを選ぶ。
 */
import type { FigureKind } from "../../../generator/types";
import type { Picto } from "./primitives";
import { peoplePictos } from "./people";
import { mindPictos } from "./mind";
import { societyPictos } from "./society";
import { timeNaturePictos } from "./timeNature";
import { techPictos } from "./tech";
import { abstractPictos } from "./abstract";

export const PICTOGRAMS: Record<FigureKind, Picto> = {
  ...peoplePictos,
  ...mindPictos,
  ...societyPictos,
  ...timeNaturePictos,
  ...techPictos,
  ...abstractPictos,
} as Record<FigureKind, Picto>;

/** レジストリに登録済みの全ピクトグラム種（台本スキーマ・プロンプトと同期させる） */
export const FIGURE_KINDS = Object.keys(PICTOGRAMS) as FigureKind[];

export type { Picto, PictoProps } from "./primitives";
