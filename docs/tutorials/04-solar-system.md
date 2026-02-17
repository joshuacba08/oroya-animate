# Tutorial 4: Sistema Solar 🟡

> **Nivel:** Intermedio  
> **Tiempo estimado:** 20 minutos  
> **Qué aprenderás:** Transforms jerárquicos padre-hijo para crear órbitas anidadas.

---

## Concepto clave: Jerarquía de transforms

Cuando un nodo hijo rota, lo hace **relativo a su padre**. Si el padre también está rotando, el hijo orbita alrededor del padre. Este es el mismo principio que hace que la Luna orbite la Tierra mientras la Tierra orbita el Sol.

```
Scene
└── Sol (esfera amarilla, rota sobre sí mismo)
    ├── Pivot Tierra (nodo vacío, rota ↁEgenera la órbita)
    ━E  └── Tierra (esfera azul, desplazada en X)
    ━E      ├── Pivot Luna (nodo vacío, rota más rápido)
    ━E      ━E  └── Luna (esfera gris, desplazada en X)
    └── Pivot Marte (nodo vacío, rota más lento)
        └── Marte (esfera roja, desplazada en X)
```

---

## Paso 1: Crear el Sol

```typescript
import { Scene, Node, createSphere, Material, Camera, CameraType } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

const scene = new Scene();

// Cámara
const cam = new Node('camera');
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 8, z: 15 };
scene.add(cam);

// Sol
const sun = new Node('sun');
sun.addComponent(createSphere(1.5, 32, 32));
sun.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.1 } }));
scene.add(sun);
```

---

## Paso 2: Crear las órbitas con nodos pivot

El truco: un **nodo vacío** (sin geometría) que rota crea una órbita para todos sus hijos.

```typescript
// --- Tierra ---
const earthPivot = new Node('earth-pivot'); // Nodo vacío que rota
sun.add(earthPivot);                        // Hijo del Sol

const earth = new Node('earth');
earth.addComponent(createSphere(0.6, 32, 32));
earth.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));
earth.transform.position = { x: 5, y: 0, z: 0 }; // Distancia orbital
earthPivot.add(earth);

// --- Luna (hija de la Tierra) ---
const moonPivot = new Node('moon-pivot');
earth.add(moonPivot);

const moon = new Node('moon');
moon.addComponent(createSphere(0.2, 16, 16));
moon.addComponent(new Material({ color: { r: 0.7, g: 0.7, b: 0.7 } }));
moon.transform.position = { x: 1.2, y: 0, z: 0 };
moonPivot.add(moon);

// --- Marte ---
const marsPivot = new Node('mars-pivot');
sun.add(marsPivot);

const mars = new Node('mars');
mars.addComponent(createSphere(0.4, 32, 32));
mars.addComponent(new Material({ color: { r: 0.9, g: 0.3, b: 0.1 } }));
mars.transform.position = { x: 8, y: 0, z: 0 };
marsPivot.add(mars);
```

---

## Paso 3: Animar las rotaciones

```typescript
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

// Helper para crear rotación en eje Y desde un ángulo
function rotateY(angle: number) {
  return {
    x: 0,
    y: Math.sin(angle / 2),
    z: 0,
    w: Math.cos(angle / 2),
  };
}

let time = 0;

function animate() {
  time += 0.005;

  // Sol rota lentamente sobre sí mismo
  sun.transform.rotation = rotateY(time * 0.5);
  sun.transform.updateLocalMatrix();

  // Pivot de la Tierra rota ↁEla Tierra orbita el Sol
  earthPivot.transform.rotation = rotateY(time * 2);
  earthPivot.transform.updateLocalMatrix();

  // Pivot de la Luna rota más rápido ↁEla Luna orbita la Tierra
  moonPivot.transform.rotation = rotateY(time * 8);
  moonPivot.transform.updateLocalMatrix();

  // Pivot de Marte rota más lento ↁEMarte tiene órbita más lenta
  marsPivot.transform.rotation = rotateY(time * 1.2);
  marsPivot.transform.updateLocalMatrix();

  renderer.render();
  requestAnimationFrame(animate);
}

animate();
```

---

## ¿Cómo funciona?

La magia está en `updateWorldMatrices()` (llamado internamente por `renderer.render()`):

1. El **Sol** tiene su propia worldMatrix.
2. El **earthPivot** multiplica su rotación local ÁEla worldMatrix del Sol.
3. La **Tierra** multiplica su posición local (X=5) ÁEla worldMatrix del pivotEarth. Resultado: orbita a distancia 5 del Sol.
4. La **Luna** hace lo mismo relativo a la Tierra.

```
worldMatrix(luna) = local(luna) ÁElocal(moonPivot) ÁElocal(earth) ÁElocal(earthPivot) ÁElocal(sun)
```

---

## Experimenta

- Agrega más planetas con diferentes distancias y velocidades.
- Inclina las órbitas usando rotaciones en X y Z en los pivots.
- Agrega anillos a Saturno usando un cubo muy aplanado (`createBox(3, 0.05, 3)`).
- Varía el tamaño y color de los planetas para hacerlo más realista.

---

## Siguiente tutorial

➡�E�E[Tutorial 5: Arte Generativo SVG](./05-svg-generative-art.md)  Erenderer SVG y Path2D.
