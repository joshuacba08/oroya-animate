import { ThreeRenderer } from '@oroya/renderer-three';
import { DEMO_SCENES } from './scenes';

// ── State ────────────────────────────────────────────────────────────
let activeId = DEMO_SCENES[0].id;
let renderer: ThreeRenderer | null = null;
let animationFrameId = 0;
let currentAnimate: ((time: number) => void) | null = null;

// ── DOM refs ─────────────────────────────────────────────────────────
const canvas = document.getElementById('oroya-canvas') as HTMLCanvasElement;
const nav = document.getElementById('nav')!;
const infoTitle = document.getElementById('info-title')!;
const infoDesc = document.getElementById('info-desc')!;

// ── Build navigation buttons ─────────────────────────────────────────
DEMO_SCENES.forEach((demo) => {
  const btn = document.createElement('button');
  btn.textContent = demo.label;
  btn.className = 'nav-btn';
  btn.dataset.id = demo.id;
  btn.addEventListener('click', () => switchDemo(demo.id));
  nav.appendChild(btn);
});

// ── Core functions ───────────────────────────────────────────────────

function switchDemo(id: string) {
  // Tear down previous
  cancelAnimationFrame(animationFrameId);
  renderer?.dispose();
  renderer = null;

  activeId = id;
  const demo = DEMO_SCENES.find((d) => d.id === id)!;

  // Update info panel
  infoTitle.textContent = demo.label;
  infoDesc.textContent = demo.description;

  // Update active button
  nav.querySelectorAll('.nav-btn').forEach((btn) => {
    const el = btn as HTMLElement;
    el.classList.toggle('active', el.dataset.id === id);
  });

  // Create new scene
  const { scene, animate } = demo.factory();
  currentAnimate = animate;

  // Create renderer
  renderer = new ThreeRenderer({
    canvas,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  });
  renderer.mount(scene);

  // Start animation loop
  function loop(time: number) {
    const t = time * 0.001;
    currentAnimate?.(t);
    renderer?.render();
    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
}

// ── Resize handling ──────────────────────────────────────────────────
window.addEventListener('resize', () => {
  // Update camera aspect ratio for current scene
  const demo = DEMO_SCENES.find((d) => d.id === activeId);
  if (!demo) return;

  // We can't access the scene from the renderer directly,
  // so we just let the canvas CSS handle visual sizing.
  // Camera aspect update would need scene reference — keep for future.
});

// ── Boot ─────────────────────────────────────────────────────────────
switchDemo(activeId);
