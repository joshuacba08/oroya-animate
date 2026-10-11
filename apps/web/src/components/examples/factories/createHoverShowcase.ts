import {
Camera,
CameraType,
createBox,
createSphere,
Interactive,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting } from "./shared";

export function createHoverShowcase() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 1.5, z: 10 };
  scene.add(cam);
  addDefaultLighting(scene);

  const configs = [
    { shape: "box" as const, baseColor: { r: 0.18, g: 0.53, b: 0.87 }, hoverColor: { r: 0.40, g: 0.73, b: 1.00 } },
    { shape: "sphere" as const, baseColor: { r: 0.87, g: 0.36, b: 0.18 }, hoverColor: { r: 1.00, g: 0.56, b: 0.35 } },
    { shape: "box" as const, baseColor: { r: 0.18, g: 0.80, b: 0.44 }, hoverColor: { r: 0.40, g: 1.00, b: 0.65 } },
    { shape: "sphere" as const, baseColor: { r: 0.93, g: 0.69, b: 0.13 }, hoverColor: { r: 1.00, g: 0.85, b: 0.40 } },
    { shape: "box" as const, baseColor: { r: 0.69, g: 0.24, b: 0.85 }, hoverColor: { r: 0.85, g: 0.50, b: 1.00 } },
  ];

  const hoverEntries: { node: Node; material: Material; baseColor: { r: number; g: number; b: number }; hoverColor: { r: number; g: number; b: number } }[] = [];
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const node = new Node(`hover - ${i} `);
    if (cfg.shape === "box") node.addComponent(createBox(1.2, 1.2, 1.2));
    else node.addComponent(createSphere(0.7, 24, 24));
    const material = new Material({ color: { ...cfg.baseColor } });
    node.addComponent(material);
    node.addComponent(new Interactive({ cursor: "pointer" }));
    node.transform.position = { x: (i - 2) * 2.5, y: 0, z: 0 };
    node.transform.updateLocalMatrix();
    scene.add(node);
    hoverEntries.push({ node, material, baseColor: cfg.baseColor, hoverColor: cfg.hoverColor });
  }

  const hoverFloor = new Node("floor");
  hoverFloor.addComponent(createBox(16, 0.08, 4));
  hoverFloor.addComponent(new Material({ color: { r: 0.12, g: 0.12, b: 0.16 } }));
  hoverFloor.transform.position = { x: 0, y: -1.2, z: 0 };
  hoverFloor.transform.updateLocalMatrix();
  scene.add(hoverFloor);

  for (let i = 0; i < configs.length; i++) {
    const indicator = new Node(`indicator - ${i} `);
    indicator.addComponent(createBox(1.8, 0.06, 0.06));
    indicator.addComponent(new Material({ color: configs[i].baseColor }));
    indicator.transform.position = { x: (i - 2) * 2.5, y: -1.1, z: 0.5 };
    indicator.transform.updateLocalMatrix();
    scene.add(indicator);
  }

  function animate(time: number) {
    for (let i = 0; i < hoverEntries.length; i++) {
      const { node, material, baseColor, hoverColor } = hoverEntries[i];
      const x = (i - 2) * 2.5;
      const cyclePhase = (time * 0.3 + i * 0.8) % 4;
      const t = cyclePhase < 1 ? cyclePhase : cyclePhase < 2 ? 2 - cyclePhase : 0;

      switch (i) {
        case 0:
          node.transform.position = { x, y: t * 1.2, z: 0 };
          node.transform.scale = { x: 1, y: 1, z: 1 };
          break;
        case 1: {
          const angle = time * 3 * t;
          node.transform.position = { x, y: 0, z: 0 };
          node.transform.rotation = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
          node.transform.scale = { x: 1, y: 1, z: 1 };
          break;
        }
        case 2: {
          const s = 1 + t * 0.6;
          node.transform.position = { x, y: 0, z: 0 };
          node.transform.scale = { x: s, y: s, z: s };
          break;
        }
        case 3: {
          const bob = Math.sin(time * 2) * 0.1 * t;
          node.transform.position = { x, y: bob, z: 0 };
          node.transform.scale = { x: 1, y: 1, z: 1 };
          break;
        }
        case 4: {
          const pulse = 1 + Math.sin(time * 6) * 0.15 * t;
          node.transform.position = { x, y: 0, z: 0 };
          node.transform.scale = { x: pulse, y: pulse, z: pulse };
          break;
        }
      }

      material.definition.color = {
        r: baseColor.r + (hoverColor.r - baseColor.r) * t,
        g: baseColor.g + (hoverColor.g - baseColor.g) * t,
        b: baseColor.b + (hoverColor.b - baseColor.b) * t,
      };
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
