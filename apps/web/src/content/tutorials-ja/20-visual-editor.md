---
title: "ビジュアルエディタ（アルファ版）"
description: "apps/editor のツアー — v1.0 に同梱の React ベースのシーン作成ツール。"
order: 20
level: "beginner"
duration: "10 min"
---

# チュートリアル 20: ビジュアルエディタ（アルファ版）

> **レベル:** 初級
> **時間:** 10 分
> **学ぶこと:** `apps/editor` が何をするか、v0.10 のシリアライズレイヤーをどう使うか、自分のワークフロー用にどう拡張するか。

> **ステータス:** アルファ版。レイアウトと機能セットは 1.x で進化します。書き込むファイル形式（`serialize()` 経由の `.json`）は `@public` で 1.x シリーズ全体で安定。

---

## ローカル実行

```bash
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate
pnpm install
pnpm build
pnpm --filter editor dev   # http://localhost:5173
```

スターターシーンがロード: hero 立方体、球、ライト付き地面、パースペクティブカメラ。

---

## 3 つのパネル

| 領域 | 目的 |
|---|---|
| **左** — 階層 | シーンツリー内の全ノードのリスト。クリックで選択。 |
| **中央** — キャンバス | ライブな `ThreeRenderer` ビュー。 |
| **右** — インスペクタ | 選択ノードの編集可能 transform（位置 / 回転クォータニオン / スケール）+ 読み取り専用のコンポーネントリスト。 |

ツールバー: **+ Cube**（ランダム色の立方体をスポーン）、**Save**（`scene.json` ダウンロード）、**Load**（ファイルピッカー → `deserialize()` → マウント）、**Delete**。

---

## 構造

1. **`OroyaCanvas`** は使われていません — エディタは 3 ペイン グリッドが完全な制御を望むため `ThreeRenderer` を直接マウント。
2. **シーン変更は `revision` カウンタをバンプ** して React の再レンダリングを強制。
3. **Save / Load は `serialize()` / `deserialize()`** — v0.10 レイヤーが `Float32Array` を base64 経由で処理。
4. **Transform 編集**は `node.transform` に直接書き込み、`updateLocalMatrix()` を呼ぶ。

ソースは [`apps/editor/src/`](https://github.com/joshuacba08/oroya-animate/tree/main/apps/editor/src)。

---

## まだできないこと

- **ギズモ**: 3D 移動/回転/スケールハンドルなし。数値入力のみ。
- **Euler 回転**: 生のクォータニオンのみ。
- **Undo/redo**: なし。頻繁に保存してください。
- **マテリアルエディタ**: カラーピッカーなし。

すべて v1.0 後のアイテム。

---

## 自分のプロジェクト用に拡張

エディタは通常の Vite + React アプリ（`apps/editor/`）なので、フォーク可能:

- カスタムコンポーネント用のパネルを追加。
- ファイル形式をバックエンドに接続（ブラウザダウンロードの代わりに S3）。
- `Inspector` パッケージの上にプラグイン対応の可視化を追加。

コアエディタは npm パッケージとしてシップされません — リファレンスアプリです。

---

## Save / Load の正式コントラクト

エディタが生成する JSON は任意のコードパスから `serialize(scene)` が生成するのと同じ形式。プロパティ:

- **安定**: 1.x シリーズで形は変わりません。
- **エンジン非依存**: Three.js への参照なし。ここで保存したシーンは SVG / Canvas2D レンダラーでもロードされます。
- **ランタイム専用をスキップ**: `InstancedMesh` GPU 状態と `Script` クロージャは意図的にデシリアライズされません。

---

## 次のステップ

- **本番ビルド**: `pnpm --filter editor build` で `apps/editor/dist/` に静的バンドルを生成。
- **Inspector オーバーレイと組み合わせる**: エディタの階層パネルはカスタム React コンポーネント、スタンドアロンの `@joroya/inspector` は DOM オーバーレイ。両者は `collectSceneStats` / `FrameMetrics` を共有。
- **スターターとして glTF をロード**: `buildStarterScene()` に `loadGLTF()` を投入。
