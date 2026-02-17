# @joroya/core

> Core scene graph and component system for building 2D/3D graphics with any rendering backend

[![NPM Version](https://img.shields.io/npm/v/@joroya/core?style=flat-square)](https://www.npmjs.com/package/@joroya/core)
[![License](https://img.shields.io/npm/l/@joroya/core?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@joroya/core?style=flat-square)](https://bundlephobia.com/package/@joroya/core)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- 識 **Engine-Agnostic Scene Graph** - Define your scene once, render anywhere
- 女・・**Component System** - Modular architecture with reusable components
- 売 **Transform Hierarchy** - Full parent-child transform propagation
- 逃 **Geometry Primitives** - Box, Sphere, Circle, Path2D, and more
- 耳 **Material System** - Color, stroke, fill properties
- 磁 **Camera Component** - Perspective and orthographic cameras
- 統 **Serialization** - Save and load scenes as JSON
- 孱・・**TypeScript First** - Fully typed API

## Installation

```bash
npm install @joroya/core
```

## Quick Example

```typescript
import { Scene, Node, createBox, Material } from '@joroya/core';

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

`@joroya/core` is rendering backend agnostic. Use with:

- **[@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three)** - WebGL via Three.js
- **[@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg)** - Lightweight SVG
- Or create your own renderer!

```typescript
import { ThreeRenderer } from '@joroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas'),
  width: 800,
  height: 600
});

renderer.render(scene, cameraNode);
```

## Documentation

- 当 [Full Documentation](https://oroya-animate.vercel.app)
- 雌 [Getting Started Guide](https://oroya-animate.vercel.app/docs/getting-started)
- 答 [API Reference](https://oroya-animate.vercel.app/docs/api-reference)
- 識 [Tutorials](https://oroya-animate.vercel.app/docs/tutorials)

## CDN Usage

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
  
  const scene = new Scene();
  const node = new Node('test');
  scene.add(node);
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT ﾂｩ [joshuacba08](https://github.com/joshuacba08)
