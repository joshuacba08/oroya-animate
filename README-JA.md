# Oroya Animate 

<div align="center">

[![NPMバージョン](https://img.shields.io/npm/v/@joroya/core?style=flat-square&logo=npm&label=@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![ライセンス](https://img.shields.io/github/license/joshuacba08/oroya-animate?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![CIステータス](https://img.shields.io/github/actions/workflow/status/joshuacba08/oroya-animate/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/joshuacba08/oroya-animate/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9+-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

**[ドキュメント](https://oroya-animate.oroyajs.com)** • **[NPM](https://www.npmjs.com/org/joroya)** • **[CDN](https://unpkg.com/@joroya/core)** • **[GitHub](https://github.com/joshuacba08/oroya-animate)**

</div>

Web向けのプロフェッショナルで、エンジン非依存の2D/3Dグラフィックスライブラリ。TypeScriptで構築され、スケーラビリティとパフォーマンスのために設計されています。

## 🎯 ビジョン

Oroya Animateは、シーンロジックをレンダリング実装から分離する高レベルグラフィックスライブラリです。開発者は複雑なシーングラフを一度定義し、Three.js（WebGL）、SVG、Canvas2Dなどの異なるバックエンドを使用してレンダリングできます。

## 🎯 主な機能

- **🦺 TypeScriptファースト:** 堅牢な開発体験のための完全型付きAPI。
- **🧩 モジュラーアーキテクチャ:** 明確な関心の分離のためのモノレポ構造。
- **🔌 エンジン非依存:** シーンを一度定義し、どこでもレンダリング。
- **🎨 複数のバックエンド:** Three.js（3D）、SVG（2D）、Canvas2Dの公式サポート。
- **📦 glTF/GLBサポート:** 複雑な3Dモデルを非依存シーングラフに直接ロード。
- **🎥 シーングラフカメラ:** シーングラフノードとしてのパースペクティブおよび正投影カメラ。
- **🎬 アニメーションシステム:** `AnimationMixer`と補間によるキーフレームベースのアニメーション。
- **🖱️ インタラクティビティ:** レイキャスティング（3D）とDOMイベント（SVG）を備えた組み込みイベントシステム。
- **🌐 オービットコントロール:** 3Dシーン用のマウス/タッチカメラコントロール。
- **🎨 ジェネラティブアート:** ノイズ、分布、SVGプリミティブを備えたSvJsエンジン。
- **⚛️ フレームワーク対応:** React と Vue 向けのアルファ版ラッパー。
- **🧰 開発ツール:** Inspector、Input Manager、Asset Manager、プラグイン、参照用ビジュアルエディタ。

## 📦 プロジェクト構造

このプロジェクトは`pnpm`ワークスペースを使用してモノレポとして管理されています：

### パッケージ
- [`@joroya/core`](packages/core): ライブラリの中核。シーングラフ、ノードシステム、基本コンポーネントを含む。
- [`@joroya/renderer-three`](packages/renderer-three): Three.jsによるWebGLレンダリングバックエンド。
- [`@joroya/renderer-svg`](packages/renderer-svg): SVG用の軽量2Dレンダリングバックエンド。
- [`@joroya/renderer-canvas2d`](packages/renderer-canvas2d): ブラウザネイティブのCanvas2Dレンダリングバックエンド。
- [`@joroya/loader-gltf`](packages/loader-gltf): Oroyaエコシステムへの3Dモデルインポート用ユーティリティ。
- [`@joroya/physics`](packages/physics): cannon-es による剛体、ジョイント、センサー、レイキャスト、車両サポート。
- [`@joroya/assets`](packages/assets): プリロード、進捗イベント、参照カウント付きのアセットキャッシュ。
- [`@joroya/input`](packages/input): キーボード、マウス、ゲームパッドのアクションマッピング。
- [`@joroya/inspector`](packages/inspector): 階層、Transform、フレームメトリクス用デバッグオーバーレイ。
- [`@joroya/react`](packages/react): 実験的な React bindings。
- [`@joroya/vue`](packages/vue): 実験的な Vue 3 composables。

### アプリケーション
- [`demo-react`](apps/demo-react): OroyaAnimateとReact、Three.jsの連携デモ。
- [`demo-vanilla`](apps/demo-vanilla): バニラJavaScriptを使用した最小限の例。
- [`web`](apps/web): Astroによるドキュメントウェブサイト（Vercelにデプロイ）。
- [`editor`](apps/editor): アルファ版ビジュアルシーンエディタとシリアライズ参照アプリ。

## 📚 ドキュメント

詳細なドキュメントは[`docs/`](docs/)フォルダーとウェブサイトで利用できます：

### コアドキュメント
- [**アーキテクチャ概要**](docs/architecture.md): エンジン非依存設計の中核を学ぶ。
- [**はじめに**](docs/getting-started.md): 5分で最初のシーンを作成。
- [**シーングラフと変換**](docs/scene-graph.md): ノードとコンポーネントの詳細解説。
- [**APIリファレンス**](docs/api-reference.md): クラス、インターフェース、関数の完全リファレンス。
- [**レンダラー**](docs/renderers.md): Three.js、SVG、Canvas2Dバックエンドのドキュメント。
- [**シリアライゼーション**](docs/serialization.md): シーンをJSONとして保存・読み込み。

### デプロイと公開
- [**NPM公開**](docs/deployment/npm-publishing.md): NPMレジストリへのパッケージ公開。
- [**CDNセットアップ**](docs/deployment/cdn-setup.md): CDNから直接パッケージを使用。
- [**Vercelデプロイ**](docs/deployment/vercel-deployment.md): ドキュメントウェブサイトのデプロイ。

### 開発
- [**コントリビューションと開発**](docs/contributing.md): セットアップ、スクリプト、開発ワークフロー。
- [**プログラミング原則**](docs/programming-principles.md): コーディング規約とアーキテクチャルール。

### チュートリアル
- [**チュートリアル**](docs/tutorials/README.md): 初心者から上級者までのステップバイステップガイド。

## 🚀 はじめに

### インストール

#### NPM/PNPM（推奨）

```bash
npm install @joroya/core @joroya/renderer-three
# または
pnpm add @joroya/core @joroya/renderer-three
# または
yarn add @joroya/core @joroya/renderer-three
```

#### CDN（インストール不要）

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@1.0.0/dist/index.js';
  import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@1.0.0/dist/index.js';
  // あなたのコードをここに...
</script>
```

### 基本的な使い方

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

// 1. シーンを作成
const scene = new Scene();

// 2. カメラを追加
const cameraNode = new Node('main-camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

// 3. ジオメトリとマテリアルでノードを作成
const box = new Node('my-box');
box.addComponent(createBox(1, 1, 1));
box.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
scene.add(box);

// 4. Three.jsでレンダリング
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);
renderer.render();
```

## 🗺️ ロードマップ

### v0.1.0 — アーキテクチャとセットアップ ✅
- [x] pnpmワークスペースを使用したモノレポ。
- [x] TypeScript + tsupビルドパイプライン。
- [x] 基本パッケージ: `@joroya/core`、`@joroya/renderer-three`、`@joroya/renderer-svg`、`@joroya/loader-gltf`。
- [x] 初期シーングラフインターフェースと基本クラス。
- [x] デモアプリ（バニラJS + React）。

### v0.2.0 — 最初の機能リリース ✅
- [x] 機能的なシーングラフAPI（`Scene`、`Node`、行列数学を含む`Transform`）。
- [x] コンポーネントシステム（`Geometry`、`Material`、`Camera`）。
- [x] ジオメトリプリミティブ: `createBox`、`createSphere`、`createPath2D`。
- [x] Three.jsレンダラー: 動的シーンレンダリング、Box + Sphereサポート。
- [x] シーングラフに統合されたカメラコンポーネント（パースペクティブ）。
- [x] `updateWorldMatrices()`によるワールド行列計算。
- [x] 動作するデモ: バニラJSとアニメーション回転キューブを含むReact。
- [x] すべてのパブリックAPIサーフェスのTSDoc。
- [x] 包括的なドキュメント（[`docs/`](docs/)参照）。

### v0.3.0 — ビルド安定化とプロジェクト強化 ✅
- [x] 修正されたビルドパイプライン: 4つのパッケージすべてが正常にコンパイル（CJS + ESM + DTS）。
- [x] 正しい`package.json`エクスポート（ファイル拡張子、`types`ファーストの条件順序）。
- [x] tsup DTS互換性のためのTypeScript `composite: false`オーバーライド。
- [x] すべてのモジュールディレクトリのバレルファイル（`index.ts`）。
- [x] SVG固有のプロパティ（`fill`、`stroke`、`strokeWidth`）で拡張された`MaterialDef`。
- [x] `@joroya/loader-gltf`に不足していた`@types/three`を追加。
- [x] デッドコードの削除（未使用のインポート）。
- [x] renderer-svgテンプレートリテラルの構文エラーを修正。

### v0.4.0 — インタラクティビティ、アニメーション、ジェネラティブアート ✅
- [x] **アニメーションシステム**: `AnimationClip`、`AnimationMixer`、線形/ステップ/cubicspline補間を含む`KeyframeTrack`。
- [x] **インタラクティビティシステム**: `EventEmitter`、`Interactive`コンポーネント、`InteractionEvent`、`BoundingBox`（AABB）。
- [x] Three.jsレンダラーでの3Dポインターイベント用**レイキャスティング**（クリック、ホバー、ドラッグ）。
- [x] SVGレンダラーでの2Dインタラクティビティ用**DOMイベント委譲**。
- [x] **オービットコントロール**: カメラ操作用の`OrbitControlsWrapper`（軌道、パン、ズーム）。
- [x] レンダラーでの**正投影カメラ**サポート。
- [x] **バッファジオメトリ**とAABB計算を含む**テキストジオメトリ**サポート。
- [x] **SvJsジェネラティブアートエンジン**: `SvJs`クラス、`Gen`モジュール（ガウス、パレート、ノイズ）、`Noise`（パーリン）。
- [x] **SVG高度機能**: グラデーション、フィルター、クリップパス、マスク、`<animate>` / `<animateTransform>`。
- [x] **ドキュメントウェブサイト**（`apps/web`）AstroでVercelにデプロイ。
- [x] **i18nインフラストラクチャ**: 英語、スペイン語、日本語の翻訳サポート。

### v0.5.0 — レンダラー完成と3Dパイプライン ✅
- [x] **フルglTF/GLBローダー**（Blenderからのジオメトリ+マテリアル）。
- [x] **完全なSVGバックエンド**（変換サポート、グループ）。
- [x] **Canvas2Dレンダラー**ブラウザネイティブ。
- [x] **2D/3Dブーリアン演算（CSG）**構成的立体幾何学モデリング用。
- [x] **3次スプライン補間**スムーズなアニメーション用。
- [x] **適切なクォータニオンSLERP**補間回転用。

### v1.0.0 — プロダクション対応 ✅
- [x] `@public`、`@experimental`、`@internal` による API 安定性ポリシー。
- [x] `PluginRegistry` / `ComponentHandler` と `ThreeRenderer.usePlugin(plugin)` によるプラグインシステム。
- [x] `apps/editor` アルファ版: 階層パネル、Transform Inspector、安定した v1.0 シリアライズでの Save / Load。
- [x] `@joroya/physics`: cannon-es ベースの剛体、ジョイント、センサー、レイキャスト、車両。
- [x] 開発エコシステム: `@joroya/inspector`、`@joroya/input`、`@joroya/assets`、`@joroya/react`、`@joroya/vue`。
- [x] 将来の高速 math パッケージ向け WASM hook (`registerMathBackend`)。

## 🚀 公開とデプロイ

### NPMパッケージ

すべてのパッケージは`@joroya`スコープでNPMに公開されています：
- [@joroya/core](https://www.npmjs.com/package/@joroya/core)
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three)
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg)
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d)
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf)
- [@joroya/physics](https://www.npmjs.com/package/@joroya/physics)
- [@joroya/assets](https://www.npmjs.com/package/@joroya/assets)
- [@joroya/input](https://www.npmjs.com/package/@joroya/input)
- [@joroya/inspector](https://www.npmjs.com/package/@joroya/inspector)
- [@joroya/react](https://www.npmjs.com/package/@joroya/react)
- [@joroya/vue](https://www.npmjs.com/package/@joroya/vue)

### CDN利用可能

すべてのパッケージは複数のCDNで自動的に利用可能です：
- **unpkg:** `https://unpkg.com/@joroya/core`
- **jsDelivr:** `https://cdn.jsdelivr.net/npm/@joroya/core`
- **esm.sh:** `https://esm.sh/@joroya/core`

### ドキュメントウェブサイト

利用可能: **https://oroya-animate.oroyajs.com**（Vercel経由でデプロイ）

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細については[コントリビューションガイド](docs/contributing.md)をお読みください：
- 開発セットアップ
- コード規約
- プルリクエストプロセス
- 問題報告

## 📄 ライセンス

MIT © [joshuacba08](https://github.com/joshuacba08)

---

<div align="center">

**Oroya AIコラボレーターによって❤️で作成**

[バグ報告](https://github.com/joshuacba08/oroya-animate/issues) · [機能リクエスト](https://github.com/joshuacba08/oroya-animate/issues) · [ディスカッション](https://github.com/joshuacba08/oroya-animate/discussions)

</div>
