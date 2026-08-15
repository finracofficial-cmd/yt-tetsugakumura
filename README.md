# yt-tetsugakumura — 哲学×学術 解説動画 自動生成パイプライン

チャンネル**「余計な解剖学」**の知的解説アニメーション動画（作風の参照元は「考えすぎる葦」）を、**テーマ選定 → 台本執筆 → 音声合成 → Remotionレンダリング** まで全自動で生成するシステムです。

GitHub Actions の `workflow_dispatch` を実行するだけで、完成した MP4 が Artifacts に出力されます。

## パイプラインの流れ

```
workflow_dispatch (topic: 任意)
        │
        ▼
 1. generateScript.ts   Claude API が「黄金の5幕構成」に従い台本を構造化JSONで生成
        │                → src/data/script.json
        ▼
 2. generateAudio.ts    OpenAI TTS がシーンごとに音声を合成し、実測秒数から尺を計算
        │                → public/audio/scene-*.mp3, src/data/timing.json
        ▼
 3. Remotion render     script.json + timing.json を読み込み <Sequence> を動的に配置
        │                → out/video.mp4 (1920x1080 / 30fps)
        ▼
 4. upload-artifact     MP4 と台本JSONを Artifacts に保存
```

## セットアップ

### 1. GitHub Secrets の登録

リポジトリの Settings → Secrets and variables → Actions に以下を登録してください。

| Secret | 用途 | 必須 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 台本生成（Claude API） | ✅ |
| `OPENAI_API_KEY` | 音声合成（OpenAI TTS） | 任意（未設定なら無音・推定尺で生成） |

### 2. 実行

Actions タブ → **Auto Generate Video** → Run workflow。
`topic` にテーマ（例: `承認欲求`）を入れるか、空欄のままにすると AI が現代の社会事象・心理的タブーからテーマを自動選定します。

完了後、Artifacts の `generated-video` から `video.mp4` をダウンロードできます。

## ローカルでの実行

```bash
npm install

# 台本 + 音声の生成（topic省略時はAI自動選定）
export ANTHROPIC_API_KEY=sk-ant-...
export OPENAI_API_KEY=sk-...        # 任意
npm run generate -- --topic="承認欲求"

# レンダリング
npm run render                       # → out/video.mp4

# Remotion Studio でプレビュー
npm run studio
```

## ディレクトリ構造

```
├── .github/workflows/auto-generate.yml   # 完全自動化パイプライン
├── src/
│   ├── pipeline.ts                       # 統合エントリポイント
│   ├── generator/
│   │   ├── prompts.ts                    # ★最重要: チャンネル解剖データを組み込んだシステムプロンプト
│   │   ├── generateScript.ts             # Step 1: Claude API による台本生成（構造化JSON）
│   │   ├── generateAudio.ts              # Step 2: TTS + 実測秒数によるフレーム計算
│   │   └── types.ts                      # 共有型定義
│   ├── remotion/
│   │   ├── index.ts / Root.tsx           # Remotion エントリ
│   │   ├── MainComposition.tsx           # Step 3: JSONからSequenceを動的配置
│   │   └── components/KeywordScene.tsx   # 明朝体キーワードが静かに浮かぶシーン
│   └── data/
│       ├── script.json                   # 生成された台本（サンプル同梱）
│       └── timing.json                   # 音声実測に基づく各シーンの尺
└── public/audio/                         # TTSで生成されたシーンごとの mp3
```

## 台本の品質を支える設計（`src/generator/prompts.ts`）

台本生成LLMには、チャンネルの成功法則を以下の観点で厳密に指示しています。

- **黄金の5幕構成**: 情景フック → 学術的解剖 → 構造の暴露 → 自己への反転 → シニカルな結び
- **ハルシネーション対策**: 引用は教科書レベルの実在する研究（ミルグラム実験、ダンバー数、プロスペクト理論など）に限定。不確かな数値は概念レベルの言及に留めるよう厳命
- **トーン&マナー**: 「だ・である」調、一人称「我々」、冷徹でシニカルな観察者、文学的比喩
- **構造化出力**: Claude API の structured outputs（JSON Schema強制）により、パースエラーのない `script.json` を保証
- **決まり文句**: 「そんなことを、余計に解剖してみました。よろしければ、チャンネル登録を。」で必ず締める

## 音響アセットの配置（任意・強く推奨）

`public/assets/` に以下の3ファイルを置いてコミットすると、4レイヤー音響（BGM・環境ノイズ・転換SFX）が自動で有効になります（ない場合は自動でスキップ）。OtoLogic や DOVA-SYNDROME 等の著作権フリー素材から「暗く、静かなもの」を選んでください。

| ファイル名 | 内容 | 音量 |
|---|---|---|
| `bgm.mp3` | メロディのないシンセドローン等のミニマル・アンビエント | 平常0.05 / イントロ・アウトロ0.15 |
| `ambient-noise.mp3` | レコードのクラックルノイズや薄い雨音のループ | 全編0.02（完全な無音を作らない） |
| `sfx-transition.mp3` | Sub Bass Swoosh等の短い転換音 | シーン切替時0.12 |

## 音声と映像の同期の仕組み

シーンごとに個別の mp3 を生成し、`music-metadata` で**実際の音声秒数を計測**して各シーンの `durationInFrames`（秒数 × 30fps + 余韻0.9秒）を算出します。各 mp3 はそのシーンの `<Sequence>` 内で再生されるため、音声と映像は構造的にズレません。
