import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting,rotateY } from "./shared";

export function createColorPalette() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 60,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 2, z: 10 };
  scene.add(cam);
  addDefaultLighting(scene);

  const shapes = [
    { geo: "box" as const, color: { r: 0.9, g: 0.1, b: 0.2 }, size: 1.0 },
    { geo: "sphere" as const, color: { r: 1.0, g: 0.7, b: 0.0 }, size: 0.7 },
    { geo: "box" as const, color: { r: 0.0, g: 0.8, b: 0.4 }, size: 1.2 },
    {
      geo: "sphere" as const,
      color: { r: 0.1, g: 0.4, b: 0.9 },
      size: 0.8,
    },
    { geo: "box" as const, color: { r: 0.6, g: 0.2, b: 0.8 }, size: 0.9 },
  ];

  const spacing = 2;
  const totalWidth = (shapes.length - 1) * spacing;
  const nodes: Node[] = [];

  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    const node = new Node(`shape-${i}`);
    if (s.geo === "box") {
      node.addComponent(createBox(s.size, s.size, s.size));
    } else {
      node.addComponent(createSphere(s.size, 32, 32));
    }
    node.addComponent(new Material({ color: s.color }));
    node.transform.position = { x: i * spacing - totalWidth / 2, y: 0, z: 0 };
    scene.add(node);
    nodes.push(node);
  }

  function animate(time: number) {
    for (let i = 0; i < nodes.length; i++) {
      const rate = (0.5 + i * 0.25) * 1.0;
      nodes[i].transform.rotation = rotateY(time * rate);
      nodes[i].transform.position.y = Math.sin(time * 1.5 + i * 1.2) * 0.4;
      nodes[i].transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
