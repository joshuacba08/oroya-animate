import {
  Camera, CameraType,
  createBox, createSphere, Material,
  Node, Scene,
} from '@joroya/core';
import type { ControlDef, ParamValues } from '../types';

/* ── Controls ─────────────────────────────────────────────────────────── */

export const gradientGalleryControls: ControlDef[] = [
  { type: 'slider', key: 'barCount', label: 'Barras', min: 1, max: 3, step: 1, defaultValue: 3, rebuild: true },
  { type: 'slider', key: 'circleCount', label: 'Círculos', min: 1, max: 3, step: 1, defaultValue: 3, rebuild: true },
];

/* ── Scene factory ────────────────────────────────────────────────────── */

export function createGradientGalleryScene(params: ParamValues) {
  const scene = new Scene();
  const barCount = (params.barCount as number) || 3;
  const circleCount = (params.circleCount as number) || 3;

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

  // Gradient bar definitions
  const barGradients = [
    {
      stops: [
        { offset: 0, color: { r: 0.45, g: 0.5, b: 0.85 } },
        { offset: 1, color: { r: 0.2, g: 0.7, b: 0.9 } },
      ],
    },
    {
      stops: [
        { offset: 0, color: { r: 0.0, g: 0.8, b: 0.8 } },
        { offset: 0.6, color: { r: 0.3, g: 0.8, b: 0.5 } },
        { offset: 1, color: { r: 0.85, g: 0.75, b: 0.2 } },
      ],
    },
    {
      stops: [
        { offset: 0, color: { r: 0.2, g: 0.8, b: 0.85 } },
        { offset: 0.35, color: { r: 0.7, g: 0.6, b: 0.8 } },
        { offset: 0.65, color: { r: 1, g: 0.5, b: 0.3 } },
        { offset: 1, color: { r: 0.95, g: 0.2, b: 0.2 } },
      ],
    },
  ];

  const barWidth = 120;
  const barHeight = 700;
  const startX = 150;
  const gap = 180;

  for (let i = 0; i < Math.min(barCount, barGradients.length); i++) {
    const bar = new Node(`bar-${i}`);
    bar.addComponent(createBox(barWidth, barHeight, 0));
    bar.addComponent(new Material({
      fillGradient: {
        type: 'linear',
        x1: 0.5, y1: 0, x2: 0.5, y2: 1,
        stops: barGradients[i].stops,
      },
    }));
    bar.transform.position = { x: startX + i * gap, y: 500, z: 0 };
    bar.transform.updateLocalMatrix();
    scene.add(bar);
  }

  // Radial gradient circles
  const circleGradients = [
    {
      cx: 0.35, cy: 0.35,
      stops: [
        { offset: 0, color: { r: 0.6, g: 0.85, b: 1 } },
        { offset: 0.5, color: { r: 0.3, g: 0.5, b: 0.9 } },
        { offset: 1, color: { r: 0.15, g: 0.2, b: 0.6 } },
      ],
    },
    {
      cx: 0.4, cy: 0.4,
      stops: [
        { offset: 0, color: { r: 0.1, g: 0.9, b: 0.9 } },
        { offset: 0.5, color: { r: 0.9, g: 0.8, b: 0.15 } },
        { offset: 1, color: { r: 0.95, g: 0.6, b: 0.1 } },
      ],
    },
    {
      cx: 0.5, cy: 0.5,
      stops: [
        { offset: 0, color: { r: 1, g: 0.3, b: 0.1 } },
        { offset: 0.4, color: { r: 0.2, g: 0.8, b: 0.7 } },
        { offset: 1, color: { r: 0, g: 0.6, b: 0.85 } },
      ],
    },
  ];

  const circleX = 780;
  const circleRadius = 85;
  const circleStartY = 210;
  const circleGap = 270;

  for (let i = 0; i < Math.min(circleCount, circleGradients.length); i++) {
    const c = new Node(`circle-${i}`);
    c.addComponent(createSphere(circleRadius));
    c.addComponent(new Material({
      fillGradient: {
        type: 'radial',
        cx: circleGradients[i].cx,
        cy: circleGradients[i].cy,
        r: 0.6,
        stops: circleGradients[i].stops,
      },
    }));
    c.transform.position = { x: circleX, y: circleStartY + i * circleGap, z: 0 };
    c.transform.updateLocalMatrix();
    scene.add(c);
  }

  function animate(_time: number, _p: ParamValues) {}

  return { scene, animate };
}
