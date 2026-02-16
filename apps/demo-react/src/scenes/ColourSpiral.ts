import {
  Scene, Node, Material, Camera, CameraType,
  createBox, createSphere,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/* ── Controls ─────────────────────────────────────────────────────────── */

export const colourSpiralControls: ControlDef[] = [
  { type: 'slider', key: 'points', label: 'Puntos', min: 50, max: 300, step: 10, defaultValue: 200, rebuild: true },
  { type: 'slider', key: 'turns', label: 'Vueltas', min: 2, max: 10, step: 1, defaultValue: 6, rebuild: true },
  { type: 'slider', key: 'maxSize', label: 'Tamaño máx', min: 4, max: 18, step: 1, defaultValue: 10, rebuild: true },
];

/* ── Palette ──────────────────────────────────────────────────────────── */

const WEB_SAFE_COLOURS = [
  { r: 1, g: 0, b: 0 }, { r: 1, g: 0.5, b: 0 }, { r: 1, g: 1, b: 0 },
  { r: 0.5, g: 1, b: 0 }, { r: 0, g: 1, b: 0 }, { r: 0, g: 1, b: 0.5 },
  { r: 0, g: 1, b: 1 }, { r: 0, g: 0.5, b: 1 }, { r: 0, g: 0, b: 1 },
  { r: 0.5, g: 0, b: 1 }, { r: 1, g: 0, b: 1 }, { r: 1, g: 0, b: 0.5 },
  { r: 1, g: 0.6, b: 0.6 }, { r: 1, g: 0.8, b: 0.5 }, { r: 1, g: 1, b: 0.6 },
  { r: 0.6, g: 1, b: 0.6 }, { r: 0.6, g: 1, b: 0.8 }, { r: 0.6, g: 1, b: 1 },
  { r: 0.6, g: 0.8, b: 1 }, { r: 0.6, g: 0.6, b: 1 }, { r: 0.8, g: 0.6, b: 1 },
  { r: 1, g: 0.6, b: 1 }, { r: 1, g: 0.6, b: 0.8 }, { r: 0.8, g: 0.8, b: 0.5 },
];

/* ── Scene factory ────────────────────────────────────────────────────── */

export function createColourSpiralScene(params: ParamValues) {
  const scene = new Scene();
  const totalPoints = params.points as number;
  const turns = params.turns as number;
  const maxSize = params.maxSize as number;

  const cam = new Node('cam');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bg = new Node('bg');
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.1, g: 0.1, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;
  const cy = 500;

  for (let i = 0; i < totalPoints; i++) {
    const t = i / totalPoints;
    const angle = t * turns * Math.PI * 2;
    const radius = 10 + t * 400;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const dotSize = 2 + t * maxSize;
    const color = WEB_SAFE_COLOURS[i % WEB_SAFE_COLOURS.length];

    const dot = new Node(`dot-${i}`);
    dot.addComponent(createSphere(dotSize));
    dot.addComponent(new Material({
      fill: color,
      opacity: 0.6 + t * 0.4,
    }));
    dot.transform.position = { x, y, z: 0 };
    dot.transform.updateLocalMatrix();
    scene.add(dot);
  }

  function animate(_time: number, _p: ParamValues) {}

  return { scene, animate };
}
