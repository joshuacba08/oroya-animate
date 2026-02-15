import { Scene, Node, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const solarSystemControls: ControlDef[] = [
  { type: 'slider', key: 'timeSpeed', label: 'Velocidad orbital', min: 0.1, max: 3, step: 0.1, defaultValue: 1 },
  { type: 'slider', key: 'planetScale', label: 'Escala planetas', min: 0.3, max: 2, step: 0.1, defaultValue: 1, rebuild: true },
  { type: 'slider', key: 'camHeight', label: 'Altura cámara', min: 3, max: 25, step: 0.5, defaultValue: 10, rebuild: true },
  { type: 'slider', key: 'camDist', label: 'Distancia cámara', min: 8, max: 30, step: 0.5, defaultValue: 18, rebuild: true },
];

function rotateY(angle: number) {
  return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
}

export function createSolarSystemScene(params: ParamValues) {
  const scene = new Scene();
  const scale = params.planetScale as number;
  const camH = params.camHeight as number;
  const camD = params.camDist as number;

  // Camera
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200,
  }));
  cam.transform.position = { x: 0, y: camH, z: camD };
  scene.add(cam);

  // Sun
  const sun = new Node('sun');
  sun.addComponent(createSphere(1.5 * scale, 32, 32));
  sun.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.1 } }));
  scene.add(sun);

  // Mercury
  const mercuryPivot = new Node('mercury-pivot');
  sun.add(mercuryPivot);
  const mercury = new Node('mercury');
  mercury.addComponent(createSphere(0.25 * scale, 24, 24));
  mercury.addComponent(new Material({ color: { r: 0.7, g: 0.6, b: 0.5 } }));
  mercury.transform.position = { x: 3, y: 0, z: 0 };
  mercuryPivot.add(mercury);

  // Earth
  const earthPivot = new Node('earth-pivot');
  sun.add(earthPivot);
  const earth = new Node('earth');
  earth.addComponent(createSphere(0.6 * scale, 32, 32));
  earth.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));
  earth.transform.position = { x: 6, y: 0, z: 0 };
  earthPivot.add(earth);

  // Moon
  const moonPivot = new Node('moon-pivot');
  earth.add(moonPivot);
  const moon = new Node('moon');
  moon.addComponent(createSphere(0.15 * scale, 16, 16));
  moon.addComponent(new Material({ color: { r: 0.75, g: 0.75, b: 0.75 } }));
  moon.transform.position = { x: 1.2, y: 0, z: 0 };
  moonPivot.add(moon);

  // Mars
  const marsPivot = new Node('mars-pivot');
  sun.add(marsPivot);
  const mars = new Node('mars');
  mars.addComponent(createSphere(0.4 * scale, 32, 32));
  mars.addComponent(new Material({ color: { r: 0.9, g: 0.3, b: 0.1 } }));
  mars.transform.position = { x: 9, y: 0, z: 0 };
  marsPivot.add(mars);

  // Saturn
  const saturnPivot = new Node('saturn-pivot');
  sun.add(saturnPivot);
  const saturn = new Node('saturn');
  saturn.addComponent(createSphere(0.9 * scale, 32, 32));
  saturn.addComponent(new Material({ color: { r: 0.9, g: 0.8, b: 0.5 } }));
  saturn.transform.position = { x: 13, y: 0, z: 0 };
  saturnPivot.add(saturn);

  function animate(time: number, p: ParamValues) {
    const ts = p.timeSpeed as number;

    sun.transform.rotation = rotateY(time * 0.2 * ts);
    sun.transform.updateLocalMatrix();

    mercuryPivot.transform.rotation = rotateY(time * 1.6 * ts);
    mercuryPivot.transform.updateLocalMatrix();

    earthPivot.transform.rotation = rotateY(time * 0.8 * ts);
    earthPivot.transform.updateLocalMatrix();

    moonPivot.transform.rotation = rotateY(time * 3.5 * ts);
    moonPivot.transform.updateLocalMatrix();

    marsPivot.transform.rotation = rotateY(time * 0.5 * ts);
    marsPivot.transform.updateLocalMatrix();

    saturnPivot.transform.rotation = rotateY(time * 0.3 * ts);
    saturnPivot.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
