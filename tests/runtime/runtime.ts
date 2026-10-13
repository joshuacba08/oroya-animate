import { Scene, Node, Camera, CameraType, Light, LightType, Material, ComponentType, createBox, InstancedMesh, Matrix4Identity, RigidBody, Collider, ColliderShape, Animator, type AnimationClip } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';
import { renderToCanvas } from '@joroya/renderer-canvas2d';
import { renderToSVG } from '@joroya/renderer-svg';
import { PhysicsSystem } from '@joroya/physics';
import { loadGLTF } from '@joroya/loader-gltf';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, shallowRef } from 'vue';
import { OroyaCanvas, Box } from '@joroya/react';
import { useOroyaCanvas, useNode } from '@joroya/vue';
import fixtureURL from '../../packages/loader-gltf/tests/fixtures/animated-skin.glb?url';

function basic(): Scene {
  const scene = new Scene(); const camera = new Node('camera');
  camera.addComponent(new Camera({ type: CameraType.Perspective, fov: 60, aspect: 1.5, near: 0.1, far: 100, autoAspect: true })); camera.transform.setPosition({ x: 0, y: 0, z: 12 }); scene.add(camera);
  const light = new Node('ambient'); light.addComponent(new Light({ type: LightType.Ambient, intensity: 2 })); scene.add(light); return scene;
}
function box(name: string): Node { const node = new Node(name); node.addComponent(createBox()); node.addComponent(new Material({ color: { r: 0.9, g: 0.3, b: 0.1 } })); return node; }
const canvas = document.createElement('canvas'); canvas.style.width = '600px'; canvas.style.height = '400px'; document.querySelector('#three')!.append(canvas);
const renderer = new ThreeRenderer({ canvas, width: 600, height: 400, dpr: 1 });
let scene = basic(); scene.add(box('cube')); renderer.mount(scene); renderer.render(0);
let frames = 0;
let paused = false;
const draw = () => { if (!paused) { renderer.render(1 / 60); frames++; } requestAnimationFrame(draw); }; requestAnimationFrame(draw);
const reactRoot = createRoot(document.querySelector('#react')!);
reactRoot.render(createElement(OroyaCanvas, { width: 300, height: 200 }, createElement(Box, { color: { r: 1, g: 0, b: 0 } })));
const vueApp = createApp({ setup() {
  const reference = shallowRef<HTMLCanvasElement>(); useOroyaCanvas(reference); useNode((node) => { node.addComponent(createBox()); node.addComponent(new Material({ color: { r: 0, g: 1, b: 0 } })); });
  return () => h('canvas', { ref: reference, style: 'width:300px;height:200px' });
} }); vueApp.mount('#vue');

function parity() {
  const source = new Scene(); const node = box('shared'); source.add(node); let updates = 0; node.onUpdate = () => { updates++; node.transform.setPosition({ x: 20, y: 20, z: 0 }); };
  const target = document.createElement('canvas'); renderToCanvas(source, target, { width: 200, height: 100, dt: 0.1 });
  const svg = renderToSVG(source, { width: 200, height: 100, dt: 0.1, advanceScene: false });
  document.querySelector('#two')!.replaceChildren(target); return { updates, svg, pixel: [...target.getContext('2d')!.getImageData(20, 20, 1, 1).data] };
}
function cycles(count = 100) {
  for (let index = 0; index < count; index++) { scene = basic(); scene.add(box('cycle-' + index)); renderer.mount(scene); renderer.render(0); }
  return renderer.getResourceInfo();
}
async function skinned() {
  const result = await loadGLTF(fixtureURL);
  scene = basic(); for (const child of [...result.scene.root.children]) scene.add(child);
  const animation = new Animator({ animations: { move: result.animations[0] } }); scene.root.addComponent(animation); renderer.mount(scene); animation.play('move', { loop: false }); renderer.render(0.5);
  return { position: scene.findNodeByName('triangle')!.transform.position.x, resources: renderer.getResourceInfo() };
}
async function benchmark() {
  paused = true;
  const results: Record<string, { cpuMedianMs: number; frameMedianMs: number }> = {};
  for (const name of ['nodes1000', 'instances10000', 'physics100', 'skinned']) {
    scene = basic(); let physics: PhysicsSystem | undefined;
    if (name === 'nodes1000') for (let i = 0; i < 1000; i++) { const node = box('node-' + i); node.transform.setPosition({ x: (i % 40 - 20) * 0.3, y: (Math.floor(i / 40) - 12) * 0.3, z: 0 }); scene.add(node); }
    if (name === 'instances10000') {
      const instanced = new InstancedMesh(createBox(0.05, 0.05, 0.05), { color: { r: 1, g: 0, b: 0 } }, 10000);
      for (let i = 0; i < 10000; i++) { const matrix = [...Matrix4Identity] as typeof Matrix4Identity; matrix[12] = (i % 100 - 50) * 0.1; matrix[13] = (Math.floor(i / 100) - 50) * 0.1; instanced.setMatrixAt(i, matrix); } scene.add(instanced);
    }
    if (name === 'physics100') {
      physics = new PhysicsSystem({ gravity: { x: 0, y: 0, z: 0 } });
      for (let i = 0; i < 100; i++) { const node = box('body-' + i); node.addComponent(new RigidBody({ mass: 1 })); node.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 0.1 })); node.transform.setPosition({ x: (i % 10 - 5) * 0.3, y: (Math.floor(i / 10) - 5) * 0.3, z: 0 }); scene.add(node); }
    }
    if (name === 'skinned') await skinned(); else renderer.mount(scene);
    const cpu: number[] = []; const frameTimes: number[] = []; let previous = performance.now();
    for (let i = 0; i < 180; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const start = performance.now(); const elapsed = start - previous; previous = start;
      physics?.update(1 / 60, scene); renderer.render(1 / 60);
      if (i >= 30) { cpu.push(performance.now() - start); frameTimes.push(elapsed); }
    }
    cpu.sort((a, b) => a - b); frameTimes.sort((a, b) => a - b);
    results[name] = { cpuMedianMs: cpu[Math.floor(cpu.length / 2)], frameMedianMs: frameTimes[Math.floor(frameTimes.length / 2)] }; physics?.dispose();
  }
  paused = false; return results;
}
Object.assign(window, { validation: { parity, cycles, skinned, benchmark, resources: () => renderer.getResourceInfo(), frames: () => frames,
  resize: (width: number, height: number) => renderer.setSize(width, height),
  disposeBindings: () => { reactRoot.unmount(); vueApp.unmount(); },
  dispose: () => { renderer.dispose(); return renderer.getResourceInfo(); },
} });
document.querySelector('#status')!.textContent = 'Ready';
