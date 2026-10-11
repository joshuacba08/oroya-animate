import {
Camera,
CameraType,
createBox,
createSphere,
createText,
Material,
Node,
Scene
} from "@joroya/core";

export function createClipMaskDemo() {
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
  const clipTitle = new Node("title");
  clipTitle.addComponent(createText("Clip-Path & Mask", {
    fontSize: 40, fontFamily: "sans-serif", fontWeight: "bold", textAnchor: "middle",
  }));
  clipTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  clipTitle.transform.position = { x: 500, y: 80, z: 0 };
  clipTitle.transform.updateLocalMatrix();
  scene.add(clipTitle);

  // ── Clip-path column (left side) ──
  const clipLabel = new Node("clip-label");
  clipLabel.addComponent(createText("clip-path", {
    fontSize: 22, fontFamily: "monospace", textAnchor: "middle",
  }));
  clipLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  clipLabel.transform.position = { x: 250, y: 150, z: 0 };
  clipLabel.transform.updateLocalMatrix();
  scene.add(clipLabel);

  // Gradient circle clipped by a diamond
  const clippedDiamond = new Node("clipped-diamond");
  clippedDiamond.addComponent(createSphere(150));
  clippedDiamond.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.4, cy: 0.35, r: 0.6,
      stops: [
        { offset: 0, color: { r: 1, g: 0.5, b: 0.7 } },
        { offset: 0.5, color: { r: 0.8, g: 0.2, b: 0.6 } },
        { offset: 1, color: { r: 0.3, g: 0.1, b: 0.5 } },
      ],
    },
    clipPath: {
      path: [
        { command: "M", args: [0, -130] },
        { command: "L", args: [130, 0] },
        { command: "L", args: [0, 130] },
        { command: "L", args: [-130, 0] },
        { command: "Z", args: [] },
      ],
    },
  }));
  clippedDiamond.transform.position = { x: 250, y: 350, z: 0 };
  clippedDiamond.transform.updateLocalMatrix();
  scene.add(clippedDiamond);

  const dLabel = new Node("d-label");
  dLabel.addComponent(createText("Diamond Clip", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  dLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  dLabel.transform.position = { x: 250, y: 530, z: 0 };
  dLabel.transform.updateLocalMatrix();
  scene.add(dLabel);

  // Gradient box clipped by a star shape
  const clippedStar = new Node("clipped-star");
  clippedStar.addComponent(createBox(250, 250, 0));
  clippedStar.addComponent(new Material({
    fillGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.2, g: 0.6, b: 1 } },
        { offset: 0.5, color: { r: 0.5, g: 0.2, b: 0.9 } },
        { offset: 1, color: { r: 1, g: 0.3, b: 0.4 } },
      ],
    },
    clipPath: {
      path: [
        { command: "M", args: [0, -120] },
        { command: "L", args: [35, -40] },
        { command: "L", args: [115, -35] },
        { command: "L", args: [55, 20] },
        { command: "L", args: [70, 100] },
        { command: "L", args: [0, 55] },
        { command: "L", args: [-70, 100] },
        { command: "L", args: [-55, 20] },
        { command: "L", args: [-115, -35] },
        { command: "L", args: [-35, -40] },
        { command: "Z", args: [] },
      ],
    },
  }));
  clippedStar.transform.position = { x: 250, y: 740, z: 0 };
  clippedStar.transform.updateLocalMatrix();
  scene.add(clippedStar);

  const sLabel = new Node("s-label");
  sLabel.addComponent(createText("Star Clip", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  sLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  sLabel.transform.position = { x: 250, y: 910, z: 0 };
  sLabel.transform.updateLocalMatrix();
  scene.add(sLabel);

  // ── Mask column (right side) ──
  const maskLabel = new Node("mask-label");
  maskLabel.addComponent(createText("mask", {
    fontSize: 22, fontFamily: "monospace", textAnchor: "middle",
  }));
  maskLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  maskLabel.transform.position = { x: 750, y: 150, z: 0 };
  maskLabel.transform.updateLocalMatrix();
  scene.add(maskLabel);

  // Gradient circle masked by a circular path
  const maskedCircle = new Node("masked-circle");
  maskedCircle.addComponent(createSphere(150));
  maskedCircle.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.5, cy: 0.5, r: 0.5,
      stops: [
        { offset: 0, color: { r: 0, g: 0.9, b: 0.9 } },
        { offset: 0.6, color: { r: 0.2, g: 0.4, b: 0.9 } },
        { offset: 1, color: { r: 0.5, g: 0.1, b: 0.8 } },
      ],
    },
    mask: {
      path: [
        { command: "M", args: [0, -140] },
        { command: "C", args: [140, -140, 140, 140, 0, 140] },
        { command: "C", args: [-140, 140, -140, -140, 0, -140] },
        { command: "Z", args: [] },
      ],
      fill: { r: 1, g: 1, b: 1 },
      opacity: 0.75,
    },
  }));
  maskedCircle.transform.position = { x: 750, y: 350, z: 0 };
  maskedCircle.transform.updateLocalMatrix();
  scene.add(maskedCircle);

  const cLabel = new Node("c-label");
  cLabel.addComponent(createText("Soft Circle Mask", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  cLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  cLabel.transform.position = { x: 750, y: 530, z: 0 };
  cLabel.transform.updateLocalMatrix();
  scene.add(cLabel);

  // Gradient box masked with reduced opacity
  const maskedRect = new Node("masked-rect");
  maskedRect.addComponent(createBox(250, 250, 0));
  maskedRect.addComponent(new Material({
    fillGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 1, g: 0.6, b: 0.1 } },
        { offset: 0.5, color: { r: 1, g: 0.2, b: 0.3 } },
        { offset: 1, color: { r: 0.6, g: 0.1, b: 0.5 } },
      ],
    },
    mask: {
      path: [
        { command: "M", args: [-100, -100] },
        { command: "L", args: [100, -100] },
        { command: "L", args: [100, 100] },
        { command: "L", args: [-100, 100] },
        { command: "Z", args: [] },
      ],
      fill: { r: 1, g: 1, b: 1 },
      opacity: 0.6,
    },
  }));
  maskedRect.transform.position = { x: 750, y: 740, z: 0 };
  maskedRect.transform.updateLocalMatrix();
  scene.add(maskedRect);

  const rLabel = new Node("r-label");
  rLabel.addComponent(createText("Opacity Mask", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  rLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  rLabel.transform.position = { x: 750, y: 910, z: 0 };
  rLabel.transform.updateLocalMatrix();
  scene.add(rLabel);

  function animate() { }
  return { scene, animate };
}
