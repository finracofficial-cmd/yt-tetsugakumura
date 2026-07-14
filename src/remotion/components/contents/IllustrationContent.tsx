import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

type Props = {
  imageFile: string | null;
  sceneId: number;
  durationInFrames: number;
};

/**
 * 全画面イラスト（Ken Burns: ゆっくりとしたズーム＋パン）。
 * 画像がない場合は抽象的な光のフォールバック。
 */
export const IllustrationContent: React.FC<Props> = ({
  imageFile,
  sceneId,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const dir = sceneId % 2 === 0 ? 1 : -1;

  // ズームイン/アウトをシーンごとに交互に
  const zoomIn = sceneId % 3 !== 0;
  const scale = zoomIn
    ? interpolate(frame, [0, durationInFrames], [1.08, 1.22])
    : interpolate(frame, [0, durationInFrames], [1.22, 1.08]);
  const panX = interpolate(frame, [0, durationInFrames], [-24 * dir, 24 * dir]);
  const panY = interpolate(frame, [0, durationInFrames], [10 * dir, -10 * dir]);

  if (!imageFile) {
    // フォールバック: 地平線のような光の帯
    const glow = 0.5 + 0.2 * Math.sin(frame / 40);
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: "70%",
            height: 3,
            background: `linear-gradient(90deg, rgba(255,200,120,0) 0%, rgba(255,200,120,${glow}) 50%, rgba(255,200,120,0) 100%)`,
            boxShadow: "0 0 120px 30px rgba(255, 190, 110, 0.15)",
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(imageFile)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
        }}
      />
      {/* 下部の字幕可読性のためのグラデーション */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
