import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import type { AnimateCallback } from '../OroyaCanvas';

/**
 * Hello Cube — A single cube with proper quaternion Y-axis rotation.
 * Based on Tutorial 1: Hello Cube.
 */
export function createHelloCubeScene(): { scene: Scene; animate: AnimateCallback } {
  const scene = new Scene();

  // Camera
  const cameraNode = new Node('camera');
  cameraNode.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
  }));
  cameraNode.transform.position = { x: 0, y: 1, z: 5 };
  scene.add(cameraNode);

  // Cube
  const cube = new Node('cube');
  cube.addComponent(createBox(1.8, 1.8, 1.8));
  cube.addComponent(new Material({ color: { r: 0.2, g: 0.6, b: 1.0 } }));
  scene.add(cube);

  // Animation: proper quaternion rotation on Y-axis
  const animate: AnimateCallback = (time) => {
    const angle = time * 0.8;

    cube.transform.rotation = {
      x: Math.sin(angle * 0.3 / 2) * 0.3,
      y: Math.sin(angle / 2),
      z: 0,
      w: Math.cos(angle / 2),
    };
    cube.transform.updateLocalMatrix();
  };

  return { scene, animate };
}
