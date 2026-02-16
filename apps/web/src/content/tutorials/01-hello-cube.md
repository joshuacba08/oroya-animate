---
title: "Hello Cube"
description: "Create your first 3D scene with a rotating cube"
order: 1
level: "beginner"
duration: "10 min"
---
# Tutorial 1: Hello Cube

> **Nivel:** Principiante  
> **Tiempo estimado:** 10 minutos  
> **Qué aprenderás:** Crear una escena mínima con un cubo 3D que rota usando `@oroya/core` y `@oroya/renderer-three`.

---

## Prerrequisitos

- El monorepo clonado y con `pnpm install` ejecutado.
- Los paquetes compilados (`pnpm build`).

---

## Paso 1: Setup del HTML

Crea un archivo HTML con un `<canvas>`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Hello Cube — Oroya Animate</title>
  <style>
    body { margin: 0; overflow: hidden; background: #1a1a2e; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

---

## Paso 2: Crear la escena

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

// 1. Crear la escena
const scene = new Scene();

// 2. Agregar una cámara
const cameraNode = new Node('camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

// 3. Crear el cubo
const cube = new Node('my-cube');
cube.addComponent(createBox(1, 1, 1));
cube.addComponent(new Material({ color: { r: 0.2, g: 0.6, b: 1.0 } }));
scene.add(cube);
```

### ¿Qué está pasando?

1. **`Scene`** es el contenedor raíz del scene graph.
2. **`Node`** es un elemento del árbol. Cada nodo tiene un `Transform` automático.
3. **`createBox(1,1,1)`** crea un componente de geometría de caja de 1×1×1.
4. **`Material`** define el color de la superficie (RGB normalizado: 0 a 1).
5. **`Camera`** define el punto de vista desde donde se renderiza.

---

## Paso 3: Inicializar el renderer y animar

```typescript
// 4. Crear el renderer Three.js
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

// 5. Loop de animación
let angle = 0;

function animate() {
  angle += 0.01;

  // Rotar el cubo usando quaternion simplificado (rotación en Y)
  cube.transform.rotation = {
    x: 0,
    y: Math.sin(angle / 2),
    z: 0,
    w: Math.cos(angle / 2),
  };
  cube.transform.updateLocalMatrix();

  renderer.render();
  requestAnimationFrame(animate);
}

animate();
```

### Conceptos clave

- **`transform.rotation`** usa quaterniones `{ x, y, z, w }`. Para rotar en el eje Y, usamos `sin(θ/2)` y `cos(θ/2)`.
- **`updateLocalMatrix()`** recalcula la matriz local a partir de position/rotation/scale.
- **`renderer.render()`** actualiza las matrices del mundo y dibuja el frame.

---

## Resultado

Un cubo azul brillante rotando suavemente sobre fondo oscuro.

---

## Código completo

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

const scene = new Scene();

const cameraNode = new Node('camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

const cube = new Node('my-cube');
cube.addComponent(createBox(1, 1, 1));
cube.addComponent(new Material({ color: { r: 0.2, g: 0.6, b: 1.0 } }));
scene.add(cube);

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

let angle = 0;
function animate() {
  angle += 0.01;
  cube.transform.rotation = {
    x: 0,
    y: Math.sin(angle / 2),
    z: 0,
    w: Math.cos(angle / 2),
  };
  cube.transform.updateLocalMatrix();
  renderer.render();
  requestAnimationFrame(animate);
}
animate();
```

---

## Siguiente tutorial

→ [Tutorial 2: Paleta de Colores](./02-color-palette.md) — múltiples formas y colores.
