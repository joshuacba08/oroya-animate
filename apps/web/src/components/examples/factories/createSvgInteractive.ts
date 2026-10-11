import {
Camera,
CameraType,
createBox,
createPath2D,
createSphere,
createText,
Interactive,
Material,
Node,
Scene
} from "@joroya/core";
import { svgAnimStarPath } from "./shared";

export function createSvgInteractive() {
  const scene = new Scene();
  const cols = 5;
  const rows = 3;

  const cam = new Node("cam");
  cam.addComponent(new Camera({ type: CameraType.Orthographic, left: 0, right: 800, top: 0, bottom: 600, near: 0.1, far: 100 }));
  scene.add(cam);

  const siTitle = new Node("title");
  siTitle.addComponent(createText("SVG Interactive", { fontSize: 28, fontFamily: "system-ui, sans-serif", fontWeight: "bold", textAnchor: "middle" }));
  siTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  siTitle.transform.position = { x: 400, y: 36, z: 0 };
  siTitle.transform.updateLocalMatrix();
  scene.add(siTitle);

  const siSubtitle = new Node("subtitle");
  siSubtitle.addComponent(createText("Interactive shapes with click & hover events", { fontSize: 12, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
  siSubtitle.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  siSubtitle.transform.position = { x: 400, y: 60, z: 0 };
  siSubtitle.transform.updateLocalMatrix();
  scene.add(siSubtitle);

  const SI_PALETTE = [
    { r: 0.95, g: 0.3, b: 0.3 }, { r: 0.3, g: 0.65, b: 1.0 },
    { r: 0.2, g: 0.85, b: 0.5 }, { r: 1.0, g: 0.75, b: 0.15 },
    { r: 0.7, g: 0.3, b: 0.9 }, { r: 1.0, g: 0.5, b: 0.2 },
    { r: 0.3, g: 0.9, b: 0.9 }, { r: 0.9, g: 0.4, b: 0.7 },
  ];
  const paddingX = 80;
  const paddingTop = 90;
  const availW = 800 - paddingX * 2;
  const availH = 600 - paddingTop - 80;
  const cellW = availW / cols;
  const cellH = availH / rows;
  const shapeSize = Math.min(cellW, cellH) * 0.55;
  const shapes = ["circle", "rect", "diamond", "star"];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cx = paddingX + cellW * (c + 0.5);
      const cy = paddingTop + cellH * (r + 0.5);
      const color = SI_PALETTE[idx % SI_PALETTE.length];
      const shapeType = shapes[idx % shapes.length];
      const node = new Node(`tile - ${r} -${c} `);
      switch (shapeType) {
        case "circle": node.addComponent(createSphere(shapeSize * 0.45)); break;
        case "rect": node.addComponent(createBox(shapeSize * 0.85, shapeSize * 0.65, 0)); break;
        case "diamond": node.addComponent(createPath2D([{ command: "M", args: [0, -shapeSize * 0.45] }, { command: "L", args: [shapeSize * 0.45, 0] }, { command: "L", args: [0, shapeSize * 0.45] }, { command: "L", args: [-shapeSize * 0.45, 0] }, { command: "Z", args: [] }])); break;
        case "star": node.addComponent(createPath2D(svgAnimStarPath(0, 0, 5, shapeSize * 0.45, shapeSize * 0.2))); break;
      }
      const material = new Material({ fill: color, stroke: { r: color.r * 0.6, g: color.g * 0.6, b: color.b * 0.6 }, strokeWidth: 2 });
      node.addComponent(material);
      let clicks = 0;
      node.on("click", (event) => {
        const next = SI_PALETTE[(idx + ++clicks) % SI_PALETTE.length];
        material.definition.fill = next;
        const element = event.nativeEvent instanceof Event ? event.nativeEvent.currentTarget : null;
        if (element instanceof SVGElement) element.setAttribute("fill", `rgb(${Math.round(next.r * 255)},${Math.round(next.g * 255)},${Math.round(next.b * 255)})`);
      });
      node.on("pointerenter", (event) => {
        const element = event.nativeEvent instanceof Event ? event.nativeEvent.currentTarget : null;
        if (element instanceof SVGElement) element.setAttribute("stroke-width", "4");
      });
      node.on("pointerleave", (event) => {
        const element = event.nativeEvent instanceof Event ? event.nativeEvent.currentTarget : null;
        if (element instanceof SVGElement) element.setAttribute("stroke-width", "2");
      });
      node.addComponent(new Interactive({ cursor: "pointer" }));
      node.transform.position = { x: cx, y: cy, z: 0 };
      node.transform.updateLocalMatrix();
      scene.add(node);
    }
  }

  const statusText = new Node("status");
  statusText.addComponent(createText("Click on any shape to interact", { fontSize: 16, fontFamily: "system-ui, sans-serif", textAnchor: "middle", fontWeight: "bold" }));
  statusText.addComponent(new Material({ fill: { r: 0.6, g: 0.8, b: 1.0 } }));
  statusText.transform.position = { x: 400, y: 560, z: 0 };
  statusText.transform.updateLocalMatrix();
  scene.add(statusText);

  function animate() { }
  return { scene, animate };
}
