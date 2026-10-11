import {
Animation,
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
import { svgAnimLabel,svgAnimStarPath } from "./shared";

export function createSvgAnimations() {
  const scene = new Scene();
  const dur = "2s";

  const cam = new Node("cam");
  cam.addComponent(new Camera({ type: CameraType.Orthographic, left: 0, right: 800, top: 0, bottom: 600, near: 0.1, far: 100 }));
  scene.add(cam);

  const anTitle = new Node("title");
  anTitle.addComponent(createText("SVG Animations", { fontSize: 30, fontFamily: "system-ui, sans-serif", fontWeight: "bold", textAnchor: "middle" }));
  anTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  anTitle.transform.position = { x: 400, y: 40, z: 0 };
  anTitle.transform.updateLocalMatrix();
  scene.add(anTitle);

  const pulse = new Node("pulse");
  pulse.addComponent(createSphere(45));
  pulse.addComponent(new Material({ fillGradient: { type: "radial", cx: 0.4, cy: 0.4, r: 0.6, stops: [{ offset: 0, color: { r: 1, g: 0.3, b: 0.3 } }, { offset: 1, color: { r: 0.8, g: 0, b: 0 } }] } }));
  pulse.addComponent(new Animation([{ type: "animate", attributeName: "opacity", values: "1;0.2;1", dur, repeatCount: "indefinite" }]));
  pulse.transform.position = { x: 130, y: 160, z: 0 };
  pulse.transform.updateLocalMatrix();
  scene.add(pulse);
  svgAnimLabel(scene, "Pulse", 130, 230);

  const spinner = new Node("spinner");
  spinner.addComponent(createBox(70, 70, 0));
  spinner.addComponent(new Material({ fill: { r: 0.3, g: 0.6, b: 1.0 }, stroke: { r: 0.1, g: 0.3, b: 0.8 }, strokeWidth: 2 }));
  spinner.addComponent(new Animation([{ type: "animateTransform", transformType: "rotate", from: "0 0 0", to: "360 0 0", dur, repeatCount: "indefinite" }]));
  spinner.transform.position = { x: 400, y: 160, z: 0 };
  spinner.transform.updateLocalMatrix();
  scene.add(spinner);
  svgAnimLabel(scene, "Rotate", 400, 230);

  const diamond = new Node("diamond");
  diamond.addComponent(createPath2D([{ command: "M", args: [0, -40] }, { command: "L", args: [40, 0] }, { command: "L", args: [0, 40] }, { command: "L", args: [-40, 0] }, { command: "Z", args: [] }]));
  diamond.addComponent(new Material({ fill: { r: 0.2, g: 0.9, b: 0.5 }, stroke: { r: 0, g: 0.5, b: 0.2 }, strokeWidth: 2 }));
  diamond.addComponent(new Animation([{ type: "animateTransform", transformType: "scale", values: "1;1.4;1", dur, repeatCount: "indefinite" }]));
  diamond.transform.position = { x: 670, y: 160, z: 0 };
  diamond.transform.updateLocalMatrix();
  scene.add(diamond);
  svgAnimLabel(scene, "Scale", 670, 230);

  const colorBox = new Node("color-cycle");
  colorBox.addComponent(createBox(120, 80, 0));
  colorBox.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));
  colorBox.addComponent(new Animation([{ type: "animate", attributeName: "fill", values: "rgb(255,0,0);rgb(0,255,0);rgb(0,0,255);rgb(255,0,0)", dur, repeatCount: "indefinite" }]));
  colorBox.transform.position = { x: 130, y: 380, z: 0 };
  colorBox.transform.updateLocalMatrix();
  scene.add(colorBox);
  svgAnimLabel(scene, "Color Cycle", 130, 445);

  const bouncer = new Node("bouncer");
  bouncer.addComponent(createSphere(25));
  bouncer.addComponent(new Material({ fill: { r: 1, g: 0.8, b: 0.1 } }));
  bouncer.addComponent(new Animation([{ type: "animate", attributeName: "cy", values: "-40;40;-40", dur, repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.42 0 0.58 1;0.42 0 0.58 1" }]));
  bouncer.transform.position = { x: 400, y: 380, z: 0 };
  bouncer.transform.updateLocalMatrix();
  scene.add(bouncer);
  svgAnimLabel(scene, "Bounce", 400, 445);

  const combinedStar = new Node("combined-star");
  combinedStar.addComponent(createPath2D(svgAnimStarPath(0, 0, 6, 45, 20)));
  combinedStar.addComponent(new Material({ fillGradient: { type: "linear", x1: 0, y1: 0, x2: 1, y2: 1, stops: [{ offset: 0, color: { r: 1, g: 0.5, b: 0 } }, { offset: 1, color: { r: 1, g: 0, b: 0.5 } }] } }));
  combinedStar.addComponent(new Animation([
    { type: "animateTransform", transformType: "rotate", from: "0 0 0", to: "360 0 0", dur: "2s", repeatCount: "indefinite" },
    { type: "animate", attributeName: "opacity", values: "1;0.4;1", dur, repeatCount: "indefinite" },
  ]));
  combinedStar.transform.position = { x: 670, y: 380, z: 0 };
  combinedStar.transform.updateLocalMatrix();
  scene.add(combinedStar);
  svgAnimLabel(scene, "Combined", 670, 445);

  const footer = new Node("footer");
  footer.addComponent(createText("All animations are declarative SVG — no JavaScript loop needed.", { fontSize: 13, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
  footer.addComponent(new Material({ fill: { r: 0.4, g: 0.4, b: 0.5 } }));
  footer.transform.position = { x: 400, y: 560, z: 0 };
  footer.transform.updateLocalMatrix();
  scene.add(footer);

  function animate() { }
  return { scene, animate };
}
