# Oroya JS 1.2 — 機能と受け入れ基準

目標バージョンは 1.2.0 です。ビルド成功は npm 公開や実機検証の完了を意味しません。

| 領域 | 保証 | 制限・検証 |
| --- | --- | --- |
| Core | 循環・重複 ID の防止、コンポーネントの所有者、必須 Transform、値をコピーする setter | 配列・Map の直接変更は検証メソッドを迂回します。Node、Stability、RuntimeRegression テスト |
| レンダラー | `advanceScene: false` は状態を再更新せず描画。公開 capabilities と診断 | Three.js は 3D/Buffer/CSG、Path2D/Text 非対応。SVG はベクトルと DOM イベント、GPU 効果非対応。Canvas2D は 2D・文字・path・gradient・opacity、picking/SVG filter 非対応。Parity と Lifecycle テスト |
| 保存・読込 | 従来 JSON と型付き配列、宣言データ、生成前の検証 | Script、InstancedMesh、未知コンポーネントにはアダプターが必要。外部 asset、callback、正確な再生時刻・物理状態は別管理。Roundtrip と Stability テスト |
| glTF/GLB | 階層、mesh buffer、PBR 数値、transform clip、skin | texture はアダプターが必要。morph target、複数 material、decoder 拡張の完全対応は約束しません。ローカル fixture と WebGL skinning テスト |
| Assets/Input/Physics/Inspector | 再試行・キャンセル・参照管理、gamepad action、body/constraint 解放、scene 交換・DOM cleanup | 物理 body はスケールのない root の直接の子。root の移動・回転は対応。gamepad は polling が必要。専用 Lifecycle テスト |
| React/Vue/Plugin | 1.2 から `@public`。commit 後の props、明示カメラ、resize、callback、cleanup | WebGL bindings。plugin は自分の資源を所有。React 18/19 StrictMode、Vue、実際のブラウザーで検証 |
| Editor | group/primitive、選択、階層、Euler 回転、material、W/E/R gizmo、複製・削除、undo/redo、Save/Load | デスクトップ基本編集。timeline、asset 梱包、複製時の animation 参照自動変更は対象外。EditorController とブラウザーテスト |

## フレームと診断

共有 scene は一度だけ更新し、他のビューでは `advanceScene: false` を指定します。`setPosition`、`setRotation`、`setScale` は値をコピーし dirty を設定します。直接書き込みには `updateLocalMatrix()` または `isDirty = true` が必要です。

カメラ投影は既定で維持されます。`autoAspect: true` または `adjustCameraToViewport: true` で resize 追従を有効化します。React/Vue の自動カメラは有効、`active: true` は明示カメラを優先します。Editor の操作用カメラは保存する scene camera と独立しています。

`validateSceneJSON(json)` は `{ valid, diagnostics }` を返します。`deserialize()` は不正入力で生成前に `SceneValidationError` を投げます。`{ onDiagnostic }` は code、severity、message、必要なら nodeId/path を通知します。未解決 bone と不完全 triangle は旧データ互換の警告、重複 ID や buffer 範囲外はエラーです。

Plugin は最後の登録を優先し、解除すると前の handler を復元します。更新 hook は scene 更新後、world matrix 同期前に実行し、更新無効時の delta はゼロです。object dispose は plugin dispose より先です。registry のキー登録だけでは core ComponentType を追加しません。

## 検証・公開

開発は Node 24 と pnpm 9.1.0、ライブラリーは Node 18/20 も対応。アプリ検証の前に `pnpm build` を実行します。CI は Windows/Linux、API audit と `pnpm api:compat` を含み、`pnpm verify:packages` は別プロジェクトで tarball の ESM/CJS と型を確認します。

`pnpm perf:record` で明示的に基準を保存し、`pnpm perf:check` は同じ機器・browser・Node・viewport・DPR で CPU/frame 中央値の 10% 超の退行を拒否します。1,000 node、10,000 instance、100 body、skin scene を測定します。転送量は開発用 harness の非圧縮 JavaScript で、公開サイトの gzip 量ではありません。

`pnpm test:endurance` は 100 回の mount と 30 分間のフレーム進行、一定の資源数、最終解放を確認します。`validation/` の JSON はコンパイル済み ESM の SHA-256 digest を記録し、古い証拠では公開できません。

Chromium、Firefox、WebKit と mobile profile は自動検証します。Safari/iOS と Chrome/Android 実機は `validation/physical-devices.json` に device、browserVersion、testedVersion、evidence、artifactDigest の記録が必要です。エミュレーションとは別の受け入れ条件です。

公開 workflow は最初に `1.2.0-rc.0` を `next` へ、全 tarball 検証後に公開します。`latest` には実機検証も必要です。IK、Vehicle、WASM hook は引き続き experimental です。
