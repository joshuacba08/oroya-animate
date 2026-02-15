import { Scene, Node, createBox, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';
import { hexToRgb } from '../types';

export const helloCubeControls: ControlDef[] = [
  { type: 'slider', key: 'speed', label: 'Velocidad', min: 0.1, max: 3, step: 0.1, defaultValue: 0.8 },
  { type: 'slider', key: 'tilt', label: 'Inclinación', min: 0, max: 1, step: 0.05, defaultValue: 0.3 },
  { type: 'slider', key: 'size', label: 'Tamaño', min: 0.5, max: 3, step: 0.1, defaultValue: 1.8, rebuild: true },
  { type: 'color', key: 'color', label: 'Color', defaultValue: '#3399ff', rebuild: true },
];

export function createHelloCubeScene(params: ParamValues) {
  const scene = new Scene();
  const size = params.size as number;
  const rgb = hexToRgb(params.color as string);

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

  const cube = new Node('cube');
  cube.addComponent(createBox(size, size, size));
  cube.addComponent(new Material({ color: rgb }));
  scene.add(cube);

  function animate(time: number, p: ParamValues) {
    const speed = p.speed as number;
    const tilt = p.tilt as number;
    const angle = time * speed;

    cube.transform.rotation = {
      x: Math.sin(angle * 0.3 / 2) * tilt,
      y: Math.sin(angle / 2),
      z: 0,
      w: Math.cos(angle / 2),
    };
    cube.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
