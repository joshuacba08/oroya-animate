# Oroya Animate 

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@joroya/core?style=flat-square&logo=npm&label=@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![License](https://img.shields.io/github/license/joshuacba08/oroya-animate?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![CI Status](https://img.shields.io/github/actions/workflow/status/joshuacba08/oroya-animate/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/joshuacba08/oroya-animate/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9+-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

**[Documentation](https://oroya-animate.vercel.app)** ? **[NPM](https://www.npmjs.com/org/joroya)** ? **[CDN](https://unpkg.com/@joroya/core)** ? **[GitHub](https://github.com/joshuacba08/oroya-animate)**

</div>

A professional, engine-agnostic 2D/3D graphics library for the web. Built with TypeScript, designed for scalability and performance.

##  Vision

Oroya Animate is a high-level graphics library that decouples scene logic from rendering implementation. It allows developers to define complex scene graphs once and render them using different backends like Three.js (WebGL), SVG, or Canvas2D.

## 🎯 Key Features

- **🦺 TypeScript First:** Fully typed API for a robust development experience.
- **🧩 Modular Architecture:** Monorepo structure for clear separation of concerns.
- **🔌 Engine Agnostic:** Define your scene once, render it anywhere.
- **🎨 Multiple Backends:** Official support for Three.js (3D) and SVG (2D).
- **📦 glTF Support:** Load complex 3D models directly into the agnostic scene graph.
- **🎥 Scene-Graph Camera:** Perspective & Orthographic cameras as scene graph nodes.
- **🎬 Animation System:** Keyframe-based animation with `AnimationMixer` and interpolation.
- **🖱️ Interactivity:** Built-in event system with raycasting (3D) and DOM events (SVG).
- **🌐 Orbit Controls:** Mouse/touch camera controls for 3D scenes.
- **🎨 Generative Art:** SvJs engine with noise, distributions, and SVG primitives.
- **⚛️ React Friendly:** Optimized wrappers for modern frontend frameworks.

##  Project Structure

This project is managed as a monorepo using `pnpm` workspaces:

### Packages
- [`@joroya/core`](packages/core): The heart of the library. Contains the Scene Graph, Node system, and base Components.
- [`@joroya/renderer-three`](packages/renderer-three): WebGL rendering backend powered by Three.js.
- [`@joroya/renderer-svg`](packages/renderer-svg): Lightweight 2D rendering backend for SVG.
- [`@joroya/loader-gltf`](packages/loader-gltf): Utilities for importing 3D models into the Oroya ecosystem.

### Apps
- [`demo-react`](apps/demo-react): Showcase of Oroya Animate working with React and Three.js.
- [`demo-vanilla`](apps/demo-vanilla): Minimal examples using vanilla JavaScript.
- [`web`](apps/web): Documentation website powered by Astro (deployed to Vercel).

## ?? Documentation

Detailed documentation is available in the [`docs/`](docs/) folder:

### Core Documentation
- [**Architecture Overview**](docs/architecture.md): Learn about the core engine-agnostic design.
- [**Getting Started**](docs/getting-started.md): Your first scene in 5 minutes.
- [**Scene Graph & Transformations**](docs/scene-graph.md): Deep dive into nodes and components.
- [**API Reference**](docs/api-reference.md): Complete reference of classes, interfaces and functions.
- [**Renderers**](docs/renderers.md): Three.js and SVG backends documentation.
- [**Serialization**](docs/serialization.md): Save and load scenes as JSON.

### Deployment & Publishing
- [**NPM Publishing**](docs/deployment/npm-publishing.md): Publish packages to NPM registry.
- [**CDN Setup**](docs/deployment/cdn-setup.md): Use packages directly from CDN.
- [**Vercel Deployment**](docs/deployment/vercel-deployment.md): Deploy documentation website.

### Development
- [**Contributing & Development**](docs/contributing.md): Setup, scripts, and development workflow.
- [**Programming Principles**](docs/programming-principles.md): Coding conventions and architectural rules.
- [**Build Errors Postmortem**](docs/troubleshooting/build-errors-postmortem.md): Analysis of common build mistakes.

### Tutorials
- [**Tutorials**](docs/tutorials/README.md): Step-by-step guides from beginner to advanced.

##  Getting Started

### Installation

#### NPM/PNPM (Recommended)

```bash
# Using npm
npm install @joroya/core @joroya/renderer-three

# Using pnpm
pnpm add @joroya/core @joroya/renderer-three

# Using yarn
yarn add @joroya/core @joroya/renderer-three
```

#### CDN (No Build Step)

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@0.4.0/dist/index.js';
  import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@0.4.0/dist/index.js';
  
  // Your code here
</script>
```

### For Development

If you want to contribute or develop locally:

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v9+)

```bash
# Clone repository
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate

# Install dependencies
pnpm install

# Build packages
pnpm build
```

> ?? The workspace packages must be built before running any demo app, since they resolve through their `dist/` output.

### Basic Usage (Core)

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

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

## ??? Roadmap

### v0.1.0 ? Architecture & Setup ?
- [x] Monorepo with pnpm workspaces.
- [x] TypeScript + tsup build pipeline.
- [x] Base packages: `@joroya/core`, `@joroya/renderer-three`, `@joroya/renderer-svg`, `@joroya/loader-gltf`.
- [x] Initial Scene Graph interfaces and base classes.
- [x] Demo apps (Vanilla JS + React).

### v0.2.0 ? First Functional Release ?
- [x] Functional Scene Graph API (`Scene`, `Node`, `Transform` with matrix math).
- [x] Component system (`Geometry`, `Material`, `Camera`).
- [x] Geometry primitives: `createBox`, `createSphere`, `createPath2D`.
- [x] Three.js renderer: dynamic scene rendering, Box + Sphere support.
- [x] Camera component integrated into the scene graph (Perspective).
- [x] World matrix computation via `updateWorldMatrices()`.
- [x] Working demos: Vanilla JS and React with animated rotating cubes.
- [x] TSDoc on all public API surfaces.
- [x] Comprehensive documentation (see [`docs/`](docs/)).

### v0.3.0 ? Build Stabilization & Project Hardening ?
- [x] Fixed build pipeline: all 4 packages compile successfully (CJS + ESM + DTS).
- [x] Correct `package.json` exports (file extensions, `types`-first condition order).
- [x] TypeScript `composite: false` override for tsup DTS compatibility.
- [x] Barrel files (`index.ts`) for all module directories.
- [x] Extended `MaterialDef` with SVG-specific properties (`fill`, `stroke`, `strokeWidth`).
- [x] Missing `@types/three` added to `@joroya/loader-gltf`.
- [x] Eliminated dead code (unused imports).
- [x] Fixed syntax errors in renderer-svg template literals.
- [x] New documentation: [Programming Principles](docs/programming-principles.md).
- [x] New documentation: [Build Errors Postmortem](docs/troubleshooting/build-errors-postmortem.md).

### v0.4.0 — Interactivity, Animation & Generative Art ✅
- [x] **Animation system**: `AnimationClip`, `AnimationMixer`, `KeyframeTrack` with linear/step/cubicspline interpolation.
- [x] **Interactivity system**: `EventEmitter`, `Interactive` component, `InteractionEvent`, `BoundingBox` (AABB).
- [x] **Raycasting** in Three.js renderer for 3D pointer events (click, hover, drag).
- [x] **DOM event delegation** in SVG renderer for 2D interactivity.
- [x] **Orbit controls**: `OrbitControlsWrapper` for camera manipulation (orbit, pan, zoom).
- [x] **Orthographic camera** support in renderers.
- [x] **Buffer geometry** and **Text geometry** support with AABB computation.
- [x] **SvJs generative art engine**: `SvJs` class, `Gen` module (gaussian, pareto, noise), `Noise` (Perlin).
- [x] **SVG advanced features**: gradients, filters, clip-paths, masks, `<animate>` / `<animateTransform>`.
- [x] **Documentation website** (`apps/web`) deployed to Vercel via Astro.
- [x] **i18n infrastructure**: Translation support for English, Spanish, and Japanese.
- [x] Feature EPICs: [OA-001](docs/features/OA-001/EPICA.md) to [OA-004](docs/features/OA-004/EPIC.md).

### v0.5.0 — Renderer Completion & 3D Pipeline (Next)
- [ ] Full glTF/GLB loader (geometry + materials from Blender).
- [ ] Complete SVG backend (transform support, groups).
- [ ] Canvas2D renderer.
- [ ] Boolean operations 2D/3D.
- [ ] Cubic spline interpolation for animations.
- [ ] Proper quaternion SLERP.

### v1.0.0 — Production Ready (Vision)
- [ ] WASM high-performance modules.
- [ ] Visual scene editor.
- [ ] Framework wrappers (Vue, Angular).
- [ ] Plugin system for custom components.
- [ ] Physics integration.

## 🚀 Publishing & Deployment

### Packages on NPM

All packages are published to NPM under the `@joroya` scope:
- [@joroya/core](https://www.npmjs.com/package/@joroya/core)
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three)
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg)
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf)

### Available on CDN

All packages are automatically available on multiple CDNs:
- **unpkg:** `https://unpkg.com/@joroya/core`
- **jsDelivr:** `https://cdn.jsdelivr.net/npm/@joroya/core`
- **esm.sh:** `https://esm.sh/@joroya/core`

### Documentation Website

Live at: **https://oroya-animate.vercel.app** (deployed via Vercel)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/contributing.md) for details on:
- Development setup
- Code conventions
- Pull request process
- Issue reporting

## 📄 License

MIT © [joshuacba08](https://github.com/joshuacba08)

---

<div align="center">

**Made with ❤️ by the Oroya AI Collaborator**

[Report Bug](https://github.com/joshuacba08/oroya-animate/issues) · [Request Feature](https://github.com/joshuacba08/oroya-animate/issues) · [Discussions](https://github.com/joshuacba08/oroya-animate/discussions)

</div>
