---
title: "物理: 剛体、ジョイント、衝突イベント"
description: "床に立方体スタックを落とし、ジョイントで連結し、衝突に反応する — すべて Oroya シーングラフから。"
order: 15
level: "intermediate"
duration: "20 min"
---

# チュートリアル 15: 物理 — 剛体、ジョイント、衝突イベント

> **レベル:** 中級
> **時間:** 20 分
> **学ぶこと:** `@joroya/physics` が任意の Oroya `Scene` 上で `cannon-es` を駆動する方法、衝突イベントをノードに配線する方法、ジョイントで剛体を拘束する方法。

---

## インストール

```bash
npm install @joroya/core @joroya/renderer-three @joroya/physics three
```

---

## ステップ 1 — 床と落下する立方体

`RigidBody` + `Collider` は通常の Oroya ノードに付ける*コンポーネント*です。`PhysicsSystem` はフレームごとにシーンを走査し、両方を持つノードに対応する cannon ボディを生成し、シミュレートされた姿勢を `node.transform` に書き戻します。

```ts
import {
    Scene, Node, createBox, createPlane, Material,
    RigidBody, RigidBodyType,
    Collider, ColliderShape,
} from "@joroya/core";
import { PhysicsSystem } from "@joroya/physics";

const floor = new Node("floor");
floor.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
floor.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
floor.addComponent(new Collider({
    shape: ColliderShape.Box,
    halfExtents: { x: 10, y: 0.1, z: 10 },
}));
scene.add(floor);

const cube = new Node("cube");
cube.addComponent(createBox(1, 1, 1, { castShadow: true }));
cube.transform.position = { x: 0, y: 5, z: 0 };
cube.transform.updateLocalMatrix();
cube.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
cube.addComponent(new Collider({
    shape: ColliderShape.Box,
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
    restitution: 0.4,
}));
scene.add(cube);
```

---

## ステップ 2 — レンダーループで物理を実行

```ts
const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });

let last = performance.now();
function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    physics.update(dt, scene);
    renderer.render(dt);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

---

## ステップ 3 — 衝突に反応

`PhysicsSystem` はノードの `EventEmitter`（クリック / ホバーイベントと同じチャンネル）で衝突イベントを発火します:

```ts
cube.events.on("collide-begin", (e) => {
    console.log(`cube が ${e.other.name} に衝撃 ${e.impulse?.toFixed(2)} で衝突`);
});
```

6 つのイベント名:
- `collide-begin` / `collide` / `collide-end` 固体接触
- `trigger-enter` / `trigger-stay` / `trigger-exit` センサーコライダー (`isTrigger: true`)

---

## ステップ 4 — ジョイントを追加

```ts
physics.update(1 / 60, scene); // 拘束前にボディを生成

physics.addHingeConstraint(anchor, pendulum, {
    pivotA: { x: 0, y: 0, z: 0 },
    pivotB: { x: 0, y: 1, z: 0 },
    axisA: { x: 0, y: 0, z: 1 },
});
```

他のジョイント: `addPointToPointConstraint`, `addDistanceConstraint`。

---

## ステップ 5 — 物理レイキャスト

```ts
const hit = physics.raycast({ x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
if (hit) console.log(`${hit.node.name} に距離 ${hit.distance} でヒット`);
```

---

## 次のステップ

- **センサー**: Collider に `isTrigger: true` を付ける — 物体は通過するが `trigger-enter` / `trigger-exit` が発火。
- **衝突フィルター**: `collisionGroup` と `collisionMask`（ビットマスク）でレイヤー。
- **車両**: `Vehicle` ラッパーは cannon-es の `RaycastVehicle` をカバー。
