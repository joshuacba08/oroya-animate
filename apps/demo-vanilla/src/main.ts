import { ThreeRenderer } from '@oroya/renderer-three';
import { DEMO_SCENES } from './scenes';
import { getDefaultParams } from './types';
import type { ParamValues } from './types';
import { buildControlPanel } from './controls';

/* ── State ────────────────────────────────────────────────────────────── */
let activeId = DEMO_SCENES[0].id;
let renderer: ThreeRenderer | null = null;
let animationFrameId = 0;
let currentAnimate: ((time: number, params: ParamValues) => void) | null = null;
let params: ParamValues = {};

/* ── DOM refs ─────────────────────────────────────────────────────────── */
const canvas = document.getElementById('oroya-canvas') as HTMLCanvasElement;
const nav = document.getElementById('nav')!;
const infoTitle = document.getElementById('info-title')!;
const infoDesc = document.getElementById('info-desc')!;
const ctrlContainer = document.getElementById('controls')!;

/* ── Build navigation buttons ─────────────────────────────────────────── */
DEMO_SCENES.forEach((demo) => {
  const btn = document.createElement('button');
  btn.textContent = demo.label;
  btn.className = 'nav-btn';
  btn.dataset.id = demo.id;
  btn.addEventListener('click', () => switchDemo(demo.id));
  nav.appendChild(btn);
});

/* ── Core ─────────────────────────────────────────────────────────────── */

function switchDemo(id: string) {
  teardown();
  activeId = id;

  const demo = DEMO_SCENES.find((d) => d.id === id)!;
  params = getDefaultParams(demo.controls);

  // Update info
  infoTitle.textContent = demo.label;
  infoDesc.textContent = demo.description;

  // Update nav buttons
  nav.querySelectorAll('.nav-btn').forEach((btn) => {
    (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.id === id);
  });

  // Build controls
  buildControlPanel(ctrlContainer, demo.controls, params, handleParamChange);

  // Boot scene
  buildScene();
}

function buildScene() {
  teardown();
  const demo = DEMO_SCENES.find((d) => d.id === activeId)!;
  const { scene, animate } = demo.factory(params);
  currentAnimate = animate;

  renderer = new ThreeRenderer({
    canvas,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  });
  renderer.mount(scene);

  function loop(time: number) {
    const t = time * 0.001;
    currentAnimate?.(t, params);
    renderer?.render();
    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
}

function teardown() {
  cancelAnimationFrame(animationFrameId);
  renderer?.dispose();
  renderer = null;
  currentAnimate = null;
}

function handleParamChange(key: string, value: number | string, rebuild: boolean) {
  params = { ...params, [key]: value };
  if (rebuild) {
    buildScene();
  }
}

/* ── Boot ──────────────────────────────────────────────────────────────── */
switchDemo(activeId);
