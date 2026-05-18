# Oroya Animate

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@joroya/core?style=flat-square&logo=npm&label=@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![License](https://img.shields.io/github/license/joshuacba08/oroya-animate?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/joshuacba08/oroya-animate/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/joshuacba08/oroya-animate/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9+-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

[Documentation](https://oroya-animate.oroyajs.com) · [Packages](https://www.npmjs.com/org/joroya) · [Examples](https://oroya-animate.oroyajs.com/examples) · [Learn](https://oroya-animate.oroyajs.com/learn)

Read this in [Spanish](README-ES.md) or [Japanese](README-JA.md).

</div>

Oroya Animate is a TypeScript scene-graph library for building interactive 2D and 3D graphics on the web. You define a scene once, then render it through different backends such as Three.js, SVG, or Canvas2D.

The project is designed for applications that need a stable graphics model rather than code tied directly to one renderer: visual editors, educational simulations, generative graphics, product configurators, data/physics visualizers, and web experiences that may need multiple render targets.

## Why Oroya Animate

- Renderer-independent scene graph with nodes, transforms, components, cameras, materials, lights, animation, and serialization.
- Official renderers for Three.js, SVG, and Canvas2D.
- glTF/GLB loader for importing 3D assets from tools such as Blender.
- Physics integration through `cannon-es`, including rigid bodies, colliders, joints, sensors, raycasts, and vehicle helpers.
- Built-in animation system with clips, blending, easing helpers, keyframe events, and backend parity.
- Optional developer packages for input mapping, asset caching, scene inspection, React bindings, and Vue composables.
- ESM/CJS builds with TypeScript declarations for every package.

## Packages

| Package | Purpose |
| --- | --- |
| [`@joroya/core`](packages/core) | Scene graph, nodes, components, math, animation, serialization, and plugin contracts. |
| [`@joroya/renderer-three`](packages/renderer-three) | WebGL renderer powered by Three.js. |
| [`@joroya/renderer-svg`](packages/renderer-svg) | SVG renderer for vector output and DOM-based interaction. |
| [`@joroya/renderer-canvas2d`](packages/renderer-canvas2d) | Canvas2D renderer for browser-native 2D drawing. |
| [`@joroya/loader-gltf`](packages/loader-gltf) | glTF/GLB import into the Oroya scene graph. |
| [`@joroya/physics`](packages/physics) | Physics system built on top of `cannon-es`. |
| [`@joroya/assets`](packages/assets) | Asset cache with preloading, progress events, and reference counting. |
| [`@joroya/input`](packages/input) | Keyboard, mouse, and gamepad action mapping. |
| [`@joroya/inspector`](packages/inspector) | Runtime scene inspector and frame metrics overlay. |
| [`@joroya/react`](packages/react) | Experimental React bindings. |
| [`@joroya/vue`](packages/vue) | Experimental Vue 3 composables. |

## Installation

Install the core package and at least one renderer:

```bash
pnpm add @joroya/core @joroya/renderer-three three
```

For SVG output:

```bash
pnpm add @joroya/core @joroya/renderer-svg
```

For physics:

```bash
pnpm add @joroya/core @joroya/physics cannon-es
```

## Quick Start

```ts
import {
  Camera,
  CameraType,
  Material,
  Node,
  Scene,
  createBox,
  setFromAxisAngle,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

if (!canvas) {
  throw new Error('Canvas element not found');
}

const scene = new Scene();

const camera = new Node('camera');
camera.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
camera.transform.position.z = 5;
scene.add(camera);

const cube = new Node('cube');
cube.addComponent(createBox(1, 1, 1));
cube.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1 } }));
scene.add(cube);

const renderer = new ThreeRenderer({
  canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});

renderer.mount(scene);

let angle = 0;

function frame() {
  angle += 0.01;
  cube.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, angle);
  cube.transform.updateLocalMatrix();
  renderer.render();
  requestAnimationFrame(frame);
}

frame();
```

## Architecture

Oroya Animate follows a "define once, render anywhere" model.

```text
@joroya/core  <-  renderers / loaders / physics  <-  applications
```

`@joroya/core` owns the portable scene representation. Renderers translate that representation into backend-specific output, such as Three.js objects, SVG markup, or Canvas2D draw calls. This keeps scene logic separate from renderer implementation details.

The core package intentionally avoids runtime dependencies on Three.js, `cannon-es`, DOM APIs, or renderer packages. Downstream packages may depend on core, but core does not depend on them.

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Scene Graph](docs/scene-graph.md)
- [API Reference](docs/api-reference.md)
- [Renderers](docs/renderers.md)
- [Serialization](docs/serialization.md)
- [Tutorials](docs/tutorials/README.md)
- [Programming Principles](docs/programming-principles.md)

The public documentation site is available at [oroya-animate.oroyajs.com](https://oroya-animate.oroyajs.com).

## Development

Requirements:

- Node.js 18 or newer
- pnpm 9

```bash
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate
pnpm install
pnpm build
```

Workspace packages are consumed through their compiled `dist/` output. After cloning, run `pnpm build` before starting any demo app.

Common commands:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm build:web
pnpm dev:web
pnpm dev:react
pnpm dev:vanilla
```

Run a single package command with pnpm filters:

```bash
pnpm --filter @joroya/core build
pnpm --filter @joroya/core typecheck
pnpm test -- packages/core/tests/Node.test.ts
```

## Repository Layout

```text
packages/
  core/
  renderer-three/
  renderer-svg/
  renderer-canvas2d/
  loader-gltf/
  physics/
  assets/
  input/
  inspector/
  react/
  vue/
apps/
  demo-react/
  demo-vanilla/
  editor/
  web/
docs/
```

## Project Status

The v1 public API is stable for the core scene graph, renderers, serialization, animation, and physics packages. React, Vue, and the visual editor are still considered experimental and may change more quickly.

Breaking changes are reserved for major versions. New minor releases should extend the API without requiring existing projects to rewrite working scenes.

## Contributing

Issues and pull requests are welcome. Before opening a PR, please run:

```bash
pnpm typecheck
pnpm test
pnpm build
```

See [Contributing](docs/contributing.md) and [Programming Principles](docs/programming-principles.md) for project conventions.

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
