# Oroya Animate 

A professional, engine-agnostic 2D/3D graphics library for the web. Built with TypeScript, designed for scalability and performance.

##  Vision

Oroya Animate is a high-level graphics library that decouples scene logic from rendering implementation. It allows developers to define complex scene graphs once and render them using different backends like Three.js (WebGL), SVG, or Canvas2D.

## ✨ Key Features

- **🛡️ TypeScript First:** Fully typed API for a robust development experience.
- **🏗️ Modular Architecture:** Monorepo structure for clear separation of concerns.
- **🔌 Engine Agnostic:** Define your scene once, render it anywhere.
- **🌉 Multiple Backends:** Official support for Three.js (3D) and SVG (2D).
- **📦 glTF Support:** Load complex 3D models directly into the agnostic scene graph.
- **🎥 Scene-Graph Camera:** Define cameras as nodes in the scene graph with full transform support.
- **⚛️ React Friendly:** Optimized wrappers for modern frontend frameworks.

##  Project Structure

This project is managed as a monorepo using `pnpm` workspaces:

### Packages
- [`@oroya/core`](packages/core): The heart of the library. Contains the Scene Graph, Node system, and base Components.
- [`@oroya/renderer-three`](packages/renderer-three): WebGL rendering backend powered by Three.js.
- [`@oroya/renderer-svg`](packages/renderer-svg): Lightweight 2D rendering backend for SVG.
- [`@oroya/loader-gltf`](packages/loader-gltf): Utilities for importing 3D models into the Oroya ecosystem.

### Apps
- [`demo-react`](apps/demo-react): Showcase of Oroya Animate working with React and Three.js.
- [`demo-vanilla`](apps/demo-vanilla): Minimal examples using vanilla JavaScript.
## 📚 Documentation

Detailed documentation is available in the [`docs/`](docs/) folder:

- [**Architecture Overview**](docs/architecture.md): Learn about the core engine-agnostic design.
- [**Getting Started**](docs/getting-started.md): Your first scene in 5 minutes.
- [**Scene Graph & Transformations**](docs/scene-graph.md): Deep dive into nodes and components.
- [**API Reference**](docs/api-reference.md): Complete reference of classes, interfaces and functions.
- [**Renderers**](docs/renderers.md): Three.js and SVG backends documentation.
- [**Serialization**](docs/serialization.md): Save and load scenes as JSON.
- [**Contributing & Development**](docs/contributing.md): Setup, scripts, and development workflow.
##  Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v9+)

### Installation

```bash
pnpm install
```

### Basic Usage (Core)

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

// 1. Create a scene
const scene = new Scene();

// 2. Add a camera
const cameraNode = new Node('main-camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

// 3. Create a node with geometry and material
const box = new Node('my-box');
box.addComponent(createBox(1, 1, 1));
box.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
scene.add(box);

// 4. Render with Three.js
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);
renderer.render();
```

## 🗺️ Roadmap

### v0.1.0 — Architecture & Setup ✅
- [x] Monorepo with pnpm workspaces.
- [x] TypeScript + tsup build pipeline.
- [x] Base packages: `@oroya/core`, `@oroya/renderer-three`, `@oroya/renderer-svg`, `@oroya/loader-gltf`.
- [x] Initial Scene Graph interfaces and base classes.
- [x] Demo apps (Vanilla JS + React).

### v0.2.0 — First Functional Release ✅
- [x] Functional Scene Graph API (`Scene`, `Node`, `Transform` with matrix math).
- [x] Component system (`Geometry`, `Material`, `Camera`).
- [x] Geometry primitives: `createBox`, `createSphere`, `createPath2D`.
- [x] Three.js renderer: dynamic scene rendering, Box + Sphere support.
- [x] Camera component integrated into the scene graph (Perspective).
- [x] World matrix computation via `updateWorldMatrices()`.
- [x] Working demos: Vanilla JS and React with animated rotating cubes.
- [x] TSDoc on all public API surfaces.
- [x] Comprehensive documentation (see [`docs/`](docs/)).

### v0.3.0 — Model Loading & Animation (Next)
- [ ] Full glTF/GLB loader (geometry + materials from Blender).
- [ ] Animation system (keyframes, timelines).
- [ ] Orthographic camera support.
- [ ] Orbital camera controls.
- [ ] Renderer resize handling.

### Future
- [ ] Complete SVG backend (transform support, groups).
- [ ] Canvas2D renderer.
- [ ] Boolean operations 2D/3D.
- [ ] WASM high-performance modules.
- [ ] Visual scene editor.
- [ ] Framework wrappers (Vue, Angular).

##  License

MIT  [joshuacba08](https://github.com/joshuacba08)
