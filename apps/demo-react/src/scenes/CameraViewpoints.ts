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
      { value: 'cinematic', label: 'Cinemático' },
    ],
  },
  { type: 'slider', key: 'orbitSpeed', label: 'Velocidad orbital', min: 0, max: 2, step: 0.05, defaultValue: 0.4 },
  { type: 'slider', key: 'camHeight', label: 'Altura cámara', min: 1, max: 20, step: 0.5, defaultValue: 5, rebuild: true },
  { type: 'slider', key: 'camDistance', label: 'Distancia cámara', min: 5, max: 30, step: 0.5, defaultValue: 14, rebuild: true },
  { type: 'slider', key: 'fov', label: 'Campo de visión', min: 30, max: 100, step: 1, defaultValue: 55, rebuild: true },
];

export function createCameraViewpointsScene(params: ParamValues) {
  const scene = new Scene();
  const camHeight = params.camHeight as number;
  const camDistance = params.camDistance as number;
  const fov = params.fov as number;

  // ── Camera ──────────────────────────────────────────────────────────
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

  // ── Ground platform (two-layer) ────────────────────────────────────
  const groundBase = new Node('ground-base');
  groundBase.addComponent(createBox(24, 0.2, 24));
  groundBase.addComponent(new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } }));
  groundBase.transform.position = { x: 0, y: -1.1, z: 0 };
  scene.add(groundBase);

  const groundTop = new Node('ground-top');
  groundTop.addComponent(createBox(18, 0.15, 18));
  groundTop.addComponent(new Material({ color: { r: 0.14, g: 0.14, b: 0.19 } }));
  groundTop.transform.position = { x: 0, y: -0.95, z: 0 };
  scene.add(groundTop);

  // ── Central pedestal ───────────────────────────────────────────────
  const pedestalBase = new Node('pedestal-base');
  pedestalBase.addComponent(createBox(3.5, 0.3, 3.5));
  pedestalBase.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.28 } }));
  pedestalBase.transform.position = { x: 0, y: -0.7, z: 0 };
  scene.add(pedestalBase);

  const pedestalMid = new Node('pedestal-mid');
  pedestalMid.addComponent(createBox(2.8, 0.25, 2.8));
  pedestalMid.addComponent(new Material({ color: { r: 0.25, g: 0.25, b: 0.33 } }));
  pedestalMid.transform.position = { x: 0, y: -0.45, z: 0 };
  scene.add(pedestalMid);

  // ── Central monument (stacked geometry) ────────────────────────────
  // Main tower
  const towerMain = new Node('tower-main');
  towerMain.addComponent(createBox(1.0, 4.5, 1.0));
  towerMain.addComponent(new Material({ color: { r: 0.85, g: 0.7, b: 0.35 } }));
  towerMain.transform.position = { x: 0, y: 1.95, z: 0 };
  scene.add(towerMain);

  // Tower accent rings (stacked boxes simulating rings)
  for (let i = 0; i < 3; i++) {
    const ring = new Node(`tower-ring-${i}`);
    const size = 1.5 - i * 0.15;
    ring.addComponent(createBox(size, 0.12, size));
    ring.addComponent(new Material({ color: { r: 0.95, g: 0.8, b: 0.4 } }));
    ring.transform.position = { x: 0, y: 0.5 + i * 1.6, z: 0 };
    scene.add(ring);
  }

  // Tower crown sphere
  const crown = new Node('tower-crown');
  crown.addComponent(createSphere(0.45, 24, 24));
  crown.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.25 } }));
  crown.transform.position = { x: 0, y: 4.5, z: 0 };
  scene.add(crown);

  // ── Four corner pillars with spheres ───────────────────────────────
  const pillarPositions = [
    { x: -5, z: -5 },
    { x: 5, z: -5 },
    { x: -5, z: 5 },
    { x: 5, z: 5 },
  ];
  const pillarColors = [
    { r: 0.75, g: 0.2, b: 0.25 },
    { r: 0.2, g: 0.55, b: 0.85 },
    { r: 0.2, g: 0.75, b: 0.4 },
    { r: 0.7, g: 0.3, b: 0.8 },
  ];

  for (let i = 0; i < 4; i++) {
    const pos = pillarPositions[i];
    const height = 2.5 + (i % 2) * 1.0;

    // Pillar base
    const base = new Node(`pillar-base-${i}`);
    base.addComponent(createBox(1.2, 0.2, 1.2));
    base.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.24 } }));
    base.transform.position = { x: pos.x, y: -0.8, z: pos.z };
    scene.add(base);

    // Pillar column
    const pillar = new Node(`pillar-${i}`);
    pillar.addComponent(createBox(0.5, height, 0.5));
    pillar.addComponent(new Material({ color: pillarColors[i] }));
    pillar.transform.position = { x: pos.x, y: height / 2 - 0.7, z: pos.z };
    scene.add(pillar);

    // Sphere on top
    const sphere = new Node(`pillar-sphere-${i}`);
    sphere.addComponent(createSphere(0.4, 20, 20));
    sphere.addComponent(new Material({
      color: {
        r: Math.min(1, pillarColors[i].r + 0.2),
        g: Math.min(1, pillarColors[i].g + 0.2),
        b: Math.min(1, pillarColors[i].b + 0.2),
      },
    }));
    sphere.transform.position = { x: pos.x, y: height - 0.1, z: pos.z };
    scene.add(sphere);
  }

  // ── Orbital ring of varied objects ─────────────────────────────────
  const ringCount = 12;
  const ringRadius = 8;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const px = Math.cos(angle) * ringRadius;
    const pz = Math.sin(angle) * ringRadius;

    const obj = new Node(`ring-${i}`);
    if (i % 3 === 0) {
      // Tall thin box
      obj.addComponent(createBox(0.35, 1.8, 0.35));
    } else if (i % 3 === 1) {
      // Sphere
      obj.addComponent(createSphere(0.4, 16, 16));
    } else {
      // Flat wide box
      obj.addComponent(createBox(0.8, 0.3, 0.8));
    }

    // Rainbow-ish hue based on position in circle
    const hue = i / ringCount;
    obj.addComponent(new Material({
      color: {
        r: 0.4 + Math.sin(hue * Math.PI * 2) * 0.35,
        g: 0.4 + Math.sin(hue * Math.PI * 2 + 2.09) * 0.35,
        b: 0.4 + Math.sin(hue * Math.PI * 2 + 4.19) * 0.35,
      },
    }));
    obj.transform.position = { x: px, y: -0.2, z: pz };
    scene.add(obj);
  }

  // ── Floating accent spheres (inner ring, higher) ───────────────────
  const innerCount = 6;
  const innerRadius = 3.5;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2 + 0.3;
    const s = new Node(`float-${i}`);
    s.addComponent(createSphere(0.25, 14, 14));
    s.addComponent(new Material({
      color: {
        r: 0.6 + i * 0.06,
        g: 0.7 - i * 0.05,
        b: 0.95,
      },
    }));
    s.transform.position = {
      x: Math.cos(angle) * innerRadius,
      y: 2.5,
      z: Math.sin(angle) * innerRadius,
    };
    scene.add(s);
  }

  // ── Small ground detail (scattered small boxes) ────────────────────
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + 0.15;
    const r = 5.5 + (i % 3) * 1.5;
    const detail = new Node(`detail-${i}`);
    detail.addComponent(createBox(0.15, 0.08, 0.15));
    detail.addComponent(new Material({
      color: { r: 0.22, g: 0.22, b: 0.3 },
      opacity: 0.6,
    }));
    detail.transform.position = {
      x: Math.cos(angle) * r,
      y: -0.86,
      z: Math.sin(angle) * r,
    };
    scene.add(detail);
  }

  // ── Viewpoint positions ────────────────────────────────────────────
  const viewpoints: Record<string, { x: number; y: number; z: number }> = {
    front: { x: 0, y: camHeight * 0.6, z: camDistance },
    top: { x: 0, y: 22, z: 0.1 },
    side: { x: camDistance, y: camHeight * 0.7, z: 5 },
    orbital: { x: 0, y: camHeight, z: camDistance },
    cinematic: { x: 0, y: 2, z: camDistance * 0.6 },
  };

  function animate(time: number, p: ParamValues) {
    const viewpoint = p.viewpoint as string;
    const orbitSpeed = p.orbitSpeed as number;
    const h = p.camHeight as number;
    const d = p.camDistance as number;

    if (viewpoint === 'orbital') {
      const angle = time * orbitSpeed;
      cam.transform.position = {
        x: Math.sin(angle) * d,
        y: h + Math.sin(time * orbitSpeed * 0.4) * 2,
        z: Math.cos(angle) * d,
      };
    } else if (viewpoint === 'cinematic') {
      // Slow sweep, low angle, dramatic
      const angle = time * orbitSpeed * 0.3;
      const sweep = Math.sin(time * orbitSpeed * 0.15) * 0.4;
      cam.transform.position = {
        x: Math.sin(angle) * d * 0.7,
        y: 1.5 + Math.abs(Math.sin(time * 0.2)) * 3,
        z: Math.cos(angle) * d * 0.7 + sweep * 3,
      };
    } else {
      const vp = viewpoints[viewpoint] || viewpoints.front;
      cam.transform.position = {
        x: vp.x + Math.sin(time * 0.2) * 0.15,
        y: vp.y + Math.sin(time * 0.3) * 0.2,
        z: vp.z,
      };
    }
    cam.transform.updateLocalMatrix();

    // Crown sphere gentle pulse via scale
    crown.transform.position.y = 4.5 + Math.sin(time * 1.5) * 0.15;
    crown.transform.updateLocalMatrix();

    // Animate floating inner spheres — orbit slowly + bob
    scene.traverse((node) => {
      if (node.name.startsWith('float-')) {
        const idx = parseInt(node.name.split('-')[1], 10);
        const baseAngle = (idx / innerCount) * Math.PI * 2 + 0.3;
        const orbAngle = baseAngle + time * 0.3;
        node.transform.position = {
          x: Math.cos(orbAngle) * innerRadius,
          y: 2.5 + Math.sin(time * 1.2 + idx * 1.0) * 0.5,
          z: Math.sin(orbAngle) * innerRadius,
        };
        node.transform.updateLocalMatrix();
      }

      // Ring objects gentle bob
      if (node.name.startsWith('ring-')) {
        const idx = parseInt(node.name.split('-')[1], 10);
        node.transform.position.y = -0.2 + Math.sin(time * 0.8 + idx * 0.52) * 0.3;
        // Gentle rotation
        const a = time * 0.4 + idx * 0.5;
        node.transform.rotation = {
          x: 0,
          y: Math.sin(a / 2),
          z: 0,
          w: Math.cos(a / 2),
        };
        node.transform.updateLocalMatrix();
      }

      // Pillar spheres float
      if (node.name.startsWith('pillar-sphere-')) {
        const idx = parseInt(node.name.split('-')[2], 10);
        const baseHeight = 2.5 + (idx % 2) * 1.0;
        node.transform.position.y = baseHeight - 0.1 + Math.sin(time * 1.0 + idx * 1.5) * 0.2;
        node.transform.updateLocalMatrix();
      }
    });
  }

  return { scene, animate };
}
