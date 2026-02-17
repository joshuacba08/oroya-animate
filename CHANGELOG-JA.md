# 変更履歴

Oroya Animateのすべての注目すべき変更はこのファイルに記録されます。

このフォーマットは[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)に基づいており、
このプロジェクトは[セマンティックバージョニング](https://semver.org/lang/ja/)に準拠しています。

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
