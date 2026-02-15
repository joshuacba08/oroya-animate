import {
  Scene, Node, Material, Camera, CameraType, Animation,
  createBox, createSphere, createPath2D, createText,
} from '@oroya/core';
import type { Path2DCommand } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/* ── Controls ─────────────────────────────────────────────────────────── */

export const svgAnimationsControls: ControlDef[] = [
  {
    type: 'select', key: 'speed', label: 'Velocidad global', defaultValue: 'normal', rebuild: true,
    options: [
      { value: 'slow', label: 'Lenta (4s)' },
      { value: 'normal', label: 'Normal (2s)' },
      { value: 'fast', label: 'Rápida (0.8s)' },
    ],
  },
];

/* ── Scene factory ────────────────────────────────────────────────────── */

export function createSvgAnimationsScene(params: ParamValues) {
  const scene = new Scene();
  const speedMap: Record<string, string> = { slow: '4s', normal: '2s', fast: '0.8s' };
  const dur = speedMap[params.speed as string] ?? '2s';

  // ── Orthographic camera ────────────────────────────────────────────
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
  title.addComponent(createText('SVG Animations', {
    fontSize: 30, fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold', textAnchor: 'middle',
  }));
  title.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  title.transform.position = { x: 400, y: 40, z: 0 };
  title.transform.updateLocalMatrix();
  scene.add(title);

  // ── 1. Pulsing opacity circle ──────────────────────────────────────
  const pulse = new Node('pulse');
  pulse.addComponent(createSphere(45));
  pulse.addComponent(new Material({
    fillGradient: {
      type: 'radial', cx: 0.4, cy: 0.4, r: 0.6,
      stops: [
        { offset: 0, color: { r: 1, g: 0.3, b: 0.3 } },
        { offset: 1, color: { r: 0.8, g: 0, b: 0 } },
      ],
    },
  }));
  pulse.addComponent(new Animation([
    {
      type: 'animate',
      attributeName: 'opacity',
      values: '1;0.2;1',
      dur,
      repeatCount: 'indefinite',
    },
  ]));
  pulse.transform.position = { x: 130, y: 160, z: 0 };
  pulse.transform.updateLocalMatrix();
  scene.add(pulse);

  addLabel(scene, 'Pulse (opacity)', 130, 230);

  // ── 2. Rotating square ─────────────────────────────────────────────
  const spinner = new Node('spinner');
  spinner.addComponent(createBox(70, 70, 0));
  spinner.addComponent(new Material({
    fill: { r: 0.3, g: 0.6, b: 1.0 },
    stroke: { r: 0.1, g: 0.3, b: 0.8 },
    strokeWidth: 2,
  }));
  spinner.addComponent(new Animation([
    {
      type: 'animateTransform',
      transformType: 'rotate',
      from: '0 0 0',
      to: '360 0 0',
      dur,
      repeatCount: 'indefinite',
    },
  ]));
  spinner.transform.position = { x: 400, y: 160, z: 0 };
  spinner.transform.updateLocalMatrix();
  scene.add(spinner);

  addLabel(scene, 'Rotate (transform)', 400, 230);

  // ── 3. Scaling diamond ─────────────────────────────────────────────
  const diamond = new Node('diamond');
  diamond.addComponent(createPath2D([
    { command: 'M', args: [0, -40] },
    { command: 'L', args: [40, 0] },
    { command: 'L', args: [0, 40] },
    { command: 'L', args: [-40, 0] },
    { command: 'Z', args: [] },
  ]));
  diamond.addComponent(new Material({
    fill: { r: 0.2, g: 0.9, b: 0.5 },
    stroke: { r: 0, g: 0.5, b: 0.2 },
    strokeWidth: 2,
  }));
  diamond.addComponent(new Animation([
    {
      type: 'animateTransform',
      transformType: 'scale',
      values: '1;1.4;1',
      dur,
      repeatCount: 'indefinite',
    },
  ]));
  diamond.transform.position = { x: 670, y: 160, z: 0 };
  diamond.transform.updateLocalMatrix();
  scene.add(diamond);

  addLabel(scene, 'Scale (transform)', 670, 230);

  // ── 4. Color cycling rectangle ─────────────────────────────────────
  const colorBox = new Node('color-cycle');
  colorBox.addComponent(createBox(120, 80, 0));
  colorBox.addComponent(new Material({
    fill: { r: 1, g: 0, b: 0 },
  }));
  colorBox.addComponent(new Animation([
    {
      type: 'animate',
      attributeName: 'fill',
      values: 'rgb(255,0,0);rgb(0,255,0);rgb(0,0,255);rgb(255,0,0)',
      dur,
      repeatCount: 'indefinite',
    },
  ]));
  colorBox.transform.position = { x: 130, y: 380, z: 0 };
  colorBox.transform.updateLocalMatrix();
  scene.add(colorBox);

  addLabel(scene, 'Color cycle (fill)', 130, 445);

  // ── 5. Translate bouncing circle ───────────────────────────────────
  const bouncer = new Node('bouncer');
  bouncer.addComponent(createSphere(25));
  bouncer.addComponent(new Material({
    fill: { r: 1, g: 0.8, b: 0.1 },
  }));
  bouncer.addComponent(new Animation([
    {
      type: 'animate',
      attributeName: 'cy',
      values: '-40;40;-40',
      dur,
      repeatCount: 'indefinite',
      calcMode: 'spline',
      keyTimes: '0;0.5;1',
      keySplines: '0.42 0 0.58 1;0.42 0 0.58 1',
    },
  ]));
  bouncer.transform.position = { x: 400, y: 380, z: 0 };
  bouncer.transform.updateLocalMatrix();
  scene.add(bouncer);

  addLabel(scene, 'Bounce (translate)', 400, 445);

  // ── 6. Combined: rotate + opacity ──────────────────────────────────
  const starPath = createStarCommands(0, 0, 6, 45, 20);
  const combinedStar = new Node('combined-star');
  combinedStar.addComponent(createPath2D(starPath));
  combinedStar.addComponent(new Material({
    fillGradient: {
      type: 'linear', x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 1, g: 0.5, b: 0 } },
        { offset: 1, color: { r: 1, g: 0, b: 0.5 } },
      ],
    },
  }));
  combinedStar.addComponent(new Animation([
    {
      type: 'animateTransform',
      transformType: 'rotate',
      from: '0 0 0',
      to: '360 0 0',
      dur: dur.replace('s', '') + 's',
      repeatCount: 'indefinite',
    },
    {
      type: 'animate',
      attributeName: 'opacity',
      values: '1;0.4;1',
      dur,
      repeatCount: 'indefinite',
    },
  ]));
  combinedStar.transform.position = { x: 670, y: 380, z: 0 };
  combinedStar.transform.updateLocalMatrix();
  scene.add(combinedStar);

  addLabel(scene, 'Combined (rotate+opacity)', 670, 445);

  // ── Footer note ────────────────────────────────────────────────────
  const footer = new Node('footer');
  footer.addComponent(createText('Animaciones SVG nativas — sin JavaScript en el render', {
    fontSize: 13, fontFamily: 'system-ui, sans-serif',
    textAnchor: 'middle', fontWeight: 'normal',
  }));
  footer.addComponent(new Material({ fill: { r: 0.4, g: 0.4, b: 0.5 } }));
  footer.transform.position = { x: 400, y: 560, z: 0 };
  footer.transform.updateLocalMatrix();
  scene.add(footer);

  // ── No JS animation needed — SVG animations run natively ───────────
  function animate(_time: number, _p: ParamValues) {
    // All animations are declarative SVG — no per-frame JS needed
  }

  return { scene, animate };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function addLabel(scene: Scene, text: string, x: number, y: number) {
  const label = new Node(`label-${x}-${y}`);
  label.addComponent(createText(text, {
    fontSize: 13, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  label.addComponent(new Material({ fill: { r: 0.55, g: 0.55, b: 0.65 } }));
  label.transform.position = { x, y, z: 0 };
  label.transform.updateLocalMatrix();
  scene.add(label);
}

function createStarCommands(
  cx: number, cy: number,
  points: number, outerR: number, innerR: number,
): Path2DCommand[] {
  const commands: Path2DCommand[] = [];
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
