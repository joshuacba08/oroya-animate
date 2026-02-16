---
title: "Getting Started"
description: "Quick start guide for setting up Oroya Animate and creating your first scene"
order: 1
category: "guide"
---
﻿# Getting Started with Oroya Animate

Welcome! This guide will help you get your first 3D scene up and running using **Oroya Animate**, a renderer-agnostic scene graph engine for the web.

Oroya Animate separates your scene definition from the rendering backend. You describe your world once using `@oroya/core` and then choose how to render it - WebGL via Three.js, SVG for static graphics, or any future backend.

---

## Installation

Install the packages you need from npm using your preferred package manager:

```bash
# npm
npm install @oroya/core @oroya/renderer-three

# yarn
yarn add @oroya/core @oroya/renderer-three

# pnpm
pnpm add @oroya/core @oroya/renderer-three
```

### Available packages

| Package | Description |
|---|---|
| `@oroya/core` | Scene graph, nodes, components, serialization, math utilities |
| `@oroya/renderer-three` | WebGL renderer powered by Three.js |
| `@oroya/renderer-svg` | SVG renderer for 2D path-based graphics |
| `@oroya/loader-gltf` | Load glTF models into an Oroya scene |

> **Note:** `@oroya/renderer-three` and `@oroya/loader-gltf` have `three` as a peer dependency. Make sure it is installed in your project: `npm install three`.

---

## Quick Start - Rotating Cube

This minimal example creates a scene with a camera and a red cube, then renders it with Three.js.

### 1. HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Oroya Animate - Quick Start</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="oroya-canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### 2. Scene Setup (`main.ts`)

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

// --- Scene ---
const scene = new Scene();

// --- Camera ---
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

// --- Cube ---
const cubeNode = new Node('my-cube');
cubeNode.addComponent(createBox(1, 1, 1));
cubeNode.addComponent(new Material({ color: { r: 1, g: 0.2, b: 0.2 } }));
scene.add(cubeNode);

// --- Renderer ---
const canvas = document.getElementById('oroya-canvas') as HTMLCanvasElement;
const renderer = new ThreeRenderer({
  canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

// --- Animation loop ---
function animate(time: number) {
  time *= 0.001; // convert to seconds
  requestAnimationFrame(animate);

  const speed = 0.5;
  cubeNode.transform.rotation.x = Math.sin(time * speed) * 2;
  cubeNode.transform.rotation.y = Math.cos(time * speed) * 2;
  cubeNode.transform.updateLocalMatrix();

  renderer.render();
}
requestAnimationFrame(animate);
```

That's it - you should see a red cube rotating on screen.

---

## Key Concepts

### Scene

The `Scene` is the top-level container. It holds a root `Node` and provides utility methods to add/remove nodes, traverse the graph, and update world matrices.

```typescript
const scene = new Scene();
scene.add(someNode);                    // add to root
scene.add(childNode, parentNode);       // add under a specific parent
scene.remove(someNode);                 // remove from its parent
scene.findNodeByName('my-cube');        // search by name
scene.findNodeById(id);                 // search by unique ID
scene.traverse((node) => { /* ... */ });
```

### Nodes

Nodes are the building blocks of the scene graph. They form a parent-child hierarchy where children inherit the world transform of their parents.

```typescript
const parent = new Node('solar-system');
const earth  = new Node('earth');
const moon   = new Node('moon');

parent.add(earth);
earth.add(moon);   // moon inherits earth's transform

scene.add(parent);
```

### Components

Components attach data or behavior to nodes. Every node gets a `Transform` component by default.

| Component | Description |
|---|---|
| **Transform** | Position (`Vec3`), rotation (`Quat`), and scale (`Vec3`). Call `updateLocalMatrix()` after mutating values. |
| **Geometry** | Defines the shape of a node. Created via factory functions. |
| **Material** | Defines appearance - color, opacity, fill/stroke (for SVG). |
| **Camera** | Defines a viewpoint - Perspective (Orthographic planned). |

```typescript
// Adding components
node.addComponent(createBox(2, 2, 2));
node.addComponent(new Material({ color: { r: 0, g: 1, b: 0 }, opacity: 0.8 }));

// Querying components
node.hasComponent(ComponentType.Geometry); // true
const geo = node.getComponent<Geometry>(ComponentType.Geometry);
```

---

## Geometry Primitives

Oroya provides factory functions for creating geometry components:

### Box

```typescript
import { createBox } from '@oroya/core';

const box = createBox(2, 1, 3); // width, height, depth
node.addComponent(box);
```

### Sphere

```typescript
import { createSphere } from '@oroya/core';

const sphere = createSphere(0.5, 32, 32); // radius, widthSegments, heightSegments
node.addComponent(sphere);
```

### Path2D (for SVG rendering)

```typescript
import { createPath2D } from '@oroya/core';

const triangle = createPath2D([
  { command: 'moveTo', args: [50, 0] },
  { command: 'lineTo', args: [100, 100] },
  { command: 'lineTo', args: [0, 100] },
  { command: 'closePath', args: [] },
]);
node.addComponent(triangle);
```

---

## Materials

The `Material` component controls the visual appearance of a node. Its properties adapt to the chosen renderer.

```typescript
import { Material } from '@oroya/core';

// For 3D (Three.js renderer)
node.addComponent(new Material({
  color: { r: 0.2, g: 0.5, b: 1.0 },
  opacity: 0.9,
}));

// For 2D (SVG renderer)
node.addComponent(new Material({
  fill: { r: 1, g: 0.8, b: 0 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2,
}));
```

Colors use the `ColorRGB` format where each channel ranges from `0` to `1`.

---

## Camera

A camera defines the viewpoint from which the scene is rendered. Attach it to a node and position it using the node's transform.

```typescript
import { Camera, CameraType } from '@oroya/core';

const cameraNode = new Node('camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: 16 / 9,
  near: 0.1,
  far: 500,
}));

// Position and orientation
cameraNode.transform.position = { x: 0, y: 3, z: 10 };
cameraNode.transform.updateLocalMatrix();

scene.add(cameraNode);
```

The `ThreeRenderer` uses the first camera it finds in the scene. If none is present, it creates a default perspective camera at `z = 5`.

---

## Renderers

### Three.js (WebGL)

Use `@oroya/renderer-three` for interactive, high-performance 3D scenes.

```typescript
import { ThreeRenderer } from '@oroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
  dpr: window.devicePixelRatio, // optional - defaults to devicePixelRatio
});

renderer.mount(scene);

function loop() {
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Clean up when done
renderer.dispose();
```

The renderer automatically adds ambient and directional lights to the Three.js scene so geometry is visible out of the box.

### SVG

Use `@oroya/renderer-svg` for scalable 2D vector output - ideal for documentation, icons, or static illustrations.

```typescript
import { renderToSVG } from '@oroya/renderer-svg';

const svgString = renderToSVG(scene, {
  width: 200,
  height: 200,
  viewBox: '0 0 200 200', // optional
});

document.getElementById('svg-container')!.innerHTML = svgString;
```

> SVG rendering only supports `Path2D` geometries. Use `createPath2D()` to define shapes.

---

## Scene Hierarchy Example

Transforms propagate through the tree. A child's world matrix is the product of its parent's world matrix and its own local matrix.

```typescript
const solarSystem = new Node('solar-system');

// Sun at the origin
const sun = new Node('sun');
sun.addComponent(createSphere(2, 32, 32));
sun.addComponent(new Material({ color: { r: 1, g: 0.9, b: 0.2 } }));
solarSystem.add(sun);

// Earth orbits the sun
const earth = new Node('earth');
earth.addComponent(createSphere(0.5, 32, 32));
earth.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));
earth.transform.position.x = 5;
solarSystem.add(earth);

// Moon orbits the earth
const moon = new Node('moon');
moon.addComponent(createSphere(0.15, 16, 16));
moon.addComponent(new Material({ color: { r: 0.8, g: 0.8, b: 0.8 } }));
moon.transform.position.x = 1;
earth.add(moon);

scene.add(solarSystem);

// In the animation loop, rotate the system
function animate(time: number) {
  time *= 0.001;
  requestAnimationFrame(animate);

  solarSystem.transform.rotation.y = time * 0.1;
  solarSystem.transform.updateLocalMatrix();

  earth.transform.rotation.y = time * 0.5;
  earth.transform.updateLocalMatrix();

  renderer.render();
}
requestAnimationFrame(animate);
```

---

## Loading glTF Models

The `@oroya/loader-gltf` package lets you load standard glTF/GLB files and convert them into Oroya scene nodes.

```bash
npm install @oroya/loader-gltf three
```

```typescript
import { loadGLTF } from '@oroya/loader-gltf';
import { ThreeRenderer } from '@oroya/renderer-three';

const gltfScene = await loadGLTF('/models/robot.glb');

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
});
renderer.mount(gltfScene);

function loop() {
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## Serialization

Oroya scenes can be serialized to JSON and deserialized back, making it easy to save/load scenes or transmit them over the network.

```typescript
import { serialize, deserialize } from '@oroya/core';

// Save scene to JSON
const json = serialize(scene);
localStorage.setItem('my-scene', json);

// Load scene from JSON
const restored = deserialize(localStorage.getItem('my-scene')!);
renderer.mount(restored);
```

---

## React Integration

Wrap Oroya in a React component to integrate it into your UI:

```tsx
import { useEffect, useRef } from 'react';
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

function OroyaCanvas({ scene }: { scene: Scene }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new ThreeRenderer({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
    renderer.mount(scene);

    let frameId: number;
    const animate = (time: number) => {
      time *= 0.001;
      renderer.render();
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [scene]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// Usage
function App() {
  const scene = new Scene();

  const cam = new Node('cam');
  cam.addComponent(new Camera({
    type: CameraType.Perspective, fov: 75,
    aspect: 16 / 9, near: 0.1, far: 1000,
  }));
  cam.transform.position.z = 5;
  scene.add(cam);

  const cube = new Node('cube');
  cube.addComponent(createBox(1, 1, 1));
  cube.addComponent(new Material({ color: { r: 0.1, g: 0.6, b: 0.9 } }));
  scene.add(cube);

  return <OroyaCanvas scene={scene} />;
}
```

---

## Transform in Depth

Every `Node` has a `Transform` component with three properties:

| Property | Type | Default | Description |
|---|---|---|---|
| `position` | `Vec3 { x, y, z }` | `{ 0, 0, 0 }` | Translation in 3D space |
| `rotation` | `Quat { x, y, z, w }` | `{ 0, 0, 0, 1 }` | Rotation as a quaternion |
| `scale` | `Vec3 { x, y, z }` | `{ 1, 1, 1 }` | Scale factors |

**Important:** After modifying any transform property, call `updateLocalMatrix()` to recompute the local matrix. The renderer calls `scene.updateWorldMatrices()` each frame to propagate transforms down the hierarchy.

```typescript
const node = new Node('box');
node.transform.position = { x: 2, y: 0, z: -3 };
node.transform.scale = { x: 2, y: 2, z: 2 };
node.transform.updateLocalMatrix();
```

---

## Traversal and Search

Oroya provides multiple ways to navigate the scene graph:

```typescript
// Traverse all nodes depth-first
scene.traverse((node) => {
  console.log(node.name, node.id);
});

// Find a specific node
const cam = scene.findNodeByName('main-camera');
const node = scene.findNodeById('some-uuid');

// Access the hierarchy
const parent = node.parent;           // Node | null
const children = node.children;       // Node[]
```

---

## Next Steps

- **[Architecture](architecture.md)** - Understand the design philosophy and module boundaries.
- **[Renderers](renderers.md)** - Deep-dive into renderer implementations.
- **[Scene Graph](scene-graph.md)** - Learn how the node hierarchy and transforms work.
- **[Serialization](serialization.md)** - Full details on the JSON format.
- **[API Reference](api-reference.md)** - Complete API documentation.
- **[Contributing](contributing.md)** - How to contribute to Oroya Animate.
