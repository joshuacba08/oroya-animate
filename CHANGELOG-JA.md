# 変更履歴

Oroya Animateのすべての注目すべき変更はこのファイルに記録されます。

このフォーマットは[Keep a Changelog](https://keepachangelog.com/ja/1.0.0/)に基づいており、
このプロジェクトは[セマンティックバージョニング](https://semver.org/lang/ja/)に準拠しています。

## [1.0.0] - 2026-05-16

> **最初のプロダクションリリース。** エンジン、開発エコシステム、コンテンツツーリングが揃いました。`@public` タグが付いた全ては [`docs/api-stability.md`](docs/api-stability.md) の安定性ポリシーに従います — 互換性のない変更にはメジャーバンプと 1 メジャー分の非推奨ウィンドウが必要です。

### 追加
- **プラグインシステム**（`@joroya/core/plugins`）: 新しい `PluginRegistry`、`Plugin`、`ComponentHandler`。`ThreeRenderer.usePlugin(plugin)` でビルトインブランチより優先するハンドラを登録。サードパーティーパッケージがレンダラーをフォークせずに拡張可能。プラグインハンドラは `create` / `update(dt)` / `dispose` フックを発火。7 個のユニットテスト。
- **API 安定性タグ**（`docs/api-stability.md`）: `@public`、`@experimental`、`@internal` の JSDoc 規約。`pnpm api:check` スクリプトで監査。v1.0 のサーフェスをタグ付け — `Scene`、`Node`、`ThreeRenderer`、`OrbitControlsWrapper`、`Inspector`、`FrameMetrics`、`InputManager`、`AssetManager`、`PhysicsSystem` は `@public`。`Vehicle`、`solve2BoneIK`、`PluginRegistry`、React/Vue バインディングは `@experimental`。
- **ビジュアルエディタ**（`apps/editor`、アルファ版）: React ベースのシーンエディタ。階層パネル、トランスフォームインスペクタ（位置 / 回転クォータニオン / スケールの軸ごとの数値入力）、v0.10.0 のシリアライズによる Save / Load。Hero キューブ / ボール / 床のスタータシーンが事前ロード。「Add Cube」と「Delete」ボタンで増分構築。
- **WASM アクセラレーションフック**（`@joroya/core/math/MathBackend`）: `getMathBackend()` / `registerMathBackend(backend)` レジストリ。デフォルトは純粋 JS。コンパニオンパッケージ（将来の `@joroya/wasm-math` など）がコンシューマコードを変更せず WASM 実装を差し込めるように。v1.0 では本番 WASM をシップしませんが、後でブレーキングチェンジを避けるためフックは整えてあります。3 個のユニットテスト。
- **InstancedMesh のシリアライズ仕様**を明示するテスト: `InstancedMesh` は意図的にデシリアライズされない（GPU ランタイム状態はアプリコードの所有）ことを文書化。一方、内部の `Float32Array` データは手動でシリアライズすれば v0.10 タイプドアレイ層を通って round-trip する。
- **EPIC**: [OA-011 — Production Ready (v1.0)](docs/features/OA-011/EPIC.md)。

### 変更
- すべてのワークスペースパッケージとルートが `0.12.0` から `1.0.0` へ。公開 API の形は v0.12.x から変わりません — バンプは安定性のシグナルであり、ブレイキングではありません。
- README ロードマップ: v1.0.0 行を Shipped に昇格。Post-1.0 アイテム（マルチボーン IK、ギズモ、フル Playwright E2E、本番 WASM）を将来作業として文書化。

### 安定性のコミットメント
- `docs/api-stability.md` にリストされた `@public` シンボルは、メジャーバンプと少なくとも 1 メジャー分の非推奨ウィンドウなしには形を変えません。
- `@experimental` シンボル（現在: `@joroya/react`、`@joroya/vue`、`Vehicle`、`solve2BoneIK`、`PluginRegistry`、math バックエンドフック）はマイナーリリースで進化する可能性があります。依存するならバージョンを固定してください。
- Pre-1.0 の CHANGELOG エントリ（v0.1.0 – v0.12.0）は歴史的記録として保持されます。これらの間のマイグレーションには非推奨ウィンドウがありませんでした。v1.0.0 以降はあります。

## [0.12.0] - 2026-05-16

### 追加
- **スキンドメッシュ / glTF スケルタルアニメーション**: 新しい `Skin` コンポーネントがボーン名と inverse bind matrices を保持。`BufferGeometryDef` に `skinIndices` と `skinWeights` を追加。`loadGLTF` がスキニング属性を抽出。`ThreeRenderer` は `THREE.SkinnedMesh` を構築し、ポストパスで `THREE.Skeleton` を解決（前方参照対応）。
- **2 ボーン解析的 IK**（`solve2BoneIK`）: 余弦定理による閉形式解、呼び出しあたり O(1)。任意のポールベクターで肘の平面を指定可能。6 個のテスト。
- **`Vehicle` ヘルパー**（`@joroya/physics`）: `CANNON.RaycastVehicle` のラッパー。`drive/steer/brake/syncWheelNodes` API。駆動・操舵ホイールの独立タグ付け。5 個のテスト。
- **`PhysicsSystem.getBody(node)`**: ボディの先行マテリアライズ。`Vehicle` がシャーシを次のステップを待たずにバインドするために使用。
- **EPIC**: [OA-010 — スキンドメッシュ、IK、車両](docs/features/OA-010/EPIC.md)。

### 変更
- レンダラーの `BufferGeometry` パスが、存在する場合に `skinIndex` + `skinWeight` 属性を配線するように。
- `ThreeRenderer.rebuildScene` がトラバース後にスキンバインディングを解決して、前方参照されたボーンでも正しく動作するように。

## [0.11.0] - 2026-05-15

### 追加
- **`@joroya/inspector`（新パッケージ）** — Oroya `Scene` 用のバニラ DOM デバッグオーバーレイ。クリック選択可能な階層、選択ノードの transform / コンポーネントビュー、ローリング FPS / フレーム時間 / 最悪ヒッチメトリクス、シーングラフ統計。フレームワーク非依存（React/Vue 依存なし）。
- **`@joroya/input`（新パッケージ）** — 統一されたキーボード / マウス / ゲームパッドレイヤーと宣言的アクションマッピング。`bindAction('jump', [{ key: 'Space' }, { gamepad: 'A' }])` で `action-down` / `action` / `action-up` イベント。Gamepad Standard マッピング + アナログ軸。ウィンドウブラー時に状態を自動クリア。
- **`@joroya/assets`（新パッケージ）** — 重複排除、ref カウント解放、進捗イベント付きの中央アセットキャッシュ。組み込みローダー（`image`、`audio` → `AudioBuffer`、`json`、`text`、`binary`）と `registerLoader` での拡張。`preload([...])` は項目ごとに `progress` / `loaded` / `error` を発火。
- **`@joroya/react`（新パッケージ、アルファ版）** — React バインディング。`<OroyaCanvas>` がシーン + レンダラー + RAF ループを所有し、`useFrame(dt)`、`useScene()`、`useParentNode()` フックを公開。JSX コンポーネント: `<Group>`、`<Box>`、`<Sphere>`、`<Plane>`、`<PerspectiveCamera>`、`<AmbientLight>`、`<DirectionalLight>`。
- **`@joroya/vue`（新パッケージ、アルファ版）** — Vue 3 コンポーザブル。`useOroyaCanvas(canvasRef)`、`useFrame((dt) => ...)`、`useNode((node) => setup)`。`shallowRef` を使用してリアクティビティがシーングラフに再帰しないように。
- **22 個の新規テスト** — 3 つのフレームワーク非依存パッケージで。
- **EPIC**: [OA-009 — エコシステム（Inspector、Input、Assets、Framework Wrappers）](docs/features/OA-009/EPIC.md)。

### 変更
- `pnpm lint` の glob が `.tsx` も含むように。
- README ロードマップ: v0.11.0 を「Planned」から「Shipped」へ。

## [0.10.0] - 2026-05-15

### 追加
- **TypedArray の完全シリアライズラウンドトリップ**: `Float32Array`、`Uint8Array`、`Uint16Array`、`Uint32Array` が base64 経由（glTF 互換フォーマット）で JSON を生き残ります。`AnimationClip`、`BufferGeometryDef`、`InstancedMesh` 行列の保存/読み込みが可能に — v1.0 ビジュアルエディタの前提条件。
- **すべての公開コンポーネントのデシリアライズ**: `RigidBody`、`Collider`、`Animator`、`PostProcessing`、`ParticleSystem`、`AudioListener`、`AudioSource`、`Environment`。9 個の新規ラウンドトリップテスト。
- **`Animator` のバックエンドパリティ**: `renderToSVG`、`renderToSVGElement`、`Canvas2DRenderer.render` がワールド行列パスの前に `Scene.update(dt)` を実行し、`options.dt`（デフォルト `1/60`）を受け取ります。Animator が 3 つのバックエンドすべてで動作。
- **フラット設定での ESLint**: `no-explicit-any`、`no @ts-ignore`、unused-vars。`pnpm lint` スクリプト + CI ゲート。
- **EPIC**: [OA-008 — シリアライゼーション、バックエンドパリティ、堅牢化](docs/features/OA-008/EPIC.md)。

### 変更
- `pnpm test` が `vitest run`（非ウォッチモード）を呼び出すように。`pnpm test:watch` で従来のインタラクティブモード。
- `apps/web/src/scenes/animation-demo.ts` を実際の `Animator` API（idle/walk/spin クリップ + `crossFadeTo` + `footstep` キーフレームイベント）で書き直し。
- `packages/core/src/components/index.ts` が完全なバレルに。
- README ロードマップを実態に同期。

### 修正
- **バグ: `deserialize` がルートレベルノードの半分を失っていた**。`forEach` 中の親の再割り当てがソース配列を変異させていた。スナップショット + for-loop に置換。
- `EventEmitter` の内部 Set で `any` を使用しないように。
- `loadGLTF.ts`、`InstancedMeshComponent.getMatrixAt`、`Gen.random` で `any` を排除。

## [0.9.0] - 2026-05-15

### 追加
- **物理パッケージ (`@joroya/physics`)**: 任意の `Scene` に対して `cannon-es` のワールドを駆動する `PhysicsSystem`。`@joroya/core` から `RigidBody` + `Collider` を読み取り、各ステップでワールド空間のトランスフォームを各ノードに同期します。
- **ジョイント / 制約**: `addHingeConstraint`、`addPointToPointConstraint`、`addDistanceConstraint`。ラグドール、振り子、ロープ、車輪などを可能にします。
- **衝突イベント**: `Node.events` に `collide-begin`、`collide`、`collide-end` を追加し、センサーコライダー用には `trigger-enter`、`trigger-stay`、`trigger-exit` を追加。ペイロードには相手ノード、接触点、法線、衝撃速度が含まれます。
- **センサー / トリガーコライダー**: `Collider.isTrigger` で接触応答なしの衝突イベントを発生させます。
- **衝突フィルタ**: `collisionGroup` と `collisionMask` ビットマスク。
- **物理レイキャスト**: `PhysicsSystem.raycast` と `raycastAll` が rigid body に対して `{ node, point, normal, distance }` を返します。
- **Animator コンポーネント（完全版）**: `play(name)`、`stop()`、`crossFade(name, duration)`、`addClip(clip)`、`autoplay` オプション。core のエンジン非依存 `AnimationMixer` 経由でノードトランスフォームを駆動します。
- **アニメーションブレンディング**: `AnimationMixer` が複数の同時クリップをクリップごとの重みとクロスフェード傾斜で対応。
- **キーフレームイベント**: `AnimationClip.events: KeyframeEvent[]` が再生ヘッドがイベント時刻を横切るときに名前付きイベントを発火。
- **`finished` イベント**: ループしないクリップが期間に達すると `finished` を発火。
- **イージング + スプリングヘルパー**: `linear`、`easeInQuad/easeOutQuad/easeInOutQuad`、立方・サイン系のバリエーション、`easeOutElastic`、臨界減衰可能な `spring(...)` 積分器。
- **`Scene.update(dt)` が毎フレーム実行**（`ThreeRenderer.render(dt)` 経由）。
- **テスト**: `Animator`、`Easing`、`PhysicsSystem`。
- **EPIC**: [OA-007 — 物理とアニメーション](docs/features/OA-007/EPIC.md)。

### 変更
- `ThreeRenderer.render(dt?: number)` が実際の `dt` を受け取れるように。ハードコードされた `0.016` を削除。
- `THREE.AnimationMixer` は実際の `SkinnedMesh` 子孫を持つノードでのみ作成。
- `Collider` に `isTrigger`、`collisionGroup`、`collisionMask` を追加。
- `Animator.definition.animations` の型を `Record<string, AnimationClip>` に（`any` を排除）。

### 削除
- `@joroya/physics` の rapier ベースの孤立コード（`PhysicsWorld.ts` と RigidBody/Collider の重複）。パッケージは単一バックエンド（`cannon-es`）に。

### 修正
- `@joroya/physics` を含むすべてのワークスペースパッケージで `pnpm typecheck` が成功するように。
- `packages/physics/tsconfig.json` が `tsconfig.base.json` を継承するように。

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
