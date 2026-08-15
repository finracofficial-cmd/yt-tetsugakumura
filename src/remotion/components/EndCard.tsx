import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SERIF_FONT } from "./SceneFrame";
import { CHANNEL_AVATAR_GLYPH } from "../../channel";
import { CUBIC_OUT } from "../easing";
import { revealAt } from "../reveal";

type Props = {
  channelName: string;
  /** アイコンの円に入れる1文字 */
  avatarGlyph?: string;
  durationInFrames: number;
};

/**
 * エンドカード。参照チャンネル3本すべてで共通の意匠:
 *   クリーム色の紙質感 / "Thank you for watching!" / チャンネル名とアイコン /
 *   高評価・低評価・コメントのアイコン / SUBSCRIBEボタン / 動く手のカーソル
 * 手のカーソルが動いて高評価→コメント→SUBSCRIBE の順に触れていく。
 */
export const EndCard: React.FC<Props> = ({
  channelName,
  avatarGlyph = CHANNEL_AVATAR_GLYPH,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const paperIn = revealAt(frame, 0.02, durationInFrames, 18);
  const textIn = revealAt(frame, 0.1, durationInFrames);
  const iconsIn = revealAt(frame, 0.22, durationInFrames);
  const subIn = revealAt(frame, 0.34, durationInFrames);

  // 手のカーソル: 高評価 → コメント → SUBSCRIBE を巡回する
  const t = interpolate(frame, [durationInFrames * 0.4, durationInFrames], [0, 1], {
    easing: CUBIC_OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stops = [
    { x: 812, y: 596 },
    { x: 1108, y: 596 },
    { x: 960, y: 742 },
  ];
  const seg = Math.min(stops.length - 1, Math.floor(t * stops.length));
  const local = Math.min(1, (t * stops.length) % 1 || (t >= 1 ? 1 : 0));
  const from = stops[Math.max(0, seg - 1 < 0 ? 0 : seg)];
  const to = stops[Math.min(stops.length - 1, seg)];
  const handX = from.x + (to.x - from.x) * local;
  const handY = from.y + (to.y - from.y) * local;
  // 到達したところで小さく押し込む
  const press = local > 0.85 ? 1 - (local - 0.85) / 0.15 : 1;

  const Icon: React.FC<{ x: number; d: string; filled?: boolean }> = ({ x, d, filled }) => (
    <svg
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: x,
        top: 556,
        width: 74,
        height: 74,
        opacity: iconsIn,
      }}
    >
      <path
        d={d}
        fill={filled ? "#2c2a24" : "none"}
        stroke="#2c2a24"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <AbsoluteFill
      style={{
        // クリーム色の紙。わずかな縦縞で紙の繊維感を出す
        background:
          "repeating-linear-gradient(96deg, #ece2c9 0px, #e8dcc0 3px, #ece2c9 6px), #ece2c9",
        opacity: paperIn,
      }}
    >
      {/* 紙の四隅の陰影 */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(90,72,40,0.24) 100%)",
        }}
      />

      {/* チャンネル名 */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          opacity: textIn,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "2px solid #2c2a24",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SERIF_FONT,
            fontSize: 26,
            color: "#2c2a24",
          }}
        >
          {avatarGlyph}
        </div>
        <div
          style={{
            fontFamily: SERIF_FONT,
            fontSize: 34,
            color: "#2c2a24",
            letterSpacing: "0.08em",
          }}
        >
          {channelName}
        </div>
      </div>

      {/* Thank you for watching! */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textIn,
          fontFamily: SERIF_FONT,
          fontSize: 84,
          color: "#2c2a24",
          letterSpacing: "0.04em",
        }}
      >
        Thank you for watching!
      </div>

      {/* 高評価 / 低評価 / コメント */}
      <Icon x={782} d="M7 22V10l5-8 1 1v6h6l1 2-2 9-2 2H8z" />
      <Icon x={932} d="M17 2v12l-5 8-1-1v-6H5l-1-2 2-9 2-2h9z" />
      <Icon x={1082} d="M3 5h18v12H8l-5 4z" filled />

      {/* SUBSCRIBE */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 706,
          display: "flex",
          justifyContent: "center",
          opacity: subIn,
        }}
      >
        <div
          style={{
            padding: "18px 62px",
            borderRadius: 999,
            background: "#1c1a16",
            color: "#f2ead6",
            fontFamily: SERIF_FONT,
            fontSize: 38,
            letterSpacing: "0.14em",
          }}
        >
          SUBSCRIBE
        </div>
      </div>

      {/* 動く手のカーソル */}
      <svg
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: handX,
          top: handY,
          width: 96,
          height: 96,
          transform: `scale(${0.94 + press * 0.06})`,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.28))",
        }}
      >
        <path
          d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v1.5m0-.5a1.5 1.5 0 0 1 3 0V17a5 5 0 0 1-5 5h-3a6 6 0 0 1-6-6v-4a1.5 1.5 0 0 1 3 0"
          fill="#fdfaf2"
          stroke="#2c2a24"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </AbsoluteFill>
  );
};
