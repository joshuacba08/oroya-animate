# Oroya Animate 

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@joroya/core?style=flat-square&logo=npm&label=@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![License](https://img.shields.io/github/license/joshuacba08/oroya-animate?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![CI Status](https://img.shields.io/github/actions/workflow/status/joshuacba08/oroya-animate/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/joshuacba08/oroya-animate/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9+-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

**[Documentation](https://oroya-animate.vercel.app)** ? **[NPM](https://www.npmjs.com/org/joroya)** ? **[CDN](https://unpkg.com/@joroya/core)** ? **[GitHub](https://github.com/joshuacba08/oroya-animate)**

📖 **Read this in other languages:** [Español](README-ES.md) • [日本語](README-JA.md)

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

### v0.5.0 — Renderer Completion & 3D Pipeline ✅
- [x] Full glTF/GLB loader (geometry + materials from Blender).
- [x] Complete SVG backend (transform support, groups).
- [x] Canvas2D renderer.
- [x] Boolean operations 2D/3D (CSG).
- [x] Cubic spline interpolation for animations.
- [x] Proper quaternion SLERP.
### v0.6.0 — Lighting, Textures & Transform Utilities ✅
- [x] **Lighting System**: Directional, Point, Ambient lights with intensity control.
- [x] **Advanced Materials**: PBR workflow (roughness, metalness) + emissive properties.
- [x] **Texture Support**: Diffuse, normal, and PBR maps.
- [x] **Environment**: Fog (exponential), background color, and global ambient light.
- [x] **Extended Geometry**: Cylinder, Cone, Plane, Torus primitives.
- [x] **Transform Utilities**: `lookAt()`, `rotateOnAxis()`, `setFromMatrix()`.
- [x] **Math Helpers**: Enhanced `Vector3` and `Quaternion` libraries.
- [x] **New Examples**: Textures & Environment, LookAt tracking.

### v0.7.0 — Rendering Optimization ✅
- [x] **InstancedMesh**: High-performance rendering of repeated geometry.
- [x] **Frustum Culling**: Skip nodes outside the camera frustum.
- [x] **Scene Graph Optimization**: Dirty-flag-driven world-matrix updates.

### v0.8.0 — Advanced Rendering & Effects ✅
- [x] **Shadow System**: Cast/receive flags on every geometry variant; directional/point/spot lights with `shadowMapSize` / `shadowBias`.
- [x] **Post-Processing**: Declarative `PostProcessing` component (Bloom + Reinhard/Cineon/ACESFilmic tone-mapping + SMAA antialiasing) anchored to the active camera.
- [x] **Particle System**: CPU-simulated `ParticleSystem` with gravity, start/end color/size, emission rate.
- [x] **Spatial Audio**: `AudioListener` + `AudioSource` mapped to `THREE.PositionalAudio`.
- [x] [OA-006 EPIC](docs/features/OA-006/EPIC.md).

### v0.9.0 — Physics & Animation ✅
- [x] **Physics Engine** (`@joroya/physics`, cannon-es): `PhysicsSystem` with world-space sync.
- [x] **Joints**: Hinge, Point-to-Point, Distance constraints.
- [x] **Collision Events**: `collide-begin`/`collide`/`collide-end` + `trigger-enter`/`trigger-stay`/`trigger-exit`.
- [x] **Sensor Colliders + Collision Filtering** (group/mask bitmasks).
- [x] **Physics Raycast**: `raycast` and `raycastAll` against rigid bodies.
- [x] **Animator Component**: `play`, `stop`, `crossFade`, `addClip`, `autoplay`.
- [x] **Animation Blending**: Multi-clip weighted blending with quaternion nlerp + hemisphere correction.
- [x] **Keyframe Events**: `AnimationClip.events` fires named events on time crossings.
- [x] **Easing + Spring helpers**: 9 easing functions + critically-dampable spring integrator.
- [x] `ThreeRenderer.render(dt?)` propagates real frame time; `Scene.update(dt)` is first-class.
- [x] [OA-007 EPIC](docs/features/OA-007/EPIC.md).

### v0.10.0 — Serialization, Backend Parity & Hardening ✅
- [x] **Full serialization**: TypedArray (Float32/Uint8/Uint16/Uint32) round-trip via base64 — `AnimationClip`, `BufferGeometry`, `InstancedMesh` matrices now save/load.
- [x] **Component deserialization gap closed**: RigidBody, Collider, Animator, PostProcessing, ParticleSystem, AudioListener, AudioSource, Environment.
- [x] **Backend parity**: SVG and Canvas2D renderers run `scene.update(dt)` — `Animator` works on all backends, not just Three.js.
- [x] **Demos audited**: `animation-demo` uses the real Animator API (idle/walk/spin clips + crossFade + keyframe events).
- [x] **ESLint**: `eslint-plugin-import` + no-unused + no-explicit-any rules in CI.
- [x] [OA-008 EPIC](docs/features/OA-008/EPIC.md).

### v0.11.0 — Pre-1.0 Ecosystem ✅
- [x] **Inspector / Debug UI** (`@joroya/inspector`): Vanilla-DOM overlay — hierarchy, transform inspection, FPS / frame-time / max-hitch, scene-graph stats.
- [x] **Input Manager** (`@joroya/input`): Unified keyboard / mouse / gamepad layer with declarative action mapping and analog gamepad axes.
- [x] **Asset Manager** (`@joroya/assets`): Centralized cache with deduplication, ref-counted release, progress events, pluggable loaders.
- [x] **Framework Wrappers (alpha)**: `@joroya/react` (`<OroyaCanvas>` + `useFrame` / `useScene` + JSX primitives) and `@joroya/vue` (`useOroyaCanvas` / `useFrame` / `useNode` composables).
- [x] [OA-009 EPIC](docs/features/OA-009/EPIC.md).

### v0.12.0 — Skinned Mesh, IK & Vehicles ✅
- [x] **glTF skinned-mesh pipeline**: `Skin` component + `skinIndices`/`skinWeights` on `BufferGeometryDef`; `loadGLTF` extracts skin attributes; `ThreeRenderer` builds `THREE.SkinnedMesh` and binds the skeleton in a post-pass.
- [x] **2-bone analytical IK**: `solve2BoneIK(root, mid, end, target, pole?)` law-of-cosines solver — O(1), no iteration, pole-vector support.
- [x] **Vehicle helper**: `Vehicle` wrapper over `CANNON.RaycastVehicle` with `drive` / `steer` / `brake` / `syncWheelNodes` API.
- [x] [OA-010 EPIC](docs/features/OA-010/EPIC.md).

### v1.0.0 — Production Ready ✅
- [x] **API Stability**: `@public` / `@experimental` / `@internal` JSDoc tags + auditable via `pnpm api:check`. Public surface frozen — breaking changes require a major bump with a 1-major-version deprecation window. See [`docs/api-stability.md`](docs/api-stability.md).
- [x] **Plugin System**: `PluginRegistry` + `ComponentHandler` in `@joroya/core/plugins`; `ThreeRenderer.usePlugin(plugin)` for renderer-level extensibility.
- [x] **Visual Scene Editor** (`apps/editor`, alpha): hierarchy panel + transform inspector + Save / Load (uses v0.10.0 serialization). Gizmo handles are post-1.0.
- [x] **WASM Acceleration Hook**: `getMathBackend()` / `registerMathBackend(backend)` registry. Default backend is pure JS; a future `@joroya/wasm-math` package can drop in WASM without consumer code changes.
- [x] **170 tests** across 11 packages + an `api:check` script + an ESLint gate forbidding `any` and `@ts-ignore` in source.
- [x] [OA-011 EPIC](docs/features/OA-011/EPIC.md).

### Post-1.0 (future)
- [ ] **Production WASM modules**: a real `@joroya/wasm-math` shipping the integration point from v1.0.
- [ ] **Visual editor — gizmos**: translate / rotate / scale handles in 3D.
- [ ] **Multi-bone IK** (CCD / FABRIK) — `solve2BoneIK` ships in v1.0 but covers 2-bone chains only.
- [ ] **Playwright E2E suite** for the editor and demo apps.
- [ ] **Animation timeline editor** integrated into the visual editor.
- [ ] **Touch gestures** (pinch / swipe / rotate) on top of the v0.11 input manager.

## 🚀 Publishing & Deployment

### Packages on NPM

All packages are published to NPM under the `@joroya` scope:
- [@joroya/core](https://www.npmjs.com/package/@joroya/core)
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three)
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg)
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d)
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
