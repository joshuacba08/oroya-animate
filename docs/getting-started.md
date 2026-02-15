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
C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.C:\devfiles\personal-projects\oroya-animate\packages\loader-gltf:
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @oroya/loader-gltf@0.1.0 build: `tsup`
Exit status 1
 ELIFECYCLE  Command failed with exit code 1.import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';

// Create the Scene
const scene = new Scene();

// Create a Camera node
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

// Create a Cube node
const cubeNode = new Node('my-cube');
cubeNode.addComponent(createBox(1, 1, 1));
cubeNode.addComponent(new Material({ 
    color: { r: 1, g: 0.2, b: 0.2 } 
}));
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
function animate(time: number) {
    time *= 0.001; // convert to seconds
    requestAnimationFrame(animate);
    
    // Update logic: Rotate the cube
    const speed = 0.5;
    cubeNode.transform.rotation.x = Math.sin(time * speed) * 2;
    cubeNode.transform.rotation.y = Math.cos(time * speed) * 2;
    cubeNode.transform.updateLocalMatrix(); // Recompute the local matrix
    
    // Sync Oroya scene with Three.js and render
    renderer.render();
}

requestAnimationFrame(animate);
```

## 🧱 Key Concepts

### Nodes
Nodes are the building blocks of your world. They form a hierarchy where children inherit the transformations (position, rotation, scale) of their parents.

### Components
Components add behavior or data to nodes. 
-   **Transform:** Automatically added to every Node. Call `updateLocalMatrix()` after mutating position/rotation/scale.
-   **Geometry:** Defines the shape (Box, Sphere, Path2D).
-   **Material:** Defines the appearance (Color, opacity).
-   **Camera:** Defines a viewpoint in the scene (Perspective, Orthographic planned).

### Backends
The renderer is chosen by you. If you want high-performance WebGL, use `@oroya/renderer-three`. If you need a scalable 2D graphic for documentation or static sites, use `@oroya/renderer-svg`.
