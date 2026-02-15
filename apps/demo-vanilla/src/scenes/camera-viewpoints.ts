import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const cameraViewpointsControls: ControlDef[] = [
  {
    type: 'select', key: 'viewpoint', label: 'Punto de vista', defaultValue: 'orbital',
    options: [
      { value: 'orbital', label: 'Orbital' },
      { value: 'front', label: 'Frontal' },
      { value: 'top', label: 'Cenital' },
      { value: 'side', label: 'Lateral' },
    ],
  },
  { type: 'slider', key: 'orbitSpeed', label: 'Velocidad orbital', min: 0, max: 2, step: 0.05, defaultValue: 0.5 },
  { type: 'slider', key: 'camHeight', label: 'Altura cámara', min: 1, max: 20, step: 0.5, defaultValue: 4, rebuild: true },
  { type: 'slider', key: 'camDistance', label: 'Distancia cámara', min: 5, max: 25, step: 0.5, defaultValue: 12, rebuild: true },
  { type: 'slider', key: 'fov', label: 'Campo de visión', min: 30, max: 100, step: 1, defaultValue: 60, rebuild: true },
];

export function createCameraViewpointsScene(params: ParamValues) {
  const scene = new Scene();
  const camHeight = params.camHeight as number;
  const camDistance = params.camDistance as number;
  const fov = params.fov as number;

  // Camera
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200,
  }));
  cam.transform.position = { x: 0, y: camHeight, z: camDistance };
  scene.add(cam);

  // Floor
  const floor = new Node('floor');
  floor.addComponent(createBox(20, 0.1, 20));
  floor.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.25 } }));
  floor.transform.position = { x: 0, y: -1, z: 0 };
  scene.add(floor);

  // Three colored pillars
  const pillarColors = [
    { r: 0.9, g: 0.2, b: 0.2 },
    { r: 0.2, g: 0.9, b: 0.3 },
    { r: 0.2, g: 0.4, b: 0.9 },
  ];

  const pillars: Node[] = [];
  for (let i = 0; i < 3; i++) {
    const height = 1 + i * 1.2;
    const pillar = new Node(`pillar-${i}`);
    pillar.addComponent(createBox(0.6, height, 0.6));
    pillar.addComponent(new Material({ color: pillarColors[i] }));
    pillar.transform.position = { x: (i - 1) * 3.5, y: height / 2 - 1, z: 0 };
    scene.add(pillar);
    pillars.push(pillar);
  }

  // Golden sphere
  const sphere = new Node('golden-sphere');
  sphere.addComponent(createSphere(0.8, 32, 32));
  sphere.addComponent(new Material({ color: { r: 1.0, g: 0.8, b: 0.0 } }));
  sphere.transform.position = { x: 0, y: 0.3, z: 3 };
  scene.add(sphere);

  // Small decorative spheres in a circle
  const decoCount = 8;
  for (let i = 0; i < decoCount; i++) {
    const angle = (i / decoCount) * Math.PI * 2;
    const radius = 6;
    const deco = new Node(`deco-${i}`);
    deco.addComponent(createSphere(0.3, 16, 16));
    const hue = i / decoCount;
    deco.addComponent(new Material({
      color: {
        r: 0.5 + Math.sin(hue * Math.PI * 2) * 0.5,
        g: 0.5 + Math.sin(hue * Math.PI * 2 + 2.09) * 0.5,
        b: 0.5 + Math.sin(hue * Math.PI * 2 + 4.19) * 0.5,
      },
    }));
    deco.transform.position = {
      x: Math.cos(angle) * radius,
      y: -0.5,
      z: Math.sin(angle) * radius,
    };
    scene.add(deco);
  }

  // Static viewpoint positions
  const viewpoints: Record<string, { x: number; y: number; z: number }> = {
    front: { x: 0, y: camHeight, z: camDistance },
    top: { x: 0, y: 18, z: 0.1 },
    side: { x: camDistance, y: camHeight, z: 4 },
    orbital: { x: 0, y: camHeight, z: camDistance }, // Will be overridden by animation
  };

  function animate(time: number, p: ParamValues) {
    const viewpoint = p.viewpoint as string;
    const orbitSpeed = p.orbitSpeed as number;
    const h = p.camHeight as number;
    const d = p.camDistance as number;

    if (viewpoint === 'orbital') {
      // Orbiting camera
      const angle = time * orbitSpeed;
      cam.transform.position = {
        x: Math.sin(angle) * d,
        y: h + Math.sin(time * orbitSpeed * 0.5) * 1.5,
        z: Math.cos(angle) * d,
      };
    } else {
      // Static viewpoints with slight breathing motion
      const vp = viewpoints[viewpoint] || viewpoints.front;
      cam.transform.position = {
        x: vp.x,
        y: vp.y + Math.sin(time * 0.3) * 0.2,
        z: vp.z,
      };
    }
    cam.transform.updateLocalMatrix();

    // Animate golden sphere gentle bob
    sphere.transform.position.y = 0.3 + Math.sin(time * 1.2) * 0.3;
    sphere.transform.updateLocalMatrix();

    // Animate decorative spheres up and down
    scene.traverse((node) => {
      if (node.name.startsWith('deco-')) {
        const idx = parseInt(node.name.split('-')[1], 10);
        node.transform.position.y = -0.5 + Math.sin(time * 1.5 + idx * 0.8) * 0.4;
        node.transform.updateLocalMatrix();
      }
    });
  }

  return { scene, animate };
}
