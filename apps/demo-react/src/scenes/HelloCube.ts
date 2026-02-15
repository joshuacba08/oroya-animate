import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';
import { hexToRgb } from '../types';

export const helloCubeControls: ControlDef[] = [
  { type: 'slider', key: 'speed', label: 'Velocidad', min: 0.1, max: 3, step: 0.1, defaultValue: 0.8 },
  { type: 'slider', key: 'tilt', label: 'Inclinación', min: 0, max: 1, step: 0.05, defaultValue: 0.35 },
  { type: 'slider', key: 'size', label: 'Tamaño', min: 0.5, max: 3, step: 0.1, defaultValue: 1.6, rebuild: true },
  { type: 'color', key: 'color', label: 'Color cubo', defaultValue: '#4a7aff', rebuild: true },
];

/**
 * Compose two axis-aligned quaternion rotations (Y then X) into a single
 * normalized quaternion.  This avoids the broken rotation the old code had.
 */
function composeYX(yAngle: number, xAngle: number) {
  const sy = Math.sin(yAngle / 2);
  const cy = Math.cos(yAngle / 2);
  const sx = Math.sin(xAngle / 2);
  const cx = Math.cos(xAngle / 2);

  // qY * qX  (Hamilton product)
  return {
    x: cy * sx,
    y: sy * cx,
    z: -sy * sx,
    w: cy * cx,
  };
}

export function createHelloCubeScene(params: ParamValues) {
  const scene = new Scene();
  const size = params.size as number;
  const rgb = hexToRgb(params.color as string);

  // ── Camera ──────────────────────────────────────────────────────────
  const cameraNode = new Node('camera');
  cameraNode.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200,
  }));
  cameraNode.transform.position = { x: 0, y: 1.8, z: 6 };
  scene.add(cameraNode);

  // ── Ground platform ─────────────────────────────────────────────────
  const groundBase = new Node('ground-base');
  groundBase.addComponent(createBox(14, 0.15, 14));
  groundBase.addComponent(new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } }));
  groundBase.transform.position = { x: 0, y: -1.6, z: 0 };
  scene.add(groundBase);

  const groundTop = new Node('ground-top');
  groundTop.addComponent(createBox(8, 0.1, 8));
  groundTop.addComponent(new Material({ color: { r: 0.14, g: 0.14, b: 0.19 } }));
  groundTop.transform.position = { x: 0, y: -1.45, z: 0 };
  scene.add(groundTop);

  // ── Pedestal ────────────────────────────────────────────────────────
  const pedestal = new Node('pedestal');
  pedestal.addComponent(createBox(size * 1.4, 0.2, size * 1.4));
  pedestal.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.25 } }));
  pedestal.transform.position = { x: 0, y: -1.3, z: 0 };
  scene.add(pedestal);

  // ── Main cube ───────────────────────────────────────────────────────
  const cube = new Node('cube');
  cube.addComponent(createBox(size, size, size));
  cube.addComponent(new Material({ color: rgb }));
  cube.transform.position = { x: 0, y: 0.2, z: 0 };
  scene.add(cube);

  // ── Small orbiting satellites ───────────────────────────────────────
  const satCount = 4;
  const satRadius = size * 1.6;
  const satellites: Node[] = [];
  const satColors = [
    { r: 0.9, g: 0.35, b: 0.25 },
    { r: 0.25, g: 0.8, b: 0.45 },
    { r: 0.9, g: 0.7, b: 0.15 },
    { r: 0.6, g: 0.3, b: 0.85 },
  ];

  for (let i = 0; i < satCount; i++) {
    const sat = new Node(`sat-${i}`);
    sat.addComponent(createSphere(0.18, 14, 14));
    sat.addComponent(new Material({ color: satColors[i] }));
    sat.transform.position = { x: satRadius, y: 0.2, z: 0 };
    scene.add(sat);
    satellites.push(sat);
  }

  // ── Corner accent spheres (static, on the ground) ──────────────────
  const accentPositions = [
    { x: -3, z: -3 }, { x: 3, z: -3 },
    { x: -3, z: 3 }, { x: 3, z: 3 },
  ];
  for (let i = 0; i < accentPositions.length; i++) {
    const a = accentPositions[i];
    const accent = new Node(`accent-${i}`);
    accent.addComponent(createSphere(0.2, 12, 12));
    accent.addComponent(new Material({
      color: { r: 0.25, g: 0.3, b: 0.5 },
      opacity: 0.6,
    }));
    accent.transform.position = { x: a.x, y: -1.25, z: a.z };
    scene.add(accent);
  }

  // ── Shadow (flat dark box under cube) ───────────────────────────────
  const shadow = new Node('shadow');
  shadow.addComponent(createBox(size * 1.1, 0.02, size * 1.1));
  shadow.addComponent(new Material({
    color: { r: 0.05, g: 0.05, b: 0.08 },
    opacity: 0.5,
  }));
  shadow.transform.position = { x: 0, y: -1.2, z: 0 };
  scene.add(shadow);

  // ── Animation ───────────────────────────────────────────────────────
  function animate(time: number, p: ParamValues) {
    const speed = p.speed as number;
    const tilt = p.tilt as number;

    const yAngle = time * speed;
    const xAngle = tilt * Math.PI * 0.5 * Math.sin(time * speed * 0.6);

    // Proper quaternion composition (Y rotation then X tilt)
    cube.transform.rotation = composeYX(yAngle, xAngle);

    // Gentle float
    cube.transform.position.y = 0.2 + Math.sin(time * speed * 0.4) * 0.15;
    cube.transform.updateLocalMatrix();

    // Shadow responds to cube height
    const cubeY = cube.transform.position.y;
    const shadowScale = 1.0 - (cubeY - 0.2) * 0.3;
    shadow.transform.scale = { x: shadowScale, y: 1, z: shadowScale };
    shadow.transform.updateLocalMatrix();

    // Orbiting satellites
    for (let i = 0; i < satCount; i++) {
      const sat = satellites[i];
      const angleOffset = (i / satCount) * Math.PI * 2;
      const orbitAngle = time * speed * 0.5 + angleOffset;
      const verticalOff = Math.sin(time * speed * 0.7 + i * 1.5) * 0.4;

      sat.transform.position = {
        x: Math.cos(orbitAngle) * satRadius,
        y: 0.2 + verticalOff,
        z: Math.sin(orbitAngle) * satRadius,
      };
      sat.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
