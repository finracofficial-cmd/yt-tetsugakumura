import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { SceneFrame } from "./components/SceneFrame";
import { safeInterpolate } from "./safeInterpolate";
import { KeywordContent } from "./components/contents/KeywordContent";
import { StatContent } from "./components/contents/StatContent";
import { ComparisonContent } from "./components/contents/ComparisonContent";
import { ChartContent } from "./components/contents/ChartContent";
import { LineChartContent } from "./components/contents/LineChartContent";
import { UnitsContent } from "./components/contents/UnitsContent";
import { TableContent } from "./components/contents/TableContent";
import { ListContent } from "./components/contents/ListContent";
import { DialogueContent } from "./components/contents/DialogueContent";
import { FigureContent } from "./components/contents/FigureContent";
import { ColumnsContent } from "./components/contents/ColumnsContent";
import { BalanceContent } from "./components/contents/BalanceContent";
import { DonutContent } from "./components/contents/DonutContent";
import { PyramidContent } from "./components/contents/PyramidContent";
import { EndCard } from "./components/EndCard";
import { getPalette } from "./theme";
import type { AssetsManifest, Scene, SyncMap, Visual } from "../generator/types";
import scriptJson from "../data/script.json";
import syncMapJson from "../data/sync-map.json";
import assetsJson from "../data/assets.json";

const scenes = scriptJson.scenes as unknown as Scene[];
const syncMap = syncMapJson as SyncMap;
const assets = assetsJson as AssetsManifest;

/**
 * テーマ由来のカラーパレット（動画1本を通して固定）。
 * 参照チャンネルは構造は共通のまま、配色だけがテーマから決まる。
 */
const palette = getPalette(
  (scriptJson as { theme?: string }).theme ?? "",
  (scriptJson as { title?: string }).title ?? "",
);

/** エンドカードの長さ（フレーム）。最終シーンの後に続けて出す */
export const END_CARD_FRAMES = 5 * 30;

/**
 * 音量設計（あくまでナレーションが主役、BGMは「うっすら聞こえる」位置）。
 *
 * ナレーションは -18 LUFS 正規化 × NARRATION_VOLUME 0.9(-0.9dB) ≒ -19 LUFS。
 * BGMは generateBgm の loudnorm で -23 LUFS に統一されているので、
 *   実効 LUFS = -23 + 20*log10(volume)
 * 語りの下で邪魔にならず、それでも存在は分かる差は約20dB。
 *   BGM_BED  0.16 → -15.9dB → 約 -38.9 LUFS（ナレーション比 -20dB）
 *   BGM_LIFT 0.28 → -11.1dB → 約 -34.1 LUFS（ナレーションが無いイントロ/アウトロ用）
 */
const NARRATION_VOLUME = 0.9;
/** 本編中のBGM。ナレーションの約20dB下 */
const BGM_BED = 0.16;
/** イントロ/アウトロでBGMだけが鳴る区間 */
const BGM_LIFT = 0.28;

/** シーン型に応じたコンテンツを描画する */
const SceneContent: React.FC<{
  visual: Visual;
  sceneId: number;
  durationInFrames: number;
}> = ({ visual, sceneId, durationInFrames }) => {
  switch (visual.type) {
    case "keyword":
      return (
        <KeywordContent
          keyword={visual.keyword}
          sceneId={sceneId}
          durationInFrames={durationInFrames}
        />
      );
    case "figure":
      return (
        <FigureContent
          figure={visual.figure}
          label={visual.label}
          durationInFrames={durationInFrames}
        />
      );
    case "dialogue":
      return <DialogueContent line={visual.line} durationInFrames={durationInFrames} />;
    case "stat":
      return (
        <StatContent
          value={visual.value}
          label={visual.label}
          context={visual.context || undefined}
          unit={visual.unit || undefined}
          axis={visual.axis && visual.axis.ticks?.length ? visual.axis : undefined}
          durationInFrames={durationInFrames}
        />
      );
    case "chart":
      return (
        <ChartContent
          title={visual.title}
          unit={visual.unit}
          items={visual.items}
          subtitle={visual.subtitle}
          highlight={visual.highlight}
          annotation={visual.annotation}
          durationInFrames={durationInFrames}
        />
      );
    case "line":
      return (
        <LineChartContent
          title={visual.title}
          unit={visual.unit}
          points={visual.points}
          durationInFrames={durationInFrames}
        />
      );
    case "units":
      return (
        <UnitsContent
          total={visual.total}
          value={visual.value}
          label={visual.label}
          durationInFrames={durationInFrames}
        />
      );
    case "table":
      return (
        <TableContent
          title={visual.title}
          headers={visual.headers}
          rows={visual.rows}
          durationInFrames={durationInFrames}
        />
      );
    case "comparison":
      return (
        <ComparisonContent
          leftTitle={visual.left_title}
          rightTitle={visual.right_title}
          leftItems={visual.left_items}
          rightItems={visual.right_items}
          centerLabel={visual.center_label}
          durationInFrames={durationInFrames}
        />
      );
    case "list":
      return (
        <ListContent
          title={visual.title}
          items={visual.items}
          durationInFrames={durationInFrames}
        />
      );
    // 以下4型のタイトルは額縁側の見出しラベル（headingFor）が表示するため、
    // コンテンツ側には渡さない（二重表示の防止）。
    case "columns":
      return (
        <ColumnsContent
          left={visual.left}
          right={visual.right}
          note={visual.note || undefined}
          durationInFrames={durationInFrames}
        />
      );
    case "balance":
      return (
        <BalanceContent
          leftLabel={visual.left_label}
          rightLabel={visual.right_label}
          tilt={visual.tilt}
          note={visual.note || undefined}
          durationInFrames={durationInFrames}
        />
      );
    case "donut":
      return (
        <DonutContent
          percent={visual.percent}
          label={visual.label}
          restLabel={visual.rest_label || undefined}
          durationInFrames={durationInFrames}
        />
      );
    case "pyramid":
      return (
        <PyramidContent tiers={visual.tiers} durationInFrames={durationInFrames} />
      );
    default:
      return null;
  }
};

/** 幕番号 → 章タグの表示名 */
const ACT_NAMES: Record<number, string> = {
  1: "情景",
  2: "解剖",
  3: "構造",
  4: "反転",
  5: "結び",
};

/** そのシーンで章タグを出すか（幕が変わる最初のシーンだけ） */
function chapterTagFor(index: number): string | undefined {
  const scene = scenes[index];
  const prev = scenes[index - 1];
  if (prev && prev.act === scene.act) return undefined;
  return `Ch${scene.act}・${ACT_NAMES[scene.act] ?? ""}`;
}

/**
 * 上部中央の概念ラベル。図解系シーンのタイトルを額縁側に出して、
 * 参照チャンネルの「見出し＋主舞台」の2段構えを作る。
 */
function headingFor(visual: Visual): string | undefined {
  switch (visual.type) {
    case "columns":
    case "balance":
    case "donut":
    case "pyramid":
      return visual.title || undefined;
    case "comparison":
      return visual.center_label || undefined;
    default:
      return undefined;
  }
}

/**
 * script.json（台本）と sync-map.json（音声実測の完全同期マップ）を読み込み、
 * シーンを <Sequence> でつなぎ合わせる。
 *
 * 音響は4レイヤー構成:
 *   L1 ナレーション（シーンごと, volume 0.9 — 常に主役）
 *   L2 BGM（イントロ/アウトロで BGM_LIFT、本編は BGM_BED でうっすら）
 *   L3 質感環境ノイズ（全編ループ, volume 0.02 — 完全な無音を作らない)
 *   L4 シーン転換のSub Bass SFX（各シーン先頭, volume 0.12）
 */
export const MainComposition: React.FC = () => {
  const { fps, durationInFrames: totalFrames } = useVideoConfig();

  const lastScene = syncMap.scenes[syncMap.scenes.length - 1];
  const outroStartFrame = lastScene ? lastScene.startFrame : totalFrames - 5 * fps;
  const introEndFrame = 5 * fps;

  /**
   * L2: イントロ/アウトロで浮き上がる動的ダッキング。
   * 短い動画では outroStartFrame が introEndFrame+fps より手前に来て
   * 補間点が逆転しクラッシュするため、safeInterpolate で単調増加に補正する。
   */
  const bgmVolume = (f: number): number =>
    safeInterpolate(
      f,
      [
        0,
        introEndFrame,
        introEndFrame + fps,
        outroStartFrame,
        outroStartFrame + fps,
        totalFrames,
      ],
      [BGM_LIFT, BGM_LIFT, BGM_BED, BGM_BED, BGM_LIFT, BGM_LIFT],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {/* L2: ミニマル・アンビエントBGM */}
      {assets.bgm ? (
        <Audio loop src={staticFile("assets/bgm.mp3")} volume={bgmVolume} />
      ) : null}
      {/* L3: 質感環境ノイズ（Room Tone） */}
      {assets.noise ? (
        <Audio loop src={staticFile("assets/ambient-noise.mp3")} volume={0.02} />
      ) : null}

      {scenes.map((scene, index) => {
        const sync = syncMap.scenes.find((t) => t.id === scene.id);
        const durationInFrames = sync?.durationInFrames ?? 150;
        const from = sync?.startFrame ?? 0;

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
            name={`Act${scene.act} - ${scene.visual.type}`}
          >
            <SceneFrame
              sceneId={scene.id}
              conceptColor={scene.concept_color}
              narration={scene.narration}
              durationInFrames={durationInFrames}
              palette={palette}
              chapterTag={chapterTagFor(index)}
              headingLabel={headingFor(scene.visual)}
              segments={sync?.segments}
            >
              <SceneContent
                visual={scene.visual}
                sceneId={scene.id}
                durationInFrames={durationInFrames}
              />
            </SceneFrame>
            {/* L1: ナレーション（BGMと重ねても割れないよう少し下げる） */}
            {sync?.audioFile ? (
              <Audio src={staticFile(sync.audioFile)} volume={NARRATION_VOLUME} />
            ) : null}
            {/* L4: シーン転換のSub Bass SFX */}
            {assets.sfx ? (
              <Audio src={staticFile("assets/sfx-transition.mp3")} volume={0.12} />
            ) : null}
          </Sequence>
        );
      })}

      {/* エンドカード（参照チャンネル3本共通の意匠） */}
      <Sequence
        from={syncMap.totalDurationInFrames}
        durationInFrames={END_CARD_FRAMES}
        name="EndCard"
      >
        <EndCard channelName="考えすぎる葦" durationInFrames={END_CARD_FRAMES} />
      </Sequence>
    </AbsoluteFill>
  );
};
