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

export function createInteractiveDemo() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 60, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 2, z: 8 };
  scene.add(cam);
  addDefaultLighting(scene);

  const colors = [
    { r: 0.95, g: 0.26, b: 0.21 }, { r: 0.30, g: 0.69, b: 0.31 },
    { r: 0.13, g: 0.59, b: 0.95 }, { r: 1.00, g: 0.76, b: 0.03 },
    { r: 0.61, g: 0.15, b: 0.69 },
  ];
  const highlightColors = [
    { r: 1.00, g: 0.54, b: 0.50 }, { r: 0.56, g: 0.83, b: 0.56 },
    { r: 0.42, g: 0.74, b: 0.98 }, { r: 1.00, g: 0.88, b: 0.38 },
    { r: 0.78, g: 0.44, b: 0.84 },
  ];

  const entries: { node: Node; material: Material }[] = [];
  for (let i = 0; i < 5; i++) {
    const node = new Node(`object - ${i} `);
    if (i % 2 === 0) node.addComponent(createBox(1.2, 1.2, 1.2));
    else node.addComponent(createSphere(0.7, 24, 24));
    const material = new Material({ color: colors[i] });
    node.addComponent(material);
    node.addComponent(new Interactive({ cursor: "pointer" }));
    node.transform.position = { x: (i - 2) * 2.2, y: 0, z: 0 };
    node.transform.updateLocalMatrix();
    scene.add(node);
    node.on("pointerenter", () => { material.definition.color = highlightColors[i]; });
    node.on("pointerleave", () => { material.definition.color = colors[i]; });
    entries.push({ node, material });
  }

  const floor = new Node("floor");
  floor.addComponent(createBox(12, 0.1, 4));
  floor.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.22 } }));
  floor.transform.position = { x: 0, y: -1, z: 0 };
  floor.transform.updateLocalMatrix();
  scene.add(floor);

  function animate(time: number) {
    for (let i = 0; i < entries.length; i++) {
      const { node } = entries[i];
      const bob = Math.sin(time * 0.5 + i * 1.2) * 0.15;
      node.transform.position = { x: (i - 2) * 2.2, y: bob, z: 0 };
      const a = time * 0.5 + i * 0.3;
      node.transform.rotation = { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
