---
title: "プラグイン: フォークせずにレンダラーを拡張"
description: "カスタムコンポーネントタイプをインターセプトする ComponentHandler を登録し、独自のバックエンドオブジェクトを出力する。"
order: 18
level: "advanced"
duration: "20 min"
---
# Tutorial 18: Plugins: 安定した lifecycle

Plugin と handler は 1.2.0 から公開 API です。最後の登録を優先し、解除すると前の handler を復元します。null を返すと組み込み処理に戻ります。

型付き core node には既存の ComponentType を使用します。PluginRegistry の文字列登録だけでは Node.components/Component.type は拡張されません。独自スキーマにはアダプターが必要です。

```ts
import { ComponentType, Geometry, GeometryPrimitive, type ComponentHandler, type Plugin } from '@joroya/core';
import * as THREE from 'three';

const handler: ComponentHandler<THREE.Mesh> = {
  componentType: ComponentType.Geometry,
  create(node) {
    const geometry = node.getComponent<Geometry>(ComponentType.Geometry);
    if (!geometry || geometry.definition.type !== GeometryPrimitive.Box) return null;
    const definition = geometry.definition;
    return new THREE.Mesh(new THREE.BoxGeometry(definition.width, definition.height, definition.depth),
      new THREE.MeshBasicMaterial({ color: 0xff8844 }));
  },
  dispose(_node, mesh) {
    mesh.geometry.dispose();
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose();
  },
};

export const boxPlugin: Plugin = { name: 'custom-box', handlers: [handler] };
// renderer.usePlugin(boxPlugin);
// renderer.removePlugin(boxPlugin);
```

hook は scene 更新後、matrix 同期前です。advanceScene: false の delta はゼロです。handler dispose は plugin dispose より先で、資源は handler が所有します。
