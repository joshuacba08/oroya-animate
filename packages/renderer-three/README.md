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
  Camera, CameraType, Light, LightType, Material,
  Node, Scene, createBox, setFromAxisAngle,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
if (!canvas) throw new Error('Canvas element not found');

const scene = new Scene();
const camera = new Node('camera');
camera.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
camera.transform.position.z = 5;
scene.add(camera);

const ambient = new Node('ambient');
ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.6 }));
scene.add(ambient);

const sun = new Node('sun');
sun.addComponent(new Light({ type: LightType.Directional, intensity: 1.5 }));
sun.transform.position = { x: 3, y: 5, z: 4 };
scene.add(sun);

const cube = new Node('cube');
cube.addComponent(createBox());
cube.addComponent(new Material({ color: { r: 1, g: 0.2, b: 0.2 } }));
scene.add(cube);

const renderer = new ThreeRenderer({
  canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

let previousTime: number | undefined;
let elapsed = 0;
let frameId = 0;
function frame(time: number) {
  const dt = previousTime === undefined ? 0 : (time - previousTime) / 1000;
  previousTime = time;
  elapsed += dt;
  cube.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, elapsed * 0.5);
  cube.transform.updateLocalMatrix();
  renderer.render(dt);
  frameId = requestAnimationFrame(frame);
}
frameId = requestAnimationFrame(frame);

function stop() {
  cancelAnimationFrame(frameId);
  renderer.dispose();
}
window.addEventListener('pagehide', stop, { once: true });
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
renderer.enableOrbitControls(): void
renderer.disableOrbitControls(): void
renderer.disableInteraction(): void
renderer.enableInteraction(): void
renderer.dispose(): void
```

## Documentation

- [Full Documentation](https://oroya-animate.oroyajs.com)
- [Renderer Guide](https://oroya-animate.oroyajs.com/docs/renderers)
- [Tutorials](https://oroya-animate.oroyajs.com/tutorials)

## Browser setup

Use the [Getting Started guide](../../docs/getting-started.md) with a bundler such as Vite. Raw `dist/index.js` files retain external package imports and require dependency resolution in the browser.

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
