---
title: "プラグイン: フォークせずにレンダラーを拡張"
description: "カスタムコンポーネントタイプをインターセプトする ComponentHandler を登録し、独自のバックエンドオブジェクトを出力する。"
order: 18
level: "advanced"
duration: "20 min"
---

# チュートリアル 18: プラグイン — フォークせずにレンダラーを拡張

> **レベル:** 上級
> **時間:** 20 分
> **学ぶこと:** `@joroya/core/plugins` のプラグインシステムで、`ThreeRenderer` を変更せずに新しいコンポーネントタイプを独自のレンダリング動作付きで出荷する方法。

> **安定性:** `PluginRegistry`、`Plugin`、`ComponentHandler` は v1.0 で `@experimental`。

---

## プラグインが必要なとき

組み込みレンダラーは `Geometry`、`Material`、`Camera`、`Light`、`ParticleSystem`、オーディオ、インスタンシング、スキンドメッシュを処理。それ以上 — ボクセルグリッド、カスタムシェーダー、GPU コンピュート出力、サードパーティーの物理ビジュアライザー — はプラグインの領域。

プラグインは小さなモジュール:

1. カスタム `ComponentType` または文字列 ID の `ComponentHandler` を定義。
2. `create(node)` から `THREE.Object3D`（任意のバックエンドオブジェクト）を返す。
3. オプションで `update(node, obj, dt)` でフレームごとの同期、`dispose(node, obj)` で GPU リソース解放。

レンダラーは組み込みブランチの**前に**レジストリにクエリ。

---

## ステップ 1 — カスタムコンポーネントを定義

```ts
import { Component } from "@joroya/core";

export class VoxelGridComponent extends Component {
    readonly type = "VoxelGrid";
    constructor(
        public readonly size: { x: number; y: number; z: number },
        public readonly cellSize: number,
        public readonly voxels: Uint8Array,
    ) { super(); }
}
```

---

## ステップ 2 — ハンドラを書く

```ts
import type { ComponentHandler } from "@joroya/core";
import * as THREE from "three";

export const voxelHandler: ComponentHandler<THREE.Object3D> = {
    componentType: "VoxelGrid",
    create(node) {
        // THREE.InstancedMesh を構築 — 非ゼロボクセルごとに 1 立方体
        return mesh;
    },
    update(node, mesh, dt) { /* オプション */ },
    dispose(node, mesh) { /* GPU リソース解放 */ },
};
```

---

## ステップ 3 — Plugin としてバンドル + 登録

```ts
import type { Plugin } from "@joroya/core";

export const voxelPlugin: Plugin = {
    name: "voxel-renderer",
    handlers: [voxelHandler],
};

renderer.usePlugin(voxelPlugin);
```

---

## プラグインの優先順位

1. ノードの各コンポーネントに対してプラグインレジストリにクエリ。
2. ハンドラが存在し非 `null` を返したら、**それ**が使われる。
3. `null` を返したら、ノードの次のコンポーネントへフォールスルー。
4. どのハンドラもマッチしなければ、組み込みチェーンを実行。

プラグインはデフォルトを**置き換える**（オブジェクト返却）か、**augment** する（`null` 返却して `update(dt)` だけ受ける）。

---

## Dispose ライフサイクル

`renderer.rebuildScene()` と `renderer.dispose()` は各プラグイン管理オブジェクトを走査し、`handler.dispose(node, obj)` を呼ぶ。ここで `geometry.dispose()` / `material.dispose()` / `texture.dispose()` を解放。

---

## 次のステップ

- **マルチハンドラプラグイン**: 同じパッケージから複数のコンポーネントタイプ用のハンドラを登録。
- **プラグインを公開**: `@<your-org>/oroya-plugin-voxels` — 慣習は `componentType` の名前。
