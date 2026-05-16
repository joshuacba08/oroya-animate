---
title: "React bindings: <OroyaCanvas> and useFrame"
description: "Build a 3D scene from React JSX — declarative components, hooks, and per-frame updates."
order: 17
level: "intermediate"
duration: "15 min"
---

# Tutorial 17: React bindings — `<OroyaCanvas>` and `useFrame`

> **Level:** Intermediate
> **Time:** 15 minutes
> **You'll learn:** how `@joroya/react` mounts an Oroya scene from JSX, how to drive per-frame updates with `useFrame`, and how the scene-graph context flows through your component tree.

> **Stability:** `@joroya/react` is `@experimental` in v1.0. Hook signatures and component props may evolve through 1.x — pin the version (`"@joroya/react": "1.0.0"`) if you depend on a specific shape.

---

## Install

```bash
npm install @joroya/react @joroya/core @joroya/renderer-three react react-dom three
```

---

## Step 1 — Mount a canvas with JSX children

`<OroyaCanvas>` owns the `Scene`, the `ThreeRenderer`, and the `requestAnimationFrame` loop. Children declare scene-graph nodes via JSX — no manual `scene.add(node)` from your code.

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

Each component creates an Oroya `Node`, attaches the relevant components (`Geometry`, `Material`, `Light`, …), and registers it under whatever JSX parent contains it. The Oroya node identity is `useMemo`'d, so re-rendering the parent doesn't discard children.

By default, `<OroyaCanvas>` provisions a perspective camera at `(0, 0, 5)` looking at the origin. To override, set `autoCamera={false}` and render a `<PerspectiveCamera>` of your own.

---

## Step 2 — Animate with `useFrame`

`useFrame(cb)` registers a callback fired every render frame with the elapsed `dt` (seconds). The callback identity is snapshotted into a ref, so you don't have to memoize.

```tsx
import { OroyaCanvas, Box, AmbientLight, useFrame, useNodeRef } from "@joroya/react";

function SpinningCube() {
    const ref = useNodeRef();

    useFrame((dt) => {
        if (ref.current) {
            ref.current.transform.rotation.y += dt;
            ref.current.transform.updateLocalMatrix();
        }
    });

    return <Box nodeRef={ref} size={1} color={{ r: 1, g: 0.5, b: 0 }} castShadow />;
}

export function App() {
    return (
        <OroyaCanvas style={{ height: "100vh" }}>
            <AmbientLight intensity={0.5} />
            <SpinningCube />
        </OroyaCanvas>
    );
}
```

`useNodeRef()` returns a `{ current: Node | null }` ref that gets filled in once the JSX component mounts and its Oroya `Node` is created.

---

## Step 3 — Reach into the underlying `Scene`

`useScene()` returns the canvas's `Scene` directly — useful when you need to call core APIs (`findNodeByName`, `serialize`, etc.) from inside a component.

```tsx
import { useScene } from "@joroya/react";
import { serialize } from "@joroya/core";

function SaveButton() {
    const scene = useScene();
    return (
        <button onClick={() => {
            const json = serialize(scene);
            const blob = new Blob([json], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "scene.json";
            a.click();
        }}>
            Save scene
        </button>
    );
}
```

`useParentNode()` returns the current JSX parent — handy for custom components that need to attach extra components to it.

---

## Step 4 — Compose your own primitives

Any component that wraps `<Group>` and uses the hooks above acts like a built-in primitive:

```tsx
import { Group, Box, useFrame, useNodeRef } from "@joroya/react";

interface OrbitProps {
    radius: number;
    speed: number;
    color: { r: number; g: number; b: number };
}

function Orbit({ radius, speed, color }: OrbitProps) {
    const ref = useNodeRef();
    const t = useRef(0);

    useFrame((dt) => {
        t.current += dt * speed;
        if (ref.current) {
            ref.current.transform.position = {
                x: Math.cos(t.current) * radius,
                y: 1,
                z: Math.sin(t.current) * radius,
            };
            ref.current.transform.updateLocalMatrix();
        }
    });

    return <Box nodeRef={ref} size={0.4} color={color} castShadow />;
}

export function App() {
    return (
        <OroyaCanvas style={{ height: "100vh" }}>
            <AmbientLight intensity={0.5} />
            <Orbit radius={2} speed={1.0} color={{ r: 1, g: 0.5, b: 0 }} />
            <Orbit radius={2.5} speed={0.7} color={{ r: 0.3, g: 0.7, b: 1 }} />
            <Orbit radius={3} speed={0.5} color={{ r: 0.5, g: 1, b: 0.5 }} />
        </OroyaCanvas>
    );
}
```

---

## What ships in `@joroya/react`

**Components:** `<OroyaCanvas>`, `<Group>`, `<Box>`, `<Sphere>`, `<Plane>`, `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>`.

**Hooks:** `useFrame(cb)`, `useScene()`, `useParentNode()`, `useOroya()`, `useNodeRef()`.

For everything else (physics, audio, post-processing, animator clips, custom geometries), use the core APIs directly with `useScene()` — drop down to imperative code when JSX coverage isn't there yet.

---

## What to try next

- **Combine with `@joroya/physics`**: get the scene from `useScene()`, instantiate a `PhysicsSystem`, and step it inside a `useFrame` callback.
- **Hook up Animator**: `useScene()` → `findNodeByName('hero').getComponent(ComponentType.Animator).play('walk')`.
- **Vue equivalent**: `@joroya/vue` exposes `useOroyaCanvas`, `useFrame`, `useNode` composables with the same lifecycle semantics.
