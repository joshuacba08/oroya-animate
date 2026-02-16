---
title: "SVG Generative Art"
description: "SVG renderer and procedural generation"
order: 5
level: "intermediate"
duration: "20 min"
---
# Tutorial 5: Arte Generativo SVG 🟡

> **Nivel:** Intermedio  
> **Tiempo estimado:** 20 minutos  
> **Qué aprenderás:** Usar el renderer SVG con `createPath2D` para generar arte vectorial procedural.

---

## Concepto: Renderer SVG

A diferencia del renderer Three.js (que produce píxeles en un canvas), `renderToSVG` produce un **string SVG** puro. Esto significa:

- Puede ejecutarse en **Node.js** (sin browser).
- La salida es infinitamente escalable (vectores).
- Perfecto para exportar gráficos, logos, patrones decorativos.

---

## Paso 1: Crear un path 2D

Los paths en Oroya usan la misma sintaxis que SVG (`M`, `L`, `C`, `Z`, etc.):

```typescript
import { Scene, Node, createPath2D, Material } from '@oroya/core';
import { renderToSVG } from '@oroya/renderer-svg';

const scene = new Scene();

// Un triángulo simple
const triangle = new Node('triangle');
triangle.addComponent(createPath2D([
  { command: 'M', args: [100, 10] },   // Mover a punto
  { command: 'L', args: [40, 180] },    // Línea a punto
  { command: 'L', args: [160, 180] },   // Línea a punto
  { command: 'Z', args: [] },            // Cerrar path
]));
triangle.addComponent(new Material({
  fill: { r: 0.2, g: 0.6, b: 1.0 },
  stroke: { r: 0.1, g: 0.3, b: 0.8 },
  strokeWidth: 2,
}));
scene.add(triangle);
```

---

## Paso 2: Renderizar a SVG

```typescript
const svgString = renderToSVG(scene, {
  width: 200,
  height: 200,
  viewBox: '0 0 200 200',
});

console.log(svgString);
// <svg width="200" height="200" ...>
//   <path d="M 100 10 L 40 180 L 160 180 Z" fill="rgb(51, 153, 255)" .../>
// </svg>

// Insertar en el DOM
document.body.innerHTML = svgString;
```

---

## Paso 3: Arte generativo — Patrón de espiral

Ahora algo más interesante. Generamos una espiral usando matemáticas:

```typescript
function createSpiral(centerX: number, centerY: number, turns: number, points: number) {
  const commands: { command: string; args: number[] }[] = [];
  
  for (let i = 0; i <= points; i++) {
    const t = (i / points) * turns * Math.PI * 2;
    const radius = 5 + (i / points) * 80;
    const x = centerX + Math.cos(t) * radius;
    const y = centerY + Math.sin(t) * radius;
    
    commands.push({
      command: i === 0 ? 'M' : 'L',
      args: [Math.round(x * 10) / 10, Math.round(y * 10) / 10],
    });
  }
  
  return commands;
}

const scene = new Scene();

const spiral = new Node('golden-spiral');
spiral.addComponent(createPath2D(createSpiral(200, 200, 5, 500)));
spiral.addComponent(new Material({
  stroke: { r: 0.9, g: 0.7, b: 0.2 },
  strokeWidth: 2,
}));
scene.add(spiral);

const svg = renderToSVG(scene, { width: 400, height: 400 });
document.body.innerHTML = svg;
```

---

## Paso 4: Patrón de mosaico generativo

Múltiples figuras geométricas generadas algorítmicamente:

```typescript
const scene = new Scene();
const gridSize = 5;
const cellSize = 80;
const padding = 10;

for (let row = 0; row < gridSize; row++) {
  for (let col = 0; col < gridSize; col++) {
    const x = padding + col * cellSize;
    const y = padding + row * cellSize;
    const size = cellSize - padding * 2;

    // Alternar entre diferentes formas
    const shapeType = (row + col) % 3;
    let commands: { command: string; args: number[] }[];

    switch (shapeType) {
      case 0: // Cuadrado
        commands = [
          { command: 'M', args: [x, y] },
          { command: 'L', args: [x + size, y] },
          { command: 'L', args: [x + size, y + size] },
          { command: 'L', args: [x, y + size] },
          { command: 'Z', args: [] },
        ];
        break;
      case 1: // Diamante
        commands = [
          { command: 'M', args: [x + size / 2, y] },
          { command: 'L', args: [x + size, y + size / 2] },
          { command: 'L', args: [x + size / 2, y + size] },
          { command: 'L', args: [x, y + size / 2] },
          { command: 'Z', args: [] },
        ];
        break;
      default: // Triángulo
        commands = [
          { command: 'M', args: [x + size / 2, y] },
          { command: 'L', args: [x + size, y + size] },
          { command: 'L', args: [x, y + size] },
          { command: 'Z', args: [] },
        ];
    }

    const node = new Node(`tile-${row}-${col}`);
    node.addComponent(createPath2D(commands));

    // Colores basados en posición
    const hueShift = (row + col) / (gridSize * 2);
    node.addComponent(new Material({
      fill: {
        r: 0.2 + hueShift * 0.8,
        g: 0.3 + (1 - hueShift) * 0.5,
        b: 0.7 + Math.sin(hueShift * Math.PI) * 0.3,
      },
      stroke: { r: 0.1, g: 0.1, b: 0.2 },
      strokeWidth: 1.5,
    }));

    scene.add(node);
  }
}

const totalSize = gridSize * cellSize;
const svg = renderToSVG(scene, {
  width: totalSize,
  height: totalSize,
  viewBox: `0 0 ${totalSize} ${totalSize}`,
});

document.body.innerHTML = svg;
```

---

## Caso de uso: Exportar SVG como archivo

```typescript
function downloadSVG(svgString: string, filename: string) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

downloadSVG(svg, 'generative-mosaic.svg');
```

---

## Resultado

Un mosaico de colores con cuadrados, diamantes y triángulos generados proceduralmente. El archivo SVG exportado se puede abrir en cualquier editor de vectores (Figma, Illustrator, Inkscape). 🎨

---

## Siguiente tutorial

➡️ [Tutorial 6: Cámaras y Puntos de Vista](./06-cameras-viewpoints.md) — posicionando cámaras.
