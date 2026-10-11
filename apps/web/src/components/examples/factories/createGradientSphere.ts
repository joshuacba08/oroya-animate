import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { seededRng } from "./shared";

export function createGradientSphere() {
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
  bg.addComponent(new Material({ fill: { r: 0.08, g: 0.09, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;
  const cy = 500;
  const mainRadius = 345;

  // Main gradient sphere
  const sphere = new Node("sphere");
  sphere.addComponent(createSphere(mainRadius));
  sphere.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.5, cy: 0.35, r: 0.65,
      stops: [
        { offset: 0, color: { r: 1.0, g: 0.4, b: 0.55 } },
        { offset: 0.3, color: { r: 0.9, g: 0.25, b: 0.5 } },
        { offset: 0.55, color: { r: 0.5, g: 0.2, b: 0.6 } },
        { offset: 0.8, color: { r: 0.2, g: 0.35, b: 0.55 } },
        { offset: 1, color: { r: 0.15, g: 0.4, b: 0.5 } },
      ],
    },
  }));
  sphere.transform.position = { x: cx, y: cy, z: 0 };
  sphere.transform.updateLocalMatrix();
  scene.add(sphere);

  // Skyline bars (clipped inside the circle using positioning)
  const rng = seededRng(42);
  const barCount = 60;
  const skylineY = cy + 20;
  const barAreaWidth = mainRadius * 1.7;
  const barStartX = cx - barAreaWidth / 2;

  for (let i = 0; i < barCount; i++) {
    const bx = barStartX + (i / barCount) * barAreaWidth;
    const distFromCenter = Math.abs(bx - cx);
    const maxH = Math.sqrt(Math.max(0, mainRadius * mainRadius - distFromCenter * distFromCenter));

    if (maxH < 10) continue;

    const barH = 20 + rng() * Math.min(maxH * 0.6, 180);
    const barW = barAreaWidth / barCount * 0.6;

    const bar = new Node(`bar-${i}`);
    bar.addComponent(createBox(barW, barH, 0));
    bar.addComponent(new Material({
      fill: { r: 0.08, g: 0.08, b: 0.15 },
      opacity: 0.7,
    }));
    bar.transform.position = { x: bx, y: skylineY - barH / 2, z: 0 };
    bar.transform.updateLocalMatrix();
    scene.add(bar);
  }

  // Stroke gradient frame
  const frame = new Node("frame");
  frame.addComponent(createSphere(mainRadius + 3));
  frame.addComponent(new Material({
    strokeGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.9, g: 0.9, b: 0.95 } },
        { offset: 1, color: { r: 0.9, g: 0.9, b: 0.95 }, opacity: 0.1 },
      ],
    },
    strokeWidth: 2,
  }));
  frame.transform.position = { x: cx, y: cy, z: 0 };
  frame.transform.updateLocalMatrix();
  scene.add(frame);

  function animate() { }
  return { scene, animate };
}
