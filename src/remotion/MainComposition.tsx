import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneFrame } from "./components/SceneFrame";
import { KeywordContent } from "./components/contents/KeywordContent";
import { StatContent } from "./components/contents/StatContent";
import { ComparisonContent } from "./components/contents/ComparisonContent";
import { ListContent } from "./components/contents/ListContent";
import { DialogueContent } from "./components/contents/DialogueContent";
import type { Scene, Visual } from "../generator/types";
import scriptJson from "../data/script.json";
import timing from "../data/timing.json";

const scenes = scriptJson.scenes as unknown as Scene[];

/** シーン型に応じたコンテンツを描画する */
const SceneContent: React.FC<{ visual: Visual; durationInFrames: number }> = ({
  visual,
  durationInFrames,
}) => {
  switch (visual.type) {
    case "keyword":
      return <KeywordContent keyword={visual.keyword} durationInFrames={durationInFrames} />;
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
 * script.json（台本）と timing.json（TTS実測に基づく尺）を読み込み、
 * シーン型ごとのコンテンツを <Sequence> でつなぎ合わせるメインコンポジション。
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

        return (
          <Sequence
            key={scene.id}
            from={sequenceFrom}
            durationInFrames={durationInFrames}
            name={`Act${scene.act} - ${scene.visual.type}`}
          >
            <SceneFrame
              conceptColor={scene.concept_color}
              narration={scene.narration}
              durationInFrames={durationInFrames}
            >
              <SceneContent visual={scene.visual} durationInFrames={durationInFrames} />
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
