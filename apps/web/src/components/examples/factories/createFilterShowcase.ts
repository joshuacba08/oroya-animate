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

export function createFilterShowcase() {
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
  const title = new Node("title");
  title.addComponent(createText("SVG Filters", {
    fontSize: 40, fontFamily: "sans-serif", fontWeight: "bold", textAnchor: "middle",
  }));
  title.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  title.transform.position = { x: 500, y: 80, z: 0 };
  title.transform.updateLocalMatrix();
  scene.add(title);

  // Blur section
  const blurLabel = new Node("blur-label");
  blurLabel.addComponent(createText("Gaussian Blur", {
    fontSize: 22, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  blurLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  blurLabel.transform.position = { x: 500, y: 150, z: 0 };
  blurLabel.transform.updateLocalMatrix();
  scene.add(blurLabel);

  const blurValues = [0, 3, 8, 15, 25];
  for (let i = 0; i < blurValues.length; i++) {
    const circle = new Node(`blur - ${i} `);
    circle.addComponent(createSphere(55));
    const matDef = {
      fillGradient: {
        type: "radial" as const,
        cx: 0.4, cy: 0.4, r: 0.6,
        stops: [
          { offset: 0, color: { r: 0.4, g: 0.7, b: 1.0 } },
          { offset: 1, color: { r: 0.15, g: 0.25, b: 0.7 } },
        ],
      },
      filter: blurValues[i] > 0
        ? { effects: [{ type: "blur" as const, stdDeviation: blurValues[i] }] }
        : undefined,
    };
    circle.addComponent(new Material(matDef));
    circle.transform.position = { x: 120 + i * 190, y: 290, z: 0 };
    circle.transform.updateLocalMatrix();
    scene.add(circle);

    const valLabel = new Node(`blur - val - ${i} `);
    valLabel.addComponent(createText(blurValues[i] === 0 ? "Original" : `\u03C3 = ${blurValues[i]} `, {
      fontSize: 14, fontFamily: "monospace", textAnchor: "middle",
    }));
    valLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
    valLabel.transform.position = { x: 120 + i * 190, y: 375, z: 0 };
    valLabel.transform.updateLocalMatrix();
    scene.add(valLabel);
  }

  // Drop shadow section
  const shadowLabel = new Node("shadow-label");
  shadowLabel.addComponent(createText("Drop Shadow", {
    fontSize: 22, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  shadowLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  shadowLabel.transform.position = { x: 500, y: 470, z: 0 };
  shadowLabel.transform.updateLocalMatrix();
  scene.add(shadowLabel);

  const shadowConfigs = [
    { dx: 4, dy: 4, std: 3, color: { r: 0, g: 0, b: 0 }, label: "Classic" },
    { dx: 8, dy: 8, std: 8, color: { r: 0.4, g: 0, b: 0.7 }, label: "Purple" },
    { dx: 0, dy: 10, std: 15, color: { r: 0, g: 0.4, b: 0.9 }, label: "Blue Glow" },
    { dx: 0, dy: 0, std: 20, color: { r: 1, g: 0.3, b: 0.1 }, label: "Fire Aura" },
  ];

  for (let i = 0; i < shadowConfigs.length; i++) {
    const cfg = shadowConfigs[i];
    const rect = new Node(`shadow - ${i} `);
    rect.addComponent(createBox(130, 130, 0));
    rect.addComponent(new Material({
      fill: { r: 0.92, g: 0.92, b: 0.95 },
      filter: {
        effects: [{
          type: "dropShadow" as const,
          dx: cfg.dx,
          dy: cfg.dy,
          stdDeviation: cfg.std,
          floodColor: cfg.color,
          floodOpacity: 0.7,
        }],
      },
    }));
    rect.transform.position = { x: 155 + i * 220, y: 620, z: 0 };
    rect.transform.updateLocalMatrix();
    scene.add(rect);

    const sLabel = new Node(`shadow - lbl - ${i} `);
    sLabel.addComponent(createText(cfg.label, {
      fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
    }));
    sLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
    sLabel.transform.position = { x: 155 + i * 220, y: 720, z: 0 };
    sLabel.transform.updateLocalMatrix();
    scene.add(sLabel);
  }

  // Combined effect
  const comboLabel = new Node("combo-label");
  comboLabel.addComponent(createText("Combined: Blur + Shadow", {
    fontSize: 22, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  comboLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  comboLabel.transform.position = { x: 500, y: 800, z: 0 };
  comboLabel.transform.updateLocalMatrix();
  scene.add(comboLabel);

  const combo = new Node("combo");
  combo.addComponent(createSphere(65));
  combo.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.4, cy: 0.4, r: 0.5,
      stops: [
        { offset: 0, color: { r: 1, g: 0.85, b: 0.3 } },
        { offset: 1, color: { r: 1, g: 0.3, b: 0.15 } },
      ],
    },
    filter: {
      effects: [
        { type: "blur" as const, stdDeviation: 2 },
        { type: "dropShadow" as const, dx: 0, dy: 0, stdDeviation: 25, floodColor: { r: 1, g: 0.4, b: 0.1 }, floodOpacity: 0.8 },
      ],
    },
  }));
  combo.transform.position = { x: 500, y: 910, z: 0 };
  combo.transform.updateLocalMatrix();
  scene.add(combo);

  function animate() { }
  return { scene, animate };
}
