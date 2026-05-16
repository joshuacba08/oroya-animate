---
title: "Physics: rigid bodies, joints, and collision events"
description: "Drop a stack of boxes onto a floor, link them with joints, and react to collisions — all from the Oroya scene graph."
order: 15
level: "intermediate"
duration: "20 min"
---

# Tutorial 15: Physics — rigid bodies, joints, and collision events

> **Level:** Intermediate
> **Time:** 20 minutes
> **You'll learn:** how `@joroya/physics` drives `cannon-es` from any Oroya `Scene`, how to wire collision events to nodes, and how to constrain bodies with joints.

---

## Install

```bash
npm install @joroya/core @joroya/renderer-three @joroya/physics three
```

`@joroya/physics` ships its own dependency on `cannon-es`, so you don't need to install it separately.

---

## Step 1 — Build a scene with a floor and a dropping cube

`RigidBody` + `Collider` are *components* you attach to regular Oroya nodes. The `PhysicsSystem` traverses the scene each frame, materializes a cannon body for every node that has both, and writes the simulated transform back to `node.transform`.

```ts
import {
    Scene, Node, Camera, CameraType, Light, LightType,
    createBox, createPlane, Material,
    RigidBody, RigidBodyType,
    Collider, ColliderShape,
} from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";
import { PhysicsSystem } from "@joroya/physics";

const scene = new Scene();

// Camera
const cam = new Node("camera");
cam.transform.position = { x: 6, y: 6, z: 10 };
cam.transform.lookAt({ x: 0, y: 0, z: 0 });
cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 50, aspect: 16 / 9, near: 0.1, far: 100 }));
scene.add(cam);

// Lights
const sun = new Node("sun");
sun.transform.position = { x: 5, y: 10, z: 5 };
sun.addComponent(new Light({ type: LightType.Directional, intensity: 1.0, castShadow: true }));
scene.add(sun);
scene.add(Object.assign(new Node("amb"), {})).addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));

// Floor — static body
const floor = new Node("floor");
floor.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
floor.addComponent(new Material({ color: { r: 0.25, g: 0.27, b: 0.32 } }));
floor.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
floor.addComponent(new Collider({
    shape: ColliderShape.Box,
    halfExtents: { x: 10, y: 0.1, z: 10 },
}));
scene.add(floor);

// Dynamic cube — falls under gravity
const cube = new Node("cube");
cube.addComponent(createBox(1, 1, 1, { castShadow: true }));
cube.addComponent(new Material({ color: { r: 1, g: 0.55, b: 0.2 } }));
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

## Step 2 — Run physics in the render loop

```ts
const renderer = new ThreeRenderer({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    width: window.innerWidth,
    height: window.innerHeight,
});
renderer.mount(scene);

const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });

let last = performance.now();
function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    physics.update(dt, scene);   // step the world, sync transforms back
    renderer.render(dt);          // draw

    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

That's it — the cube falls, hits the floor, and bounces with the configured `restitution`.

---

## Step 3 — React to collisions

`PhysicsSystem` emits collision events on the node's existing `EventEmitter` (the same channel that delivers click / hover events). Subscribe with `node.events.on(...)`:

```ts
cube.events.on("collide-begin", (e) => {
    console.log(`cube hit ${e.other.name} with impulse ${e.impulse?.toFixed(2)}`);
});

cube.events.on("collide-end", (e) => {
    console.log(`cube left ${e.other.name}`);
});
```

Six event names exist:
- `collide-begin` / `collide` / `collide-end` for solid contacts
- `trigger-enter` / `trigger-stay` / `trigger-exit` for sensor colliders (set `isTrigger: true` on the `Collider`)

---

## Step 4 — Add a joint

A hinge joint pins two bodies along a shared axis — perfect for doors, wheels, pendulums.

```ts
const anchor = new Node("anchor");
anchor.transform.position = { x: -3, y: 4, z: 0 };
anchor.transform.updateLocalMatrix();
anchor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
anchor.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 0.1 }));
scene.add(anchor);

const pendulum = new Node("pendulum");
pendulum.transform.position = { x: -3, y: 2, z: 0 };
pendulum.transform.updateLocalMatrix();
pendulum.addComponent(createBox(0.5, 2, 0.5, { castShadow: true }));
pendulum.addComponent(new Material({ color: { r: 0.6, g: 0.8, b: 1 } }));
pendulum.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
pendulum.addComponent(new Collider({ shape: ColliderShape.Box, halfExtents: { x: 0.25, y: 1, z: 0.25 } }));
scene.add(pendulum);

// Ensure both bodies exist in the world before linking them.
physics.update(1 / 60, scene);

physics.addHingeConstraint(anchor, pendulum, {
    pivotA: { x: 0, y: 0, z: 0 },     // attach at anchor center
    pivotB: { x: 0, y: 1, z: 0 },     // attach at pendulum top
    axisA: { x: 0, y: 0, z: 1 },
});
```

Push the pendulum (mouse drag, an `applyImpulse` call, or just gravity at startup) and it swings.

---

## Step 5 — Raycast against the physics world

The renderer's raycast targets visual meshes. The physics raycast targets simulated bodies — useful for click-to-pick on physical objects, line-of-sight checks, or laser-pointer effects.

```ts
const hit = physics.raycast(
    { x: 0, y: 10, z: 0 },        // from
    { x: 0, y: 0, z: 0 },         // to
);

if (hit) {
    console.log(`hit ${hit.node.name} at distance ${hit.distance}`);
}
```

`raycast` returns the closest hit (or `null`); `raycastAll(from, to)` returns every body along the ray.

---

## What to try next

- **Sensors**: add `isTrigger: true` to a Collider — bodies pass through it but `trigger-enter` / `trigger-exit` fire. Use for checkpoints, damage zones, proximity sensors.
- **Collision filtering**: `collisionGroup` (bitmask, default `1`) and `collisionMask` (default `-1`) let you put bodies in layers that ignore each other.
- **Vehicles**: `Vehicle` is a high-level wrapper over cannon-es's `RaycastVehicle` for drivable cars. See the `Vehicle` API in `@joroya/physics`.
