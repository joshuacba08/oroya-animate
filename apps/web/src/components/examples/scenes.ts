import {
  Scene,
  Node,
  createBox,
  createSphere,
  Material,
  Camera,
  CameraType,
} from "@oroya/core";
import type { ExampleDef } from "./ExampleCard";

function rotateY(angle: number) {
  return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
}

function composeYX(yAngle: number, xAngle: number) {
  const sy = Math.sin(yAngle / 2);
  const cy = Math.cos(yAngle / 2);
  const sx = Math.sin(xAngle / 2);
  const cx = Math.cos(xAngle / 2);
  return { x: cy * sx, y: sy * cx, z: -sy * sx, w: cy * cx };
}

// ── Hello Cube ─────────────────────────────────────────────────────────

function createHelloCube() {
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

// ── Solar System ───────────────────────────────────────────────────────

function createSolarSystem() {
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

// ── Color Palette ──────────────────────────────────────────────────────

function createColorPalette() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 60,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 2, z: 10 };
  scene.add(cam);

  const shapes = [
    { geo: "box" as const, color: { r: 0.9, g: 0.1, b: 0.2 }, size: 1.0 },
    { geo: "sphere" as const, color: { r: 1.0, g: 0.7, b: 0.0 }, size: 0.7 },
    { geo: "box" as const, color: { r: 0.0, g: 0.8, b: 0.4 }, size: 1.2 },
    {
      geo: "sphere" as const,
      color: { r: 0.1, g: 0.4, b: 0.9 },
      size: 0.8,
    },
    { geo: "box" as const, color: { r: 0.6, g: 0.2, b: 0.8 }, size: 0.9 },
  ];

  const spacing = 2;
  const totalWidth = (shapes.length - 1) * spacing;
  const nodes: Node[] = [];

  for (let i = 0; i < shapes.length; i++) {
    const s = shapes[i];
    const node = new Node(`shape-${i}`);
    if (s.geo === "box") {
      node.addComponent(createBox(s.size, s.size, s.size));
    } else {
      node.addComponent(createSphere(s.size, 32, 32));
    }
    node.addComponent(new Material({ color: s.color }));
    node.transform.position = { x: i * spacing - totalWidth / 2, y: 0, z: 0 };
    scene.add(node);
    nodes.push(node);
  }

  function animate(time: number) {
    for (let i = 0; i < nodes.length; i++) {
      const rate = (0.5 + i * 0.25) * 1.0;
      nodes[i].transform.rotation = rotateY(time * rate);
      nodes[i].transform.position.y = Math.sin(time * 1.5 + i * 1.2) * 0.4;
      nodes[i].transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}

// ── Shape Grid ─────────────────────────────────────────────────────────

function createShapeGrid() {
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

// ── Procedural City ────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createProceduralCity() {
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

// ── Export all examples ────────────────────────────────────────────────

export const EXAMPLES: ExampleDef[] = [
  {
    id: "hello-cube",
    title: "Hello Cube",
    description:
      "Cubo 3D con rotación quaternion suave y esferas orbitales. Configuración básica de escena, cámara y geometría.",
    category: "3d",
    factory: createHelloCube,
  },
  {
    id: "solar-system",
    title: "Solar System",
    description:
      "Sistema planetario con órbitas jerárquicas usando nodos pivot padre-hijo. Demuestra transforms anidados.",
    category: "3d",
    factory: createSolarSystem,
  },
  {
    id: "color-palette",
    title: "Color Palette",
    description:
      "Figuras geométricas con diferentes formas, colores y velocidades. Muestra createBox, createSphere y temas de color.",
    category: "3d",
    factory: createColorPalette,
  },
  {
    id: "shape-grid",
    title: "Shape Grid",
    description:
      "Grilla procedural con ola sinusoidal y colores por posición. Demuestra generación procedural y animación masiva.",
    category: "3d",
    factory: createShapeGrid,
  },
  {
    id: "procedural-city",
    title: "Procedural City",
    description:
      "Ciudad generada algorítmicamente con edificios, parque central y torre. Demuestra generación procedural y agrupación jerárquica.",
    category: "3d",
    factory: createProceduralCity,
  },
];
