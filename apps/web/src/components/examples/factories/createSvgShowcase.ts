import {
Camera,
CameraType,
createBox,
createPath2D,
createSphere,
createText,
Material,
Node,
Scene
} from "@joroya/core";
import { svgShowcaseStarPath } from "./shared";

export function createSvgShowcase() {
  const scene = new Scene();
  const accent = { r: 0.29, g: 0.48, b: 1.0 };

  const cam = new Node("cam");
  cam.addComponent(new Camera({ type: CameraType.Orthographic, left: 0, right: 800, top: 0, bottom: 600, near: 0.1, far: 100 }));
  scene.add(cam);

  const scTitle = new Node("title");
  scTitle.addComponent(createText("SVG Showcase", { fontSize: 32, fontFamily: "system-ui, sans-serif", fontWeight: "bold", textAnchor: "middle" }));
  scTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  scTitle.transform.position = { x: 400, y: 40, z: 0 };
  scTitle.transform.updateLocalMatrix();
  scene.add(scTitle);

  const gradRect = new Node("gradient-rect");
  gradRect.addComponent(createBox(200, 120, 0));
  gradRect.addComponent(new Material({ fillGradient: { type: "linear" as const, x1: 0, y1: 0, x2: 1, y2: 1, stops: [{ offset: 0, color: accent }, { offset: 0.5, color: { r: 1, g: 1, b: 1 } }, { offset: 1, color: { r: accent.r * 0.4, g: accent.g * 0.4, b: accent.b * 0.8 } }] }, stroke: { r: 0.3, g: 0.3, b: 0.4 }, strokeWidth: 2 }));
  gradRect.transform.position = { x: 140, y: 160, z: 0 };
  gradRect.transform.updateLocalMatrix();
  scene.add(gradRect);

  function addLbl(text: string, x: number, y: number) {
    const l = new Node(`lbl - ${x} -${y} `);
    l.addComponent(createText(text, { fontSize: 14, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
    l.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
    l.transform.position = { x, y, z: 0 };
    l.transform.updateLocalMatrix();
    scene.add(l);
  }
  addLbl("Gradient", 140, 240);

  const blurCircle = new Node("blur-circle");
  blurCircle.addComponent(createSphere(55));
  blurCircle.addComponent(new Material({ fill: { r: 0.4, g: 0.8, b: 1.0 }, filter: { effects: [{ type: "blur", stdDeviation: 3 }] } }));
  blurCircle.transform.position = { x: 400, y: 160, z: 0 };
  blurCircle.transform.updateLocalMatrix();
  scene.add(blurCircle);
  addLbl("Blur (3px)", 400, 240);

  const shadowBox = new Node("shadow-box");
  shadowBox.addComponent(createBox(150, 100, 0));
  shadowBox.addComponent(new Material({ fill: { r: 1.0, g: 0.6, b: 0.2 }, filter: { effects: [{ type: "dropShadow", dx: 4, dy: 4, stdDeviation: 3, floodColor: { r: 0, g: 0, b: 0 }, floodOpacity: 0.5 }] } }));
  shadowBox.transform.position = { x: 660, y: 160, z: 0 };
  shadowBox.transform.updateLocalMatrix();
  scene.add(shadowBox);
  addLbl("Drop Shadow", 660, 240);

  const clippedCircle = new Node("clipped-circle");
  clippedCircle.addComponent(createSphere(65));
  clippedCircle.addComponent(new Material({ fillGradient: { type: "radial", cx: 0.4, cy: 0.4, r: 0.6, stops: [{ offset: 0, color: { r: 1, g: 1, b: 0.3 } }, { offset: 1, color: { r: 1, g: 0.4, b: 0 } }] }, clipPath: { path: svgShowcaseStarPath(0, 0, 5, 70, 30) } }));
  clippedCircle.transform.position = { x: 140, y: 400, z: 0 };
  clippedCircle.transform.updateLocalMatrix();
  scene.add(clippedCircle);
  addLbl("Clip-Path", 140, 490);

  const maskedRect = new Node("masked-rect");
  maskedRect.addComponent(createBox(150, 120, 0));
  maskedRect.addComponent(new Material({ fillGradient: { type: "linear", x1: 0, y1: 0, x2: 1, y2: 0, stops: [{ offset: 0, color: { r: 0.9, g: 0.1, b: 0.5 } }, { offset: 1, color: { r: 0.2, g: 0.1, b: 0.9 } }] }, mask: { path: [{ command: "M" as const, args: [-75, -60] }, { command: "L" as const, args: [75, -60] }, { command: "L" as const, args: [75, 60] }, { command: "L" as const, args: [-75, 60] }, { command: "Z" as const, args: [] }, { command: "M" as const, args: [0, -40] }, { command: "L" as const, args: [40, 0] }, { command: "L" as const, args: [0, 40] }, { command: "L" as const, args: [-40, 0] }, { command: "Z" as const, args: [] }], fill: { r: 1, g: 1, b: 1 }, opacity: 0.9 } }));
  maskedRect.transform.position = { x: 400, y: 400, z: 0 };
  maskedRect.transform.updateLocalMatrix();
  scene.add(maskedRect);
  addLbl("Mask", 400, 490);

  const bezier = new Node("bezier");
  bezier.addComponent(createPath2D([{ command: "M", args: [580, 340] }, { command: "C", args: [580, 280, 740, 280, 740, 340] }, { command: "C", args: [740, 400, 580, 460, 580, 460] }, { command: "C", args: [580, 460, 740, 400, 740, 460] }]));
  bezier.addComponent(new Material({ stroke: { r: 0.5, g: 1.0, b: 0.6 }, strokeWidth: 3 }));
  scene.add(bezier);
  addLbl("Bézier Path", 660, 490);

  const gradLine = new Node("gradient-line");
  gradLine.addComponent(createPath2D([{ command: "M", args: [60, 540] }, { command: "L", args: [740, 540] }]));
  gradLine.addComponent(new Material({ strokeGradient: { type: "linear", x1: 0, y1: 0.5, x2: 1, y2: 0.5, stops: [{ offset: 0, color: { r: 1, g: 0, b: 0 } }, { offset: 0.25, color: { r: 1, g: 1, b: 0 } }, { offset: 0.5, color: { r: 0, g: 1, b: 0 } }, { offset: 0.75, color: { r: 0, g: 1, b: 1 } }, { offset: 1, color: { r: 0.5, g: 0, b: 1 } }] }, strokeWidth: 4 }));
  scene.add(gradLine);
  addLbl("Stroke Gradient", 400, 570);

  function animate() { }
  return { scene, animate };
}
