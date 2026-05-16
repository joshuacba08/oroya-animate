# @joroya/renderer-three

> Three.js (WebGL) renderer for Oroya Animate scene graphs

[![NPM Version](https://img.shields.io/npm/v/@joroya/renderer-three?style=flat-square)](https://www.npmjs.com/package/@joroya/renderer-three)
[![License](https://img.shields.io/npm/l/@joroya/renderer-three?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- 🎮 **WebGL Rendering** - High-performance 3D graphics via Three.js
- 🎥 **Camera Support** - Perspective and orthographic cameras
- 💡 **Lighting** - Ambient, directional, point, and spot lights with optional shadows
- 🎨 **Material Support** - PBR materials and basic colors
- 📦 **Geometry Primitives** - Box, sphere, cylinder, and custom meshes
- 🔄 **Per-frame Updates** - `render(dt?)` advances scene logic, animations, particles, controls, and backend sync

## Installation

```bash
npm install @joroya/core @joroya/renderer-three three
```

## Quick Example

```typescript
import { Scene, Node, Camera, CameraType, createBox, Material } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

// Create scene
const scene = new Scene();

// Add camera
const camera = new Node('camera');
camera.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000
}));
camera.transform.position.z = 5;
scene.add(camera);

// Add cube
const cube = new Node('cube');
cube.addComponent(createBox(1, 1, 1));
cube.addComponent(new Material({ color: { r: 1, g: 0.5, b: 0 } }));
scene.add(cube);

// Create renderer
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight
});
renderer.mount(scene);

// Animation loop
function animate() {
  cube.transform.rotation.y += 0.01;
  cube.transform.updateLocalMatrix();
  renderer.render();
  requestAnimationFrame(animate);
}
animate();
```

## API

### ThreeRenderer

```typescript
const renderer = new ThreeRenderer({
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr?: number
});
```

### Methods

```typescript
renderer.mount(scene: Scene): void
renderer.render(dt?: number): void
renderer.setSize(width: number, height: number): void
renderer.enableInteraction(): void
renderer.dispose(): void
```

## Documentation

- 📖 [Full Documentation](https://oroya-animate.vercel.app)
- 📚 [Renderer Guide](https://oroya-animate.vercel.app/docs/renderers)
- 🎓 [Tutorials](https://oroya-animate.vercel.app/docs/tutorials)

## CDN Usage

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@1.0.0/dist/index.js';
  import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@1.0.0/dist/index.js';
  
  // Your code here
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
