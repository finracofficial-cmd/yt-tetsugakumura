import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";
import { PictogramGrid } from "./PictogramGrid";
import syncMap from "../data/sync-map.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={MainComposition}
        durationInFrames={syncMap.totalDurationInFrames}
        fps={syncMap.fps}
        width={1920}
        height={1080}
      />
      <Composition
        id="PictogramGrid"
        component={PictogramGrid}
        durationInFrames={120}
        fps={30}
        width={3080}
        height={3120}
      />
    </>
  );
};
