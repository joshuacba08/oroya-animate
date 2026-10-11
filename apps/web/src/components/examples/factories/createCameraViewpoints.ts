import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting } from "./shared";

export function createCameraViewpoints() {
  const scene = new Scene();
  const cvCamHeight = 5;
  const cvCamDistance = 14;
  const cvInnerCount = 6;
  const cvInnerRadius = 3.5;

  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 200 }));
  cam.transform.position = { x: 0, y: cvCamHeight, z: cvCamDistance };
  scene.add(cam);
  addDefaultLighting(scene);

  const groundBase = new Node("ground-base");
  groundBase.addComponent(createBox(24, 0.2, 24));
  groundBase.addComponent(new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } }));
  groundBase.transform.position = { x: 0, y: -1.1, z: 0 };
  scene.add(groundBase);

  const groundTop = new Node("ground-top");
  groundTop.addComponent(createBox(18, 0.15, 18));
  groundTop.addComponent(new Material({ color: { r: 0.14, g: 0.14, b: 0.19 } }));
  groundTop.transform.position = { x: 0, y: -0.95, z: 0 };
  scene.add(groundTop);

  const pedestalBase = new Node("pedestal-base");
  pedestalBase.addComponent(createBox(3.5, 0.3, 3.5));
  pedestalBase.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.28 } }));
  pedestalBase.transform.position = { x: 0, y: -0.7, z: 0 };
  scene.add(pedestalBase);

  const towerMain = new Node("tower-main");
  towerMain.addComponent(createBox(1.0, 4.5, 1.0));
  towerMain.addComponent(new Material({ color: { r: 0.85, g: 0.7, b: 0.35 } }));
  towerMain.transform.position = { x: 0, y: 1.95, z: 0 };
  scene.add(towerMain);

  for (let i = 0; i < 3; i++) {
    const ring = new Node(`tower - ring - ${i} `);
    const size = 1.5 - i * 0.15;
    ring.addComponent(createBox(size, 0.12, size));
    ring.addComponent(new Material({ color: { r: 0.95, g: 0.8, b: 0.4 } }));
    ring.transform.position = { x: 0, y: 0.5 + i * 1.6, z: 0 };
    scene.add(ring);
  }

  const crown = new Node("tower-crown");
  crown.addComponent(createSphere(0.45, 24, 24));
  crown.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.25 } }));
  crown.transform.position = { x: 0, y: 4.5, z: 0 };
  scene.add(crown);

  const pillarPositions = [{ x: -5, z: -5 }, { x: 5, z: -5 }, { x: -5, z: 5 }, { x: 5, z: 5 }];
  const pillarColors = [
    { r: 0.75, g: 0.2, b: 0.25 }, { r: 0.2, g: 0.55, b: 0.85 },
    { r: 0.2, g: 0.75, b: 0.4 }, { r: 0.7, g: 0.3, b: 0.8 },
  ];
  for (let i = 0; i < 4; i++) {
    const pos = pillarPositions[i];
    const height = 2.5 + (i % 2) * 1.0;
    const base = new Node(`pillar - base - ${i} `);
    base.addComponent(createBox(1.2, 0.2, 1.2));
    base.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.24 } }));
    base.transform.position = { x: pos.x, y: -0.8, z: pos.z };
    scene.add(base);
    const pillar = new Node(`pillar - ${i} `);
    pillar.addComponent(createBox(0.5, height, 0.5));
    pillar.addComponent(new Material({ color: pillarColors[i] }));
    pillar.transform.position = { x: pos.x, y: height / 2 - 0.7, z: pos.z };
    scene.add(pillar);
    const sphere = new Node(`pillar - sphere - ${i} `);
    sphere.addComponent(createSphere(0.4, 20, 20));
    sphere.addComponent(new Material({ color: { r: Math.min(1, pillarColors[i].r + 0.2), g: Math.min(1, pillarColors[i].g + 0.2), b: Math.min(1, pillarColors[i].b + 0.2) } }));
    sphere.transform.position = { x: pos.x, y: height - 0.1, z: pos.z };
    scene.add(sphere);
  }

  const ringCount = 12;
  const ringRadius = 8;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const obj = new Node(`ring - ${i} `);
    if (i % 3 === 0) obj.addComponent(createBox(0.35, 1.8, 0.35));
    else if (i % 3 === 1) obj.addComponent(createSphere(0.4, 16, 16));
    else obj.addComponent(createBox(0.8, 0.3, 0.8));
    const hue = i / ringCount;
    obj.addComponent(new Material({ color: { r: 0.4 + Math.sin(hue * Math.PI * 2) * 0.35, g: 0.4 + Math.sin(hue * Math.PI * 2 + 2.09) * 0.35, b: 0.4 + Math.sin(hue * Math.PI * 2 + 4.19) * 0.35 } }));
    obj.transform.position = { x: Math.cos(angle) * ringRadius, y: -0.2, z: Math.sin(angle) * ringRadius };
    scene.add(obj);
  }

  for (let i = 0; i < cvInnerCount; i++) {
    const angle = (i / cvInnerCount) * Math.PI * 2 + 0.3;
    const s = new Node(`float - ${i} `);
    s.addComponent(createSphere(0.25, 14, 14));
    s.addComponent(new Material({ color: { r: 0.6 + i * 0.06, g: 0.7 - i * 0.05, b: 0.95 } }));
    s.transform.position = { x: Math.cos(angle) * cvInnerRadius, y: 2.5, z: Math.sin(angle) * cvInnerRadius };
    scene.add(s);
  }

  function animate(time: number) {
    const angle = time * 0.4;
    cam.transform.position = { x: Math.sin(angle) * cvCamDistance, y: cvCamHeight + Math.sin(time * 0.16) * 2, z: Math.cos(angle) * cvCamDistance };
    cam.transform.updateLocalMatrix();
    crown.transform.position.y = 4.5 + Math.sin(time * 1.5) * 0.15;
    crown.transform.updateLocalMatrix();
    scene.traverse((node) => {
      if (node.name.startsWith("float-")) {
        const idx = parseInt(node.name.split("-")[1], 10);
        const baseAngle = (idx / cvInnerCount) * Math.PI * 2 + 0.3;
        const orbAngle = baseAngle + time * 0.3;
        node.transform.position = { x: Math.cos(orbAngle) * cvInnerRadius, y: 2.5 + Math.sin(time * 1.2 + idx) * 0.5, z: Math.sin(orbAngle) * cvInnerRadius };
        node.transform.updateLocalMatrix();
      }
      if (node.name.startsWith("ring-")) {
        const idx = parseInt(node.name.split("-")[1], 10);
        node.transform.position.y = -0.2 + Math.sin(time * 0.8 + idx * 0.52) * 0.3;
        const a = time * 0.4 + idx * 0.5;
        node.transform.rotation = { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
        node.transform.updateLocalMatrix();
      }
      if (node.name.startsWith("pillar-sphere-")) {
        const idx = parseInt(node.name.split("-")[2], 10);
        const baseHeight = 2.5 + (idx % 2) * 1.0;
        node.transform.position.y = baseHeight - 0.1 + Math.sin(time + idx * 1.5) * 0.2;
        node.transform.updateLocalMatrix();
      }
    });
  }

  return { scene, animate };
}
