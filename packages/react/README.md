# @joroya/react

> React bindings for [Oroya Animate](https://github.com/joshuacba08/oroya-animate) — hooks and components for scene-graph composition.

[![npm](https://img.shields.io/npm/v/@joroya/react.svg)](https://www.npmjs.com/package/@joroya/react)
[![License](https://img.shields.io/npm/l/@joroya/react.svg)](../../LICENSE)

> **⚠ alpha** — all exports are tagged `@experimental`. Prop names and
> hook signatures may evolve through v1.x. Pin the version if you depend
> on a specific shape.

## Install

```bash
npm install @joroya/react @joroya/core @joroya/renderer-three react react-dom
```

## Usage

```tsx
import { OroyaCanvas, Box, AmbientLight, DirectionalLight, useFrame, useNodeRef } from '@joroya/react';

function SpinningCube() {
    const ref = useNodeRef();
    useFrame((dt) => {
        if (ref.current) ref.current.transform.rotation.y += dt;
    });
    return <Box nodeRef={ref} size={1} color={{ r: 1, g: 0.5, b: 0 }} castShadow />;
}

export function App() {
    return (
        <OroyaCanvas style={{ height: '100vh' }}>
            <AmbientLight intensity={0.5} />
            <DirectionalLight position={{ x: 5, y: 10, z: 5 }} castShadow />
            <SpinningCube />
        </OroyaCanvas>
    );
}
```

## Components and hooks

### Components

- `<OroyaCanvas>` — root component; owns the Scene + ThreeRenderer + RAF loop.
- `<Group>`, `<Box>`, `<Sphere>`, `<Plane>` — geometry primitives.
- `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>` — scene primitives.

### Hooks

- `useFrame((dt) => void)` — per-frame callback.
- `useScene()` — access the underlying `Scene`.
- `useParentNode()` — current JSX parent in the scene graph.
- `useNodeRef()` — ref to an Oroya `Node` (use with `nodeRef` prop).
- `useOroya()` — full context (scene + parent + frame registry).

## License

MIT
