# Tutorial 7: Ciudad Procedural 🔴

> **Nivel:** Avanzado  
> **Tiempo estimado:** 30 minutos  
> **Qué aprenderás:** Generar escenas complejas algorítmicamente, usar el scene graph como estructura de datos, y aplicar técnicas de generación procedural de ciudades.

---

## Concepto

En lugar de colocar objetos uno por uno, definimos **reglas** que generan la ciudad automáticamente. Esto demuestra el poder del scene graph como estructura de datos programable.

---

## Paso 1: Definir los parámetros de la ciudad

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

interface CityConfig {
  gridSize: number;       // Grilla NxN de cuadras
  blockSize: number;      // Tamaño de cada cuadra
  streetWidth: number;    // Ancho de calles
  maxBuildingHeight: number;
  minBuildingHeight: number;
  buildingsPerBlock: number;
}

const config: CityConfig = {
  gridSize: 6,
  blockSize: 8,
  streetWidth: 2,
  maxBuildingHeight: 12,
  minBuildingHeight: 1,
  buildingsPerBlock: 4,
};
```

---

## Paso 2: Generar el suelo y las calles

```typescript
const scene = new Scene();

// Helper: color aleatorio en un rango
function randomColor(base: { r: number; g: number; b: number }, variance: number) {
  return {
    r: Math.min(1, Math.max(0, base.r + (Math.random() - 0.5) * variance)),
    g: Math.min(1, Math.max(0, base.g + (Math.random() - 0.5) * variance)),
    b: Math.min(1, Math.max(0, base.b + (Math.random() - 0.5) * variance)),
  };
}

// Suelo principal
const totalSize = config.gridSize * (config.blockSize + config.streetWidth);
const ground = new Node('ground');
ground.addComponent(createBox(totalSize, 0.1, totalSize));
ground.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.25 } }));
ground.transform.position = { x: 0, y: -0.05, z: 0 };
scene.add(ground);
```

---

## Paso 3: Generar edificios por cuadra

```typescript
// Nodo contenedor para toda la ciudad
const city = new Node('city');
scene.add(city);

// Offset para centrar la ciudad en el origen
const offset = -totalSize / 2;

for (let row = 0; row < config.gridSize; row++) {
  for (let col = 0; col < config.gridSize; col++) {
    // Nodo contenedor por cuadra (agrupación lógica)
    const block = new Node(`block-${row}-${col}`);
    const blockX = offset + col * (config.blockSize + config.streetWidth) + config.blockSize / 2;
    const blockZ = offset + row * (config.blockSize + config.streetWidth) + config.blockSize / 2;
    block.transform.position = { x: blockX, y: 0, z: blockZ };
    city.add(block);

    // Generar edificios dentro de la cuadra
    for (let b = 0; b < config.buildingsPerBlock; b++) {
      const height = config.minBuildingHeight + 
        Math.random() * (config.maxBuildingHeight - config.minBuildingHeight);
      
      // Posición aleatoria dentro de la cuadra
      const margin = 1;
      const maxOffset = config.blockSize / 2 - margin;
      const bx = (Math.random() - 0.5) * maxOffset * 2;
      const bz = (Math.random() - 0.5) * maxOffset * 2;

      // Tamaño aleatorio del edificio
      const width = 0.8 + Math.random() * 2;
      const depth = 0.8 + Math.random() * 2;

      const building = new Node(`building-${row}-${col}-${b}`);
      building.addComponent(createBox(width, height, depth));
      
      // Color: tonos grises/azulados para edificios urbanos
      building.addComponent(new Material({
        color: randomColor({ r: 0.4, g: 0.45, b: 0.55 }, 0.15),
      }));
      
      building.transform.position = { x: bx, y: height / 2, z: bz };
      block.add(building);
    }
  }
}
```

---

## Paso 4: Agregar detalles — Parque central y torre destacada

```typescript
// Parque central (cuadra central diferente)
const centerIdx = Math.floor(config.gridSize / 2);
const parkBlock = city.findNodeByName(`block-${centerIdx}-${centerIdx}`);
if (parkBlock) {
  // Limpiar edificios del bloque central
  [...parkBlock.children].forEach(child => parkBlock.remove(child));

  // Agregar un "parque" (una caja verde plana)
  const park = new Node('central-park');
  park.addComponent(createBox(config.blockSize - 1, 0.2, config.blockSize - 1));
  park.addComponent(new Material({ color: { r: 0.1, g: 0.6, b: 0.2 } }));
  park.transform.position = { x: 0, y: 0.1, z: 0 };
  parkBlock.add(park);
}

// Torre principal (edificio más alto, color dorado)
const tower = new Node('main-tower');
const towerHeight = config.maxBuildingHeight * 2;
tower.addComponent(createBox(1.5, towerHeight, 1.5));
tower.addComponent(new Material({ color: { r: 0.9, g: 0.75, b: 0.3 } }));
tower.transform.position = { x: 3, y: towerHeight / 2, z: -3 };
city.add(tower);
```

---

## Paso 5: Cámara con vista panorámica y animación

```typescript
const cam = new Node('city-camera');
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 50,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 200,
}));
scene.add(cam);

const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);

let time = 0;

function animate() {
  time += 0.003;

  // Órbita de la cámara alrededor de la ciudad
  const radius = totalSize * 0.8;
  cam.transform.position = {
    x: Math.sin(time) * radius,
    y: 15 + Math.sin(time * 0.5) * 5,
    z: Math.cos(time) * radius,
  };
  cam.transform.updateLocalMatrix();

  renderer.render();
  requestAnimationFrame(animate);
}

animate();
```

---

## Estadísticas de la escena generada

Con la configuración por defecto (`gridSize: 6, buildingsPerBlock: 4`):

| Elemento | Cantidad |
|----------|----------|
| Cuadras | 36 |
| Edificios | ~144 |
| Nodos totales | ~180+ |
| Nodos totales (con ground, park, tower, camera) | ~185 |

Todo gestionado por el scene graph con actualizaciones de matrices automáticas.

---

## Técnicas aplicadas

1. **Generación procedural** — Sin hardcodear posiciones, todo es algorítmico.
2. **Agrupación jerárquica** — Cada cuadra es un nodo padre, facilitando operaciones como "eliminar toda la cuadra".
3. **Scene graph como datos** — Usar `findNodeByName` para localizar y modificar secciones.
4. **Variación controlada** — Aleatorización dentro de rangos definidos para resultados orgánicos pero coherentes.

---

## Experimenta

- Cambia `gridSize` a 10 para una ciudad más grande.
- Agrega "antenas" (cajas delgadas y altas) encima de algunos edificios como nodos hijos.
- Implementa un sistema de "zonas" donde el centro tenga edificios más altos y la periferia más bajos.
- Serializa la ciudad generada con `serialize()` y cárgala luego con `deserialize()`.

---

## Siguiente tutorial

➡️ [Tutorial 8: Multi-Renderer](./08-multi-renderer.md) — misma escena en Three.js y SVG.
