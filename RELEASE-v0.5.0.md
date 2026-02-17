# Release Notes: v0.5.0

**Release Date:** February 17, 2026  
**Status:** ✅ Completed

## Overview

Version 0.5.0 marks a major milestone in Oroya Animate's journey toward production readiness with the completion of all core rendering backends and advanced 3D pipeline features.

## 🎉 Major New Features

### 1. Full glTF/GLB Model Loading

Import complex 3D models from Blender, Maya, or any glTF-compatible tool with full support for:

- ✅ Geometry (meshes, primitives)
- ✅ Materials (PBR materials with textures)
- ✅ Hierarchical scene structures
- ✅ Animations (keyframes)

**Example:**

```typescript
import { Scene } from '@joroya/core';
import { loadGLTF } from '@joroya/loader-gltf';
import { ThreeRenderer } from '@joroya/renderer-three';

const scene = new Scene();
const modelNode = await loadGLTF('/models/spaceship.glb');
scene.add(modelNode);

const renderer = new ThreeRenderer({ canvas, width, height });
renderer.mount(scene);
renderer.render();
```

### 2. Canvas2D Renderer

A new lightweight rendering backend for 2D graphics using the browser's native Canvas API:

- ✅ Zero external dependencies (no Three.js required)
- ✅ Perfect for UI overlays, HUDs, and 2D games
- ✅ Hardware-accelerated 2D graphics
- ✅ Full transform hierarchy support

**Example:**

```typescript
import { Scene, Node, createCircle, Material } from '@joroya/core';
import { Canvas2DRenderer } from '@joroya/renderer-canvas2d';

const scene = new Scene();
const circle = new Node('my-circle');
circle.addComponent(createCircle(50));
circle.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));
scene.add(circle);

const renderer = new Canvas2DRenderer({ canvas, width, height });
renderer.mount(scene);
renderer.render();
```

### 3. Boolean Operations (CSG)

Constructive Solid Geometry operations for creating complex shapes:

- ✅ **Union**: Combine two geometries
- ✅ **Subtract**: Remove one geometry from another
- ✅ **Intersect**: Keep only the overlapping region

Powered by `three-csg-ts` for high-performance mesh operations.

**Example:**

```typescript
import { Scene, Node, createCSG, CSGOperation, Material } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const node = new Node('csg-shape');
node.addComponent(createCSG({
  operation: CSGOperation.Subtract,
  base: createBox(2, 2, 2),
  modifier: createSphere(1.2, 32, 32)
}));
node.addComponent(new Material({ color: { r: 0, g: 0.7, b: 1 } }));
scene.add(node);
```

### 4. Cubic Spline Interpolation

Professional-grade animation interpolation for ultra-smooth transitions:

- ✅ **C1 continuity**: Smooth velocity at keyframes
- ✅ **Hermite splines**: Industry-standard interpolation
- ✅ **No overshooting**: Predictable motion paths

Perfect for camera movements, object trajectories, and character animations.

**Example:**

```typescript
import { AnimationClip, KeyframeTrack, InterpolationType } from '@joroya/core';

const clip = new AnimationClip('smooth-movement', 3.0, [
  new KeyframeTrack('position', [0, 1, 2, 3], [...], InterpolationType.CubicSpline)
]);
```

### 5. Proper Quaternion SLERP

Spherical Linear Interpolation for rotations:

- ✅ **No gimbal lock**: Stable rotations in all orientations
- ✅ **Shortest path**: Optimal rotation interpolation
- ✅ **Constant angular velocity**: Smooth rotation speed

Essential for character controllers, camera systems, and physics simulations.

### 6. Complete SVG Backend

The SVG renderer now has feature parity with other backends:

- ✅ Full transform support (position, rotation, scale)
- ✅ Group hierarchy (`<g>` elements)
- ✅ Clipping paths and masks
- ✅ SVG-specific features (gradients, filters, patterns)

## 📦 Updated Packages

All packages have been updated to v0.5.0:

- `@joroya/core@0.5.0`
- `@joroya/renderer-three@0.5.0`
- `@joroya/renderer-svg@0.5.0`
- `@joroya/renderer-canvas2d@0.5.0` ⭐ New
- `@joroya/loader-gltf@0.5.0`

## 🔧 Breaking Changes

### Organization Scope Change

All packages have been renamed from `@oroya/*` to `@joroya/*`:

**Before:**
```typescript
import { Scene } from '@oroya/core';
```

**After:**
```typescript
import { Scene } from '@joroya/core';
```

**Migration:** Simply update your imports and reinstall dependencies:

```bash
npm uninstall @oroya/core @oroya/renderer-three
npm install @joroya/core @joroya/renderer-three
```

## 🚀 Getting Started with v0.5.0

### Installation

```bash
# Core + Three.js renderer
npm install @joroya/core @joroya/renderer-three

# SVG renderer
npm install @joroya/core @joroya/renderer-svg

# Canvas2D renderer (NEW!)
npm install @joroya/core @joroya/renderer-canvas2d

# glTF loader
npm install @joroya/loader-gltf
```

### CDN Usage

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@0.5.0/dist/index.js';
  import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@0.5.0/dist/index.js';
  // Your code here...
</script>
```

## 📚 Documentation

- **Main Documentation**: https://oroya-animate.vercel.app
- **CHANGELOG**: [CHANGELOG.md](CHANGELOG.md)
- **API Reference**: [docs/api-reference.md](docs/api-reference.md)
- **Tutorials**: [docs/tutorials/](docs/tutorials/)

## 🌐 Multilingual Support

Full documentation is now available in:

- 🇬🇧 **English**: [README.md](README.md)
- 🇪🇸 **Español**: [README-ES.md](README-ES.md)
- 🇯🇵 **日本語**: [README-JA.md](README-JA.md)

## 🎯 What's Next?

### v1.0.0 — Production Ready (Upcoming)

- [ ] WASM high-performance modules
- [ ] Visual scene editor
- [ ] Framework wrappers (Vue, Angular)
- [ ] Plugin system for custom components
- [ ] Physics integration (Rapier, Cannon.js)

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](docs/contributing.md) for details.

---

## Links

- **NPM Organization**: https://www.npmjs.com/org/joroya
- **GitHub Repository**: https://github.com/joshuacba08/oroya-animate
- **Documentation Website**: https://oroya-animate.vercel.app
- **Report Issues**: https://github.com/joshuacba08/oroya-animate/issues

---

**Made with ❤️ by the Oroya AI Collaborator**
