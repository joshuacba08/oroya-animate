/**
 * Self-contained HelloCube scene for the landing page.
 * No external dependencies beyond @joroya/core.
 */
import {
  Scene,
  Node,
  createBox,
  createSphere,
  Material,
  Camera,
  CameraType,
} from "@joroya/core";

function composeYX(yAngle: number, xAngle: number) {
  const sy = Math.sin(yAngle / 2);
  const cy = Math.cos(yAngle / 2);
  const sx = Math.sin(xAngle / 2);
  const cx = Math.cos(xAngle / 2);
  return { x: cy * sx, y: sy * cx, z: -sy * sx, w: cy * cx };
}

export function createHelloCubeScene(aspect: number) {
  const scene = new Scene();
  const size = 1.6;

  // Camera
  const cameraNode = new Node("camera");
  cameraNode.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 60,
      aspect,
      near: 0.1,
      far: 200,
    })
  );
  cameraNode.transform.position = { x: 0, y: 1.8, z: 6 };
  scene.add(cameraNode);

  // Ground
  const groundBase = new Node("ground-base");
  groundBase.addComponent(createBox(14, 0.15, 14));
  groundBase.addComponent(
    new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } })
  );
  groundBase.transform.position = { x: 0, y: -1.6, z: 0 };
  scene.add(groundBase);

  const groundTop = new Node("ground-top");
  groundTop.addComponent(createBox(8, 0.1, 8));
  groundTop.addComponent(
    new Material({ color: { r: 0.14, g: 0.14, b: 0.19 } })
  );
  groundTop.transform.position = { x: 0, y: -1.45, z: 0 };
  scene.add(groundTop);

  // Pedestal
  const pedestal = new Node("pedestal");
  pedestal.addComponent(createBox(size * 1.4, 0.2, size * 1.4));
  pedestal.addComponent(
    new Material({ color: { r: 0.18, g: 0.18, b: 0.25 } })
  );
  pedestal.transform.position = { x: 0, y: -1.3, z: 0 };
  scene.add(pedestal);

  // Main cube  Eindigo/blue
  const cube = new Node("cube");
  cube.addComponent(createBox(size, size, size));
  cube.addComponent(
    new Material({ color: { r: 0.29, g: 0.48, b: 1.0 } })
  );
  cube.transform.position = { x: 0, y: 0.2, z: 0 };
  scene.add(cube);

  // Orbiting satellites
  const satRadius = size * 1.6;
  const satColors = [
    { r: 0.9, g: 0.35, b: 0.25 },
    { r: 0.25, g: 0.8, b: 0.45 },
    { r: 0.9, g: 0.7, b: 0.15 },
    { r: 0.6, g: 0.3, b: 0.85 },
  ];
  const satellites: Node[] = [];

  for (let i = 0; i < 4; i++) {
    const sat = new Node(`sat-${i}`);
    sat.addComponent(createSphere(0.18, 14, 14));
    sat.addComponent(new Material({ color: satColors[i] }));
    sat.transform.position = { x: satRadius, y: 0.2, z: 0 };
    scene.add(sat);
    satellites.push(sat);
  }

  // Shadow under cube
  const shadow = new Node("shadow");
  shadow.addComponent(createBox(size * 1.1, 0.02, size * 1.1));
  shadow.addComponent(
    new Material({ color: { r: 0.05, g: 0.05, b: 0.08 }, opacity: 0.5 })
  );
  shadow.transform.position = { x: 0, y: -1.2, z: 0 };
  scene.add(shadow);

  // Animation function
  const speed = 0.8;
  const tilt = 0.35;

  function animate(time: number) {
    const yAngle = time * speed;
    const xAngle = tilt * Math.PI * 0.5 * Math.sin(time * speed * 0.6);

    cube.transform.rotation = composeYX(yAngle, xAngle);
    cube.transform.position.y = 0.2 + Math.sin(time * speed * 0.4) * 0.15;
    cube.transform.updateLocalMatrix();

    const cubeY = cube.transform.position.y;
    const shadowScale = 1.0 - (cubeY - 0.2) * 0.3;
    shadow.transform.scale = { x: shadowScale, y: 1, z: shadowScale };
    shadow.transform.updateLocalMatrix();

    for (let i = 0; i < 4; i++) {
      const sat = satellites[i];
      const angleOffset = (i / 4) * Math.PI * 2;
      const orbitAngle = time * speed * 0.5 + angleOffset;
      const verticalOff = Math.sin(time * speed * 0.7 + i * 1.5) * 0.4;
      sat.transform.position = {
        x: Math.cos(orbitAngle) * satRadius,
        y: 0.2 + verticalOff,
        z: Math.sin(orbitAngle) * satRadius,
      };
      sat.transform.updateLocalMatrix();
    }
  }

  return { scene, animate, cameraNode };
}
