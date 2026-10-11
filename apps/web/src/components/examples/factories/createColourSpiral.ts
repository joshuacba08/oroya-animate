import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { WEB_SAFE_COLOURS } from "./shared";

export function createColourSpiral() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.1, g: 0.1, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;
  const cy = 500;
  const totalPoints = 200;
  const turns = 6;

  for (let i = 0; i < totalPoints; i++) {
    const t = i / totalPoints;
    const angle = t * turns * Math.PI * 2;
    const radius = 10 + t * 400;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const dotSize = 2 + t * 10;
    const color = WEB_SAFE_COLOURS[i % WEB_SAFE_COLOURS.length];

    const dot = new Node(`dot-${i}`);
    dot.addComponent(createSphere(dotSize));
    dot.addComponent(new Material({
      fill: color,
      opacity: 0.6 + t * 0.4,
    }));
    dot.transform.position = { x, y, z: 0 };
    dot.transform.updateLocalMatrix();
    scene.add(dot);
  }

  function animate() { }
  return { scene, animate };
}
