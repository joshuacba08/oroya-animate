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

export function createWheelAndBubbling() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 3, z: 14 };
  scene.add(cam);
  addDefaultLighting(scene);

  const wheelConfigs = [
    { x: -4, color: { r: 0.18, g: 0.60, b: 0.95 }, shape: "box" as const },
    { x: -2, color: { r: 0.95, g: 0.44, b: 0.18 }, shape: "sphere" as const },
    { x: 0, color: { r: 0.18, g: 0.85, b: 0.55 }, shape: "box" as const },
  ];
  const wheelNodes: Node[] = [];
  for (const cfg of wheelConfigs) {
    const node = new Node(`wheel - obj - ${cfg.x} `);
    if (cfg.shape === "box") node.addComponent(createBox(1.2, 1.2, 1.2));
    else node.addComponent(createSphere(0.7, 24, 24));
    node.addComponent(new Material({ color: { ...cfg.color } }));
    node.transform.position = { x: cfg.x, y: 0, z: 0 };
    node.transform.updateLocalMatrix();
    scene.add(node);
    wheelNodes.push(node);
  }

  const wheelLabel = new Node("wheel-section-indicator");
  wheelLabel.addComponent(createBox(8, 0.04, 0.04));
  wheelLabel.addComponent(new Material({ color: { r: 0.3, g: 0.3, b: 0.5 } }));
  wheelLabel.transform.position = { x: -2, y: -1.8, z: 0 };
  wheelLabel.transform.updateLocalMatrix();
  scene.add(wheelLabel);

  const parentNode = new Node("bubbling-parent");
  parentNode.addComponent(createBox(3.5, 3.5, 0.3));
  parentNode.addComponent(new Material({ color: { r: 0.3, g: 0.3, b: 0.3 }, opacity: 0.4 }));
  parentNode.transform.position = { x: 4, y: 0.5, z: 0 };
  parentNode.transform.updateLocalMatrix();
  scene.add(parentNode);

  const childA = new Node("child-A");
  childA.addComponent(createSphere(0.45, 20, 20));
  childA.addComponent(new Material({ color: { r: 0.95, g: 0.55, b: 0.18 } }));
  childA.transform.position = { x: 3.2, y: 1.2, z: 0.3 };
  childA.transform.updateLocalMatrix();
  scene.add(childA);

  const childB = new Node("child-B");
  childB.addComponent(createBox(0.8, 0.8, 0.8));
  childB.addComponent(new Material({ color: { r: 0.60, g: 0.18, b: 0.95 } }));
  childB.transform.position = { x: 4.8, y: 1.2, z: 0.3 };
  childB.transform.updateLocalMatrix();
  scene.add(childB);

  const childC = new Node("child-C");
  childC.addComponent(createBox(0.6, 0.6, 0.6));
  childC.addComponent(new Material({ color: { r: 0.18, g: 0.87, b: 0.70 } }));
  childC.transform.position = { x: 4, y: -0.2, z: 0.3 };
  childC.transform.updateLocalMatrix();
  scene.add(childC);

  const trackerNode = new Node("pointer-tracker");
  trackerNode.addComponent(createBox(5, 3, 0.1));
  trackerNode.addComponent(new Material({ color: { r: 0.15, g: 0.15, b: 0.20 }, opacity: 0.6 }));
  trackerNode.transform.position = { x: -2, y: -3.5, z: 0 };
  trackerNode.transform.updateLocalMatrix();
  scene.add(trackerNode);

  const trackerDot = new Node("tracker-dot");
  trackerDot.addComponent(createSphere(0.15, 16, 16));
  trackerDot.addComponent(new Material({ color: { r: 1, g: 0.3, b: 0.5 } }));
  trackerDot.transform.position = { x: -2, y: -3.5, z: 0.15 };
  trackerDot.transform.updateLocalMatrix();
  scene.add(trackerDot);

  const wbFloor = new Node("floor");
  wbFloor.addComponent(createBox(16, 0.08, 4));
  wbFloor.addComponent(new Material({ color: { r: 0.10, g: 0.10, b: 0.14 } }));
  wbFloor.transform.position = { x: 0, y: -5.5, z: 0 };
  wbFloor.transform.updateLocalMatrix();
  scene.add(wbFloor);

  function animate(time: number) {
    for (let i = 0; i < wheelNodes.length; i++) {
      const s = 1 + Math.sin(time * 0.8 + i * 1.5) * 0.3;
      wheelNodes[i].transform.scale = { x: s, y: s, z: s };
      const a = time * 0.3;
      wheelNodes[i].transform.rotation = { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
      wheelNodes[i].transform.updateLocalMatrix();
    }
    parentNode.transform.position = { x: 4, y: 0.5 + Math.sin(time * 0.5) * 0.1, z: 0 };
    parentNode.transform.updateLocalMatrix();
    childA.transform.position = { x: 3.2, y: 1.2 + Math.sin(time * 0.5) * 0.1, z: 0.3 };
    childA.transform.updateLocalMatrix();
    childB.transform.position = { x: 4.8, y: 1.2 + Math.sin(time * 0.5) * 0.1, z: 0.3 };
    childB.transform.updateLocalMatrix();
    childC.transform.position = { x: 4, y: -0.2 + Math.sin(time * 0.5) * 0.1, z: 0.3 };
    childC.transform.updateLocalMatrix();

    const dotX = -2 + Math.sin(time * 0.7) * 2;
    const dotY = -3.5 + Math.cos(time * 0.9) * 1;
    trackerDot.transform.position = { x: dotX, y: dotY, z: 0.15 };
    const dotPulse = 0.15 + Math.sin(time * 4) * 0.03;
    const dotS = dotPulse / 0.15;
    trackerDot.transform.scale = { x: dotS, y: dotS, z: dotS };
    trackerDot.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
