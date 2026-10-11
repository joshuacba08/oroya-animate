import {
Camera,
CameraType,
createSphere,
Material,
Node,
Scene
} from "@joroya/core";
import { addDefaultLighting,rotateY } from "./shared";

export function createSolarSystem() {
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
  cam.transform.position = { x: 0, y: 10, z: 18 };
  scene.add(cam);
  addDefaultLighting(scene);

  const sun = new Node("sun");
  sun.addComponent(createSphere(1.5, 32, 32));
  sun.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.1 } }));
  scene.add(sun);

  const planets = [
    {
      name: "mercury",
      size: 0.25,
      dist: 3,
      speed: 1.6,
      color: { r: 0.7, g: 0.6, b: 0.5 },
    },
    {
      name: "earth",
      size: 0.6,
      dist: 6,
      speed: 0.8,
      color: { r: 0.2, g: 0.5, b: 1.0 },
    },
    {
      name: "mars",
      size: 0.4,
      dist: 9,
      speed: 0.5,
      color: { r: 0.9, g: 0.3, b: 0.1 },
    },
    {
      name: "saturn",
      size: 0.9,
      dist: 13,
      speed: 0.3,
      color: { r: 0.9, g: 0.8, b: 0.5 },
    },
  ];

  const pivots: Node[] = [];

  for (const p of planets) {
    const pivot = new Node(`${p.name}-pivot`);
    sun.add(pivot);
    const planet = new Node(p.name);
    planet.addComponent(createSphere(p.size, 24, 24));
    planet.addComponent(new Material({ color: p.color }));
    planet.transform.position = { x: p.dist, y: 0, z: 0 };
    pivot.add(planet);
    pivots.push(pivot);
  }

  // Moon on Earth
  const earthPivot = pivots[1];
  const earthNode = earthPivot.children[0];
  const moonPivot = new Node("moon-pivot");
  earthNode.add(moonPivot);
  const moon = new Node("moon");
  moon.addComponent(createSphere(0.15, 16, 16));
  moon.addComponent(new Material({ color: { r: 0.75, g: 0.75, b: 0.75 } }));
  moon.transform.position = { x: 1.2, y: 0, z: 0 };
  moonPivot.add(moon);

  function animate(time: number) {
    sun.transform.rotation = rotateY(time * 0.2);
    sun.transform.updateLocalMatrix();

    for (let i = 0; i < planets.length; i++) {
      pivots[i].transform.rotation = rotateY(time * planets[i].speed);
      pivots[i].transform.updateLocalMatrix();
    }

    moonPivot.transform.rotation = rotateY(time * 3.5);
    moonPivot.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
