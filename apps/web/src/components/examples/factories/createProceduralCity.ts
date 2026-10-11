import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting,seededRandom } from "./shared";

export function createProceduralCity() {
  const scene = new Scene();
  const gridSize = 5;
  const maxHeight = 10;
  const density = 3;
  const rand = seededRandom(42);

  const blockSize = 6;
  const streetWidth = 2.2;
  const totalSize = gridSize * (blockSize + streetWidth);
  const offset = -totalSize / 2;
  const centerIdx = Math.floor(gridSize / 2);

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 48,
      aspect: 16 / 9,
      near: 0.1,
      far: 400,
    })
  );
  cam.transform.position = { x: 0, y: 18, z: totalSize * 0.8 };
  scene.add(cam);
  addDefaultLighting(scene);

  const ground = new Node("ground");
  ground.addComponent(createBox(totalSize + 14, 0.15, totalSize + 14));
  ground.addComponent(new Material({ color: { r: 0.14, g: 0.14, b: 0.18 } }));
  ground.transform.position = { x: 0, y: -0.075, z: 0 };
  scene.add(ground);

  const city = new Node("city");
  scene.add(city);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const block = new Node(`block-${row}-${col}`);
      const blockX = offset + col * (blockSize + streetWidth) + blockSize / 2;
      const blockZ = offset + row * (blockSize + streetWidth) + blockSize / 2;
      block.transform.position = { x: blockX, y: 0, z: blockZ };
      city.add(block);

      if (row === centerIdx && col === centerIdx) {
        const park = new Node("park");
        park.addComponent(createBox(blockSize - 0.3, 0.12, blockSize - 0.3));
        park.addComponent(
          new Material({ color: { r: 0.12, g: 0.5, b: 0.2 } })
        );
        park.transform.position = { x: 0, y: 0.06, z: 0 };
        block.add(park);
        continue;
      }

      const distFromCenter = Math.sqrt(
        (row - centerIdx) ** 2 + (col - centerIdx) ** 2
      );
      const heightFactor = 1 - (distFromCenter / gridSize) * 0.5;

      for (let b = 0; b < density; b++) {
        const height = 1.0 + rand() * maxHeight * heightFactor;
        const width = 0.7 + rand() * 1.6;
        const depth = 0.7 + rand() * 1.6;
        const halfBlock = blockSize / 2;
        const maxOffX = halfBlock - width / 2 - 0.2;
        const maxOffZ = halfBlock - depth / 2 - 0.2;
        const bx = (rand() - 0.5) * Math.max(0, maxOffX) * 2;
        const bz = (rand() - 0.5) * Math.max(0, maxOffZ) * 2;

        const base = { r: 0.35, g: 0.4, b: 0.5 };
        const bColor = {
          r: base.r + (rand() - 0.5) * 0.18,
          g: base.g + (rand() - 0.5) * 0.18,
          b: base.b + (rand() - 0.5) * 0.18,
        };

        const building = new Node(`bld-${row}-${col}-${b}`);
        building.addComponent(createBox(width, height, depth));
        building.addComponent(new Material({ color: bColor }));
        building.transform.position = { x: bx, y: height / 2, z: bz };
        block.add(building);
      }
    }
  }

  // Main tower
  const tBase = new Node("tower-base");
  tBase.addComponent(createBox(2.2, maxHeight * 0.8, 2.2));
  tBase.addComponent(new Material({ color: { r: 0.85, g: 0.72, b: 0.3 } }));
  tBase.transform.position = { x: 2.5, y: (maxHeight * 0.8) / 2, z: -2.5 };
  city.add(tBase);

  const tTop = new Node("tower-top");
  tTop.addComponent(createBox(1.0, maxHeight * 0.4, 1.0));
  tTop.addComponent(new Material({ color: { r: 0.95, g: 0.82, b: 0.4 } }));
  tTop.transform.position = {
    x: 2.5,
    y: maxHeight * 0.8 + (maxHeight * 0.4) / 2,
    z: -2.5,
  };
  city.add(tTop);

  const beacon = new Node("beacon");
  beacon.addComponent(createSphere(0.18, 12, 12));
  beacon.addComponent(new Material({ color: { r: 1.0, g: 0.3, b: 0.2 } }));
  beacon.transform.position = { x: 2.5, y: maxHeight * 1.25, z: -2.5 };
  city.add(beacon);

  function animate(time: number) {
    const angle = time * 0.25;
    const radius = totalSize * 0.65;
    cam.transform.position = {
      x: Math.sin(angle) * radius,
      y: 14 + Math.sin(time * 0.09) * 5,
      z: Math.cos(angle) * radius,
    };
    cam.transform.updateLocalMatrix();

    beacon.transform.position.y =
      maxHeight * 1.25 + Math.sin(time * 3) * 0.05;
    beacon.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
