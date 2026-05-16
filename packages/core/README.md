# @joroya/core

> Core scene graph and component system for building 2D/3D graphics with any rendering backend

[![NPM Version](https://img.shields.io/npm/v/@joroya/core?style=flat-square)](https://www.npmjs.com/package/@joroya/core)
[![License](https://img.shields.io/npm/l/@joroya/core?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@joroya/core?style=flat-square)](https://bundlephobia.com/package/@joroya/core)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- Engine-agnostic scene graph - Define your scene once, render anywhere
- Component system - Modular architecture with reusable components
- Transform hierarchy - Full parent-child transform propagation
- Geometry primitives - Box, sphere, cylinder, plane, cone, text, Path2D, buffer, and CSG definitions
- Material system - Color, stroke, fill properties
- Camera component - Perspective and orthographic cameras
- Serialization - Save and load scenes as JSON
- TypeScript first - Fully typed API

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
node.transform.position = { x: 1, y: 2, z: 3 };
node.addComponent(geometry);
node.addComponent(material);
node.add(childNode);
```

### Transform
Position, rotation, and scale in 3D space with matrix operations.

```typescript
node.transform.position = { x, y, z };
node.transform.rotation = { x: qx, y: qy, z: qz, w: qw };
node.transform.scale = { x: sx, y: sy, z: sz };
node.transform.updateLocalMatrix();
```

### Components

Add behavior and appearance to nodes:

- **Geometry**: `createBox()`, `createSphere()`, `createCylinder()`, `createPlane()`, `createCone()`, `createText()`, `createPath2D()`
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
- **[@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d)** - Browser-native Canvas2D
- Or create your own renderer!

```typescript
import { ThreeRenderer } from '@joroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas'),
  width: 800,
  height: 600
});

renderer.mount(scene);
renderer.render();
```

## Documentation

- 📖 [Full Documentation](https://oroya-animate.vercel.app)
- 🎓 [Getting Started Guide](https://oroya-animate.vercel.app/docs/getting-started)
- 📚 [API Reference](https://oroya-animate.vercel.app/docs/api-reference)
- 🎯 [Tutorials](https://oroya-animate.vercel.app/docs/tutorials)

## CDN Usage

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@1.0.0/dist/index.js';
  
  const scene = new Scene();
  const node = new Node('test');
  scene.add(node);
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
