---
title: "Introducción"
description: "Guía rápida para configurar Oroya Animate y crear tu primera escena"
order: 1
category: "guide"
---
# Comenzando con Oroya Animate

¡Bienvenido! Esta guía te ayudará a crear tu primera escena 3D usando **Oroya Animate**, un motor de escena gráfica agnóstico al renderer para la web.

Oroya Animate separa la definición de tu escena del backend de renderizado. Describes tu mundo una sola vez usando `@joroya/core` y luego eliges cómo renderizarlo — WebGL vía Three.js, SVG para gráficos estáticos, Canvas 2D, o cualquier backend futuro.

---

## Instalación

Instala los paquetes que necesites desde npm usando tu gestor de paquetes preferido:

```bash
# npm
npm install @joroya/core @joroya/renderer-three three

# yarn
yarn add @joroya/core @joroya/renderer-three three

# pnpm
pnpm add @joroya/core @joroya/renderer-three three
```

### Paquetes disponibles

| Paquete | Descripción |
|---|---|
| `@joroya/core` | Grafo de escena, nodos, componentes, serialización, utilidades matemáticas |
| `@joroya/renderer-three` | Backend WebGL que traduce escenas Oroya a objetos Three.js |
| `@joroya/renderer-svg` | Renderer SVG para gráficos vectoriales 2D |
| `@joroya/renderer-canvas2d` | Renderer Canvas 2D para gráficos rasterizados 2D |
| `@joroya/loader-gltf` | Carga modelos glTF en una escena Oroya |

> **Nota:** `@joroya/renderer-three` y `@joroya/loader-gltf` tienen `three` como dependencia peer. Asegúrate de instalarlo en tu proyecto: `npm install three`.

---

## Inicio Rápido — Cubo Rotando

Este ejemplo mínimo crea una escena con una cámara, iluminación y un cubo rojo, y luego lo renderiza con Three.js.

### 1. HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Oroya Animate - Inicio Rápido</title>
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

### 2. Configuración de la Escena (`main.ts`)

```typescript
import {
  Scene, Node, createBox, Material,
  Camera, CameraType, Light, LightType,
  setFromAxisAngle,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

// --- Escena ---
const scene = new Scene();

// --- Cámara ---
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

// --- Iluminación ---
const ambient = new Node('ambient');
ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
scene.add(ambient);

const sun = new Node('sun');
sun.addComponent(new Light({
  type: LightType.Directional,
  intensity: 0.8,
  target: { x: 0, y: 0, z: 0 },
}));
sun.transform.position = { x: 3, y: 6, z: 4 };
scene.add(sun);

// --- Cubo ---
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

// --- Bucle de animación ---
function animate(time: number) {
  time *= 0.001; // convertir a segundos
  requestAnimationFrame(animate);

  const speed = 0.5;
  cubeNode.transform.rotation = setFromAxisAngle(
    { x: 0.4, y: 1, z: 0 },
    time * speed,
  );
  cubeNode.transform.updateLocalMatrix();

  renderer.render();
}
requestAnimationFrame(animate);
```

¡Eso es todo! Deberías ver un cubo rojo rotando en pantalla.

---

## Conceptos Clave

### Escena (Scene)

La `Scene` es el contenedor de nivel superior. Contiene un `Node` raíz y proporciona métodos para agregar/eliminar nodos, recorrer el grafo y actualizar las matrices de mundo.

```typescript
const scene = new Scene();
scene.add(someNode);                    // agregar a la raíz
scene.add(childNode, parentNode);       // agregar bajo un padre específico
scene.remove(someNode);                 // eliminar de su padre
scene.findNodeByName('my-cube');        // buscar por nombre
scene.findNodeById(id);                 // buscar por ID único
scene.traverse((node) => { /* ... */ });
```

### Nodos (Nodes)

Los nodos son los bloques fundamentales del grafo de escena. Forman una jerarquía padre-hijo donde los hijos heredan la transformación de mundo de sus padres.

```typescript
const parent = new Node('solar-system');
const earth  = new Node('earth');
const moon   = new Node('moon');

parent.add(earth);
earth.add(moon);   // la luna hereda la transformación de la tierra

scene.add(parent);
```

### Componentes (Components)

Los componentes adjuntan datos o comportamiento a los nodos. Cada nodo obtiene un componente `Transform` por defecto.

| Componente | Descripción |
|---|---|
| **Transform** | Posición (`Vec3`), rotación (`Quat`) y escala (`Vec3`). Llama a `updateLocalMatrix()` después de modificar valores. |
| **Geometry** | Define la forma de un nodo. Se crea mediante funciones de fábrica. |
| **Material** | Define la apariencia — color, opacidad, fill/stroke (para SVG), metalness/roughness (para PBR). |
| **Camera** | Define un punto de vista — Perspectiva u Ortográfica. |
| **Light** | Define una fuente de luz — Ambient, Directional, Point o Spot. |

```typescript
// Agregar componentes
node.addComponent(createBox(2, 2, 2));
node.addComponent(new Material({ color: { r: 0, g: 1, b: 0 }, opacity: 0.8 }));

// Consultar componentes
node.hasComponent(ComponentType.Geometry); // true
const geo = node.getComponent<Geometry>(ComponentType.Geometry);
```

---

## Primitivas de Geometría

Oroya proporciona funciones de fábrica para crear componentes de geometría:

### Caja (Box)

```typescript
import { createBox } from '@joroya/core';

const box = createBox(2, 1, 3); // ancho, alto, profundidad
node.addComponent(box);
```

### Esfera (Sphere)

```typescript
import { createSphere } from '@joroya/core';

const sphere = createSphere(0.5, 32, 32); // radio, segmentosAncho, segmentosAlto
node.addComponent(sphere);
```

### Path2D (para renderizado SVG/Canvas2D)

```typescript
import { createPath2D } from '@joroya/core';

const triangle = createPath2D([
  { command: 'M', args: [50, 0] },
  { command: 'L', args: [100, 100] },
  { command: 'L', args: [0, 100] },
  { command: 'Z', args: [] },
]);
node.addComponent(triangle);
```

### Texto

```typescript
import { createText } from '@joroya/core';

const text = createText('¡Hola Mundo!', {
  fontSize: 24,
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  textAnchor: 'middle',
});
node.addComponent(text);
```

---

## Materiales

El componente `Material` controla la apariencia visual de un nodo. Sus propiedades se adaptan al renderer elegido.

```typescript
import { Material } from '@joroya/core';

// Para 3D (renderer Three.js)
node.addComponent(new Material({
  color: { r: 0.2, g: 0.5, b: 1.0 },
  opacity: 0.9,
  metalness: 0.3,
  roughness: 0.5,
}));

// Para 2D (renderer SVG o Canvas2D)
node.addComponent(new Material({
  fill: { r: 1, g: 0.8, b: 0 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2,
}));
```

Los colores usan el formato `ColorRGB` donde cada canal va de `0` a `1`.

---

## Iluminación

El componente `Light` define fuentes de luz en la escena. Se soportan cuatro tipos:

```typescript
import { Light, LightType } from '@joroya/core';

// Luz ambiental — iluminación uniforme en todas las direcciones
const ambient = new Node('ambient');
ambient.addComponent(new Light({
  type: LightType.Ambient,
  color: { r: 1, g: 1, b: 1 },
  intensity: 0.4,
}));
scene.add(ambient);

// Luz direccional — rayos paralelos (como el sol)
const sun = new Node('sun');
sun.addComponent(new Light({
  type: LightType.Directional,
  intensity: 0.9,
  target: { x: 0, y: 0, z: 0 },
}));
sun.transform.position = { x: 5, y: 10, z: 5 };
scene.add(sun);

// Luz puntual — emite en todas las direcciones desde un punto
const bulb = new Node('bulb');
bulb.addComponent(new Light({
  type: LightType.Point,
  color: { r: 1, g: 0.8, b: 0.4 },
  intensity: 2.0,
  distance: 15,
  decay: 2,
}));
bulb.transform.position = { x: -3, y: 4, z: 2 };
scene.add(bulb);

// Luz spot — cono de luz (como una linterna)
const spot = new Node('spot');
spot.addComponent(new Light({
  type: LightType.Spot,
  intensity: 3.0,
  angle: 0.5,
  penumbra: 0.4,
  target: { x: 0, y: 0, z: 0 },
}));
spot.transform.position = { x: 0, y: 8, z: 0 };
scene.add(spot);
```

---

## Cámara

Una cámara define el punto de vista desde el cual se renderiza la escena. Adjúntala a un nodo y posiciónala usando la transformación del nodo.

```typescript
import { Camera, CameraType } from '@joroya/core';

const cameraNode = new Node('camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: 16 / 9,
  near: 0.1,
  far: 500,
}));

// Posición y orientación
cameraNode.transform.position = { x: 0, y: 3, z: 10 };
cameraNode.transform.updateLocalMatrix();

scene.add(cameraNode);
```

El `ThreeRenderer` usa la primera cámara que encuentra en la escena. Si no hay ninguna, crea una cámara perspectiva por defecto en `z = 5`.

---

## Renderers

### Three.js (WebGL)

Usa `@joroya/renderer-three` para escenas 3D interactivas de alto rendimiento.

```typescript
import { ThreeRenderer } from '@joroya/renderer-three';

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
  dpr: window.devicePixelRatio, // opcional
});

renderer.mount(scene);
renderer.enableOrbitControls(); // controles de cámara con el mouse

function loop() {
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Limpiar cuando termines
renderer.dispose();
```

### SVG

Usa `@joroya/renderer-svg` para salida vectorial 2D escalable — ideal para documentación, íconos o ilustraciones estáticas.

```typescript
import { renderToSVG } from '@joroya/renderer-svg';

const svgString = renderToSVG(scene, {
  width: 200,
  height: 200,
  viewBox: '0 0 200 200', // opcional
});

document.getElementById('svg-container')!.innerHTML = svgString;
```

### Canvas 2D

Usa `@joroya/renderer-canvas2d` para renderizado 2D rasterizado con formas, texto y paths.

```typescript
import { renderToCanvas } from '@joroya/renderer-canvas2d';

renderToCanvas(scene, canvas, {
  width: 500,
  height: 500,
  backgroundColor: { r: 0.06, g: 0.07, b: 0.1 },
});
```

---

## Ejemplo de Jerarquía de Escena

Las transformaciones se propagan a través del árbol. La matriz de mundo de un hijo es el producto de la matriz de mundo de su padre y su propia matriz local.

```typescript
const solarSystem = new Node('solar-system');

// Sol en el origen
const sun = new Node('sun');
sun.addComponent(createSphere(2, 32, 32));
sun.addComponent(new Material({
  color: { r: 1, g: 0.9, b: 0.2 },
  emissive: { r: 1, g: 0.7, b: 0.1 },
}));
solarSystem.add(sun);

// La Tierra orbita el sol
const earth = new Node('earth');
earth.addComponent(createSphere(0.5, 32, 32));
earth.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));
earth.transform.position.x = 5;
solarSystem.add(earth);

// La Luna orbita la Tierra
const moon = new Node('moon');
moon.addComponent(createSphere(0.15, 16, 16));
moon.addComponent(new Material({ color: { r: 0.8, g: 0.8, b: 0.8 } }));
moon.transform.position.x = 1;
earth.add(moon);

scene.add(solarSystem);

// En el bucle de animación, rotar el sistema
function animate(time: number) {
  time *= 0.001;
  requestAnimationFrame(animate);

  solarSystem.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, time * 0.1);
  solarSystem.transform.updateLocalMatrix();

  earth.transform.rotation = setFromAxisAngle({ x: 0, y: 1, z: 0 }, time * 0.5);
  earth.transform.updateLocalMatrix();

  renderer.render();
}
requestAnimationFrame(animate);
```

---

## Carga de Modelos glTF

El paquete `@joroya/loader-gltf` permite cargar archivos glTF/GLB estándar y convertirlos en nodos de escena Oroya.

```bash
npm install @joroya/loader-gltf three
```

```typescript
import { loadGLTF } from '@joroya/loader-gltf';
import { ThreeRenderer } from '@joroya/renderer-three';

const { scene: gltfScene, animations } = await loadGLTF('/models/robot.glb');

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: 800,
  height: 600,
});
renderer.mount(gltfScene);

// Reproducir animaciones si existen
if (animations.length > 0) {
  const mixer = new AnimationMixer(gltfScene);
  mixer.play(animations[0]);
}

function loop() {
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

---

## Serialización

Las escenas Oroya se pueden serializar a JSON y deserializar de vuelta, facilitando guardar/cargar escenas o transmitirlas por red.

```typescript
import { serialize, deserialize } from '@joroya/core';

// Guardar escena en JSON
const json = serialize(scene);
localStorage.setItem('my-scene', json);

// Cargar escena desde JSON
const restored = deserialize(localStorage.getItem('my-scene')!);
renderer.mount(restored);
```

---

## Integración con React

Envuelve Oroya en un componente React para integrarlo en tu interfaz:

```tsx
import { useEffect, useRef } from 'react';
import {
  Scene, Node, createBox, Material,
  Camera, CameraType, Light, LightType,
} from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

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

// Uso
function App() {
  const scene = new Scene();

  const cam = new Node('cam');
  cam.addComponent(new Camera({
    type: CameraType.Perspective, fov: 75,
    aspect: 16 / 9, near: 0.1, far: 1000,
  }));
  cam.transform.position.z = 5;
  scene.add(cam);

  // Iluminación
  const ambient = new Node('ambient');
  ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.4 }));
  scene.add(ambient);

  const cube = new Node('cube');
  cube.addComponent(createBox(1, 1, 1));
  cube.addComponent(new Material({ color: { r: 0.1, g: 0.6, b: 0.9 } }));
  scene.add(cube);

  return <OroyaCanvas scene={scene} />;
}
```

---

## Transform en Profundidad

Cada `Node` tiene un componente `Transform` con tres propiedades:

| Propiedad | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `position` | `Vec3 { x, y, z }` | `{ 0, 0, 0 }` | Traslación en el espacio 3D |
| `rotation` | `Quat { x, y, z, w }` | `{ 0, 0, 0, 1 }` | Rotación como cuaternión |
| `scale` | `Vec3 { x, y, z }` | `{ 1, 1, 1 }` | Factores de escala |

**Importante:** Después de modificar cualquier propiedad de transform, llama a `updateLocalMatrix()` para recalcular la matriz local. El renderer llama a `scene.updateWorldMatrices()` cada frame para propagar las transformaciones por la jerarquía.

```typescript
const node = new Node('box');
node.transform.position = { x: 2, y: 0, z: -3 };
node.transform.scale = { x: 2, y: 2, z: 2 };
node.transform.updateLocalMatrix();
```

---

## Recorrido y Búsqueda

Oroya proporciona múltiples formas de navegar el grafo de escena:

```typescript
// Recorrer todos los nodos en profundidad
scene.traverse((node) => {
  console.log(node.name, node.id);
});

// Buscar un nodo específico
const cam = scene.findNodeByName('main-camera');
const node = scene.findNodeById('some-uuid');

// Acceder a la jerarquía
const parent = node.parent;           // Node | null
const children = node.children;       // Node[]
```

---

## Siguientes Pasos

- **[Arquitectura](architecture.md)** — Entiende la filosofía de diseño y los límites de módulos.
- **[Renderers](renderers.md)** — Profundiza en las implementaciones de renderers.
- **[Grafo de Escena](scene-graph.md)** — Aprende cómo funciona la jerarquía de nodos y las transformaciones.
- **[Serialización](serialization.md)** — Detalles completos del formato JSON.
- **[Referencia API](api-reference.md)** — Documentación completa de la API.
- **[Contribuir](contributing.md)** — Cómo contribuir a Oroya Animate.
