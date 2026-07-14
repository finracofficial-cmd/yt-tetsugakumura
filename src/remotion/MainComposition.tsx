import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { KeywordScene } from "./components/KeywordScene";
import script from "../data/script.json";
import timing from "../data/timing.json";

/**
 * script.json（台本）と timing.json（TTS実測に基づく尺）を読み込み、
 * シーンを <Sequence> でつなぎ合わせるメインコンポジション。
 *
 * 各シーンの音声はシーンごとの mp3 として public/audio/ に置かれ、
 * それぞれの Sequence 内で再生されるため、映像と音声は自動的に同期する。
 */
export const MainComposition: React.FC = () => {
  let from = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {script.scenes.map((scene) => {
        const sceneTiming = timing.scenes.find((t) => t.id === scene.id);
        const durationInFrames = sceneTiming?.durationInFrames ?? 150;
        const sequenceFrom = from;
        from += durationInFrames;

        return (
          <Sequence
            key={scene.id}
            from={sequenceFrom}
            durationInFrames={durationInFrames}
            name={`Act${scene.act} - ${scene.visual_keyword}`}
          >
            <KeywordScene
              keyword={scene.visual_keyword}
              narration={scene.narration}
              conceptColor={scene.concept_color}
              durationInFrames={durationInFrames}
            />
            {sceneTiming?.audioFile ? (
              <Audio src={staticFile(sceneTiming.audioFile)} />
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
