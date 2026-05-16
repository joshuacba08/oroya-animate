# @joroya/physics

> [cannon-es](https://pmndrs.github.io/cannon-es/)-backed physics for [Oroya Animate](https://github.com/joshuacba08/oroya-animate) scenes.

[![npm](https://img.shields.io/npm/v/@joroya/physics.svg)](https://www.npmjs.com/package/@joroya/physics)
[![License](https://img.shields.io/npm/l/@joroya/physics.svg)](../../LICENSE)

Rigid-body simulation, joints, sensors, raycast, and a `RaycastVehicle`
helper, all driven from your Oroya `Scene`.

## Install

```bash
npm install @joroya/physics @joroya/core
```

## Usage

```ts
import { PhysicsSystem } from '@joroya/physics';
import { Scene, Node, RigidBody, RigidBodyType, Collider, ColliderShape, createBox, createPlane } from '@joroya/core';

const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });
const scene = new Scene();

// Static floor
const floor = new Node('floor');
floor.addComponent(createPlane(20, 20));
floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
floor.addComponent(new Collider({ shape: ColliderShape.Box, halfExtents: { x: 10, y: 0.1, z: 10 } }));
scene.add(floor);

// Dynamic cube
const cube = new Node('cube');
cube.addComponent(createBox(1, 1, 1));
cube.transform.position = { x: 0, y: 5, z: 0 };
cube.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
cube.addComponent(new Collider({ shape: ColliderShape.Box, halfExtents: { x: 0.5, y: 0.5, z: 0.5 } }));
scene.add(cube);

// Subscribe to collisions
cube.events.on('collide-begin', (e) => console.log('hit', e.other.name));

// In the render loop
function frame(dt) {
    physics.update(dt, scene);
    renderer.render(dt);
}
```

## Features

- **Rigid bodies**: Dynamic / Static / Kinematic.
- **Colliders**: Box / Sphere / Plane / Cylinder, with material friction
  and restitution.
- **Joints**: hinge, point-to-point, distance.
- **Collision events**: `collide-begin` / `collide` / `collide-end` on
  solid contacts; `trigger-enter` / `trigger-stay` / `trigger-exit` on
  sensor colliders.
- **Collision filtering**: bitmask `collisionGroup` + `collisionMask`.
- **Raycast**: `raycast(from, to)` and `raycastAll(...)` return
  `{ node, point, normal, distance }`.
- **`Vehicle` helper**: declarative `RaycastVehicle` wrapper.

## API surface

| Symbol | Stability |
|---|---|
| `PhysicsSystem` (class) | `@public` |
| `PhysicsSystemOptions` (type) | `@public` |
| `PhysicsRaycastHit` (type) | `@public` |
| `Vehicle` (class) | `@experimental` |
| `WheelOptions` (type) | `@experimental` |

See [`docs/api-stability.md`](../../docs/api-stability.md).

## License

MIT
