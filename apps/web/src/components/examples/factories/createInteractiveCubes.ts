import {
Camera,
CameraType,
createBox,
Interactive,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting,rotateY } from "./shared";

export function createInteractiveCubes() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 50,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 3.5, z: 8 };
  scene.add(cam);
  addDefaultLighting(scene);

  const ground = new Node("ground");
  ground.addComponent(createBox(14, 0.1, 14));
  ground.addComponent(
    new Material({ color: { r: 0.08, g: 0.08, b: 0.12 }, metalness: 0.2, roughness: 0.9 })
  );
  ground.transform.position = { x: 0, y: -1.2, z: 0 };
  scene.add(ground);

  const colors = [
    { r: 0.9, g: 0.2, b: 0.3 },
    { r: 0.2, g: 0.8, b: 0.4 },
    { r: 0.3, g: 0.5, b: 0.95 },
    { r: 1.0, g: 0.7, b: 0.1 },
    { r: 0.7, g: 0.3, b: 0.9 },
    { r: 0.1, g: 0.8, b: 0.85 },
    { r: 0.95, g: 0.45, b: 0.1 },
    { r: 0.6, g: 0.9, b: 0.3 },
    { r: 0.9, g: 0.2, b: 0.7 },
  ];

  const cubes: Node[] = [];
  const gridSize = 3;
  const spacing = 2.2;
  const cubeOffset = ((gridSize - 1) * spacing) / 2;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const idx = x * gridSize + z;
      const cube = new Node(`cube - ${x} -${z} `);
      cube.addComponent(createBox(1.2, 1.2, 1.2));
      cube.addComponent(
        new Material({ color: colors[idx], metalness: 0.3, roughness: 0.5 })
      );
      cube.addComponent(new Interactive({ cursor: "pointer" }));
      cube.transform.position = {
        x: x * spacing - cubeOffset,
        y: 0,
        z: z * spacing - cubeOffset,
      };
      scene.add(cube);
      cubes.push(cube);
    }
  }

  function animate(time: number) {
    for (let i = 0; i < cubes.length; i++) {
      const node = cubes[i];
      const gx = Math.floor(i / gridSize);
      const gz = i % gridSize;
      const phase = gx * 0.7 + gz * 1.1;

      node.transform.position.y = Math.sin(time * 1.5 + phase) * 0.2;
      node.transform.rotation = rotateY(time * 0.4 + phase * 0.3);

      const activeIdx = Math.floor(time * 1.2) % cubes.length;
      const scale = i === activeIdx ? 1.0 + Math.sin(time * 8) * 0.1 : 1.0;
      node.transform.scale = { x: scale, y: scale, z: scale };

      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
