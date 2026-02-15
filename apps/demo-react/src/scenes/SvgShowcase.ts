import {
  Scene, Node, Material, Camera, CameraType,
  createBox, createSphere, createPath2D, createText,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';
import { hexToRgb } from '../types';

/* ── Controls ─────────────────────────────────────────────────────────── */

export const svgShowcaseControls: ControlDef[] = [
  { type: 'color', key: 'accent', label: 'Color acento', defaultValue: '#4a7aff', rebuild: true },
  { type: 'slider', key: 'blur', label: 'Blur (px)', min: 0, max: 10, step: 0.5, defaultValue: 3, rebuild: true },
  { type: 'slider', key: 'shadowDx', label: 'Sombra dx', min: -10, max: 10, step: 1, defaultValue: 4, rebuild: true },
  { type: 'slider', key: 'shadowDy', label: 'Sombra dy', min: -10, max: 10, step: 1, defaultValue: 4, rebuild: true },
  {
    type: 'select', key: 'gradient', label: 'Gradiente', defaultValue: 'linear', rebuild: true,
    options: [
      { value: 'linear', label: 'Lineal' },
      { value: 'radial', label: 'Radial' },
    ],
  },
];

/* ── Scene factory ────────────────────────────────────────────────────── */

export function createSvgShowcaseScene(params: ParamValues) {
  const scene = new Scene();
  const accent = hexToRgb(params.accent as string);
  const blurVal = params.blur as number;
  const dx = params.shadowDx as number;
  const dy = params.shadowDy as number;
  const gradientType = params.gradient as string;

  // ── Orthographic camera for SVG viewBox ────────────────────────────
  const cam = new Node('cam');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 800,
    top: 0, bottom: 600,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // ── Title ──────────────────────────────────────────────────────────
  const title = new Node('title');
  title.addComponent(createText('SVG Showcase', {
    fontSize: 32,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold',
    textAnchor: 'middle',
  }));
  title.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  title.transform.position = { x: 400, y: 40, z: 0 };
  title.transform.updateLocalMatrix();
  scene.add(title);

  // ── 1. Gradient rectangle ──────────────────────────────────────────
  const gradientDef = gradientType === 'radial'
    ? {
        type: 'radial' as const,
        cx: 0.5, cy: 0.5, r: 0.5,
        stops: [
          { offset: 0, color: { r: 1, g: 1, b: 1 } },
          { offset: 0.5, color: accent },
          { offset: 1, color: { r: accent.r * 0.3, g: accent.g * 0.3, b: accent.b * 0.3 } },
        ],
      }
    : {
        type: 'linear' as const,
        x1: 0, y1: 0, x2: 1, y2: 1,
        stops: [
          { offset: 0, color: accent },
          { offset: 0.5, color: { r: 1, g: 1, b: 1 } },
          { offset: 1, color: { r: accent.r * 0.4, g: accent.g * 0.4, b: accent.b * 0.8 } },
        ],
      };

  const gradRect = new Node('gradient-rect');
  gradRect.addComponent(createBox(200, 120, 0));
  gradRect.addComponent(new Material({
    fillGradient: gradientDef,
    stroke: { r: 0.3, g: 0.3, b: 0.4 },
    strokeWidth: 2,
  }));
  gradRect.cssClass = 'gradient-demo';
  gradRect.transform.position = { x: 140, y: 160, z: 0 };
  gradRect.transform.updateLocalMatrix();
  scene.add(gradRect);

  const gradLabel = new Node('gradient-label');
  gradLabel.addComponent(createText('Gradiente', {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  gradLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  gradLabel.transform.position = { x: 140, y: 240, z: 0 };
  gradLabel.transform.updateLocalMatrix();
  scene.add(gradLabel);

  // ── 2. Blurred circle ──────────────────────────────────────────────
  const blurCircle = new Node('blur-circle');
  blurCircle.addComponent(createSphere(55));
  blurCircle.addComponent(new Material({
    fill: { r: 0.4, g: 0.8, b: 1.0 },
    filter: { effects: [{ type: 'blur', stdDeviation: blurVal }] },
  }));
  blurCircle.transform.position = { x: 400, y: 160, z: 0 };
  blurCircle.transform.updateLocalMatrix();
  scene.add(blurCircle);

  const blurLabel = new Node('blur-label');
  blurLabel.addComponent(createText(`Blur (${blurVal}px)`, {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  blurLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  blurLabel.transform.position = { x: 400, y: 240, z: 0 };
  blurLabel.transform.updateLocalMatrix();
  scene.add(blurLabel);

  // ── 3. Drop shadow box ─────────────────────────────────────────────
  const shadowBox = new Node('shadow-box');
  shadowBox.addComponent(createBox(150, 100, 0));
  shadowBox.addComponent(new Material({
    fill: { r: 1.0, g: 0.6, b: 0.2 },
    filter: {
      effects: [{
        type: 'dropShadow', dx, dy,
        stdDeviation: 3, floodColor: '#000', floodOpacity: 0.5,
      }],
    },
  }));
  shadowBox.transform.position = { x: 660, y: 160, z: 0 };
  shadowBox.transform.updateLocalMatrix();
  scene.add(shadowBox);

  const shadowLabel = new Node('shadow-label');
  shadowLabel.addComponent(createText(`Drop Shadow (${dx}, ${dy})`, {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  shadowLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  shadowLabel.transform.position = { x: 660, y: 240, z: 0 };
  shadowLabel.transform.updateLocalMatrix();
  scene.add(shadowLabel);

  // ── 4. Clip-path star ──────────────────────────────────────────────
  const starPath = createStarCommands(0, 0, 5, 70, 30);
  const clippedCircle = new Node('clipped-circle');
  clippedCircle.addComponent(createSphere(65));
  clippedCircle.addComponent(new Material({
    fillGradient: {
      type: 'radial',
      cx: 0.4, cy: 0.4, r: 0.6,
      stops: [
        { offset: 0, color: { r: 1, g: 1, b: 0.3 } },
        { offset: 1, color: { r: 1, g: 0.4, b: 0 } },
      ],
    },
    clipPath: { path: starPath },
  }));
  clippedCircle.transform.position = { x: 140, y: 400, z: 0 };
  clippedCircle.transform.updateLocalMatrix();
  scene.add(clippedCircle);

  const clipLabel = new Node('clip-label');
  clipLabel.addComponent(createText('Clip Path', {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  clipLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  clipLabel.transform.position = { x: 140, y: 490, z: 0 };
  clipLabel.transform.updateLocalMatrix();
  scene.add(clipLabel);

  // ── 5. Mask demo ───────────────────────────────────────────────────
  const maskedRect = new Node('masked-rect');
  maskedRect.addComponent(createBox(150, 120, 0));
  maskedRect.addComponent(new Material({
    fillGradient: {
      type: 'linear',
      x1: 0, y1: 0, x2: 1, y2: 0,
      stops: [
        { offset: 0, color: { r: 0.9, g: 0.1, b: 0.5 } },
        { offset: 1, color: { r: 0.2, g: 0.1, b: 0.9 } },
      ],
    },
    mask: {
      path: [
        { command: 'M', args: [-75, -60] },
        { command: 'L', args: [75, -60] },
        { command: 'L', args: [75, 60] },
        { command: 'L', args: [-75, 60] },
        { command: 'Z', args: [] },
        // Inner diamond cutout
        { command: 'M', args: [0, -40] },
        { command: 'L', args: [40, 0] },
        { command: 'L', args: [0, 40] },
        { command: 'L', args: [-40, 0] },
        { command: 'Z', args: [] },
      ],
      fill: 'white',
      opacity: 0.9,
    },
  }));
  maskedRect.transform.position = { x: 400, y: 400, z: 0 };
  maskedRect.transform.updateLocalMatrix();
  scene.add(maskedRect);

  const maskLabel = new Node('mask-label');
  maskLabel.addComponent(createText('Mask', {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  maskLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  maskLabel.transform.position = { x: 400, y: 490, z: 0 };
  maskLabel.transform.updateLocalMatrix();
  scene.add(maskLabel);

  // ── 6. Path2D — Bézier curve ───────────────────────────────────────
  const bezier = new Node('bezier');
  bezier.addComponent(createPath2D([
    { command: 'M', args: [580, 340] },
    { command: 'C', args: [580, 280, 740, 280, 740, 340] },
    { command: 'C', args: [740, 400, 580, 460, 580, 460] },
    { command: 'C', args: [580, 460, 740, 400, 740, 460] },
  ]));
  bezier.addComponent(new Material({
    stroke: { r: 0.5, g: 1.0, b: 0.6 },
    strokeWidth: 3,
  }));
  scene.add(bezier);

  const bezierLabel = new Node('bezier-label');
  bezierLabel.addComponent(createText('Bézier Path', {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  bezierLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  bezierLabel.transform.position = { x: 660, y: 490, z: 0 };
  bezierLabel.transform.updateLocalMatrix();
  scene.add(bezierLabel);

  // ── 7. Stroke gradient line ────────────────────────────────────────
  const gradLine = new Node('gradient-line');
  gradLine.addComponent(createPath2D([
    { command: 'M', args: [60, 540] },
    { command: 'L', args: [740, 540] },
  ]));
  gradLine.addComponent(new Material({
    strokeGradient: {
      type: 'linear',
      x1: 0, y1: 0.5, x2: 1, y2: 0.5,
      stops: [
        { offset: 0, color: { r: 1, g: 0, b: 0 } },
        { offset: 0.25, color: { r: 1, g: 1, b: 0 } },
        { offset: 0.5, color: { r: 0, g: 1, b: 0 } },
        { offset: 0.75, color: { r: 0, g: 1, b: 1 } },
        { offset: 1, color: { r: 0.5, g: 0, b: 1 } },
      ],
    },
    strokeWidth: 4,
  }));
  scene.add(gradLine);

  const lineLabel = new Node('line-label');
  lineLabel.addComponent(createText('Stroke Gradient', {
    fontSize: 14, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  lineLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  lineLabel.transform.position = { x: 400, y: 570, z: 0 };
  lineLabel.transform.updateLocalMatrix();
  scene.add(lineLabel);

  // ── No JS animation needed — it's a static showcase ────────────────
  function animate(_time: number, _p: ParamValues) {
    // Static scene — nothing to animate per frame
  }

  return { scene, animate };
}

/* ── Helper: star path ────────────────────────────────────────────────── */

function createStarCommands(
  cx: number, cy: number,
  points: number, outerR: number, innerR: number,
) {
  const commands: { command: string; args: number[] }[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    commands.push({
      command: i === 0 ? 'M' : 'L',
      args: [Math.round(x * 10) / 10, Math.round(y * 10) / 10],
    });
  }
  commands.push({ command: 'Z', args: [] });
  return commands;
}
