# 変更履歴

Oroya Animateのすべての注目すべき変更はこのファイルに記録されます。

このフォーマットは[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)に基づいており、
このプロジェクトは[セマンティックバージョニング](https://semver.org/lang/ja/)に準拠しています。

## [0.8.0] - 2026-05-15

### 追加
- **シャドウシステム**: すべての `GeometryDef` バリアントに `castShadow` / `receiveShadow` フラグを追加。`DirectionalLightDef`、`PointLightDef`、`SpotLightDef` に `castShadow`、`shadowBias`、`shadowMapSize` を追加。Three.js バックエンドはデフォルトで `PCFSoftShadowMap` を有効化し、フラグをメッシュ、インスタンスメッシュ、ライトに適用します。
- **ポストプロセシングパイプライン**: 宣言的な `PostProcessing` コンポーネント（`bloom`、`toneMapping`（Reinhard / Cineon / ACESFilmic）、`exposure`、`antialiasing`（SMAA））。Three.js バックエンドは冪等な `EffectComposer` チェーン（RenderPass → UnrealBloomPass → SMAAPass → OutputPass）を組み立て、GPU リソースを再割り当てせずに `.enabled` でパスを切り替えます。
- **パーティクルシステム**: CPU シミュレーション型 `ParticleSystem` コンポーネント（最大数、発生率、重力、開始/終了色、開始/終了サイズ、オプションのテクスチャ）。Three.js バックエンドは頂点色と加算ブレンディングで `THREE.Points` としてレンダリングします。
- **空間音響**: `AudioListener` と `AudioSource` コンポーネントを `THREE.AudioListener` と `THREE.PositionalAudio` にマッピング。デコード済みバッファは URL ごとにキャッシュ。コーンと距離モデルによる減衰は透過的に渡されます。
- **EPIC**: [OA-006 — 高度なレンダリングとエフェクト](docs/features/OA-006/EPIC.md)。
- **テスト**: シャドウフラグ、パーティクルの発生/減衰/重力、`PostProcessing` 定義のシリアライズに対する Vitest カバレッジ。

### 変更
- `PostProcessingDef.fxaa`（未実装の boolean）を `antialiasing` に改名し、SMAA 実装で裏付け。
- `AudioSourceDef.url` を正式にドキュメント化（シーングラフをシリアライズ可能に保ち、各バックエンドが独自のローダー/キャッシュを再利用できるよう `buffer` ではなく `url` を選択）。
- `PostProcessing` をアクティブな **Camera ノード** に正式に紐付け。マルチカメラ構成（スプリットスクリーン、ピクチャー・イン・ピクチャー）で独立した FX チェーンを持てるように。

### 修正
- Three.js のポストプロセシング経路から `// @ts-ignore` と `any` を削除。`EffectComposer`、`RenderPass`、`UnrealBloomPass`、`SMAAPass`、`OutputPass`、`Pass` は `@types/three` で解決。`composer` は `EffectComposer | null` 型、`renderPostFX` は `PostProcessingDef` を受け取ります。

## [0.5.0] - 2026-02-17

### 追加
- **フルglTF/GLBローダー**: `@joroya/loader-gltf`経由でBlenderや他の3Dツールからジオメトリとマテリアルを含む3Dモデルをロードする完全サポート
- **Canvas2Dレンダラー**: 軽量2Dグラフィックス用の`@joroya/renderer-canvas2d`の新しいブラウザネイティブCanvas2Dレンダリングバックエンド
- **ブーリアン演算（CSG）**: `three-csg-ts`を使用した2D/3Dブーリアン演算（結合、減算、交差）の構成的立体幾何学サポート
- **3次スプライン補間**: キーフレーム間のスムーズな遷移のための高度なアニメーション補間
- **クォータニオンSLERP**: 回転のための適切な球面線形補間

### 改善
- **SVGバックエンド**: `@joroya/renderer-svg`での完全な変換サポートとグループ処理
- **アニメーションシステム**: プロフェッショナルグレードのアニメーションのための3次スプラインを含む改善された補間メソッド

### 変更
- すべてのパッケージで組織スコープを`@oroya`から`@joroya`に変更

## [0.4.0] - 2026-01-XX

### 追加
- **アニメーションシステム**: 線形/ステップ/cubicspline補間によるKeyframeTrack、AnimationClip、AnimationMixer
- **インタラクティビティシステム**: EventEmitter、Interactiveコンポーネント、InteractionEvent、BoundingBox（AABB）
- **レイキャスティング**: Three.jsレンダラーでの3Dポインターイベント（クリック、ホバー、ドラッグ）
- **DOMイベント委譲**: SVGレンダラーでの2Dインタラクティビティ
- **オービットコントロール**: カメラ操作用のOrbitControlsWrapper（軌道、パン、ズーム）
- **正投影カメラ**: すべてのレンダラーでのサポート
- **バッファジオメトリ**: AABB計算を含むテキストジオメトリサポート
- **SvJsジェネラティブアートエンジン**: ガウス、パレート、パーリンノイズの分布とジェネレーター
- **SVG高度機能**: グラデーション、フィルター、クリップパス、マスク、`<animate>` / `<animateTransform>`
- **ドキュメントウェブサイト**: Vercelにデプロイされたastro駆動サイト
- **i18nインフラストラクチャ**: 英語、スペイン語、日本語の翻訳サポート

## [0.3.0] - 2025-12-XX

### 修正
- ビルドパイプライン安定化: 4つのパッケージすべてが正常にコンパイル（CJS + ESM + DTS）
- 適切なファイル拡張子と`types`ファーストの条件順序による正しい`package.json`エクスポート
- tsup DTS互換性のためのTypeScript `composite: false`オーバーライド
- renderer-svgテンプレートリテラルの構文エラー

### 追加
- すべてのモジュールディレクトリのバレルファイル（`index.ts`）
- SVG固有のプロパティ（`fill`、`stroke`、`strokeWidth`）で拡張された`MaterialDef`
- `@joroya/loader-gltf`への不足していた`@types/three`依存関係
- [プログラミング原則](docs/programming-principles.md)ドキュメント
- [ビルドエラー事後分析](docs/troubleshooting/build-errors-postmortem.md)ドキュメント

### 削除
- パッケージ全体のデッドコードと未使用のインポート

## [0.2.0] - 2025-11-XX

### 追加
- 機能的なシーングラフAPI（行列数学を含む`Scene`、`Node`、`Transform`）
- コンポーネントシステム（`Geometry`、`Material`、`Camera`）
- ジオメトリプリミティブ: `createBox`、`createSphere`、`createPath2D`
- 動的シーンレンダリングを備えたThree.jsレンダラー
- シーングラフに統合されたカメラコンポーネント（パースペクティブ）
- `updateWorldMatrices()`によるワールド行列計算
- 動作するデモ: アニメーション回転キューブを含むバニラJSとReact
- すべてのパブリックAPIサーフェスのTSDoc
- `docs/`フォルダーの包括的なドキュメント

## [0.1.0] - 2025-10-XX

### 追加
- pnpmワークスペースによる初期モノレポセットアップ
- TypeScript + tsupビルドパイプライン
- 基本パッケージ: `@joroya/core`、`@joroya/renderer-three`、`@joroya/renderer-svg`、`@joroya/loader-gltf`
- 初期シーングラフインターフェースと基本クラス
- デモアプリ（バニラJS + React）

---

## パッケージリンク

### 公開パッケージ
- [@joroya/core](https://www.npmjs.com/package/@joroya/core) - コアシーングラフとコンポーネント
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three) - Three.js WebGLレンダラー
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg) - SVGレンダラー
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d) - Canvas2Dレンダラー（0.5.0の新機能）
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf) - glTF/GLBモデルローダー

### ドキュメント
- [メインドキュメント](https://oroya-animate.vercel.app)
- [GitHubリポジトリ](https://github.com/joshuacba08/oroya-animate)
