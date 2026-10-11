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

export function createClickPlayground() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 2, z: 12 };
  scene.add(cam);
  addDefaultLighting(scene);

  const counterNode = new Node("click-counter");
  counterNode.addComponent(createBox(1, 1, 1));
  counterNode.addComponent(new Material({ color: { r: 0.18, g: 0.53, b: 0.87 } }));
  counterNode.transform.position = { x: -5, y: 0, z: 0 };
  counterNode.transform.updateLocalMatrix();
  scene.add(counterNode);

  const toggleNode = new Node("toggle");
  toggleNode.addComponent(createSphere(0.7, 24, 24));
  const toggleMat = new Material({ color: { r: 0.4, g: 0.4, b: 0.4 } });
  toggleNode.addComponent(toggleMat);
  toggleNode.transform.position = { x: -2.5, y: 0, z: 0 };
  toggleNode.transform.updateLocalMatrix();
  scene.add(toggleNode);

  const pressNode = new Node("press-effect");
  pressNode.addComponent(createBox(1.4, 1.4, 1.4));
  pressNode.addComponent(new Material({ color: { r: 0.87, g: 0.36, b: 0.18 } }));
  pressNode.transform.position = { x: 0, y: 0, z: 0 };
  pressNode.transform.updateLocalMatrix();
  scene.add(pressNode);

  const CLICK_COLORS = [
    { r: 0.95, g: 0.26, b: 0.21 }, { r: 0.13, g: 0.59, b: 0.95 },
    { r: 0.18, g: 0.80, b: 0.44 }, { r: 0.93, g: 0.69, b: 0.13 },
    { r: 0.69, g: 0.24, b: 0.85 }, { r: 1.00, g: 0.42, b: 0.70 },
  ];
  const cyclerNode = new Node("color-cycler");
  cyclerNode.addComponent(createSphere(0.8, 32, 32));
  const cyclerMat = new Material({ color: { ...CLICK_COLORS[0] } });
  cyclerNode.addComponent(cyclerMat);
  cyclerNode.transform.position = { x: 2.5, y: 0, z: 0 };
  cyclerNode.transform.updateLocalMatrix();
  scene.add(cyclerNode);

  const hub = new Node("hub");
  hub.addComponent(createBox(0.5, 0.5, 0.5));
  hub.addComponent(new Material({ color: { r: 0.69, g: 0.24, b: 0.85 } }));
  hub.transform.position = { x: 5, y: 0, z: 0 };
  hub.transform.updateLocalMatrix();
  scene.add(hub);

  const orbitNodes: { node: Node; angle: number }[] = [];
  for (let j = 0; j < 6; j++) {
    const angle = (j / 6) * Math.PI * 2;
    const orbiter = new Node(`orbiter - ${j} `);
    orbiter.addComponent(createSphere(0.25, 16, 16));
    orbiter.addComponent(new Material({
      color: {
        r: 0.5 + 0.5 * Math.cos(angle),
        g: 0.5 + 0.5 * Math.cos(angle + 2.094),
        b: 0.5 + 0.5 * Math.cos(angle + 4.189),
      },
    }));
    scene.add(orbiter);
    orbitNodes.push({ node: orbiter, angle });
  }

  const clickFloor = new Node("floor");
  clickFloor.addComponent(createBox(14, 0.08, 4));
  clickFloor.addComponent(new Material({ color: { r: 0.12, g: 0.12, b: 0.16 } }));
  clickFloor.transform.position = { x: 0, y: -1.5, z: 0 };
  clickFloor.transform.updateLocalMatrix();
  scene.add(clickFloor);

  function animate(time: number) {
    const scaleT = 1 + Math.sin(time * 1.5) * 0.15;
    counterNode.transform.scale = { x: scaleT, y: scaleT, z: scaleT };
    const a1 = time * 0.5;
    counterNode.transform.rotation = { x: Math.sin(a1 * 0.3) * 0.1, y: Math.sin(a1 / 2), z: 0, w: Math.cos(a1 / 2) };
    counterNode.transform.updateLocalMatrix();

    const toggleY = Math.sin(time * 0.8) * 0.75;
    toggleNode.transform.position = { x: -2.5, y: toggleY, z: 0 };
    const tPhase = (Math.sin(time * 0.8) + 1) / 2;
    toggleMat.definition.color = { r: 0.4 + (0.18 - 0.4) * tPhase, g: 0.4 + (0.87 - 0.4) * tPhase, b: 0.4 + (0.44 - 0.4) * tPhase };
    if (toggleY > 0) {
      const a2 = time * 2;
      toggleNode.transform.rotation = { x: 0, y: Math.sin(a2 / 2), z: 0, w: Math.cos(a2 / 2) };
    } else {
      toggleNode.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
    }
    toggleNode.transform.updateLocalMatrix();

    const pressBreathe = 0.85 + Math.abs(Math.sin(time * 2.5)) * 0.15;
    pressNode.transform.scale = { x: pressBreathe, y: pressBreathe, z: pressBreathe };
    pressNode.transform.updateLocalMatrix();

    const colorIdx = Math.floor(time * 0.5) % CLICK_COLORS.length;
    const nextIdx = (colorIdx + 1) % CLICK_COLORS.length;
    const lerpT = (time * 0.5) % 1;
    cyclerMat.definition.color = {
      r: CLICK_COLORS[colorIdx].r + (CLICK_COLORS[nextIdx].r - CLICK_COLORS[colorIdx].r) * lerpT,
      g: CLICK_COLORS[colorIdx].g + (CLICK_COLORS[nextIdx].g - CLICK_COLORS[colorIdx].g) * lerpT,
      b: CLICK_COLORS[colorIdx].b + (CLICK_COLORS[nextIdx].b - CLICK_COLORS[colorIdx].b) * lerpT,
    };
    cyclerNode.transform.position = { x: 2.5, y: Math.sin(time * 1.5) * 0.15, z: 0 };
    cyclerNode.transform.updateLocalMatrix();

    const et = (Math.sin(time * 0.5) + 1) / 2;
    const hubAngle = time;
    hub.transform.rotation = { x: Math.sin(hubAngle * 0.3) * 0.2, y: Math.sin(hubAngle / 2), z: 0, w: Math.cos(hubAngle / 2) };
    hub.transform.updateLocalMatrix();
    for (let j = 0; j < orbitNodes.length; j++) {
      const { node, angle } = orbitNodes[j];
      const radius = et * 1.5;
      const spin = time * 1.5;
      node.transform.position = { x: 5 + Math.cos(angle + spin) * radius, y: Math.sin(angle + spin) * radius, z: Math.sin(angle * 2 + spin * 0.5) * radius * 0.3 };
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
