# Tutorial 15: Canvas2D — Tu primer render 2D sin dependencias 🟢

> **Nivel:** Principiante  
> **Tiempo estimado:** 15 minutos  
> **Qué aprenderás:** Renderizar escenas 2D usando el Canvas2D API nativo del navegador, sin Three.js ni ninguna dependencia externa.

---

## ¿Por qué Canvas2D?

| Renderer | Dependencias | Ideal para |
|----------|-------------|------------|
| `@joroya/renderer-three` | Three.js (~150 KB) | 3D, WebGL, modelos complejos |
| `@joroya/renderer-svg` | Ninguna | UI, vectores, server-side |
| `@joroya/renderer-canvas2d` | **Ninguna** | Partículas, juegos 2D, alto rendimiento |

El renderer Canvas2D dibuja directamente sobre un `<canvas>` HTML usando el API 2D nativo. Es perfecto cuando necesitas rendimiento sin el overhead de WebGL.

---

## Paso 1: Instalación

```bash
pnpm add @joroya/core @joroya/renderer-canvas2d
```

> Solo necesitas estos dos paquetes. No hay dependencias externas como Three.js.

---

## Paso 2: Setup del HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Canvas2D — Oroya Animate</title>
  <style>
    body { margin: 0; background: #0d1117; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { border: 1px solid #30363d; border-radius: 8px; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

---

## Paso 3: Crear la escena con cámara ortográfica

El renderer Canvas2D trabaja con una **cámara ortográfica** que mapea coordenadas del scene graph a píxeles del canvas:

```typescript
import {
  Scene, Node, Camera, CameraType,
  createBox, createSphere, Material,
} from '@joroya/core';
import { renderToCanvas } from '@joroya/renderer-canvas2d';

const scene = new Scene();

// Cámara ortográfica: define el "viewport" del mundo 2D
const cam = new Node('camera');
cam.addComponent(new Camera({
  type: CameraType.Orthographic,
  left: 0,
  right: 600,
  top: 0,
  bottom: 400,
  near: 0.1,
  far: 100,
}));
scene.add(cam);
```

### ¿Qué significan los parámetros?

| Parámetro | Significado |
|-----------|-------------|
| `left` / `right` | Rango horizontal visible (0 → 600 = 600px de ancho) |
| `top` / `bottom` | Rango vertical visible (0 → 400 = 400px de alto) |

---

## Paso 4: Agregar formas con colores

```typescript
// Rectángulo azul
const rect = new Node('blue-rect');
rect.addComponent(createBox(200, 120, 0)); // width, height, depth (0 para 2D)
rect.addComponent(new Material({
  fill: { r: 0.2, g: 0.5, b: 1.0 },
  stroke: { r: 0.1, g: 0.3, b: 0.8 },
  strokeWidth: 3,
}));
rect.transform.position = { x: 200, y: 150, z: 0 };
rect.transform.updateLocalMatrix();
scene.add(rect);

// Círculo verde
const circle = new Node('green-circle');
circle.addComponent(createSphere(50)); // radio = 50
circle.addComponent(new Material({
  fill: { r: 0.2, g: 0.85, b: 0.4 },
  stroke: { r: 0.1, g: 0.5, b: 0.2 },
  strokeWidth: 2,
}));
circle.transform.position = { x: 450, y: 250, z: 0 };
circle.transform.updateLocalMatrix();
scene.add(circle);
```

> **Nota:** `createSphere()` en 2D dibuja un círculo. `createBox()` dibuja un rectángulo. La coordenada `z` se ignora en Canvas2D.

---

## Paso 5: Render estático (one-shot)

La forma más simple de renderizar es con `renderToCanvas`:

```typescript
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

renderToCanvas(scene, canvas, {
  width: 600,
  height: 400,
  backgroundColor: { r: 0.05, g: 0.07, b: 0.09 },
});
```

Esto dibuja un solo frame. Perfecto para contenido estático.

---

## Paso 6: Animación con CanvasRenderer

Para animar, usa la clase `CanvasRenderer` que incluye un loop de animación:

```typescript
import { CanvasRenderer } from '@joroya/renderer-canvas2d';

const renderer = new CanvasRenderer();
const canvas = renderer.mount(document.body, {
  width: 600,
  height: 400,
});

let time = 0;

renderer.startLoop(() => {
  time += 0.02;

  // Animar posición del círculo
  circle.transform.position.y = 250 + Math.sin(time) * 80;
  circle.transform.updateLocalMatrix();

  // Animar escala del rectángulo
  const scale = 1 + Math.sin(time * 1.5) * 0.1;
  rect.transform.scale = { x: scale, y: scale, z: 1 };
  rect.transform.updateLocalMatrix();

  renderer.render(scene, {
    width: 600,
    height: 400,
    backgroundColor: { r: 0.05, g: 0.07, b: 0.09 },
  });
});
```

---

## Paso 7: Texto en Canvas2D

Puedes dibujar texto directamente en el canvas:

```typescript
import { createText } from '@joroya/core';

const label = new Node('label');
label.addComponent(createText('Hello Canvas2D!', {
  fontSize: 28,
  fontFamily: 'monospace',
  fontWeight: 'bold',
  textAnchor: 'center',
}));
label.addComponent(new Material({
  fill: { r: 1, g: 1, b: 1 },
}));
label.transform.position = { x: 300, y: 50, z: 0 };
label.transform.updateLocalMatrix();
scene.add(label);
```

---

## Paso 8: Path2D — Formas personalizadas

Para formas complejas, usa `createPath2D` con comandos SVG-like:

```typescript
import { createPath2D } from '@joroya/core';

// Triángulo personalizado
const triangle = new Node('triangle');
triangle.addComponent(createPath2D([
  { command: 'M', args: [0, -40] },     // Mover al vértice superior
  { command: 'L', args: [35, 30] },     // Línea al vértice inferior derecho
  { command: 'L', args: [-35, 30] },    // Línea al vértice inferior izquierdo
  { command: 'Z', args: [] },           // Cerrar el path
]));
triangle.addComponent(new Material({
  fill: { r: 1.0, g: 0.5, b: 0.1 },
  stroke: { r: 0.8, g: 0.3, b: 0.0 },
  strokeWidth: 2,
}));
triangle.transform.position = { x: 100, y: 320, z: 0 };
triangle.transform.updateLocalMatrix();
scene.add(triangle);
```

### Comandos disponibles

| Comando | Argumentos | Descripción |
|---------|-----------|-------------|
| `M` | `[x, y]` | Mover a punto |
| `L` | `[x, y]` | Línea recta a punto |
| `C` | `[cx1, cy1, cx2, cy2, x, y]` | Curva Bézier cúbica |
| `Q` | `[cx, cy, x, y]` | Curva Bézier cuadrática |
| `Z` | `[]` | Cerrar path |

---

## Código completo

```typescript
import {
  Scene, Node, Camera, CameraType,
  createBox, createSphere, createPath2D, Material,
} from '@joroya/core';
import { CanvasRenderer } from '@joroya/renderer-canvas2d';

const scene = new Scene();

// Cámara
const cam = new Node('camera');
cam.addComponent(new Camera({
  type: CameraType.Orthographic,
  left: 0, right: 600, top: 0, bottom: 400,
  near: 0.1, far: 100,
}));
scene.add(cam);

// Rectángulo
const rect = new Node('rect');
rect.addComponent(createBox(200, 120, 0));
rect.addComponent(new Material({
  fill: { r: 0.2, g: 0.5, b: 1.0 },
  stroke: { r: 0.1, g: 0.3, b: 0.8 },
  strokeWidth: 3,
}));
rect.transform.position = { x: 200, y: 150, z: 0 };
rect.transform.updateLocalMatrix();
scene.add(rect);

// Círculo
const circle = new Node('circle');
circle.addComponent(createSphere(50));
circle.addComponent(new Material({
  fill: { r: 0.2, g: 0.85, b: 0.4 },
}));
circle.transform.position = { x: 450, y: 250, z: 0 };
circle.transform.updateLocalMatrix();
scene.add(circle);

// Triángulo
const triangle = new Node('triangle');
triangle.addComponent(createPath2D([
  { command: 'M', args: [0, -40] },
  { command: 'L', args: [35, 30] },
  { command: 'L', args: [-35, 30] },
  { command: 'Z', args: [] },
]));
triangle.addComponent(new Material({
  fill: { r: 1.0, g: 0.5, b: 0.1 },
  stroke: { r: 0.8, g: 0.3, b: 0.0 },
  strokeWidth: 2,
}));
triangle.transform.position = { x: 100, y: 320, z: 0 };
triangle.transform.updateLocalMatrix();
scene.add(triangle);

// Renderer con animación
const renderer = new CanvasRenderer();
renderer.mount(document.body, { width: 600, height: 400 });

let time = 0;
renderer.startLoop(() => {
  time += 0.02;
  circle.transform.position.y = 250 + Math.sin(time) * 80;
  circle.transform.updateLocalMatrix();

  renderer.render(scene, {
    width: 600,
    height: 400,
    backgroundColor: { r: 0.05, g: 0.07, b: 0.09 },
  });
});
```

---

## Siguiente tutorial

➡️ [Tutorial 16: Carga modelos 3D con el glTF Loader](./16-gltf-loader.md) — importa modelos de Blender.
