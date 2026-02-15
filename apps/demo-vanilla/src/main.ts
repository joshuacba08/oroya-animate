import { Scene, Node, createBox, Material } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

// 1. Setup Scene
const scene = new Scene();

const boxNode = new Node('rotating-box');
boxNode.addComponent(createBox(1, 1, 1));
boxNode.addComponent(new Material({ color: { r: 0.1, g: 0.4, b: 0.8 } }));

scene.add(boxNode);

// 2. Setup Renderer
const canvas = document.getElementById('oroya-canvas') as HTMLCanvasElement;
const renderer = new ThreeRenderer({
  canvas,
  width: window.innerWidth,
  height: window.innerHeight,
});

// 3. Mount scene to renderer
renderer.mount(scene);

// 4. Animation loop
function animate(time: number) {
  time *= 0.001; // convert time to seconds

  const { rotation } = boxNode.transform;
  
  // Simple rotation logic (mutating the scene graph)
  const speed = 0.5;
  rotation.x = Math.sin(time * speed) * 2;
  rotation.y = Math.cos(time * speed) * 2;

  renderer.render();

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// Handle window resize
window.addEventListener('resize', () => {
  // A real app would have resize logic in the renderer
  // For now, we'll just reload.
  window.location.reload();
});
