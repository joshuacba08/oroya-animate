import {
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting,composeYX } from "./shared";

export function createPBRShowcase() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 50,
      aspect: 16 / 9,
      near: 0.1,
      far: 200,
    })
  );
  cam.transform.position = { x: 0, y: 2, z: 8 };
  scene.add(cam);
  addDefaultLighting(scene);

  // Ground plane
  const ground = new Node("ground");
  ground.addComponent(createBox(16, 0.1, 16));
  ground.addComponent(
    new Material({
      color: { r: 0.08, g: 0.08, b: 0.12 },
      metalness: 0.3,
      roughness: 0.9,
    })
  );
  ground.transform.position = { x: 0, y: -1.5, z: 0 };
  scene.add(ground);

  // Create a row of spheres with varying metalness/roughness
  const spheres: Node[] = [];
  const count = 5;
  const spacing = 2.2;
  const totalWidth = (count - 1) * spacing;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const sphere = new Node(`pbr-sphere-${i}`);
    sphere.addComponent(createSphere(0.7, 32, 32));
    sphere.addComponent(
      new Material({
        color: { r: 0.85, g: 0.55, b: 0.25 },
        metalness: t,
        roughness: 1.0 - t,
        emissive: { r: t * 0.15, g: t * 0.05, b: 0 },
      })
    );
    sphere.transform.position = { x: i * spacing - totalWidth / 2, y: 0, z: 0 };
    scene.add(sphere);
    spheres.push(sphere);
  }

  // Create a second row of boxes with different PBR combos
  const boxes: Node[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const box = new Node(`pbr-box-${i}`);
    box.addComponent(createBox(0.9, 0.9, 0.9));
    box.addComponent(
      new Material({
        color: { r: 0.2 + t * 0.6, g: 0.3, b: 0.85 - t * 0.5 },
        metalness: 1.0 - t,
        roughness: t,
      })
    );
    box.transform.position = { x: i * spacing - totalWidth / 2, y: 0, z: -2.5 };
    scene.add(box);
    boxes.push(box);
  }

  // Emissive beacon
  const beacon = new Node("beacon");
  beacon.addComponent(createSphere(0.35, 24, 24));
  beacon.addComponent(
    new Material({
      color: { r: 1.0, g: 0.3, b: 0.1 },
      metalness: 0.0,
      roughness: 0.4,
      emissive: { r: 1.0, g: 0.2, b: 0.05 },
    })
  );
  beacon.transform.position = { x: 0, y: 2, z: 0 };
  scene.add(beacon);

  function animate(time: number) {
    for (let i = 0; i < spheres.length; i++) {
      spheres[i].transform.position.y = Math.sin(time * 1.2 + i * 0.8) * 0.3;
      spheres[i].transform.updateLocalMatrix();
    }
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].transform.rotation = composeYX(time * (0.3 + i * 0.15), 0.3);
      boxes[i].transform.updateLocalMatrix();
    }
    beacon.transform.position.y = 2 + Math.sin(time * 2.5) * 0.3;
    beacon.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
