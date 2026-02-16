# @oroya/core

> Core scene graph and component system for building 2D/3D graphics with any rendering backend

[![NPM Version](https://img.shields.io/npm/v/@oroya/core?style=flat-square)](https://www.npmjs.com/package/@oroya/core)
[![License](https://img.shields.io/npm/l/@oroya/core?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@oroya/core?style=flat-square)](https://bundlephobia.com/package/@oroya/core)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- 🎯 **Engine-Agnostic Scene Graph** - Define your scene once, render anywhere
- 🏗️ **Component System** - Modular architecture with reusable components
- 🔄 **Transform Hierarchy** - Full parent-child transform propagation
- 📦 **Geometry Primitives** - Box, Sphere, Circle, Path2D, and more
- 🎨 **Material System** - Color, stroke, fill properties
- 🎥 **Camera Component** - Perspective and orthographic cameras
- 📝 **Serialization** - Save and load scenes as JSON
- 🛡️ **TypeScript First** - Fully typed API

## Installation

```bash
npm install @oroya/core
```

## Quick Example

```typescript
import { Scene, Node, createBox, Material } from '@oroya/core';

// Create a scene
const scene = new Scene();

// Create a cube
const cube = new Node('my-cube');
cube.addComponent(createBox(1, 1, 1));
cube.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));

// Position it
cube.transform.position.x = 2;
cube.transform.rotation.y = Math.PI / 4;

// Add to scene
scene.add(cube);

// Update world transforms
scene.updateWorldMatrices();
```

## Core Classes

### Scene
Container for all nodes in your 3D/2D world.

```typescript
const scene = new Scene();
scene.add(node);
scene.remove(node);
scene.updateWorldMatrices();
```

### Node
Basic building block with transform, components, and children.

```typescript
const node = new Node('my-node');
node.transform.position.set(1, 2, 3);
node.addComponent(geometry);
node.addComponent(material);
node.addChild(childNode);
```

### Transform
Position, rotation, and scale in 3D space with matrix operations.

```typescript
node.transform.position.set(x, y, z);
node.transform.rotation.set(rx, ry, rz);
node.transform.scale.set(sx, sy, sz);
```

### Components

Add behavior and appearance to nodes:

- **Geometry**: `createBox()`, `createSphere()`, `createCircle()`, `createPath2D()`
- **Material**: Colors and rendering properties
- **Camera**: Perspective and orthographic projection

```typescript
const geometry = createSphere(1, 32, 32);
const material = new Material({ color: { r: 0, g: 1, b: 0 } });

node.addComponent(geometry);
node.addComponent(material);
```

## Rendering

`@oroya/core` is rendering backend agnostic. Use with:

- **[@oroya/renderer-three](https://www.npmjs.com/package/@oroya/renderer-three)** - WebGL via Three.js
- **[@oroya/renderer-svg](https://www.npmjs.com/package/@oroya/renderer-svg)** - Lightweight SVG
- Or create your own renderer!

```typescript
import { ThreeRenderer } from '@oroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas'),
  width: 800,
  height: 600
});

renderer.render(scene, cameraNode);
```

## Documentation

- 📖 [Full Documentation](https://oroya-animate.vercel.app)
- 🎓 [Getting Started Guide](https://oroya-animate.vercel.app/docs/getting-started)
- 📚 [API Reference](https://oroya-animate.vercel.app/docs/api-reference)
- 🎯 [Tutorials](https://oroya-animate.vercel.app/docs/tutorials)

## CDN Usage

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@oroya/core@0.3.0/dist/index.js';
  
  const scene = new Scene();
  const node = new Node('test');
  scene.add(node);
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
