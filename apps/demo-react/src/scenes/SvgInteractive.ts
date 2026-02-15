import {
  Scene, Node, Material, Camera, CameraType, Interactive,
  createBox, createSphere, createPath2D, createText,
} from '@oroya/core';
import type { Path2DCommand } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/* ── Controls ─────────────────────────────────────────────────────────── */

export const svgInteractiveControls: ControlDef[] = [
  { type: 'slider', key: 'columns', label: 'Columnas', min: 3, max: 8, step: 1, defaultValue: 5, rebuild: true },
  { type: 'slider', key: 'rows', label: 'Filas', min: 2, max: 5, step: 1, defaultValue: 3, rebuild: true },
];

/* ── Palette ──────────────────────────────────────────────────────────── */

const PALETTE = [
  { r: 0.95, g: 0.3, b: 0.3 },
  { r: 0.3, g: 0.65, b: 1.0 },
  { r: 0.2, g: 0.85, b: 0.5 },
  { r: 1.0, g: 0.75, b: 0.15 },
  { r: 0.7, g: 0.3, b: 0.9 },
  { r: 1.0, g: 0.5, b: 0.2 },
  { r: 0.3, g: 0.9, b: 0.9 },
  { r: 0.9, g: 0.4, b: 0.7 },
];

/* ── Scene factory ────────────────────────────────────────────────────── */

export function createSvgInteractiveScene(params: ParamValues) {
  const scene = new Scene();
  const cols = params.columns as number;
  const rows = params.rows as number;

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
  title.addComponent(createText('Interactive SVG', {
    fontSize: 28, fontFamily: 'system-ui, sans-serif',
    fontWeight: 'bold', textAnchor: 'middle',
  }));
  title.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  title.transform.position = { x: 400, y: 36, z: 0 };
  title.transform.updateLocalMatrix();
  scene.add(title);

  const subtitle = new Node('subtitle');
  subtitle.addComponent(createText('Haz click en las figuras — los eventos se procesan via renderToSVGElement', {
    fontSize: 12, fontFamily: 'system-ui, sans-serif', textAnchor: 'middle',
  }));
  subtitle.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  subtitle.transform.position = { x: 400, y: 60, z: 0 };
  subtitle.transform.updateLocalMatrix();
  scene.add(subtitle);

  // ── Status text (updates on interaction) ───────────────────────────
  const statusText = new Node('status');
  statusText.addComponent(createText('Click on a shape...', {
    fontSize: 16, fontFamily: 'system-ui, sans-serif',
    textAnchor: 'middle', fontWeight: 'bold',
  }));
  statusText.addComponent(new Material({ fill: { r: 0.6, g: 0.8, b: 1.0 } }));
  statusText.cssId = 'status-display';
  statusText.transform.position = { x: 400, y: 560, z: 0 };
  statusText.transform.updateLocalMatrix();
  scene.add(statusText);

  // ── Grid of interactive shapes ─────────────────────────────────────
  const paddingX = 80;
  const paddingTop = 90;
  const availW = 800 - paddingX * 2;
  const availH = 600 - paddingTop - 80;
  const cellW = availW / cols;
  const cellH = availH / rows;
  const shapeSize = Math.min(cellW, cellH) * 0.55;

  const clickCounts = new Map<string, number>();
  const shapes = ['circle', 'rect', 'diamond', 'star'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cx = paddingX + cellW * (c + 0.5);
      const cy = paddingTop + cellH * (r + 0.5);
      const color = PALETTE[idx % PALETTE.length];
      const shapeType = shapes[idx % shapes.length];

      const node = new Node(`tile-${r}-${c}`);
      clickCounts.set(node.id, 0);

      // Choose geometry
      switch (shapeType) {
        case 'circle':
          node.addComponent(createSphere(shapeSize * 0.45));
          break;
        case 'rect':
          node.addComponent(createBox(shapeSize * 0.85, shapeSize * 0.65, 0));
          break;
        case 'diamond':
          node.addComponent(createPath2D(makeDiamond(shapeSize * 0.45)));
          break;
        case 'star':
          node.addComponent(createPath2D(
            makeStarCommands(0, 0, 5, shapeSize * 0.45, shapeSize * 0.2),
          ));
          break;
      }

      node.addComponent(new Material({
        fill: color,
        stroke: { r: color.r * 0.6, g: color.g * 0.6, b: color.b * 0.6 },
        strokeWidth: 2,
      }));
      node.addComponent(new Interactive({ cursor: 'pointer' }));
      node.cssClass = 'interactive-shape';

      node.transform.position = { x: cx, y: cy, z: 0 };
      node.transform.updateLocalMatrix();

      // Register click handler
      node.on('click', () => {
        const count = (clickCounts.get(node.id) ?? 0) + 1;
        clickCounts.set(node.id, count);
        console.log(`[SVG Interactive] Clicked "${node.name}" (${shapeType}) — count: ${count}`);
      });

      node.on('pointerenter', () => {
        console.log(`[SVG Interactive] Hover → "${node.name}"`);
      });

      scene.add(node);
    }
  }

  // ── No JS animation — static interactive scene ─────────────────────
  function animate(_time: number, _p: ParamValues) {
    // No per-frame animation needed. Interactions handled via events.
  }

  return { scene, animate };
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function makeDiamond(size: number): Path2DCommand[] {
  return [
    { command: 'M', args: [0, -size] },
    { command: 'L', args: [size, 0] },
    { command: 'L', args: [0, size] },
    { command: 'L', args: [-size, 0] },
    { command: 'Z', args: [] },
  ];
}

function makeStarCommands(
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
