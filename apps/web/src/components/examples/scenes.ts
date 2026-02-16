import {
  Scene,
  Node,
  createBox,
  createSphere,
  Material,
  Camera,
  CameraType,
} from "@oroya/core";
import { SvJs, Gen } from "@oroya/renderer-svg";
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

// ── SVG: Colour Spiral ─────────────────────────────────────────────────

const WEB_SAFE_COLOURS = [
  { r: 1, g: 0, b: 0 }, { r: 1, g: 0.5, b: 0 }, { r: 1, g: 1, b: 0 },
  { r: 0.5, g: 1, b: 0 }, { r: 0, g: 1, b: 0 }, { r: 0, g: 1, b: 0.5 },
  { r: 0, g: 1, b: 1 }, { r: 0, g: 0.5, b: 1 }, { r: 0, g: 0, b: 1 },
  { r: 0.5, g: 0, b: 1 }, { r: 1, g: 0, b: 1 }, { r: 1, g: 0, b: 0.5 },
  { r: 1, g: 0.6, b: 0.6 }, { r: 1, g: 0.8, b: 0.5 }, { r: 1, g: 1, b: 0.6 },
  { r: 0.6, g: 1, b: 0.6 }, { r: 0.6, g: 1, b: 0.8 }, { r: 0.6, g: 1, b: 1 },
  { r: 0.6, g: 0.8, b: 1 }, { r: 0.6, g: 0.6, b: 1 }, { r: 0.8, g: 0.6, b: 1 },
  { r: 1, g: 0.6, b: 1 }, { r: 1, g: 0.6, b: 0.8 }, { r: 0.8, g: 0.8, b: 0.5 },
];

function createColourSpiral() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.1, g: 0.1, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;
  const cy = 500;
  const totalPoints = 200;
  const turns = 6;

  for (let i = 0; i < totalPoints; i++) {
    const t = i / totalPoints;
    const angle = t * turns * Math.PI * 2;
    const radius = 10 + t * 400;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const dotSize = 2 + t * 10;
    const color = WEB_SAFE_COLOURS[i % WEB_SAFE_COLOURS.length];

    const dot = new Node(`dot-${i}`);
    dot.addComponent(createSphere(dotSize));
    dot.addComponent(new Material({
      fill: color,
      opacity: 0.6 + t * 0.4,
    }));
    dot.transform.position = { x, y, z: 0 };
    dot.transform.updateLocalMatrix();
    scene.add(dot);
  }

  function animate() { }
  return { scene, animate };
}

// ── SVG: Gradient Gallery ──────────────────────────────────────────────

function createGradientGallery() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.1, g: 0.1, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  // Gradient bar definitions
  const barGradients = [
    {
      stops: [
        { offset: 0, color: { r: 0.45, g: 0.5, b: 0.85 } },
        { offset: 1, color: { r: 0.2, g: 0.7, b: 0.9 } },
      ],
    },
    {
      stops: [
        { offset: 0, color: { r: 0.0, g: 0.8, b: 0.8 } },
        { offset: 0.6, color: { r: 0.3, g: 0.8, b: 0.5 } },
        { offset: 1, color: { r: 0.85, g: 0.75, b: 0.2 } },
      ],
    },
    {
      stops: [
        { offset: 0, color: { r: 0.2, g: 0.8, b: 0.85 } },
        { offset: 0.35, color: { r: 0.7, g: 0.6, b: 0.8 } },
        { offset: 0.65, color: { r: 1, g: 0.5, b: 0.3 } },
        { offset: 1, color: { r: 0.95, g: 0.2, b: 0.2 } },
      ],
    },
  ];

  const barWidth = 120;
  const barHeight = 700;
  const startX = 150;
  const gap = 180;

  for (let i = 0; i < barGradients.length; i++) {
    const bar = new Node(`bar-${i}`);
    bar.addComponent(createBox(barWidth, barHeight, 0));
    bar.addComponent(new Material({
      fillGradient: {
        type: "linear" as const,
        x1: 0.5, y1: 0, x2: 0.5, y2: 1,
        stops: barGradients[i].stops,
      },
    }));
    bar.transform.position = { x: startX + i * gap, y: 500, z: 0 };
    bar.transform.updateLocalMatrix();
    scene.add(bar);
  }

  // Radial gradient circles
  const circleGradients = [
    {
      cx: 0.35, cy: 0.35,
      stops: [
        { offset: 0, color: { r: 0.6, g: 0.85, b: 1 } },
        { offset: 0.5, color: { r: 0.3, g: 0.5, b: 0.9 } },
        { offset: 1, color: { r: 0.15, g: 0.2, b: 0.6 } },
      ],
    },
    {
      cx: 0.4, cy: 0.4,
      stops: [
        { offset: 0, color: { r: 0.1, g: 0.9, b: 0.9 } },
        { offset: 0.5, color: { r: 0.9, g: 0.8, b: 0.15 } },
        { offset: 1, color: { r: 0.95, g: 0.6, b: 0.1 } },
      ],
    },
    {
      cx: 0.5, cy: 0.5,
      stops: [
        { offset: 0, color: { r: 1, g: 0.3, b: 0.1 } },
        { offset: 0.4, color: { r: 0.2, g: 0.8, b: 0.7 } },
        { offset: 1, color: { r: 0, g: 0.6, b: 0.85 } },
      ],
    },
  ];

  const circleX = 780;
  const circleRadius = 85;
  const circleStartY = 210;
  const circleGap = 270;

  for (let i = 0; i < circleGradients.length; i++) {
    const c = new Node(`circle-${i}`);
    c.addComponent(createSphere(circleRadius));
    c.addComponent(new Material({
      fillGradient: {
        type: "radial" as const,
        cx: circleGradients[i].cx,
        cy: circleGradients[i].cy,
        r: 0.6,
        stops: circleGradients[i].stops,
      },
    }));
    c.transform.position = { x: circleX, y: circleStartY + i * circleGap, z: 0 };
    c.transform.updateLocalMatrix();
    scene.add(c);
  }

  function animate() { }
  return { scene, animate };
}

// ── SVG: Circle Overlay ────────────────────────────────────────────────

function createCircleOverlay() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.08, g: 0.09, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;

  // Concentric circle sets — two overlapping groups
  for (let i = 1; i <= 6; i++) {
    const r = 50 * i;
    const cy1 = 800 - r; // Bottom → up
    const cy2 = 200 + r; // Top → down

    // Blueish set (bottom up)
    const blue = new Node(`blue-${i}`);
    blue.addComponent(createSphere(r));
    blue.addComponent(new Material({
      fill: { r: 0.6, g: 0.93, b: 1.0 },
      opacity: 0.1,
    }));
    blue.transform.position = { x: cx, y: cy1, z: 0 };
    blue.transform.updateLocalMatrix();
    scene.add(blue);

    // Greenish set (top down)
    const green = new Node(`green-${i}`);
    green.addComponent(createSphere(r));
    green.addComponent(new Material({
      fill: { r: 0.67, g: 1.0, b: 0.93 },
      opacity: 0.1,
    }));
    green.transform.position = { x: cx, y: cy2, z: 0 };
    green.transform.updateLocalMatrix();
    scene.add(green);
  }

  // Subtle outline circle
  const outline = new Node("outline");
  outline.addComponent(createSphere(320));
  outline.addComponent(new Material({
    stroke: { r: 0.67, g: 1.0, b: 0.93 },
    strokeWidth: 2,
    opacity: 0.1,
  }));
  outline.transform.position = { x: cx, y: 500, z: 0 };
  outline.transform.updateLocalMatrix();
  scene.add(outline);

  // Stroke gradient frame
  const frame = new Node("frame");
  frame.addComponent(createSphere(345));
  frame.addComponent(new Material({
    strokeGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 0, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.93, g: 0.93, b: 0.93 } },
        { offset: 1, color: { r: 0.93, g: 0.93, b: 0.93 }, opacity: 0.08 },
      ],
    },
    strokeWidth: 2.5,
  }));
  frame.transform.position = { x: cx, y: 500, z: 0 };
  frame.transform.updateLocalMatrix();
  scene.add(frame);

  function animate() { }
  return { scene, animate };
}

// ── SVG: Gradient Sphere with Skyline ──────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createGradientSphere() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.08, g: 0.09, b: 0.12 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  const cx = 500;
  const cy = 500;
  const mainRadius = 345;

  // Main gradient sphere
  const sphere = new Node("sphere");
  sphere.addComponent(createSphere(mainRadius));
  sphere.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.5, cy: 0.35, r: 0.65,
      stops: [
        { offset: 0, color: { r: 1.0, g: 0.4, b: 0.55 } },
        { offset: 0.3, color: { r: 0.9, g: 0.25, b: 0.5 } },
        { offset: 0.55, color: { r: 0.5, g: 0.2, b: 0.6 } },
        { offset: 0.8, color: { r: 0.2, g: 0.35, b: 0.55 } },
        { offset: 1, color: { r: 0.15, g: 0.4, b: 0.5 } },
      ],
    },
  }));
  sphere.transform.position = { x: cx, y: cy, z: 0 };
  sphere.transform.updateLocalMatrix();
  scene.add(sphere);

  // Skyline bars (clipped inside the circle using positioning)
  const rng = seededRng(42);
  const barCount = 60;
  const skylineY = cy + 20;
  const barAreaWidth = mainRadius * 1.7;
  const barStartX = cx - barAreaWidth / 2;

  for (let i = 0; i < barCount; i++) {
    const bx = barStartX + (i / barCount) * barAreaWidth;
    const distFromCenter = Math.abs(bx - cx);
    const maxH = Math.sqrt(Math.max(0, mainRadius * mainRadius - distFromCenter * distFromCenter));

    if (maxH < 10) continue;

    const barH = 20 + rng() * Math.min(maxH * 0.6, 180);
    const barW = barAreaWidth / barCount * 0.6;

    const bar = new Node(`bar-${i}`);
    bar.addComponent(createBox(barW, barH, 0));
    bar.addComponent(new Material({
      fill: { r: 0.08, g: 0.08, b: 0.15 },
      opacity: 0.7,
    }));
    bar.transform.position = { x: bx, y: skylineY - barH / 2, z: 0 };
    bar.transform.updateLocalMatrix();
    scene.add(bar);
  }

  // Stroke gradient frame
  const frame = new Node("frame");
  frame.addComponent(createSphere(mainRadius + 3));
  frame.addComponent(new Material({
    strokeGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.9, g: 0.9, b: 0.95 } },
        { offset: 1, color: { r: 0.9, g: 0.9, b: 0.95 }, opacity: 0.1 },
      ],
    },
    strokeWidth: 2,
  }));
  frame.transform.position = { x: cx, y: cy, z: 0 };
  frame.transform.updateLocalMatrix();
  scene.add(frame);

  function animate() { }
  return { scene, animate };
}

// ── SvJs: Porto Pareto ─────────────────────────────────────────────────

function createPortoPareto() {
  const svgSize = 1000;

  // Initialize SvJs
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  // Background
  const skyGradientId = 'sky-gradient';
  svg.createGradient(skyGradientId, 'linear', ['#f58b10', '#d21263', '#940c5e', '#23103a'], 90);
  svg.rect(1000, 600, 0, 0).fill(`url(#${skyGradientId})`);

  const waterGradientId = 'water-gradient';
  svg.createGradient(waterGradientId, 'linear', ['#80e5ff10', '#70b566'], 90);
  svg.rect(1000, 400, 0, 600).fill(`url(#${waterGradientId})`);

  // City Group
  const city = svg.g();

  // Default params
  const count = 60;
  const minH = 20;
  const spacing = 1000 / count;

  for (let i = 0; i < count; i++) {
    const paretoVal = Gen.pareto(minH);
    const maxHeight = Gen.random(300, 500);
    const height = Gen.constrain(paretoVal, minH, maxHeight);

    const x = i * spacing;
    const y = 600 - height; // Horizon at 600

    city.rect(spacing - 2, height, x, y)
      .fill('#1a1a2e')
      .stroke('#000', 1);

    city.rect(spacing - 2, height * 0.3, x, 600)
      .fill('#1a1a2e', 0.3);
  }

  // Sun
  svg.circle(60, 800, 150)
    .fill('#ffcc33', 0.8)
    .set({ filter: 'blur(4px)' });

  return {
    scene: svg,
    animate: () => { }
  };
}

// ── SvJs: Gaussian Distribution ────────────────────────────────────────

function createGaussianDist() {
  const svgSize = 1000;
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  svg.rect(svgSize, svgSize).fill('#111');

  const particles = svg.g();
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const count = 2000;
  const sd = 120;

  for (let i = 0; i < count; i++) {
    const x = Gen.gaussian(centerX, sd);
    const y = Gen.gaussian(centerY, sd);

    const d = Gen.dist(x, y, centerX, centerY);
    const hue = Gen.map(d, 0, 400, 220, 340); // Blue to Pink

    particles.circle(Gen.random(1, 4), x, y)
      .fill(`hsl(${hue}, 80%, 70%)`, 0.6);
  }

  const graphGroup = svg.g();
  graphGroup.line(0, centerY, 1000, centerY).stroke('#fff', 1, 0.2);

  return {
    scene: svg,
    animate: () => { }
  };
}

// ── SvJs: Colourful Grids ──────────────────────────────────────────────

function createColourfulGrids() {
  const svgSize = 1000;
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  svg.rect(svgSize, svgSize).fill('#f0f0f0');

  const gSize = 600;
  const rows = 10;
  const chance = 60;
  const spacing = 10;

  const increment = gSize / rows;
  const cellSize = Math.abs(increment - spacing);
  const offset = (svgSize - gSize) / 2;

  const grid = svg.g();
  grid.moveTo(offset, offset);

  const palettes = [
    ['#5465FF', '#788BFF', '#9BB1FF', '#BFD7FF', '#E2FDFF'],
    ['#22577A', '#38A3A5', '#57CC99', '#80ED99', '#C7f9CC'],
    ['#4C5760', '#93A8AC', '#D7CEB2', '#A59E8C', '#66635B']
  ];
  const palette = Gen.random(palettes);

  function clipId(base: string) { return `clip-${base}-${Math.floor(Math.random() * 10000)}`; }

  for (let y = 0; y < gSize; y += increment) {
    for (let x = 0; x < gSize; x += increment) {
      if (!Gen.chance(chance)) continue;

      const cellId = `cell-${x}-${y}`;
      const clip = svg.create('clipPath').set({ id: clipId(cellId) });
      clip.rect(cellSize, cellSize, x, y);

      const cellContent = grid.g();
      cellContent.set({ 'clip-path': `url(#${clipId(cellId)})` });

      const type = Gen.random(['circles', 'lines']);

      if (type === 'circles') {
        const cx = Gen.random([x, x + cellSize]);
        const cy = Gen.random([y, y + cellSize]);
        for (let i = 0; i < 5; i++) {
          cellContent.circle(cellSize - (i * cellSize / 5), cx, cy)
            .fill(palette[i % palette.length]);
        }
      } else {
        for (let i = 0; i < 10; i++) {
          cellContent.line(
            Gen.random(x, x + cellSize), Gen.random(y, y + cellSize),
            Gen.random(x, x + cellSize), Gen.random(y, y + cellSize)
          ).stroke(palette[Gen.random(0, palette.length - 1)], 2);
        }
      }

      grid.rect(cellSize, cellSize, x, y)
        .fill('none')
        .stroke('#ddd', 1);
    }
  }

  return {
    scene: svg,
    animate: () => { }
  };
}

// ── SvJs: Interactive Galaxy ───────────────────────────────────────────

function createInteractiveGalaxy() {
  const svgSize = 1000;
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  svg.rect(svgSize, svgSize).fill('#050510');

  const stars = svg.g();
  const starElements: { el: SvJs, x: number, y: number, z: number }[] = [];

  const count = 100;

  for (let i = 0; i < count; i++) {
    const x = Gen.random(0, svgSize);
    const y = Gen.random(0, svgSize);
    const z = Gen.random(0.5, 2, true);

    const star = stars.circle(Gen.random(1, 3), x, y)
      .fill('#fff', Gen.random(0.5, 1, true));

    starElements.push({ el: star, x, y, z });
  }

  const cursorFollower = svg.circle(20, 0, 0)
    .fill('none')
    .stroke('#0ff', 2)
    .set({ filter: 'blur(2px)' });

  // Note: trackCursor attaches event listeners to the SVG element.
  // Since we are running in a specific container, we rely on SvJs logic.
  svg.trackCursor();

  function animate() {
    const mx = svg.cursorX ?? svgSize / 2;
    const my = svg.cursorY ?? svgSize / 2;

    cursorFollower.set({ cx: mx, cy: my });

    starElements.forEach(star => {
      const dx = (mx - svgSize / 2) * star.z * 0.1;
      const dy = (my - svgSize / 2) * star.z * 0.1;
      star.el.set({
        cx: star.x + dx,
        cy: star.y + dy
      });
    });
  }

  return {
    scene: svg,
    animate: animate
  };
}

// ── Export all examples ────────────────────────────────────────────────

export const EXAMPLES: ExampleDef[] = [
  {
    id: "colour-spiral",
    title: "Colour Spiral",
    description:
      "Espiral de puntos coloridos generados proceduralmente. Demuestra createSphere, fill con paleta de colores y posicionamiento polar.",
    category: "svg",
    factory: createColourSpiral,
  },
  {
    id: "gradient-gallery",
    title: "Gradient Gallery",
    description:
      "Barras con gradientes lineales verticales y círculos con gradientes radiales. Demuestra fillGradient lineal y radial.",
    category: "svg",
    factory: createGradientGallery,
  },
  {
    id: "circle-overlay",
    title: "Circle Overlay",
    description:
      "Círculos translúcidos superpuestos creando profundidad. Demuestra opacity, strokeGradient y composición visual.",
    category: "svg",
    factory: createCircleOverlay,
  },
  {
    id: "gradient-sphere",
    title: "Gradient Sphere",
    description:
      "Esfera con gradiente radial y silueta de ciudad superpuesta. Demuestra gradientes radiales complejos y strokeGradient en marcos.",
    category: "svg",
    factory: createGradientSphere,
  },
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
  {
    id: "porto-pareto",
    title: "Porto Pareto",
    description:
      "Paisaje urbano generativo usando distribución de Pareto para alturas de edificios. Demuestra Gen.pareto y constrains.",
    category: "svjs",
    factory: createPortoPareto,
  },
  {
    id: "gaussian-dist",
    title: "Gaussian Distribution",
    description:
      "Visualización de distribución normal (campana de Gauss). Demuestra Gen.gaussian y mapeo de colores.",
    category: "svjs",
    factory: createGaussianDist,
  },
  {
    id: "colourful-grids",
    title: "Colourful Grids",
    description:
      "Grilla con patrones recortados usando clipPath y decisiones probabilísticas con Gen.chance.",
    category: "svjs",
    factory: createColourfulGrids,
  },
  {
    id: "interactive-galaxy",
    title: "Interactive Galaxy",
    description:
      "Sistema de partículas con efecto de paralaje que sigue al mouse. Demuestra trackCursor y reactividad.",
    category: "svjs",
    factory: createInteractiveGalaxy,
  },
];
