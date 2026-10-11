import {
Camera,
CameraType,
createBox,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting } from "./shared";

export function createOrthoDemo() {
  const scene = new Scene();

  const cam = new Node("ortho-camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Orthographic,
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 5, y: 8, z: 5 };
  scene.add(cam);
  addDefaultLighting(scene);

  // Ground plane
  const ground = new Node("ground");
  ground.addComponent(createBox(18, 0.08, 18));
  ground.addComponent(
    new Material({
      color: { r: 0.12, g: 0.12, b: 0.16 },
      metalness: 0.1,
      roughness: 0.95,
    })
  );
  ground.transform.position = { x: 0, y: -0.04, z: 0 };
  scene.add(ground);

  // Isometric-like grid of towers
  const towers: Node[] = [];
  const gridSize = 5;
  const spacing = 2.5;
  const offset = ((gridSize - 1) * spacing) / 2;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const dist = Math.sqrt(
        Math.pow(x - (gridSize - 1) / 2, 2) + Math.pow(z - (gridSize - 1) / 2, 2)
      );
      const height = 0.5 + (1 - dist / (gridSize * 0.7)) * 3;

      const tower = new Node(`tower-${x}-${z}`);
      tower.addComponent(createBox(1.2, Math.max(0.3, height), 1.2));

      const r = 0.15 + (x / gridSize) * 0.5;
      const g = 0.2 + (z / gridSize) * 0.4;
      const b = 0.6;
      tower.addComponent(
        new Material({
          color: { r, g, b },
          metalness: 0.4,
          roughness: 0.6,
        })
      );
      tower.transform.position = {
        x: x * spacing - offset,
        y: Math.max(0.3, height) / 2,
        z: z * spacing - offset,
      };
      scene.add(tower);
      towers.push(tower);
    }
  }

  function animate(time: number) {
    let idx = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const dist = Math.sqrt(
          Math.pow(x - (gridSize - 1) / 2, 2) + Math.pow(z - (gridSize - 1) / 2, 2)
        );
        const height = 0.5 + (1 - dist / (gridSize * 0.7)) * 3 +
          Math.sin(time * 1.5 - dist * 0.8) * 0.5;
        const h = Math.max(0.3, height);

        towers[idx].transform.position.y = h / 2;
        towers[idx].transform.scale = { x: 1, y: h / Math.max(0.3, 0.5 + (1 - dist / (gridSize * 0.7)) * 3), z: 1 };
        towers[idx].transform.updateLocalMatrix();
        idx++;
      }
    }
  }

  return { scene, animate };
}
