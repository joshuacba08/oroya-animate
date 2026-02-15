# Oroya Animate 

A professional, engine-agnostic 2D/3D graphics library for the web. Built with TypeScript, designed for scalability and performance.

##  Vision

Oroya Animate is a high-level graphics library that decouples scene logic from rendering implementation. It allows developers to define complex scene graphs once and render them using different backends like Three.js (WebGL), SVG, or Canvas2D.

##  Key Features

- ** TypeScript First:** Fully typed API for a robust development experience.
- ** Modular Architecture:** Monorepo structure for clear separation of concerns.
- ** Engine Agnostic:** Define your scene once, render it anywhere.
- ** Multiple Backends:** Official support for Three.js (3D) and SVG (2D).
- ** glTF Support:** Load complex 3D models directly into the agnostic scene graph.
- ** React Friendly:** Optimized wrappers for modern frontend frameworks.

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
import { Scene, Node, createBox, Material } from '@oroya/core';

// 1. Create a scene
const scene = new Scene();

// 2. Create a node with geometry and material
const box = new Node('my-box');
box.addComponent(createBox(1, 1, 1));
box.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));

// 3. Add it to the scene
scene.add(box);
```

##  Roadmap

- [x] Initial Monorepo setup and core architecture.
- [x] Three.js and SVG basic renderers.
- [x] Basic glTF loading.
- [ ] Complete SVG backend functionality.
- [ ] Physics engine integration.
- [x] Initial documentation structure (see [`docs/`](docs/)).
- [ ] Comprehensive documentation site.

##  License

MIT  [joshuacba08](https://github.com/joshuacba08)
