import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { SceneFrame } from "./components/SceneFrame";
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
import type { AssetsManifest, Scene, SyncMap, Visual } from "../generator/types";
import scriptJson from "../data/script.json";
import syncMapJson from "../data/sync-map.json";
import assetsJson from "../data/assets.json";

const scenes = scriptJson.scenes as unknown as Scene[];
const syncMap = syncMapJson as SyncMap;
const assets = assetsJson as AssetsManifest;

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
          durationInFrames={durationInFrames}
        />
      );
    case "chart":
      return (
        <ChartContent
          title={visual.title}
          unit={visual.unit}
          items={visual.items}
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
    default:
      return null;
  }
};

/**
 * script.json（台本）と sync-map.json（音声実測の完全同期マップ）を読み込み、
 * シーンを <Sequence> でつなぎ合わせる。
 *
 * 音響は4レイヤー構成:
 *   L1 ナレーション（シーンごと, volume 1.0）
 *   L2 ミニマル・アンビエントBGM（イントロ/アウトロで 0.15、平常時 0.05）
 *   L3 質感環境ノイズ（全編ループ, volume 0.02 — 完全な無音を作らない)
 *   L4 シーン転換のSub Bass SFX（各シーン先頭, volume 0.12）
 */
export const MainComposition: React.FC = () => {
  const { fps, durationInFrames: totalFrames } = useVideoConfig();

  const lastScene = syncMap.scenes[syncMap.scenes.length - 1];
  const outroStartFrame = lastScene ? lastScene.startFrame : totalFrames - 5 * fps;
  const introEndFrame = 5 * fps;

  /** L2: イントロ/アウトロで浮き上がる動的ダッキング */
  const bgmVolume = (f: number): number =>
    interpolate(
      f,
      [
        0,
        introEndFrame,
        introEndFrame + fps,
        outroStartFrame,
        outroStartFrame + fps,
        totalFrames,
      ],
      [0.18, 0.18, 0.07, 0.07, 0.18, 0.18],
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

      {scenes.map((scene) => {
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
              <Audio src={staticFile(sync.audioFile)} volume={0.9} />
            ) : null}
            {/* L4: シーン転換のSub Bass SFX */}
            {assets.sfx ? (
              <Audio src={staticFile("assets/sfx-transition.mp3")} volume={0.12} />
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
