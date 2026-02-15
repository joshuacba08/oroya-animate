# Renderers

Oroya Animate uses a "compiler" pattern: renderers translate the engine-agnostic Scene Graph into technology-specific objects. This page documents the currently available renderers.

---

## `@oroya/renderer-three` — Three.js (WebGL)

The primary 3D renderer. It uses [Three.js](https://threejs.org/) under the hood to produce high-quality WebGL output.

### Setup

```typescript
import { ThreeRenderer } from '@oroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
  dpr: window.devicePixelRatio, // optional
});
```

### Options

| Option   | Type               | Default                  | Description                  |
|----------|--------------------|--------------------------|------------------------------|
| `canvas` | `HTMLCanvasElement` | —                        | **Required.** Target canvas. |
| `width`  | `number`           | —                        | **Required.** Viewport width.|
| `height` | `number`           | —                        | **Required.** Viewport height.|
| `dpr`    | `number`           | `window.devicePixelRatio`| Device pixel ratio.          |

### API

| Method             | Description                                                              |
|--------------------|--------------------------------------------------------------------------|
| `mount(scene)`     | Connects an Oroya `Scene` and builds the initial Three.js scene objects. |
| `render()`         | Syncs Oroya transforms to Three.js objects and renders a frame.          |
| `dispose()`        | Cleans up WebGL resources. Call when unmounting.                         |

### How it works
1. **`mount()`** traverses the Oroya Scene Graph. For each node with a `Geometry` component, it creates the corresponding `THREE.Mesh`. Nodes with a `Camera` component become `THREE.PerspectiveCamera` instances. The first camera found becomes the **active camera**.
2. **`render()`** calls `scene.updateWorldMatrices()`, then reads each node's `worldMatrix` and applies it to its Three.js counterpart via `matrix.fromArray()` + `decompose()`. Finally, it renders the frame with the active camera.
3. If no camera node is found in the scene graph, a fallback `PerspectiveCamera` at `z = 5` is created automatically.
4. Ambient and directional lighting are added by default.

### Supported Geometries
- `Box` → `THREE.BoxGeometry`
- `Sphere` → `THREE.SphereGeometry`

### Supported Components
- `Geometry` → `THREE.Mesh`
- `Material` → `THREE.MeshStandardMaterial` (color, opacity, transparency)
- `Camera` → `THREE.PerspectiveCamera` (Perspective type)

### Example (Vanilla)

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

const scene = new Scene();

// Camera
const cam = new Node('cam');
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cam.transform.position.z = 5;
scene.add(cam);

// Box
const box = new Node('box');
box.addComponent(createBox(1, 1, 1));
box.addComponent(new Material({ color: { r: 0.2, g: 0.6, b: 1.0 } }));
scene.add(box);

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

function loop(time: number) {
  time *= 0.001;
  box.transform.rotation.y = time;
  box.transform.updateLocalMatrix();
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## `@oroya/renderer-svg` — SVG (2D)

A lightweight renderer that outputs SVG markup from a 2D scene. Ideal for diagrams, icons, and server-side rendering.

### Usage

```typescript
import { renderToSVG } from '@oroya/renderer-svg';

const svgString = renderToSVG(scene, {
  width: 400,
  height: 300,
  viewBox: '0 0 400 300', // optional
});

document.getElementById('container')!.innerHTML = svgString;
```

### Options

| Option    | Type     | Default                    | Description             |
|-----------|----------|----------------------------|-------------------------|
| `width`   | `number` | —                          | **Required.** SVG width.|
| `height`  | `number` | —                          | **Required.** SVG height.|
| `viewBox` | `string` | `"0 0 {width} {height}"`  | SVG viewBox attribute.  |

### Supported Geometries
- `Path2D` → `<path>` element

### Material Properties (SVG-specific)

| Property      | Type       | Description                        |
|---------------|------------|------------------------------------|
| `fill`        | `ColorRGB` | Fill color of the SVG shape.       |
| `stroke`      | `ColorRGB` | Stroke color of the SVG shape.     |
| `strokeWidth` | `number`   | Width of the stroke.               |

### Example

```typescript
import { Scene, Node, createPath2D, Material } from '@oroya/core';
import { renderToSVG } from '@oroya/renderer-svg';

const scene = new Scene();
const triangle = new Node('triangle');
triangle.addComponent(createPath2D([
  { command: 'moveTo', args: [200, 50] },
  { command: 'lineTo', args: [350, 250] },
  { command: 'lineTo', args: [50, 250] },
  { command: 'closePath', args: [] },
]));
triangle.addComponent(new Material({
  fill: { r: 0.2, g: 0.8, b: 0.4 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2,
}));
scene.add(triangle);

const svg = renderToSVG(scene, { width: 400, height: 300 });
console.log(svg); // <svg>...</svg>
```

---

## Adding a Custom Renderer

Since `@oroya/core` is completely agnostic, you can build your own renderer. The pattern is:

1. Accept an Oroya `Scene` in a `mount()` method.
2. Use `scene.traverse()` to walk all nodes.
3. Read `ComponentType.Geometry` and `ComponentType.Material` to build your engine's objects.
4. On each `render()` call, sync transforms from Oroya nodes to your engine.

```typescript
// Pseudocode for a Canvas2D renderer
export class Canvas2DRenderer {
  mount(scene: Scene) {
    scene.traverse((node) => {
      // Build Canvas2D draw commands from node components
    });
  }

  render() {
    // Clear canvas, redraw based on current node transforms
  }
}
```
