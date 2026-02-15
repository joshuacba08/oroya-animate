# Getting Started with Oroya Animate

Welcome! This guide will help you get your first 3D scene up and running using Oroya Animate and the Three.js renderer.

## 📦 Installation

Since Oroya is a monorepo, you can install the packages you need from the registry (once published) or use them locally in your workspace.

```bash
pnpm add @oroya/core @oroya/renderer-three
```

## 🎮 Creating your first Scene

### 1. Basic Setup

First, let's create a Scene and a basic Node with a cube.

```typescript
import { Scene, Node, createBox, Material } from '@oroya/core';

// Create the Scene
const scene = new Scene();

// Create a Node
const cubeNode = new Node('my-cube');

// Add a Box geometry (1x1x1)
cubeNode.addComponent(createBox(1, 1, 1));

// Add a red Material
cubeNode.addComponent(new Material({ 
    color: { r: 1, g: 0.2, b: 0.2 } 
}));

// Position the cube
cubeNode.transform.position = { x: 0, y: 0, z: 0 };

// Add to scene structure
scene.add(cubeNode);
```

### 2. Rendering into a Canvas

To see something, we need to attach a renderer to a `<canvas>` element.

```typescript
import { ThreeRenderer } from '@oroya/renderer-three';

const canvas = document.querySelector('#app-canvas') as HTMLCanvasElement;

const renderer = new ThreeRenderer({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
});

// Mount the Oroya scene into the Three.js renderer
renderer.mount(scene);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update logic: Rotate the cube
    cubeNode.transform.rotation.y += 0.01;
    
    // Sync Oroya scene with Three.js and render
    renderer.render();
}

animate();
```

## 🧱 Key Concepts

### Nodes
Nodes are the building blocks of your world. They form a hierarchy where children inherit the transformations (position, rotation, scale) of their parents.

### Components
Components add behavior or data to nodes. 
-   **Transform:** Automatically added to every Node.
-   **Geometry:** Defines the shape (Box, Sphere, etc.).
-   **Material:** Defines the appearance (Color, opacity, textures).

### Backends
The renderer is chosen by you. If you want high-performance WebGL, use `@oroya/renderer-three`. If you need a scalable 2D graphic for documentation or static sites, use `@oroya/renderer-svg`.
