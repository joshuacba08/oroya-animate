import {
Camera,
CameraType,
createBox,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting,rotateY } from "./shared";

export function createShapeGrid() {
  const scene = new Scene();
  const gridSize = 7;
  const cellSize = 0.8;
  const gap = 0.3;
  const step = cellSize + gap;

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 60,
      aspect: 16 / 9,
      near: 0.1,
      far: 200,
    })
  );
  const extent = ((gridSize - 1) * step) / 2;
  cam.transform.position = { x: 0, y: extent * 1.5, z: extent * 3 };
  scene.add(cam);
  addDefaultLighting(scene);

  const cells: { node: Node; gx: number; gz: number }[] = [];
  const offset = ((gridSize - 1) * step) / 2;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const node = new Node(`cell-${x}-${z}`);
      node.addComponent(createBox(cellSize, cellSize, cellSize));
      const r = x / (gridSize - 1);
      const b = z / (gridSize - 1);
      const g = 0.25 + 0.3 * (1 - (r + b) / 2);
      node.addComponent(new Material({ color: { r, g, b } }));
      node.transform.position = {
        x: x * step - offset,
        y: 0,
        z: z * step - offset,
      };
      scene.add(node);
      cells.push({ node, gx: x, gz: z });
    }
  }

  function animate(time: number) {
    for (const { node, gx, gz } of cells) {
      const dist = Math.sqrt(gx * gx + gz * gz);
      node.transform.position.y = Math.sin(time * 2 - dist * 0.7) * 1.0;
      node.transform.rotation = rotateY(time * 0.5);
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
