---
title: "React バインディング: <OroyaCanvas> と useFrame"
description: "React JSX から 3D シーンを構築 — 宣言的コンポーネント、フック、フレームごとの更新。"
order: 17
level: "intermediate"
duration: "15 min"
---

# チュートリアル 17: React バインディング — `<OroyaCanvas>` と `useFrame`

> **レベル:** 中級
> **時間:** 15 分
> **学ぶこと:** `@joroya/react` が JSX から Oroya シーンをマウントする方法、`useFrame` でフレームごとに更新する方法、シーングラフコンテキストがコンポーネントツリーを通る方法。

> **安定性:** `@joroya/react` は v1.0 で `@experimental`。フックとプロパティの形は 1.x で進化する可能性 — バージョンを固定してください。

---

## インストール

```bash
npm install @joroya/react @joroya/core @joroya/renderer-three react react-dom three
```

---

## ステップ 1 — JSX 子要素でキャンバスをマウント

`<OroyaCanvas>` は `Scene`、`ThreeRenderer`、`requestAnimationFrame` ループを所有。子要素は JSX 経由でシーングラフノードを宣言。

```tsx
import {
    OroyaCanvas, Box, Sphere, AmbientLight, DirectionalLight,
} from "@joroya/react";

export function App() {
    return (
        <OroyaCanvas style={{ height: "100vh" }}>
            <AmbientLight intensity={0.5} />
            <DirectionalLight intensity={1.2} position={{ x: 5, y: 10, z: 5 }} castShadow />
            <Box position={{ x: 0, y: 1, z: 0 }} color={{ r: 1, g: 0.5, b: 0 }} castShadow />
            <Sphere position={{ x: 2, y: 1, z: 0 }} radius={0.6} color={{ r: 0.3, g: 0.7, b: 1 }} castShadow />
        </OroyaCanvas>
    );
}
```

---

## ステップ 2 — `useFrame` でアニメーション

```tsx
import { Box, useFrame, useNodeRef } from "@joroya/react";

function SpinningCube() {
    const ref = useNodeRef();
    useFrame((dt) => {
        if (ref.current) {
            ref.current.transform.rotateOnAxis({ x: 0, y: 1, z: 0 }, dt);
            ref.current.transform.updateLocalMatrix();
        }
    });
    return <Box nodeRef={ref} size={1} color={{ r: 1, g: 0.5, b: 0 }} castShadow />;
}
```

---

## ステップ 3 — `Scene` への直接アクセス

```tsx
import { useScene } from "@joroya/react";
import { serialize } from "@joroya/core";

function SaveButton() {
    const scene = useScene();
    return <button onClick={() => downloadJson(serialize(scene))}>保存</button>;
}
```

---

## `@joroya/react` の公開 API

**コンポーネント:** `<OroyaCanvas>`、`<Group>`、`<Box>`、`<Sphere>`、`<Plane>`、`<PerspectiveCamera>`、`<AmbientLight>`、`<DirectionalLight>`。

**フック:** `useFrame(cb)`、`useScene()`、`useParentNode()`、`useOroya()`、`useNodeRef()`。

それ以外（物理、オーディオ、ポストプロセシング、Animator）はコア API を直接使用 — `useScene()` で取得して命令的コードに降りる。

---

## 次のステップ

- **`@joroya/physics` と組み合わせる**: `useScene()` でシーン取得 → `PhysicsSystem` をインスタンス化 → `useFrame` 内でステップ。
- **Vue 同等版**: `@joroya/vue` が `useOroyaCanvas`、`useFrame`、`useNode` を公開。同じライフサイクル。
