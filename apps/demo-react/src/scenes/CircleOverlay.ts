import {
  Camera, CameraType,
  createBox, createSphere, Material,
  Node, Scene,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/* ── Controls ─────────────────────────────────────────────────────────── */

export const circleOverlayControls: ControlDef[] = [
  { type: 'slider', key: 'rings', label: 'Anillos', min: 3, max: 10, step: 1, defaultValue: 6, rebuild: true },
  { type: 'slider', key: 'opacity', label: 'Opacidad', min: 0.05, max: 0.3, step: 0.01, defaultValue: 0.1, rebuild: true },
];

/* ── Scene factory ────────────────────────────────────────────────────── */

export function createCircleOverlayScene(params: ParamValues) {
  const scene = new Scene();
  const rings = (params.rings as number) || 6;
  const alpha = (params.opacity as number) || 0.1;

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
  bg.addComponent(new Material({ fill: { r: 0.08, g: 0.09, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;

  // Concentric circle sets — two overlapping groups
  for (let i = 1; i <= rings; i++) {
    const r = 50 * i;
    const cy1 = 800 - r; // Bottom → up
    const cy2 = 200 + r; // Top → down

    // Blueish set (bottom up)
    const blue = new Node(`blue-${i}`);
    blue.addComponent(createSphere(r));
    blue.addComponent(new Material({
      fill: { r: 0.6, g: 0.93, b: 1.0 },
      opacity: alpha,
    }));
    blue.transform.position = { x: cx, y: cy1, z: 0 };
    blue.transform.updateLocalMatrix();
    scene.add(blue);

    // Greenish set (top down)
    const green = new Node(`green-${i}`);
    green.addComponent(createSphere(r));
    green.addComponent(new Material({
      fill: { r: 0.67, g: 1.0, b: 0.93 },
      opacity: alpha,
    }));
    green.transform.position = { x: cx, y: cy2, z: 0 };
    green.transform.updateLocalMatrix();
    scene.add(green);
  }

  // Subtle outline circle
  const outline = new Node('outline');
  outline.addComponent(createSphere(320));
  outline.addComponent(new Material({
    stroke: { r: 0.67, g: 1.0, b: 0.93 },
    strokeWidth: 2,
    opacity: 0.1,
  }));
  outline.transform.position = { x: cx, y: 500, z: 0 };
  outline.transform.updateLocalMatrix();
  scene.add(outline);

  // Stroke gradient frame
  const frame = new Node('frame');
  frame.addComponent(createSphere(345));
  frame.addComponent(new Material({
    strokeGradient: {
      type: 'linear',
      x1: 0, y1: 0, x2: 0, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.93, g: 0.93, b: 0.93 } },
        { offset: 1, color: { r: 0.93, g: 0.93, b: 0.93 }, opacity: 0.08 },
      ],
    },
    strokeWidth: 2.5,
  }));
  frame.transform.position = { x: cx, y: 500, z: 0 };
  frame.transform.updateLocalMatrix();
  scene.add(frame);

  function animate(_time: number, _p: ParamValues) {}

  return { scene, animate };
}
