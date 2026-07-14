import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFrame } from "./components/SceneFrame";
import { KeywordContent } from "./components/contents/KeywordContent";
import { StatContent } from "./components/contents/StatContent";
import { ComparisonContent } from "./components/contents/ComparisonContent";
import { ListContent } from "./components/contents/ListContent";
import { DialogueContent } from "./components/contents/DialogueContent";
import { IllustrationContent } from "./components/contents/IllustrationContent";
import type { ImageManifest, Scene, Visual } from "../generator/types";
import scriptJson from "../data/script.json";
import imagesJson from "../data/images.json";
import timing from "../data/timing.json";

const scenes = scriptJson.scenes as unknown as Scene[];
const images = imagesJson as ImageManifest;

/** シーン型に応じたコンテンツを描画する */
const SceneContent: React.FC<{
  visual: Visual;
  sceneId: number;
  durationInFrames: number;
}> = ({ visual, sceneId, durationInFrames }) => {
  const imageFile = images[String(sceneId)] ?? null;

  switch (visual.type) {
    case "keyword":
      return <KeywordContent keyword={visual.keyword} durationInFrames={durationInFrames} />;
    case "illustration":
      return (
        <IllustrationContent
          imageFile={imageFile}
          sceneId={sceneId}
          durationInFrames={durationInFrames}
        />
      );
    case "dialogue":
      return (
        <DialogueContent
          line={visual.line}
          imageFile={imageFile}
          sceneId={sceneId}
          durationInFrames={durationInFrames}
        />
      );
    case "stat":
      return (
        <StatContent
          value={visual.value}
          label={visual.label}
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
 * script.json（台本）・images.json（生成イラスト）・timing.json（音声実測尺）を
 * 読み込み、シーン型ごとのコンテンツを <Sequence> でつなぎ合わせる。
 */
export const MainComposition: React.FC = () => {
  let from = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {scenes.map((scene) => {
        const sceneTiming = timing.scenes.find((t) => t.id === scene.id);
        const durationInFrames = sceneTiming?.durationInFrames ?? 150;
        const sequenceFrom = from;
        from += durationInFrames;

        const hasFullBleedImage =
          (scene.visual.type === "illustration" || scene.visual.type === "dialogue") &&
          Boolean(images[String(scene.id)]);

        return (
          <Sequence
            key={scene.id}
            from={sequenceFrom}
            durationInFrames={durationInFrames}
            name={`Act${scene.act} - ${scene.visual.type}`}
          >
            <SceneFrame
              sceneId={scene.id}
              conceptColor={scene.concept_color}
              narration={scene.narration}
              durationInFrames={durationInFrames}
              plainBackdrop={hasFullBleedImage}
            >
              <SceneContent
                visual={scene.visual}
                sceneId={scene.id}
                durationInFrames={durationInFrames}
              />
            </SceneFrame>
            {sceneTiming?.audioFile ? (
              <Audio src={staticFile(sceneTiming.audioFile)} />
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
