# yt-tetsugakumura

チャンネル**「余計な解剖学」**の、哲学×学術系解説アニメーション動画の完全自動生成パイプライン。
作風の参照元は YouTube チャンネル「考えすぎる葦」だが、**参照元であって本チャンネルではない**。
チャンネル名・結びの決まり文句は `src/channel.ts` が唯一の正で、参照元の固有表現を出力に混ぜないこと。
GitHub Actions の `workflow_dispatch` 1回で 台本 → TTS → Remotionレンダリング → 成果物 まで走る。

## ⚠️ 映像に手を入れる前に必ず読むもの

**`docs/reference-style/映像スタイルガイド.md`**

参照チャンネルの実物922コマを解析した決定版。**見た目に関する判断はすべてこの文書が根拠**であり、
記憶や印象で上書きしてはいけない。特に次の数値は実測値なので、推測で動かさないこと。

| 項目 | 実測値 | 実装 |
|---|---|---|
| 平均輝度 | 45 / 255 | — |
| 暗いコマ（輝度<40） | 63.2% | — |
| **明トーン比率** | **暗くない=6.7% / 明るい=2.7%** | `src/generator/styleMetrics.ts` の `BRIGHT_TARGET_RATIO = 0.1` |
| 色相 | 寒色58% / 暖色アクセント20% | `src/remotion/theme.ts` |
| 平均彩度 | 0.46 | — |

### 過去に間違えたこと（繰り返さない）

- ❌ **「背景が暗い」と指摘されて明トーンを38%まで上げた** → 実物は逆に暗い。
  暗さは正しく、足りないのは**情報密度・光の演出・奥行き**だった。明るくして解決してはいけない。
- ❌ ElevenLabs に全ひらがなの `reading` を渡した → 単語境界が壊れて片言になる。
  ElevenLabs/OpenAI には**漢字仮名交じりの自然文**をそのまま渡す（`speakTextFor()`）。
- ❌ 構造化出力のスキーマに判別共用体14種を渡した → `compiled grammar is too large` で全落ち。
  `visual` は**JSON文字列**として受け取り、検証は `sanitizeScenes.ts` のコード側で行う。

## 構成

```
src/generator/   台本生成・AI演出付け・TTS・BGM   （Node/tsx で実行）
src/remotion/    Remotion コンポーネント（実際の絵）
src/data/        生成物の受け渡し（script.json / sync-map.json / assets.json）
docs/reference-style/  参照チャンネルの解析結果とフレーム
```

パイプライン: `loadScript`(Gist) or `generateScript` → `directScript`(AI演出付け) →
`sanitizeScenes` → `enforceVisualRichness` → `enforceToneVariety` → `generateAudio` → `generateBgm` → Remotion

## コマンド

```
npm run typecheck    # tsc --noEmit（変更後は必ず通す）
npm run generate     # パイプライン全体（要APIキー）
npm run render       # Remotion レンダリング
npm run studio       # Remotion Studio でプレビュー
```

## 鉄則

- **APIキーは GitHub Secrets のみ。** 値を出力しない（診断は長さ・prefix・HTTPステータスまで）。
  読み込み時は `.replace(/\s+/g, "")` でサニタイズする。
- Actions の `GITHUB_TOKEN` を gist API に使わない。gist は `GIST_TOKEN`（ユーザーPAT）。
- ナレーション本文は AI演出付けで**一字一句変更しない**（`directScript` は narration を返さない）。
- `interpolate` の入力レンジは厳密な単調増加でないとクラッシュする。短い動画で壊れるので
  `safeInterpolate` を使う。
- 変更したら `npm run typecheck` を通す。
