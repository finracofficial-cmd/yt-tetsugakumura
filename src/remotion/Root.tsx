import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";
import timing from "../data/timing.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={MainComposition}
      durationInFrames={timing.totalDurationInFrames}
      fps={timing.fps}
      width={1920}
      height={1080}
    />
  );
};
