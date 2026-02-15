import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';

// 1. Setup Scene
const scene = new Scene();

// Create a camera
const cameraNode = new Node('camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

// Create a box
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

  // Mutate the transform of the box node
  const { transform } = boxNode;
  const speed = 0.5;
  transform.rotation.x = Math.sin(time * speed) * 2;
  transform.rotation.y = Math.cos(time * speed) * 2;
  transform.updateLocalMatrix(); // Mark the transform as dirty

  // Render the scene
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
