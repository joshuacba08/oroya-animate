import { Scene, Node, createSphere, Material, Camera, CameraType } from '@oroya/core';

/**
 * Solar System — Hierarchical transforms with orbiting planets.
 * Based on Tutorial 4: Sistema Solar.
 * Demonstrates parent-child relationships and pivot nodes for orbital motion.
 */

/** Helper to create a Y-axis quaternion rotation from an angle */
function rotateY(angle: number) {
  return {
    x: 0,
    y: Math.sin(angle / 2),
    z: 0,
    w: Math.cos(angle / 2),
  };
}

export function createSolarSystemScene() {
  const scene = new Scene();

  // Camera — elevated and pulled back
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200,
  }));
  cam.transform.position = { x: 0, y: 10, z: 18 };
  scene.add(cam);

  // ---- Sun ----
  const sun = new Node('sun');
  sun.addComponent(createSphere(1.5, 32, 32));
  sun.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.1 } }));
  scene.add(sun);

  // ---- Mercury ----
  const mercuryPivot = new Node('mercury-pivot');
  sun.add(mercuryPivot);

  const mercury = new Node('mercury');
  mercury.addComponent(createSphere(0.25, 24, 24));
  mercury.addComponent(new Material({ color: { r: 0.7, g: 0.6, b: 0.5 } }));
  mercury.transform.position = { x: 3, y: 0, z: 0 };
  mercuryPivot.add(mercury);

  // ---- Earth ----
  const earthPivot = new Node('earth-pivot');
  sun.add(earthPivot);

  const earth = new Node('earth');
  earth.addComponent(createSphere(0.6, 32, 32));
  earth.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));
  earth.transform.position = { x: 6, y: 0, z: 0 };
  earthPivot.add(earth);

  // ---- Moon (child of Earth) ----
  const moonPivot = new Node('moon-pivot');
  earth.add(moonPivot);

  const moon = new Node('moon');
  moon.addComponent(createSphere(0.15, 16, 16));
  moon.addComponent(new Material({ color: { r: 0.75, g: 0.75, b: 0.75 } }));
  moon.transform.position = { x: 1.2, y: 0, z: 0 };
  moonPivot.add(moon);

  // ---- Mars ----
  const marsPivot = new Node('mars-pivot');
  sun.add(marsPivot);

  const mars = new Node('mars');
  mars.addComponent(createSphere(0.4, 32, 32));
  mars.addComponent(new Material({ color: { r: 0.9, g: 0.3, b: 0.1 } }));
  mars.transform.position = { x: 9, y: 0, z: 0 };
  marsPivot.add(mars);

  // ---- Saturn ----
  const saturnPivot = new Node('saturn-pivot');
  sun.add(saturnPivot);

  const saturn = new Node('saturn');
  saturn.addComponent(createSphere(0.9, 32, 32));
  saturn.addComponent(new Material({ color: { r: 0.9, g: 0.8, b: 0.5 } }));
  saturn.transform.position = { x: 13, y: 0, z: 0 };
  saturnPivot.add(saturn);

  // Animation
  function animate(time: number) {
    sun.transform.rotation = rotateY(time * 0.2);
    sun.transform.updateLocalMatrix();

    mercuryPivot.transform.rotation = rotateY(time * 1.6);
    mercuryPivot.transform.updateLocalMatrix();

    earthPivot.transform.rotation = rotateY(time * 0.8);
    earthPivot.transform.updateLocalMatrix();

    moonPivot.transform.rotation = rotateY(time * 3.5);
    moonPivot.transform.updateLocalMatrix();

    marsPivot.transform.rotation = rotateY(time * 0.5);
    marsPivot.transform.updateLocalMatrix();

    saturnPivot.transform.rotation = rotateY(time * 0.3);
    saturnPivot.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
