# Tutorial 2: Paleta de Colores 🟢

> **Nivel:** Principiante  
> **Tiempo estimado:** 15 minutos  
> **Qué aprenderás:** Crear múltiples nodos con diferentes geometrías, colores y posiciones.

---

## Objetivo

Construir una escena con 5 figuras geométricas de diferentes colores dispuestas en línea, como una paleta de pintor.

---

## Paso 1: Crear la escena base

```typescript
import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const scene = new Scene();

// Cámara alejada para ver todos los objetos
const cam = new Node('camera');
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 100,
}));
cam.transform.position = { x: 0, y: 2, z: 10 };
scene.add(cam);
```

---

## Paso 2: Definir la paleta

Usamos un array para definir las figuras y sus propiedades:

```typescript
interface ShapeDef {
  name: string;
  geometry: 'box' | 'sphere';
  color: { r: number; g: number; b: number };
  position: { x: number; y: number; z: number };
  size: number;
}

const palette: ShapeDef[] = [
  { name: 'ruby',     geometry: 'box',    color: { r: 0.9, g: 0.1, b: 0.2 }, position: { x: -4, y: 0, z: 0 }, size: 1.0 },
  { name: 'amber',    geometry: 'sphere', color: { r: 1.0, g: 0.7, b: 0.0 }, position: { x: -2, y: 0, z: 0 }, size: 0.7 },
  { name: 'emerald',  geometry: 'box',    color: { r: 0.0, g: 0.8, b: 0.4 }, position: { x:  0, y: 0, z: 0 }, size: 1.2 },
  { name: 'sapphire', geometry: 'sphere', color: { r: 0.1, g: 0.4, b: 0.9 }, position: { x:  2, y: 0, z: 0 }, size: 0.8 },
  { name: 'amethyst', geometry: 'box',    color: { r: 0.6, g: 0.2, b: 0.8 }, position: { x:  4, y: 0, z: 0 }, size: 0.9 },
];
```

---

## Paso 3: Generar los nodos

```typescript
const nodes: Node[] = [];

palette.forEach((shape) => {
  const node = new Node(shape.name);

  // Geometría
  if (shape.geometry === 'box') {
    node.addComponent(createBox(shape.size, shape.size, shape.size));
  } else {
    node.addComponent(createSphere(shape.size, 32, 32));
  }

  // Material
  node.addComponent(new Material({ color: shape.color }));

  // Posición
  node.transform.position = shape.position;

  scene.add(node);
  nodes.push(node);
});
```

### Conceptos clave

- **`createBox(w, h, d)`** y **`createSphere(r, wSeg, hSeg)`** son factory functions que devuelven un componente `Geometry`.
- Cada nodo es **independiente**  Etiene su propia posición, geometría y material.
- Pueden mezclarse diferentes tipos de geometría en la misma escena.

---

## Paso 4: Animar con rotaciones individuales

Cada figura rota a una velocidad diferente:

```typescript
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

let time = 0;

function animate() {
  time += 0.01;

  nodes.forEach((node, i) => {
    const speed = 0.5 + i * 0.3; // Velocidad diferente por nodo
    const angle = time * speed;

    node.transform.rotation = {
      x: Math.sin(angle / 2) * 0.5,
      y: Math.sin(angle / 2),
      z: 0,
      w: Math.cos(angle / 2),
    };
    node.transform.updateLocalMatrix();
  });

  renderer.render();
  requestAnimationFrame(animate);
}

animate();
```

---

## Resultado

Cinco figuras geométricas de colores vibrantes rotando a diferentes velocidades, como una paleta de gemas flotantes. 💎

---

## Experimenta

- Cambia los colores para crear tu propia paleta de marca.
- Agrega más figuras al array.
- Prueba con `opacity` en el `Material` para crear figuras translúcidas:
  ```typescript
  new Material({ color: { r: 1, g: 1, b: 1 }, opacity: 0.5 })
  ```

---

## Siguiente tutorial

➡�E�E[Tutorial 3: Guardar y Cargar Escenas](./03-save-load-scenes.md)  Eserialización JSON.
