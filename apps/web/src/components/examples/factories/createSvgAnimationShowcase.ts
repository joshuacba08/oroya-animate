import {
Animation,
Camera,
CameraType,
createBox,
createSphere,
createText,
Material,
Node,
Scene
} from "@joroya/core";

export function createSvgAnimationShowcase() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.06, g: 0.07, b: 0.1 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  // Title
  const animTitle = new Node("title");
  animTitle.addComponent(createText("SVG Native Animations", {
    fontSize: 38, fontFamily: "sans-serif", fontWeight: "bold", textAnchor: "middle",
  }));
  animTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  animTitle.transform.position = { x: 500, y: 80, z: 0 };
  animTitle.transform.updateLocalMatrix();
  scene.add(animTitle);

  // 1. Pulsing circle
  const pulse = new Node("pulse");
  pulse.addComponent(createSphere(40));
  pulse.addComponent(new Material({ fill: { r: 0.3, g: 0.6, b: 1.0 }, opacity: 0.8 }));
  pulse.addComponent(new Animation([
    { type: "animate", attributeName: "r", values: "40;55;40", dur: "2s", repeatCount: "indefinite" },
    { type: "animate", attributeName: "opacity", values: "0.9;0.4;0.9", dur: "2s", repeatCount: "indefinite" },
  ]));
  pulse.transform.position = { x: 200, y: 280, z: 0 };
  pulse.transform.updateLocalMatrix();
  scene.add(pulse);

  const pulseLabel = new Node("pulse-lbl");
  pulseLabel.addComponent(createText("Pulse", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  pulseLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  pulseLabel.transform.position = { x: 200, y: 360, z: 0 };
  pulseLabel.transform.updateLocalMatrix();
  scene.add(pulseLabel);

  // 2. Rotating square
  const spinner = new Node("spinner");
  spinner.addComponent(createBox(80, 80, 0));
  spinner.addComponent(new Material({
    fill: { r: 1, g: 0.4, b: 0.3 },
    stroke: { r: 1, g: 0.6, b: 0.5 },
    strokeWidth: 2,
  }));
  spinner.addComponent(new Animation([
    { type: "animateTransform", transformType: "rotate", from: "0", to: "360", dur: "4s", repeatCount: "indefinite" },
  ]));
  spinner.transform.position = { x: 500, y: 280, z: 0 };
  spinner.transform.updateLocalMatrix();
  scene.add(spinner);

  const spinnerLabel = new Node("spinner-lbl");
  spinnerLabel.addComponent(createText("Rotate", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  spinnerLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  spinnerLabel.transform.position = { x: 500, y: 360, z: 0 };
  spinnerLabel.transform.updateLocalMatrix();
  scene.add(spinnerLabel);

  // 3. Scaling circle
  const scaler = new Node("scaler");
  scaler.addComponent(createSphere(40));
  scaler.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.4, cy: 0.4, r: 0.5,
      stops: [
        { offset: 0, color: { r: 0.4, g: 1, b: 0.6 } },
        { offset: 1, color: { r: 0.1, g: 0.6, b: 0.3 } },
      ],
    },
  }));
  scaler.addComponent(new Animation([
    { type: "animateTransform", transformType: "scale", values: "1;1.4;1", dur: "1.5s", repeatCount: "indefinite" },
  ]));
  scaler.transform.position = { x: 800, y: 280, z: 0 };
  scaler.transform.updateLocalMatrix();
  scene.add(scaler);

  const scalerLabel = new Node("scaler-lbl");
  scalerLabel.addComponent(createText("Scale", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  scalerLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  scalerLabel.transform.position = { x: 800, y: 360, z: 0 };
  scalerLabel.transform.updateLocalMatrix();
  scene.add(scalerLabel);

  // 4. Translating element
  const mover = new Node("mover");
  mover.addComponent(createSphere(25));
  mover.addComponent(new Material({ fill: { r: 1, g: 0.8, b: 0.1 } }));
  mover.addComponent(new Animation([
    { type: "animateTransform", transformType: "translate", values: "0,0;150,0;150,-80;0,0", dur: "3s", repeatCount: "indefinite" },
  ]));
  mover.transform.position = { x: 200, y: 580, z: 0 };
  mover.transform.updateLocalMatrix();
  scene.add(mover);

  const moverLabel = new Node("mover-lbl");
  moverLabel.addComponent(createText("Translate", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  moverLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  moverLabel.transform.position = { x: 200, y: 660, z: 0 };
  moverLabel.transform.updateLocalMatrix();
  scene.add(moverLabel);

  // 5. Skewing rectangle
  const skewer = new Node("skewer");
  skewer.addComponent(createBox(70, 100, 0));
  skewer.addComponent(new Material({
    fillGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.6, g: 0.2, b: 0.9 } },
        { offset: 1, color: { r: 0.2, g: 0.6, b: 0.9 } },
      ],
    },
  }));
  skewer.addComponent(new Animation([
    { type: "animateTransform", transformType: "skewX", values: "0;20;-20;0", dur: "3s", repeatCount: "indefinite" },
  ]));
  skewer.transform.position = { x: 500, y: 580, z: 0 };
  skewer.transform.updateLocalMatrix();
  scene.add(skewer);

  const skewerLabel = new Node("skewer-lbl");
  skewerLabel.addComponent(createText("SkewX", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  skewerLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  skewerLabel.transform.position = { x: 500, y: 660, z: 0 };
  skewerLabel.transform.updateLocalMatrix();
  scene.add(skewerLabel);

  // 6. Combined: pulse + rotate
  const animCombo = new Node("anim-combo");
  animCombo.addComponent(createSphere(40));
  animCombo.addComponent(new Material({ fill: { r: 1, g: 0.3, b: 0.5 }, opacity: 0.9 }));
  animCombo.addComponent(new Animation([
    { type: "animate", attributeName: "r", values: "40;28;40", dur: "1s", repeatCount: "indefinite" },
    { type: "animateTransform", transformType: "rotate", from: "0", to: "360", dur: "6s", repeatCount: "indefinite" },
  ]));
  animCombo.transform.position = { x: 800, y: 580, z: 0 };
  animCombo.transform.updateLocalMatrix();
  scene.add(animCombo);

  const comboLabel = new Node("combo-lbl");
  comboLabel.addComponent(createText("Combined", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  comboLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  comboLabel.transform.position = { x: 800, y: 660, z: 0 };
  comboLabel.transform.updateLocalMatrix();
  scene.add(comboLabel);

  // Subtitle
  const subtitle = new Node("subtitle");
  subtitle.addComponent(createText("Declarative <animate> & <animateTransform>", {
    fontSize: 18, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  subtitle.addComponent(new Material({ fill: { r: 0.4, g: 0.4, b: 0.5 } }));
  subtitle.transform.position = { x: 500, y: 820, z: 0 };
  subtitle.transform.updateLocalMatrix();
  scene.add(subtitle);

  function animate() { }
  return { scene, animate };
}
