---
title: "開発者ツール: Inspector、Input、Assets"
description: "デバッグオーバーレイ、アクション マッピング入力、プログレスイベント付きアセットキャッシュ — デモをアプリに変える 3 つのパッケージ。"
order: 19
level: "intermediate"
duration: "25 min"
---

# チュートリアル 19: 開発者ツール — Inspector、Input、Assets

> **レベル:** 中級
> **時間:** 25 分
> **学ぶこと:** デバッグオーバーレイを取り付ける方法、キーボード / ゲームパッド入力を論理的アクションにマップする方法、プログレスイベント付きでアセットをプリロードする方法。

---

## `@joroya/inspector` — デバッグオーバーレイ

```bash
npm install @joroya/inspector @joroya/core
```

```ts
import { Inspector } from "@joroya/inspector";

const inspector = new Inspector(scene, { position: "top-right" });
inspector.attach();

function frame(now: number) {
    const dt = computeDt(now);
    inspector.update(dt);
    renderer.render(dt);
}
```

階層内の行をクリックしてノードを選択。下のパネルが transform 値と取り付けられたコンポーネントを表示。

DOM なしのメトリクスには `FrameMetrics`（ローリング FPS / avg / max-hitch）と `collectSceneStats(scene)` もエクスポート。

---

## `@joroya/input` — アクションマッピング入力

```bash
npm install @joroya/input @joroya/core
```

```ts
import { InputManager } from "@joroya/input";

const input = new InputManager();
input.attach();

input.bindAction("jump",         [{ key: "Space" },   { gamepad: "A" }]);
input.bindAction("move-forward", [{ key: "KeyW" },    { key: "ArrowUp" }]);
input.bindAction("fire",         [{ mouseButton: 0 }, { gamepad: "RT" }]);
```

### 3 つのイベントタイプ

```ts
input.on("action-down", (e) => { /* 非アクティブ → アクティブの遷移 */ });
input.on("action",      (e) => { /* ホールド中の連続 */ });
input.on("action-up",   (e) => { /* リリース時 */ });
```

### フレームごとのポール（ゲームパッドに必須）

```ts
function frame(dt) {
    input.update(dt);   // ゲームパッドを再ポール、ホールド中のアクションに `action` を発火
}
```

### アナログ軸のダイレクトクエリ

```ts
const leftStickX = input.getGamepadAxis(0, 0);  // -1..1
```

### ブラーセーフ

ウィンドウがフォーカスを失うと、マネージャーはキーボード / マウス状態をクリア — キーが「貼り付き」ません。

---

## `@joroya/assets` — プログレス付きプリローダー

```bash
npm install @joroya/assets @joroya/core
```

```ts
import { AssetManager } from "@joroya/assets";

const assets = new AssetManager();
assets.on("progress", (e) => progressBar.set(e.loaded / e.total));

await assets.preload([
    { url: "/tex/grass.png",  type: "image" },
    { url: "/audio/loop.mp3", type: "audio" },
]);

const tex = assets.get<HTMLImageElement>("/tex/grass.png");
assets.release("/tex/grass.png");
```

- **重複排除**: 同じ URL への同時 `load()` は 1 つの fetch を共有。
- **参照カウント**: `load()` インクリメント、`release()` デクリメント、0 で削除。
- **耐障害性**: 個別エラーは全体の promise をリジェクトしない。
- **プラグ可能**: `registerLoader('gltf', myGltfLoader)` でカスタムタイプ。

---

## 次のステップ

- **入力を物理に接続**: `"throw"` アクションをバインドして `applyImpulse(...)` を呼び出す。
- **ローディング画面**: `assets.on("progress")` をリッスンして `loaded === total` でフェードアウトする HTML オーバーレイ。
- **マルチゲームパッド**: `getGamepadAxis(index, axis)` はインデックスを受け取る — 2 人プレイヤーを `index: 0` と `index: 1` に。
