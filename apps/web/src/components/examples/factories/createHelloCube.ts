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

export function createHelloCube() {
  const scene = new Scene();

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
  cam.transform.position = { x: 0, y: 1.8, z: 6 };
  scene.add(cam);
  addDefaultLighting(scene);

  const ground = new Node("ground");
  ground.addComponent(createBox(14, 0.15, 14));
  ground.addComponent(new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } }));
  ground.transform.position = { x: 0, y: -1.6, z: 0 };
  scene.add(ground);

  const pedestal = new Node("pedestal");
  pedestal.addComponent(createBox(2.2, 0.2, 2.2));
  pedestal.addComponent(
    new Material({ color: { r: 0.18, g: 0.18, b: 0.25 } })
  );
  pedestal.transform.position = { x: 0, y: -1.3, z: 0 };
  scene.add(pedestal);

  const cube = new Node("cube");
  cube.addComponent(createBox(1.6, 1.6, 1.6));
  cube.addComponent(new Material({ color: { r: 0.29, g: 0.48, b: 1.0 } }));
  cube.transform.position = { x: 0, y: 0.2, z: 0 };
  scene.add(cube);

  const satellites: Node[] = [];
  const satColors = [
    { r: 0.9, g: 0.35, b: 0.25 },
    { r: 0.25, g: 0.8, b: 0.45 },
    { r: 0.9, g: 0.7, b: 0.15 },
    { r: 0.6, g: 0.3, b: 0.85 },
  ];
  for (let i = 0; i < 4; i++) {
    const sat = new Node(`sat-${i}`);
    sat.addComponent(createSphere(0.18, 14, 14));
    sat.addComponent(new Material({ color: satColors[i] }));
    scene.add(sat);
    satellites.push(sat);
  }

  const satRadius = 2.56;

  function animate(time: number) {
    cube.transform.rotation = composeYX(
      time * 0.8,
      0.35 * Math.PI * 0.5 * Math.sin(time * 0.48)
    );
    cube.transform.position.y = 0.2 + Math.sin(time * 0.32) * 0.15;
    cube.transform.updateLocalMatrix();

    for (let i = 0; i < 4; i++) {
      const angle = time * 0.4 + (i / 4) * Math.PI * 2;
      satellites[i].transform.position = {
        x: Math.cos(angle) * satRadius,
        y: 0.2 + Math.sin(time * 0.56 + i * 1.5) * 0.4,
        z: Math.sin(angle) * satRadius,
      };
      satellites[i].transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}
