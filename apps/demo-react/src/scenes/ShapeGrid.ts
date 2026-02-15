import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const shapeGridControls: ControlDef[] = [
  { type: 'slider', key: 'gridSize', label: 'Tamaño grilla', min: 3, max: 12, step: 1, defaultValue: 7, rebuild: true },
  { type: 'slider', key: 'waveSpeed', label: 'Velocidad ola', min: 0.5, max: 5, step: 0.1, defaultValue: 2 },
  { type: 'slider', key: 'waveHeight', label: 'Altura ola', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1 },
  { type: 'slider', key: 'gap', label: 'Separación', min: 0.1, max: 1.2, step: 0.05, defaultValue: 0.3, rebuild: true },
  {
    type: 'select', key: 'shape', label: 'Forma', defaultValue: 'box', rebuild: true,
    options: [
      { value: 'box', label: 'Cubos' },
      { value: 'sphere', label: 'Esferas' },
    ],
  },
];

interface CellRef {
  node: Node;
  gx: number;
  gz: number;
}

export function createShapeGridScene(params: ParamValues) {
  const scene = new Scene();
  const gridSize = params.gridSize as number;
  const gap = params.gap as number;
  const shape = params.shape as string;
  const cellSize = 0.8;
  const step = cellSize + gap;

  // Camera — positioned along Z axis, elevated to give a 3D perspective.
  // The Oroya camera looks down -Z by default, so we place it on the Z axis
  // and raise it enough to see the grid at the origin.
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200,
  }));
  const extent = ((gridSize - 1) * step) / 2;
  cam.transform.position = { x: 0, y: extent * 1.5, z: extent * 3 };
  scene.add(cam);

  // Build grid
  const cells: CellRef[] = [];
  const offset = ((gridSize - 1) * step) / 2;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const node = new Node(`cell-${x}-${z}`);

      if (shape === 'sphere') {
        node.addComponent(createSphere(cellSize * 0.45, 16, 16));
      } else {
        node.addComponent(createBox(cellSize, cellSize, cellSize));
      }

      // Position-based color gradient
      const r = x / Math.max(gridSize - 1, 1);
      const b = z / Math.max(gridSize - 1, 1);
      const g = 0.25 + 0.3 * (1 - (r + b) / 2);
      node.addComponent(new Material({ color: { r, g, b } }));

      node.transform.position = {
        x: x * step - offset,
        y: 0,
        z: z * step - offset,
      };

      scene.add(node);
      cells.push({ node, gx: x, gz: z });
    }
  }

  function animate(time: number, p: ParamValues) {
    const waveSpeed = p.waveSpeed as number;
    const waveHeight = p.waveHeight as number;

    for (const { node, gx, gz } of cells) {
      const dist = Math.sqrt(gx * gx + gz * gz);
      node.transform.position.y = Math.sin(time * waveSpeed - dist * 0.7) * waveHeight;

      // Gentle rotation
      const angle = time * 0.5;
      node.transform.rotation = {
        x: 0,
        y: Math.sin(angle / 2),
        z: 0,
        w: Math.cos(angle / 2),
      };

      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
