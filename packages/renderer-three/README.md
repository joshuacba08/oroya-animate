# @joroya/renderer-three

> WebGL backend that translates Oroya Animate scene graphs into Three.js objects.

[![NPM Version](https://img.shields.io/npm/v/@joroya/renderer-three?style=flat-square)](https://www.npmjs.com/package/@joroya/renderer-three)
[![License](https://img.shields.io/npm/l/@joroya/renderer-three?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate), a renderer-independent 2D/3D scene-graph library.

## Relationship to Three.js

This package uses Three.js as the rendering backend. You install `three`, but your application usually works with Oroya primitives such as `Scene`, `Node`, `Camera`, `Light`, `Material`, and `Geometry`. `ThreeRenderer` converts those components into Three.js objects during `mount()` and keeps them synchronized during `render(dt?)`.

Use this package when you want Three.js rendering with Oroya's portable scene model, serialization, animation, physics integration, input, and inspection utilities. For lower-level rendering needs, extend the renderer through plugins or use Three.js directly in the specific area that requires it.

## Features

- WebGL rendering through Three.js.
- Perspective and orthographic cameras.
- Ambient, directional, point, and spot lights with optional shadows.
- PBR material fields, textures, emissive properties, transparency, and basic colors.
- Box, sphere, cylinder, plane, cone, torus, circle, buffer, CSG, instanced, and skinned geometry support.
- Per-frame updates through `render(dt?)` for scene logic, animations, particles, controls, and backend synchronization.

## Installation

```bash
npm install @joroya/core @joroya/renderer-three three
```

## Quick Example

```typescript
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
let angle = 0;

function animate() {
  angle += 0.01;
  cube.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, angle);
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

- [Full Documentation](https://oroya-animate.oroyajs.com)
- [Renderer Guide](https://oroya-animate.oroyajs.com/docs/renderers)
- [Tutorials](https://oroya-animate.oroyajs.com/docs/tutorials)

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
