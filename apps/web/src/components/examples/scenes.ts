import {
  Scene,
  Node,
  createBox,
  createSphere,
  createText,
  Geometry,
  GeometryPrimitive,
  Material,
  Camera,
  CameraType,
  Interactive,
  Animation,
  AnimationMixer,
  createPath2D,
  Light,
  LightType,
  type AnimationClip,
  type KeyframeTrack,
  type Path2DCommand,
} from "@joroya/core";
import { loadGLTF } from "@joroya/loader-gltf";
import { SvJs, Gen } from "@joroya/renderer-svg";
import type { ExampleDef } from "./ExampleCard";
import { createTexturesScene } from "../../scenes/textures";
import { createLookAtScene } from "../../scenes/look-at";
import { createPhysicsScene } from "../../scenes/physics-demo";
import { createInstancingScene } from "../../scenes/instancing-demo";
import { createShadowsScene } from "../../scenes/shadows-demo";
import { createNeonCityScene } from "../../scenes/neon-city-demo";
import { createFireSmokeScene } from "../../scenes/fire-smoke-demo";
import { createAudioScene } from "../../scenes/audio-demo";
import { createAnimationScene } from "../../scenes/animation-demo";

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

/**
 * Add default lighting (ambient + directional) to a scene.
 * Call this in every 3D scene so objects using MeshStandardMaterial are visible.
 */
function addDefaultLighting(scene: Scene) {
  const ambient = new Node("default-ambient");
  ambient.addComponent(new Light({
    type: LightType.Ambient,
    color: { r: 0.4, g: 0.4, b: 0.5 },
    intensity: 0.6,
  }));
  scene.add(ambient);

  const sun = new Node("default-sun");
  sun.addComponent(new Light({
    type: LightType.Directional,
    color: { r: 1.0, g: 0.95, b: 0.9 },
    intensity: 1.0,
  }));
  sun.transform.position = { x: 5, y: 8, z: 4 };
  scene.add(sun);
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
  addDefaultLighting(scene);

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
  addDefaultLighting(scene);

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

  // Concentric circle sets  Etwo overlapping groups
  for (let i = 1; i <= 6; i++) {
    const r = 50 * i;
    const cy1 = 800 - r; // Bottom ↁEup
    const cy2 = 200 + r; // Top ↁEdown

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

// ── PBR Material Showcase ──────────────────────────────────────────────

function createPBRShowcase() {
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

// ── Orthographic Camera Demo ───────────────────────────────────────────

function createOrthoDemo() {
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

// ── Export all examples ────────────────────────────────────────────────

function createGLTFDemo() {
  const scene = new Scene();
  const mixer = new AnimationMixer(scene);

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
  cam.transform.position = { x: 0, y: 1.5, z: 4 };
  scene.add(cam);
  addDefaultLighting(scene);

  // Load the model asynchronously
  // Note: The factory function is synchronous, but we can load async content into the scene.
  loadGLTF('/models/BoxAnimated.glb').then(({ scene: gltfScene, animations }: { scene: Scene, animations: AnimationClip[] }) => {
    // Add the glTF scene root to our main scene
    scene.root.add(gltfScene.root);

    // Play the first animation if available
    if (animations.length > 0) {
      mixer.play(animations[0]);
    }
  }).catch((err: unknown) => {
    console.error("Failed to load glTF model:", err);
  });

  let lastTime = -1;

  return {
    scene,
    animate: (time: number) => {
      // time is in seconds
      if (lastTime === -1) {
        lastTime = time;
      }
      const delta = time - lastTime;
      lastTime = time;
      mixer.update(delta);
    }
  };
}

// ── Interactive Cubes ──────────────────────────────────────────────────

function createInteractiveCubes() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 50,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 3.5, z: 8 };
  scene.add(cam);
  addDefaultLighting(scene);

  const ground = new Node("ground");
  ground.addComponent(createBox(14, 0.1, 14));
  ground.addComponent(
    new Material({ color: { r: 0.08, g: 0.08, b: 0.12 }, metalness: 0.2, roughness: 0.9 })
  );
  ground.transform.position = { x: 0, y: -1.2, z: 0 };
  scene.add(ground);

  const colors = [
    { r: 0.9, g: 0.2, b: 0.3 },
    { r: 0.2, g: 0.8, b: 0.4 },
    { r: 0.3, g: 0.5, b: 0.95 },
    { r: 1.0, g: 0.7, b: 0.1 },
    { r: 0.7, g: 0.3, b: 0.9 },
    { r: 0.1, g: 0.8, b: 0.85 },
    { r: 0.95, g: 0.45, b: 0.1 },
    { r: 0.6, g: 0.9, b: 0.3 },
    { r: 0.9, g: 0.2, b: 0.7 },
  ];

  const cubes: Node[] = [];
  const gridSize = 3;
  const spacing = 2.2;
  const cubeOffset = ((gridSize - 1) * spacing) / 2;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const idx = x * gridSize + z;
      const cube = new Node(`cube - ${x} -${z} `);
      cube.addComponent(createBox(1.2, 1.2, 1.2));
      cube.addComponent(
        new Material({ color: colors[idx], metalness: 0.3, roughness: 0.5 })
      );
      cube.addComponent(new Interactive({ cursor: "pointer" }));
      cube.transform.position = {
        x: x * spacing - cubeOffset,
        y: 0,
        z: z * spacing - cubeOffset,
      };
      scene.add(cube);
      cubes.push(cube);
    }
  }

  function animate(time: number) {
    for (let i = 0; i < cubes.length; i++) {
      const node = cubes[i];
      const gx = Math.floor(i / gridSize);
      const gz = i % gridSize;
      const phase = gx * 0.7 + gz * 1.1;

      node.transform.position.y = Math.sin(time * 1.5 + phase) * 0.2;
      node.transform.rotation = rotateY(time * 0.4 + phase * 0.3);

      const activeIdx = Math.floor(time * 1.2) % cubes.length;
      const scale = i === activeIdx ? 1.0 + Math.sin(time * 8) * 0.1 : 1.0;
      node.transform.scale = { x: scale, y: scale, z: scale };

      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}

// ── Interpolation Comparison ──────────────────────────────────────────

function createInterpolationComparison() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 50,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 2.5, z: 10 };
  scene.add(cam);
  addDefaultLighting(scene);

  const ground = new Node("ground");
  ground.addComponent(createBox(16, 0.1, 6));
  ground.addComponent(
    new Material({ color: { r: 0.08, g: 0.08, b: 0.12 }, metalness: 0.2, roughness: 0.9 })
  );
  ground.transform.position = { x: 0, y: -1.5, z: 0 };
  scene.add(ground);

  const modes: { name: string; color: { r: number; g: number; b: number }; x: number }[] = [
    { name: "linear", color: { r: 0.3, g: 0.6, b: 1.0 }, x: -3.5 },
    { name: "step", color: { r: 1.0, g: 0.4, b: 0.3 }, x: 0 },
    { name: "cubic", color: { r: 0.3, g: 0.9, b: 0.5 }, x: 3.5 },
  ];

  for (const mode of modes) {
    const pedestal = new Node(`pedestal - ${mode.name} `);
    pedestal.addComponent(createBox(2, 0.15, 2));
    pedestal.addComponent(
      new Material({ color: { r: 0.15, g: 0.15, b: 0.2 }, metalness: 0.3, roughness: 0.7 })
    );
    pedestal.transform.position = { x: mode.x, y: -1.35, z: 0 };
    scene.add(pedestal);

    const pivot = new Node(`pivot - ${mode.name} `);
    pivot.transform.position = { x: mode.x, y: 0, z: 0 };
    scene.add(pivot);

    const sphere = new Node(`sphere - ${mode.name} `);
    sphere.addComponent(createSphere(0.6, 32, 32));
    sphere.addComponent(
      new Material({
        color: mode.color,
        metalness: 0.5,
        roughness: 0.3,
        emissive: { r: mode.color.r * 0.1, g: mode.color.g * 0.1, b: mode.color.b * 0.1 },
      })
    );
    pivot.add(sphere);
  }

  const duration = 2.0;
  const times = new Float32Array([0, 1, 2]);

  const linearTrack: KeyframeTrack = {
    targetNodeName: "sphere-linear",
    property: "position",
    times,
    values: new Float32Array([0, 0, 0, 0, 2.5, 0, 0, 0, 0]),
    interpolation: "linear",
  };

  const stepTrack: KeyframeTrack = {
    targetNodeName: "sphere-step",
    property: "position",
    times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
    values: new Float32Array([
      0, 0, 0,
      0, 1.25, 0,
      0, 2.5, 0,
      0, 1.25, 0,
      0, 0, 0,
    ]),
    interpolation: "step",
  };

  // glTF CUBICSPLINE: [in-tangent, value, out-tangent] per keyframe (stride=3 per Vec3)
  const cubicTrack: KeyframeTrack = {
    targetNodeName: "sphere-cubic",
    property: "position",
    times,
    values: new Float32Array([
      // KF 0: in-tangent, value, out-tangent
      0, 0, 0, 0, 0, 0, 0, 5, 0,
      // KF 1: in-tangent, value, out-tangent
      0, 0, 0, 0, 2.5, 0, 0, 0, 0,
      // KF 2: in-tangent, value, out-tangent
      0, -5, 0, 0, 0, 0, 0, 0, 0,
    ]),
    interpolation: "cubicspline",
  };

  const clip: AnimationClip = {
    name: "interpolation-comparison",
    duration,
    tracks: [linearTrack, stepTrack, cubicTrack],
  };

  const mixer = new AnimationMixer(scene);
  mixer.play(clip, true);

  let lastTime = -1;
  function animate(time: number) {
    if (lastTime === -1) lastTime = time;
    const delta = time - lastTime;
    lastTime = time;
    mixer.update(delta);
  }

  return { scene, animate };
}

// ── SVG: Filter Showcase ──────────────────────────────────────────────

function createFilterShowcase() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.06, g: 0.07, b: 0.1 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  // Title
  const title = new Node("title");
  title.addComponent(createText("SVG Filters", {
    fontSize: 40, fontFamily: "sans-serif", fontWeight: "bold", textAnchor: "middle",
  }));
  title.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  title.transform.position = { x: 500, y: 80, z: 0 };
  title.transform.updateLocalMatrix();
  scene.add(title);

  // Blur section
  const blurLabel = new Node("blur-label");
  blurLabel.addComponent(createText("Gaussian Blur", {
    fontSize: 22, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  blurLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  blurLabel.transform.position = { x: 500, y: 150, z: 0 };
  blurLabel.transform.updateLocalMatrix();
  scene.add(blurLabel);

  const blurValues = [0, 3, 8, 15, 25];
  for (let i = 0; i < blurValues.length; i++) {
    const circle = new Node(`blur - ${i} `);
    circle.addComponent(createSphere(55));
    const matDef = {
      fillGradient: {
        type: "radial" as const,
        cx: 0.4, cy: 0.4, r: 0.6,
        stops: [
          { offset: 0, color: { r: 0.4, g: 0.7, b: 1.0 } },
          { offset: 1, color: { r: 0.15, g: 0.25, b: 0.7 } },
        ],
      },
      filter: blurValues[i] > 0
        ? { effects: [{ type: "blur" as const, stdDeviation: blurValues[i] }] }
        : undefined,
    };
    circle.addComponent(new Material(matDef));
    circle.transform.position = { x: 120 + i * 190, y: 290, z: 0 };
    circle.transform.updateLocalMatrix();
    scene.add(circle);

    const valLabel = new Node(`blur - val - ${i} `);
    valLabel.addComponent(createText(blurValues[i] === 0 ? "Original" : `\u03C3 = ${blurValues[i]} `, {
      fontSize: 14, fontFamily: "monospace", textAnchor: "middle",
    }));
    valLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
    valLabel.transform.position = { x: 120 + i * 190, y: 375, z: 0 };
    valLabel.transform.updateLocalMatrix();
    scene.add(valLabel);
  }

  // Drop shadow section
  const shadowLabel = new Node("shadow-label");
  shadowLabel.addComponent(createText("Drop Shadow", {
    fontSize: 22, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  shadowLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  shadowLabel.transform.position = { x: 500, y: 470, z: 0 };
  shadowLabel.transform.updateLocalMatrix();
  scene.add(shadowLabel);

  const shadowConfigs = [
    { dx: 4, dy: 4, std: 3, color: { r: 0, g: 0, b: 0 }, label: "Classic" },
    { dx: 8, dy: 8, std: 8, color: { r: 0.4, g: 0, b: 0.7 }, label: "Purple" },
    { dx: 0, dy: 10, std: 15, color: { r: 0, g: 0.4, b: 0.9 }, label: "Blue Glow" },
    { dx: 0, dy: 0, std: 20, color: { r: 1, g: 0.3, b: 0.1 }, label: "Fire Aura" },
  ];

  for (let i = 0; i < shadowConfigs.length; i++) {
    const cfg = shadowConfigs[i];
    const rect = new Node(`shadow - ${i} `);
    rect.addComponent(createBox(130, 130, 0));
    rect.addComponent(new Material({
      fill: { r: 0.92, g: 0.92, b: 0.95 },
      filter: {
        effects: [{
          type: "dropShadow" as const,
          dx: cfg.dx,
          dy: cfg.dy,
          stdDeviation: cfg.std,
          floodColor: cfg.color,
          floodOpacity: 0.7,
        }],
      },
    }));
    rect.transform.position = { x: 155 + i * 220, y: 620, z: 0 };
    rect.transform.updateLocalMatrix();
    scene.add(rect);

    const sLabel = new Node(`shadow - lbl - ${i} `);
    sLabel.addComponent(createText(cfg.label, {
      fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
    }));
    sLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
    sLabel.transform.position = { x: 155 + i * 220, y: 720, z: 0 };
    sLabel.transform.updateLocalMatrix();
    scene.add(sLabel);
  }

  // Combined effect
  const comboLabel = new Node("combo-label");
  comboLabel.addComponent(createText("Combined: Blur + Shadow", {
    fontSize: 22, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  comboLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  comboLabel.transform.position = { x: 500, y: 800, z: 0 };
  comboLabel.transform.updateLocalMatrix();
  scene.add(comboLabel);

  const combo = new Node("combo");
  combo.addComponent(createSphere(65));
  combo.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.4, cy: 0.4, r: 0.5,
      stops: [
        { offset: 0, color: { r: 1, g: 0.85, b: 0.3 } },
        { offset: 1, color: { r: 1, g: 0.3, b: 0.15 } },
      ],
    },
    filter: {
      effects: [
        { type: "blur" as const, stdDeviation: 2 },
        { type: "dropShadow" as const, dx: 0, dy: 0, stdDeviation: 25, floodColor: { r: 1, g: 0.4, b: 0.1 }, floodOpacity: 0.8 },
      ],
    },
  }));
  combo.transform.position = { x: 500, y: 910, z: 0 };
  combo.transform.updateLocalMatrix();
  scene.add(combo);

  function animate() { }
  return { scene, animate };
}

// ── SVG: Clip-Path & Mask ─────────────────────────────────────────────

function createClipMaskDemo() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.06, g: 0.07, b: 0.1 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  // Title
  const clipTitle = new Node("title");
  clipTitle.addComponent(createText("Clip-Path & Mask", {
    fontSize: 40, fontFamily: "sans-serif", fontWeight: "bold", textAnchor: "middle",
  }));
  clipTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  clipTitle.transform.position = { x: 500, y: 80, z: 0 };
  clipTitle.transform.updateLocalMatrix();
  scene.add(clipTitle);

  // ── Clip-path column (left side) ──
  const clipLabel = new Node("clip-label");
  clipLabel.addComponent(createText("clip-path", {
    fontSize: 22, fontFamily: "monospace", textAnchor: "middle",
  }));
  clipLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  clipLabel.transform.position = { x: 250, y: 150, z: 0 };
  clipLabel.transform.updateLocalMatrix();
  scene.add(clipLabel);

  // Gradient circle clipped by a diamond
  const clippedDiamond = new Node("clipped-diamond");
  clippedDiamond.addComponent(createSphere(150));
  clippedDiamond.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.4, cy: 0.35, r: 0.6,
      stops: [
        { offset: 0, color: { r: 1, g: 0.5, b: 0.7 } },
        { offset: 0.5, color: { r: 0.8, g: 0.2, b: 0.6 } },
        { offset: 1, color: { r: 0.3, g: 0.1, b: 0.5 } },
      ],
    },
    clipPath: {
      path: [
        { command: "M", args: [0, -130] },
        { command: "L", args: [130, 0] },
        { command: "L", args: [0, 130] },
        { command: "L", args: [-130, 0] },
        { command: "Z", args: [] },
      ],
    },
  }));
  clippedDiamond.transform.position = { x: 250, y: 350, z: 0 };
  clippedDiamond.transform.updateLocalMatrix();
  scene.add(clippedDiamond);

  const dLabel = new Node("d-label");
  dLabel.addComponent(createText("Diamond Clip", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  dLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  dLabel.transform.position = { x: 250, y: 530, z: 0 };
  dLabel.transform.updateLocalMatrix();
  scene.add(dLabel);

  // Gradient box clipped by a star shape
  const clippedStar = new Node("clipped-star");
  clippedStar.addComponent(createBox(250, 250, 0));
  clippedStar.addComponent(new Material({
    fillGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.2, g: 0.6, b: 1 } },
        { offset: 0.5, color: { r: 0.5, g: 0.2, b: 0.9 } },
        { offset: 1, color: { r: 1, g: 0.3, b: 0.4 } },
      ],
    },
    clipPath: {
      path: [
        { command: "M", args: [0, -120] },
        { command: "L", args: [35, -40] },
        { command: "L", args: [115, -35] },
        { command: "L", args: [55, 20] },
        { command: "L", args: [70, 100] },
        { command: "L", args: [0, 55] },
        { command: "L", args: [-70, 100] },
        { command: "L", args: [-55, 20] },
        { command: "L", args: [-115, -35] },
        { command: "L", args: [-35, -40] },
        { command: "Z", args: [] },
      ],
    },
  }));
  clippedStar.transform.position = { x: 250, y: 740, z: 0 };
  clippedStar.transform.updateLocalMatrix();
  scene.add(clippedStar);

  const sLabel = new Node("s-label");
  sLabel.addComponent(createText("Star Clip", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  sLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  sLabel.transform.position = { x: 250, y: 910, z: 0 };
  sLabel.transform.updateLocalMatrix();
  scene.add(sLabel);

  // ── Mask column (right side) ──
  const maskLabel = new Node("mask-label");
  maskLabel.addComponent(createText("mask", {
    fontSize: 22, fontFamily: "monospace", textAnchor: "middle",
  }));
  maskLabel.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
  maskLabel.transform.position = { x: 750, y: 150, z: 0 };
  maskLabel.transform.updateLocalMatrix();
  scene.add(maskLabel);

  // Gradient circle masked by a circular path
  const maskedCircle = new Node("masked-circle");
  maskedCircle.addComponent(createSphere(150));
  maskedCircle.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.5, cy: 0.5, r: 0.5,
      stops: [
        { offset: 0, color: { r: 0, g: 0.9, b: 0.9 } },
        { offset: 0.6, color: { r: 0.2, g: 0.4, b: 0.9 } },
        { offset: 1, color: { r: 0.5, g: 0.1, b: 0.8 } },
      ],
    },
    mask: {
      path: [
        { command: "M", args: [0, -140] },
        { command: "C", args: [140, -140, 140, 140, 0, 140] },
        { command: "C", args: [-140, 140, -140, -140, 0, -140] },
        { command: "Z", args: [] },
      ],
      fill: { r: 1, g: 1, b: 1 },
      opacity: 0.75,
    },
  }));
  maskedCircle.transform.position = { x: 750, y: 350, z: 0 };
  maskedCircle.transform.updateLocalMatrix();
  scene.add(maskedCircle);

  const cLabel = new Node("c-label");
  cLabel.addComponent(createText("Soft Circle Mask", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  cLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  cLabel.transform.position = { x: 750, y: 530, z: 0 };
  cLabel.transform.updateLocalMatrix();
  scene.add(cLabel);

  // Gradient box masked with reduced opacity
  const maskedRect = new Node("masked-rect");
  maskedRect.addComponent(createBox(250, 250, 0));
  maskedRect.addComponent(new Material({
    fillGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 1, g: 0.6, b: 0.1 } },
        { offset: 0.5, color: { r: 1, g: 0.2, b: 0.3 } },
        { offset: 1, color: { r: 0.6, g: 0.1, b: 0.5 } },
      ],
    },
    mask: {
      path: [
        { command: "M", args: [-100, -100] },
        { command: "L", args: [100, -100] },
        { command: "L", args: [100, 100] },
        { command: "L", args: [-100, 100] },
        { command: "Z", args: [] },
      ],
      fill: { r: 1, g: 1, b: 1 },
      opacity: 0.6,
    },
  }));
  maskedRect.transform.position = { x: 750, y: 740, z: 0 };
  maskedRect.transform.updateLocalMatrix();
  scene.add(maskedRect);

  const rLabel = new Node("r-label");
  rLabel.addComponent(createText("Opacity Mask", {
    fontSize: 14, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  rLabel.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  rLabel.transform.position = { x: 750, y: 910, z: 0 };
  rLabel.transform.updateLocalMatrix();
  scene.add(rLabel);

  function animate() { }
  return { scene, animate };
}

// ── SVG: Native Animation ─────────────────────────────────────────────

function createSvgAnimationShowcase() {
  const scene = new Scene();

  const cam = new Node("cam");
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000, top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  const bg = new Node("bg");
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.06, g: 0.07, b: 0.1 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  bg.transform.updateLocalMatrix();
  scene.add(bg);

  // Title
  const animTitle = new Node("title");
  animTitle.addComponent(createText("SVG Native Animations", {
    fontSize: 38, fontFamily: "sans-serif", fontWeight: "bold", textAnchor: "middle",
  }));
  animTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  animTitle.transform.position = { x: 500, y: 80, z: 0 };
  animTitle.transform.updateLocalMatrix();
  scene.add(animTitle);

  // 1. Pulsing circle
  const pulse = new Node("pulse");
  pulse.addComponent(createSphere(40));
  pulse.addComponent(new Material({ fill: { r: 0.3, g: 0.6, b: 1.0 }, opacity: 0.8 }));
  pulse.addComponent(new Animation([
    { type: "animate", attributeName: "r", values: "40;55;40", dur: "2s", repeatCount: "indefinite" },
    { type: "animate", attributeName: "opacity", values: "0.9;0.4;0.9", dur: "2s", repeatCount: "indefinite" },
  ]));
  pulse.transform.position = { x: 200, y: 280, z: 0 };
  pulse.transform.updateLocalMatrix();
  scene.add(pulse);

  const pulseLabel = new Node("pulse-lbl");
  pulseLabel.addComponent(createText("Pulse", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  pulseLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  pulseLabel.transform.position = { x: 200, y: 360, z: 0 };
  pulseLabel.transform.updateLocalMatrix();
  scene.add(pulseLabel);

  // 2. Rotating square
  const spinner = new Node("spinner");
  spinner.addComponent(createBox(80, 80, 0));
  spinner.addComponent(new Material({
    fill: { r: 1, g: 0.4, b: 0.3 },
    stroke: { r: 1, g: 0.6, b: 0.5 },
    strokeWidth: 2,
  }));
  spinner.addComponent(new Animation([
    { type: "animateTransform", transformType: "rotate", from: "0", to: "360", dur: "4s", repeatCount: "indefinite" },
  ]));
  spinner.transform.position = { x: 500, y: 280, z: 0 };
  spinner.transform.updateLocalMatrix();
  scene.add(spinner);

  const spinnerLabel = new Node("spinner-lbl");
  spinnerLabel.addComponent(createText("Rotate", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  spinnerLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  spinnerLabel.transform.position = { x: 500, y: 360, z: 0 };
  spinnerLabel.transform.updateLocalMatrix();
  scene.add(spinnerLabel);

  // 3. Scaling circle
  const scaler = new Node("scaler");
  scaler.addComponent(createSphere(40));
  scaler.addComponent(new Material({
    fillGradient: {
      type: "radial" as const,
      cx: 0.4, cy: 0.4, r: 0.5,
      stops: [
        { offset: 0, color: { r: 0.4, g: 1, b: 0.6 } },
        { offset: 1, color: { r: 0.1, g: 0.6, b: 0.3 } },
      ],
    },
  }));
  scaler.addComponent(new Animation([
    { type: "animateTransform", transformType: "scale", values: "1;1.4;1", dur: "1.5s", repeatCount: "indefinite" },
  ]));
  scaler.transform.position = { x: 800, y: 280, z: 0 };
  scaler.transform.updateLocalMatrix();
  scene.add(scaler);

  const scalerLabel = new Node("scaler-lbl");
  scalerLabel.addComponent(createText("Scale", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  scalerLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  scalerLabel.transform.position = { x: 800, y: 360, z: 0 };
  scalerLabel.transform.updateLocalMatrix();
  scene.add(scalerLabel);

  // 4. Translating element
  const mover = new Node("mover");
  mover.addComponent(createSphere(25));
  mover.addComponent(new Material({ fill: { r: 1, g: 0.8, b: 0.1 } }));
  mover.addComponent(new Animation([
    { type: "animateTransform", transformType: "translate", values: "0,0;150,0;150,-80;0,0", dur: "3s", repeatCount: "indefinite" },
  ]));
  mover.transform.position = { x: 200, y: 580, z: 0 };
  mover.transform.updateLocalMatrix();
  scene.add(mover);

  const moverLabel = new Node("mover-lbl");
  moverLabel.addComponent(createText("Translate", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  moverLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  moverLabel.transform.position = { x: 200, y: 660, z: 0 };
  moverLabel.transform.updateLocalMatrix();
  scene.add(moverLabel);

  // 5. Skewing rectangle
  const skewer = new Node("skewer");
  skewer.addComponent(createBox(70, 100, 0));
  skewer.addComponent(new Material({
    fillGradient: {
      type: "linear" as const,
      x1: 0, y1: 0, x2: 1, y2: 1,
      stops: [
        { offset: 0, color: { r: 0.6, g: 0.2, b: 0.9 } },
        { offset: 1, color: { r: 0.2, g: 0.6, b: 0.9 } },
      ],
    },
  }));
  skewer.addComponent(new Animation([
    { type: "animateTransform", transformType: "skewX", values: "0;20;-20;0", dur: "3s", repeatCount: "indefinite" },
  ]));
  skewer.transform.position = { x: 500, y: 580, z: 0 };
  skewer.transform.updateLocalMatrix();
  scene.add(skewer);

  const skewerLabel = new Node("skewer-lbl");
  skewerLabel.addComponent(createText("SkewX", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  skewerLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  skewerLabel.transform.position = { x: 500, y: 660, z: 0 };
  skewerLabel.transform.updateLocalMatrix();
  scene.add(skewerLabel);

  // 6. Combined: pulse + rotate
  const animCombo = new Node("anim-combo");
  animCombo.addComponent(createSphere(40));
  animCombo.addComponent(new Material({ fill: { r: 1, g: 0.3, b: 0.5 }, opacity: 0.9 }));
  animCombo.addComponent(new Animation([
    { type: "animate", attributeName: "r", values: "40;28;40", dur: "1s", repeatCount: "indefinite" },
    { type: "animateTransform", transformType: "rotate", from: "0", to: "360", dur: "6s", repeatCount: "indefinite" },
  ]));
  animCombo.transform.position = { x: 800, y: 580, z: 0 };
  animCombo.transform.updateLocalMatrix();
  scene.add(animCombo);

  const comboLabel = new Node("combo-lbl");
  comboLabel.addComponent(createText("Combined", { fontSize: 16, fontFamily: "sans-serif", textAnchor: "middle" }));
  comboLabel.addComponent(new Material({ fill: { r: 0.5, g: 0.5, b: 0.6 } }));
  comboLabel.transform.position = { x: 800, y: 660, z: 0 };
  comboLabel.transform.updateLocalMatrix();
  scene.add(comboLabel);

  // Subtitle
  const subtitle = new Node("subtitle");
  subtitle.addComponent(createText("Declarative <animate> & <animateTransform>", {
    fontSize: 18, fontFamily: "sans-serif", textAnchor: "middle",
  }));
  subtitle.addComponent(new Material({ fill: { r: 0.4, g: 0.4, b: 0.5 } }));
  subtitle.transform.position = { x: 500, y: 820, z: 0 };
  subtitle.transform.updateLocalMatrix();
  scene.add(subtitle);

  function animate() { }
  return { scene, animate };
}

// ── Interactive Demo ───────────────────────────────────────────────────

function createInteractiveDemo() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 60, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 2, z: 8 };
  scene.add(cam);
  addDefaultLighting(scene);

  const colors = [
    { r: 0.95, g: 0.26, b: 0.21 }, { r: 0.30, g: 0.69, b: 0.31 },
    { r: 0.13, g: 0.59, b: 0.95 }, { r: 1.00, g: 0.76, b: 0.03 },
    { r: 0.61, g: 0.15, b: 0.69 },
  ];
  const highlightColors = [
    { r: 1.00, g: 0.54, b: 0.50 }, { r: 0.56, g: 0.83, b: 0.56 },
    { r: 0.42, g: 0.74, b: 0.98 }, { r: 1.00, g: 0.88, b: 0.38 },
    { r: 0.78, g: 0.44, b: 0.84 },
  ];

  const entries: { node: Node; material: Material }[] = [];
  for (let i = 0; i < 5; i++) {
    const node = new Node(`object - ${i} `);
    if (i % 2 === 0) node.addComponent(createBox(1.2, 1.2, 1.2));
    else node.addComponent(createSphere(0.7, 24, 24));
    const material = new Material({ color: colors[i] });
    node.addComponent(material);
    node.addComponent(new Interactive({ cursor: "pointer" }));
    node.transform.position = { x: (i - 2) * 2.2, y: 0, z: 0 };
    node.transform.updateLocalMatrix();
    scene.add(node);
    node.on("pointerenter", () => { material.definition.color = highlightColors[i]; });
    node.on("pointerleave", () => { material.definition.color = colors[i]; });
    entries.push({ node, material });
  }

  const floor = new Node("floor");
  floor.addComponent(createBox(12, 0.1, 4));
  floor.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.22 } }));
  floor.transform.position = { x: 0, y: -1, z: 0 };
  floor.transform.updateLocalMatrix();
  scene.add(floor);

  function animate(time: number) {
    for (let i = 0; i < entries.length; i++) {
      const { node } = entries[i];
      const bob = Math.sin(time * 0.5 + i * 1.2) * 0.15;
      node.transform.position = { x: (i - 2) * 2.2, y: bob, z: 0 };
      const a = time * 0.5 + i * 0.3;
      node.transform.rotation = { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}

// ── Hover Showcase ────────────────────────────────────────────────────

function createHoverShowcase() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 1.5, z: 10 };
  scene.add(cam);
  addDefaultLighting(scene);

  const configs = [
    { shape: "box" as const, baseColor: { r: 0.18, g: 0.53, b: 0.87 }, hoverColor: { r: 0.40, g: 0.73, b: 1.00 } },
    { shape: "sphere" as const, baseColor: { r: 0.87, g: 0.36, b: 0.18 }, hoverColor: { r: 1.00, g: 0.56, b: 0.35 } },
    { shape: "box" as const, baseColor: { r: 0.18, g: 0.80, b: 0.44 }, hoverColor: { r: 0.40, g: 1.00, b: 0.65 } },
    { shape: "sphere" as const, baseColor: { r: 0.93, g: 0.69, b: 0.13 }, hoverColor: { r: 1.00, g: 0.85, b: 0.40 } },
    { shape: "box" as const, baseColor: { r: 0.69, g: 0.24, b: 0.85 }, hoverColor: { r: 0.85, g: 0.50, b: 1.00 } },
  ];

  const hoverEntries: { node: Node; material: Material; baseColor: { r: number; g: number; b: number }; hoverColor: { r: number; g: number; b: number } }[] = [];
  for (let i = 0; i < configs.length; i++) {
    const cfg = configs[i];
    const node = new Node(`hover - ${i} `);
    if (cfg.shape === "box") node.addComponent(createBox(1.2, 1.2, 1.2));
    else node.addComponent(createSphere(0.7, 24, 24));
    const material = new Material({ color: { ...cfg.baseColor } });
    node.addComponent(material);
    node.addComponent(new Interactive({ cursor: "pointer" }));
    node.transform.position = { x: (i - 2) * 2.5, y: 0, z: 0 };
    node.transform.updateLocalMatrix();
    scene.add(node);
    hoverEntries.push({ node, material, baseColor: cfg.baseColor, hoverColor: cfg.hoverColor });
  }

  const hoverFloor = new Node("floor");
  hoverFloor.addComponent(createBox(16, 0.08, 4));
  hoverFloor.addComponent(new Material({ color: { r: 0.12, g: 0.12, b: 0.16 } }));
  hoverFloor.transform.position = { x: 0, y: -1.2, z: 0 };
  hoverFloor.transform.updateLocalMatrix();
  scene.add(hoverFloor);

  for (let i = 0; i < configs.length; i++) {
    const indicator = new Node(`indicator - ${i} `);
    indicator.addComponent(createBox(1.8, 0.06, 0.06));
    indicator.addComponent(new Material({ color: configs[i].baseColor }));
    indicator.transform.position = { x: (i - 2) * 2.5, y: -1.1, z: 0.5 };
    indicator.transform.updateLocalMatrix();
    scene.add(indicator);
  }

  function animate(time: number) {
    for (let i = 0; i < hoverEntries.length; i++) {
      const { node, material, baseColor, hoverColor } = hoverEntries[i];
      const x = (i - 2) * 2.5;
      const cyclePhase = (time * 0.3 + i * 0.8) % 4;
      const t = cyclePhase < 1 ? cyclePhase : cyclePhase < 2 ? 2 - cyclePhase : 0;

      switch (i) {
        case 0:
          node.transform.position = { x, y: t * 1.2, z: 0 };
          node.transform.scale = { x: 1, y: 1, z: 1 };
          break;
        case 1: {
          const angle = time * 3 * t;
          node.transform.position = { x, y: 0, z: 0 };
          node.transform.rotation = { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
          node.transform.scale = { x: 1, y: 1, z: 1 };
          break;
        }
        case 2: {
          const s = 1 + t * 0.6;
          node.transform.position = { x, y: 0, z: 0 };
          node.transform.scale = { x: s, y: s, z: s };
          break;
        }
        case 3: {
          const bob = Math.sin(time * 2) * 0.1 * t;
          node.transform.position = { x, y: bob, z: 0 };
          node.transform.scale = { x: 1, y: 1, z: 1 };
          break;
        }
        case 4: {
          const pulse = 1 + Math.sin(time * 6) * 0.15 * t;
          node.transform.position = { x, y: 0, z: 0 };
          node.transform.scale = { x: pulse, y: pulse, z: pulse };
          break;
        }
      }

      material.definition.color = {
        r: baseColor.r + (hoverColor.r - baseColor.r) * t,
        g: baseColor.g + (hoverColor.g - baseColor.g) * t,
        b: baseColor.b + (hoverColor.b - baseColor.b) * t,
      };
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}

// ── Click Playground ──────────────────────────────────────────────────

function createClickPlayground() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 2, z: 12 };
  scene.add(cam);
  addDefaultLighting(scene);

  const counterNode = new Node("click-counter");
  counterNode.addComponent(createBox(1, 1, 1));
  counterNode.addComponent(new Material({ color: { r: 0.18, g: 0.53, b: 0.87 } }));
  counterNode.transform.position = { x: -5, y: 0, z: 0 };
  counterNode.transform.updateLocalMatrix();
  scene.add(counterNode);

  const toggleNode = new Node("toggle");
  toggleNode.addComponent(createSphere(0.7, 24, 24));
  const toggleMat = new Material({ color: { r: 0.4, g: 0.4, b: 0.4 } });
  toggleNode.addComponent(toggleMat);
  toggleNode.transform.position = { x: -2.5, y: 0, z: 0 };
  toggleNode.transform.updateLocalMatrix();
  scene.add(toggleNode);

  const pressNode = new Node("press-effect");
  pressNode.addComponent(createBox(1.4, 1.4, 1.4));
  pressNode.addComponent(new Material({ color: { r: 0.87, g: 0.36, b: 0.18 } }));
  pressNode.transform.position = { x: 0, y: 0, z: 0 };
  pressNode.transform.updateLocalMatrix();
  scene.add(pressNode);

  const CLICK_COLORS = [
    { r: 0.95, g: 0.26, b: 0.21 }, { r: 0.13, g: 0.59, b: 0.95 },
    { r: 0.18, g: 0.80, b: 0.44 }, { r: 0.93, g: 0.69, b: 0.13 },
    { r: 0.69, g: 0.24, b: 0.85 }, { r: 1.00, g: 0.42, b: 0.70 },
  ];
  const cyclerNode = new Node("color-cycler");
  cyclerNode.addComponent(createSphere(0.8, 32, 32));
  const cyclerMat = new Material({ color: { ...CLICK_COLORS[0] } });
  cyclerNode.addComponent(cyclerMat);
  cyclerNode.transform.position = { x: 2.5, y: 0, z: 0 };
  cyclerNode.transform.updateLocalMatrix();
  scene.add(cyclerNode);

  const hub = new Node("hub");
  hub.addComponent(createBox(0.5, 0.5, 0.5));
  hub.addComponent(new Material({ color: { r: 0.69, g: 0.24, b: 0.85 } }));
  hub.transform.position = { x: 5, y: 0, z: 0 };
  hub.transform.updateLocalMatrix();
  scene.add(hub);

  const orbitNodes: { node: Node; angle: number }[] = [];
  for (let j = 0; j < 6; j++) {
    const angle = (j / 6) * Math.PI * 2;
    const orbiter = new Node(`orbiter - ${j} `);
    orbiter.addComponent(createSphere(0.25, 16, 16));
    orbiter.addComponent(new Material({
      color: {
        r: 0.5 + 0.5 * Math.cos(angle),
        g: 0.5 + 0.5 * Math.cos(angle + 2.094),
        b: 0.5 + 0.5 * Math.cos(angle + 4.189),
      },
    }));
    scene.add(orbiter);
    orbitNodes.push({ node: orbiter, angle });
  }

  const clickFloor = new Node("floor");
  clickFloor.addComponent(createBox(14, 0.08, 4));
  clickFloor.addComponent(new Material({ color: { r: 0.12, g: 0.12, b: 0.16 } }));
  clickFloor.transform.position = { x: 0, y: -1.5, z: 0 };
  clickFloor.transform.updateLocalMatrix();
  scene.add(clickFloor);

  function animate(time: number) {
    const scaleT = 1 + Math.sin(time * 1.5) * 0.15;
    counterNode.transform.scale = { x: scaleT, y: scaleT, z: scaleT };
    const a1 = time * 0.5;
    counterNode.transform.rotation = { x: Math.sin(a1 * 0.3) * 0.1, y: Math.sin(a1 / 2), z: 0, w: Math.cos(a1 / 2) };
    counterNode.transform.updateLocalMatrix();

    const toggleY = Math.sin(time * 0.8) * 0.75;
    toggleNode.transform.position = { x: -2.5, y: toggleY, z: 0 };
    const tPhase = (Math.sin(time * 0.8) + 1) / 2;
    toggleMat.definition.color = { r: 0.4 + (0.18 - 0.4) * tPhase, g: 0.4 + (0.87 - 0.4) * tPhase, b: 0.4 + (0.44 - 0.4) * tPhase };
    if (toggleY > 0) {
      const a2 = time * 2;
      toggleNode.transform.rotation = { x: 0, y: Math.sin(a2 / 2), z: 0, w: Math.cos(a2 / 2) };
    } else {
      toggleNode.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
    }
    toggleNode.transform.updateLocalMatrix();

    const pressBreathe = 0.85 + Math.abs(Math.sin(time * 2.5)) * 0.15;
    pressNode.transform.scale = { x: pressBreathe, y: pressBreathe, z: pressBreathe };
    pressNode.transform.updateLocalMatrix();

    const colorIdx = Math.floor(time * 0.5) % CLICK_COLORS.length;
    const nextIdx = (colorIdx + 1) % CLICK_COLORS.length;
    const lerpT = (time * 0.5) % 1;
    cyclerMat.definition.color = {
      r: CLICK_COLORS[colorIdx].r + (CLICK_COLORS[nextIdx].r - CLICK_COLORS[colorIdx].r) * lerpT,
      g: CLICK_COLORS[colorIdx].g + (CLICK_COLORS[nextIdx].g - CLICK_COLORS[colorIdx].g) * lerpT,
      b: CLICK_COLORS[colorIdx].b + (CLICK_COLORS[nextIdx].b - CLICK_COLORS[colorIdx].b) * lerpT,
    };
    cyclerNode.transform.position = { x: 2.5, y: Math.sin(time * 1.5) * 0.15, z: 0 };
    cyclerNode.transform.updateLocalMatrix();

    const et = (Math.sin(time * 0.5) + 1) / 2;
    const hubAngle = time;
    hub.transform.rotation = { x: Math.sin(hubAngle * 0.3) * 0.2, y: Math.sin(hubAngle / 2), z: 0, w: Math.cos(hubAngle / 2) };
    hub.transform.updateLocalMatrix();
    for (let j = 0; j < orbitNodes.length; j++) {
      const { node, angle } = orbitNodes[j];
      const radius = et * 1.5;
      const spin = time * 1.5;
      node.transform.position = { x: 5 + Math.cos(angle + spin) * radius, y: Math.sin(angle + spin) * radius, z: Math.sin(angle * 2 + spin * 0.5) * radius * 0.3 };
      node.transform.updateLocalMatrix();
    }
  }

  return { scene, animate };
}

// ── Wheel & Bubbling ──────────────────────────────────────────────────

function createWheelAndBubbling() {
  const scene = new Scene();
  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 100 }));
  cam.transform.position = { x: 0, y: 3, z: 14 };
  scene.add(cam);
  addDefaultLighting(scene);

  const wheelConfigs = [
    { x: -4, color: { r: 0.18, g: 0.60, b: 0.95 }, shape: "box" as const },
    { x: -2, color: { r: 0.95, g: 0.44, b: 0.18 }, shape: "sphere" as const },
    { x: 0, color: { r: 0.18, g: 0.85, b: 0.55 }, shape: "box" as const },
  ];
  const wheelNodes: Node[] = [];
  for (const cfg of wheelConfigs) {
    const node = new Node(`wheel - obj - ${cfg.x} `);
    if (cfg.shape === "box") node.addComponent(createBox(1.2, 1.2, 1.2));
    else node.addComponent(createSphere(0.7, 24, 24));
    node.addComponent(new Material({ color: { ...cfg.color } }));
    node.transform.position = { x: cfg.x, y: 0, z: 0 };
    node.transform.updateLocalMatrix();
    scene.add(node);
    wheelNodes.push(node);
  }

  const wheelLabel = new Node("wheel-section-indicator");
  wheelLabel.addComponent(createBox(8, 0.04, 0.04));
  wheelLabel.addComponent(new Material({ color: { r: 0.3, g: 0.3, b: 0.5 } }));
  wheelLabel.transform.position = { x: -2, y: -1.8, z: 0 };
  wheelLabel.transform.updateLocalMatrix();
  scene.add(wheelLabel);

  const parentNode = new Node("bubbling-parent");
  parentNode.addComponent(createBox(3.5, 3.5, 0.3));
  parentNode.addComponent(new Material({ color: { r: 0.3, g: 0.3, b: 0.3 }, opacity: 0.4 }));
  parentNode.transform.position = { x: 4, y: 0.5, z: 0 };
  parentNode.transform.updateLocalMatrix();
  scene.add(parentNode);

  const childA = new Node("child-A");
  childA.addComponent(createSphere(0.45, 20, 20));
  childA.addComponent(new Material({ color: { r: 0.95, g: 0.55, b: 0.18 } }));
  childA.transform.position = { x: 3.2, y: 1.2, z: 0.3 };
  childA.transform.updateLocalMatrix();
  scene.add(childA);

  const childB = new Node("child-B");
  childB.addComponent(createBox(0.8, 0.8, 0.8));
  childB.addComponent(new Material({ color: { r: 0.60, g: 0.18, b: 0.95 } }));
  childB.transform.position = { x: 4.8, y: 1.2, z: 0.3 };
  childB.transform.updateLocalMatrix();
  scene.add(childB);

  const childC = new Node("child-C");
  childC.addComponent(createBox(0.6, 0.6, 0.6));
  childC.addComponent(new Material({ color: { r: 0.18, g: 0.87, b: 0.70 } }));
  childC.transform.position = { x: 4, y: -0.2, z: 0.3 };
  childC.transform.updateLocalMatrix();
  scene.add(childC);

  const trackerNode = new Node("pointer-tracker");
  trackerNode.addComponent(createBox(5, 3, 0.1));
  trackerNode.addComponent(new Material({ color: { r: 0.15, g: 0.15, b: 0.20 }, opacity: 0.6 }));
  trackerNode.transform.position = { x: -2, y: -3.5, z: 0 };
  trackerNode.transform.updateLocalMatrix();
  scene.add(trackerNode);

  const trackerDot = new Node("tracker-dot");
  trackerDot.addComponent(createSphere(0.15, 16, 16));
  trackerDot.addComponent(new Material({ color: { r: 1, g: 0.3, b: 0.5 } }));
  trackerDot.transform.position = { x: -2, y: -3.5, z: 0.15 };
  trackerDot.transform.updateLocalMatrix();
  scene.add(trackerDot);

  const wbFloor = new Node("floor");
  wbFloor.addComponent(createBox(16, 0.08, 4));
  wbFloor.addComponent(new Material({ color: { r: 0.10, g: 0.10, b: 0.14 } }));
  wbFloor.transform.position = { x: 0, y: -5.5, z: 0 };
  wbFloor.transform.updateLocalMatrix();
  scene.add(wbFloor);

  function animate(time: number) {
    for (let i = 0; i < wheelNodes.length; i++) {
      const s = 1 + Math.sin(time * 0.8 + i * 1.5) * 0.3;
      wheelNodes[i].transform.scale = { x: s, y: s, z: s };
      const a = time * 0.3;
      wheelNodes[i].transform.rotation = { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
      wheelNodes[i].transform.updateLocalMatrix();
    }
    parentNode.transform.position = { x: 4, y: 0.5 + Math.sin(time * 0.5) * 0.1, z: 0 };
    parentNode.transform.updateLocalMatrix();
    childA.transform.position = { x: 3.2, y: 1.2 + Math.sin(time * 0.5) * 0.1, z: 0.3 };
    childA.transform.updateLocalMatrix();
    childB.transform.position = { x: 4.8, y: 1.2 + Math.sin(time * 0.5) * 0.1, z: 0.3 };
    childB.transform.updateLocalMatrix();
    childC.transform.position = { x: 4, y: -0.2 + Math.sin(time * 0.5) * 0.1, z: 0.3 };
    childC.transform.updateLocalMatrix();

    const dotX = -2 + Math.sin(time * 0.7) * 2;
    const dotY = -3.5 + Math.cos(time * 0.9) * 1;
    trackerDot.transform.position = { x: dotX, y: dotY, z: 0.15 };
    const dotPulse = 0.15 + Math.sin(time * 4) * 0.03;
    const dotS = dotPulse / 0.15;
    trackerDot.transform.scale = { x: dotS, y: dotS, z: dotS };
    trackerDot.transform.updateLocalMatrix();
  }

  return { scene, animate };
}

// ── Camera Viewpoints ─────────────────────────────────────────────────

function createCameraViewpoints() {
  const scene = new Scene();
  const cvCamHeight = 5;
  const cvCamDistance = 14;
  const cvInnerCount = 6;
  const cvInnerRadius = 3.5;

  const cam = new Node("camera");
  cam.addComponent(new Camera({ type: CameraType.Perspective, fov: 55, aspect: 16 / 9, near: 0.1, far: 200 }));
  cam.transform.position = { x: 0, y: cvCamHeight, z: cvCamDistance };
  scene.add(cam);
  addDefaultLighting(scene);

  const groundBase = new Node("ground-base");
  groundBase.addComponent(createBox(24, 0.2, 24));
  groundBase.addComponent(new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } }));
  groundBase.transform.position = { x: 0, y: -1.1, z: 0 };
  scene.add(groundBase);

  const groundTop = new Node("ground-top");
  groundTop.addComponent(createBox(18, 0.15, 18));
  groundTop.addComponent(new Material({ color: { r: 0.14, g: 0.14, b: 0.19 } }));
  groundTop.transform.position = { x: 0, y: -0.95, z: 0 };
  scene.add(groundTop);

  const pedestalBase = new Node("pedestal-base");
  pedestalBase.addComponent(createBox(3.5, 0.3, 3.5));
  pedestalBase.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.28 } }));
  pedestalBase.transform.position = { x: 0, y: -0.7, z: 0 };
  scene.add(pedestalBase);

  const towerMain = new Node("tower-main");
  towerMain.addComponent(createBox(1.0, 4.5, 1.0));
  towerMain.addComponent(new Material({ color: { r: 0.85, g: 0.7, b: 0.35 } }));
  towerMain.transform.position = { x: 0, y: 1.95, z: 0 };
  scene.add(towerMain);

  for (let i = 0; i < 3; i++) {
    const ring = new Node(`tower - ring - ${i} `);
    const size = 1.5 - i * 0.15;
    ring.addComponent(createBox(size, 0.12, size));
    ring.addComponent(new Material({ color: { r: 0.95, g: 0.8, b: 0.4 } }));
    ring.transform.position = { x: 0, y: 0.5 + i * 1.6, z: 0 };
    scene.add(ring);
  }

  const crown = new Node("tower-crown");
  crown.addComponent(createSphere(0.45, 24, 24));
  crown.addComponent(new Material({ color: { r: 1.0, g: 0.85, b: 0.25 } }));
  crown.transform.position = { x: 0, y: 4.5, z: 0 };
  scene.add(crown);

  const pillarPositions = [{ x: -5, z: -5 }, { x: 5, z: -5 }, { x: -5, z: 5 }, { x: 5, z: 5 }];
  const pillarColors = [
    { r: 0.75, g: 0.2, b: 0.25 }, { r: 0.2, g: 0.55, b: 0.85 },
    { r: 0.2, g: 0.75, b: 0.4 }, { r: 0.7, g: 0.3, b: 0.8 },
  ];
  for (let i = 0; i < 4; i++) {
    const pos = pillarPositions[i];
    const height = 2.5 + (i % 2) * 1.0;
    const base = new Node(`pillar - base - ${i} `);
    base.addComponent(createBox(1.2, 0.2, 1.2));
    base.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.24 } }));
    base.transform.position = { x: pos.x, y: -0.8, z: pos.z };
    scene.add(base);
    const pillar = new Node(`pillar - ${i} `);
    pillar.addComponent(createBox(0.5, height, 0.5));
    pillar.addComponent(new Material({ color: pillarColors[i] }));
    pillar.transform.position = { x: pos.x, y: height / 2 - 0.7, z: pos.z };
    scene.add(pillar);
    const sphere = new Node(`pillar - sphere - ${i} `);
    sphere.addComponent(createSphere(0.4, 20, 20));
    sphere.addComponent(new Material({ color: { r: Math.min(1, pillarColors[i].r + 0.2), g: Math.min(1, pillarColors[i].g + 0.2), b: Math.min(1, pillarColors[i].b + 0.2) } }));
    sphere.transform.position = { x: pos.x, y: height - 0.1, z: pos.z };
    scene.add(sphere);
  }

  const ringCount = 12;
  const ringRadius = 8;
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2;
    const obj = new Node(`ring - ${i} `);
    if (i % 3 === 0) obj.addComponent(createBox(0.35, 1.8, 0.35));
    else if (i % 3 === 1) obj.addComponent(createSphere(0.4, 16, 16));
    else obj.addComponent(createBox(0.8, 0.3, 0.8));
    const hue = i / ringCount;
    obj.addComponent(new Material({ color: { r: 0.4 + Math.sin(hue * Math.PI * 2) * 0.35, g: 0.4 + Math.sin(hue * Math.PI * 2 + 2.09) * 0.35, b: 0.4 + Math.sin(hue * Math.PI * 2 + 4.19) * 0.35 } }));
    obj.transform.position = { x: Math.cos(angle) * ringRadius, y: -0.2, z: Math.sin(angle) * ringRadius };
    scene.add(obj);
  }

  for (let i = 0; i < cvInnerCount; i++) {
    const angle = (i / cvInnerCount) * Math.PI * 2 + 0.3;
    const s = new Node(`float - ${i} `);
    s.addComponent(createSphere(0.25, 14, 14));
    s.addComponent(new Material({ color: { r: 0.6 + i * 0.06, g: 0.7 - i * 0.05, b: 0.95 } }));
    s.transform.position = { x: Math.cos(angle) * cvInnerRadius, y: 2.5, z: Math.sin(angle) * cvInnerRadius };
    scene.add(s);
  }

  function animate(time: number) {
    const angle = time * 0.4;
    cam.transform.position = { x: Math.sin(angle) * cvCamDistance, y: cvCamHeight + Math.sin(time * 0.16) * 2, z: Math.cos(angle) * cvCamDistance };
    cam.transform.updateLocalMatrix();
    crown.transform.position.y = 4.5 + Math.sin(time * 1.5) * 0.15;
    crown.transform.updateLocalMatrix();
    scene.traverse((node) => {
      if (node.name.startsWith("float-")) {
        const idx = parseInt(node.name.split("-")[1], 10);
        const baseAngle = (idx / cvInnerCount) * Math.PI * 2 + 0.3;
        const orbAngle = baseAngle + time * 0.3;
        node.transform.position = { x: Math.cos(orbAngle) * cvInnerRadius, y: 2.5 + Math.sin(time * 1.2 + idx) * 0.5, z: Math.sin(orbAngle) * cvInnerRadius };
        node.transform.updateLocalMatrix();
      }
      if (node.name.startsWith("ring-")) {
        const idx = parseInt(node.name.split("-")[1], 10);
        node.transform.position.y = -0.2 + Math.sin(time * 0.8 + idx * 0.52) * 0.3;
        const a = time * 0.4 + idx * 0.5;
        node.transform.rotation = { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) };
        node.transform.updateLocalMatrix();
      }
      if (node.name.startsWith("pillar-sphere-")) {
        const idx = parseInt(node.name.split("-")[2], 10);
        const baseHeight = 2.5 + (idx % 2) * 1.0;
        node.transform.position.y = baseHeight - 0.1 + Math.sin(time + idx * 1.5) * 0.2;
        node.transform.updateLocalMatrix();
      }
    });
  }

  return { scene, animate };
}

// ── SVG Showcase ──────────────────────────────────────────────────────

function svgShowcaseStarPath(cx: number, cy: number, points: number, outerR: number, innerR: number): Path2DCommand[] {
  const cmds: Path2DCommand[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    cmds.push({ command: i === 0 ? "M" : "L", args: [Math.round((cx + Math.cos(angle) * r) * 10) / 10, Math.round((cy + Math.sin(angle) * r) * 10) / 10] });
  }
  cmds.push({ command: "Z", args: [] });
  return cmds;
}

function createSvgShowcase() {
  const scene = new Scene();
  const accent = { r: 0.29, g: 0.48, b: 1.0 };

  const cam = new Node("cam");
  cam.addComponent(new Camera({ type: CameraType.Orthographic, left: 0, right: 800, top: 0, bottom: 600, near: 0.1, far: 100 }));
  scene.add(cam);

  const scTitle = new Node("title");
  scTitle.addComponent(createText("SVG Showcase", { fontSize: 32, fontFamily: "system-ui, sans-serif", fontWeight: "bold", textAnchor: "middle" }));
  scTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  scTitle.transform.position = { x: 400, y: 40, z: 0 };
  scTitle.transform.updateLocalMatrix();
  scene.add(scTitle);

  const gradRect = new Node("gradient-rect");
  gradRect.addComponent(createBox(200, 120, 0));
  gradRect.addComponent(new Material({ fillGradient: { type: "linear" as const, x1: 0, y1: 0, x2: 1, y2: 1, stops: [{ offset: 0, color: accent }, { offset: 0.5, color: { r: 1, g: 1, b: 1 } }, { offset: 1, color: { r: accent.r * 0.4, g: accent.g * 0.4, b: accent.b * 0.8 } }] }, stroke: { r: 0.3, g: 0.3, b: 0.4 }, strokeWidth: 2 }));
  gradRect.transform.position = { x: 140, y: 160, z: 0 };
  gradRect.transform.updateLocalMatrix();
  scene.add(gradRect);

  function addLbl(text: string, x: number, y: number) {
    const l = new Node(`lbl - ${x} -${y} `);
    l.addComponent(createText(text, { fontSize: 14, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
    l.addComponent(new Material({ fill: { r: 0.6, g: 0.6, b: 0.7 } }));
    l.transform.position = { x, y, z: 0 };
    l.transform.updateLocalMatrix();
    scene.add(l);
  }
  addLbl("Gradient", 140, 240);

  const blurCircle = new Node("blur-circle");
  blurCircle.addComponent(createSphere(55));
  blurCircle.addComponent(new Material({ fill: { r: 0.4, g: 0.8, b: 1.0 }, filter: { effects: [{ type: "blur", stdDeviation: 3 }] } }));
  blurCircle.transform.position = { x: 400, y: 160, z: 0 };
  blurCircle.transform.updateLocalMatrix();
  scene.add(blurCircle);
  addLbl("Blur (3px)", 400, 240);

  const shadowBox = new Node("shadow-box");
  shadowBox.addComponent(createBox(150, 100, 0));
  shadowBox.addComponent(new Material({ fill: { r: 1.0, g: 0.6, b: 0.2 }, filter: { effects: [{ type: "dropShadow", dx: 4, dy: 4, stdDeviation: 3, floodColor: { r: 0, g: 0, b: 0 }, floodOpacity: 0.5 }] } }));
  shadowBox.transform.position = { x: 660, y: 160, z: 0 };
  shadowBox.transform.updateLocalMatrix();
  scene.add(shadowBox);
  addLbl("Drop Shadow", 660, 240);

  const clippedCircle = new Node("clipped-circle");
  clippedCircle.addComponent(createSphere(65));
  clippedCircle.addComponent(new Material({ fillGradient: { type: "radial", cx: 0.4, cy: 0.4, r: 0.6, stops: [{ offset: 0, color: { r: 1, g: 1, b: 0.3 } }, { offset: 1, color: { r: 1, g: 0.4, b: 0 } }] }, clipPath: { path: svgShowcaseStarPath(0, 0, 5, 70, 30) } }));
  clippedCircle.transform.position = { x: 140, y: 400, z: 0 };
  clippedCircle.transform.updateLocalMatrix();
  scene.add(clippedCircle);
  addLbl("Clip-Path", 140, 490);

  const maskedRect = new Node("masked-rect");
  maskedRect.addComponent(createBox(150, 120, 0));
  maskedRect.addComponent(new Material({ fillGradient: { type: "linear", x1: 0, y1: 0, x2: 1, y2: 0, stops: [{ offset: 0, color: { r: 0.9, g: 0.1, b: 0.5 } }, { offset: 1, color: { r: 0.2, g: 0.1, b: 0.9 } }] }, mask: { path: [{ command: "M" as const, args: [-75, -60] }, { command: "L" as const, args: [75, -60] }, { command: "L" as const, args: [75, 60] }, { command: "L" as const, args: [-75, 60] }, { command: "Z" as const, args: [] }, { command: "M" as const, args: [0, -40] }, { command: "L" as const, args: [40, 0] }, { command: "L" as const, args: [0, 40] }, { command: "L" as const, args: [-40, 0] }, { command: "Z" as const, args: [] }], fill: { r: 1, g: 1, b: 1 }, opacity: 0.9 } }));
  maskedRect.transform.position = { x: 400, y: 400, z: 0 };
  maskedRect.transform.updateLocalMatrix();
  scene.add(maskedRect);
  addLbl("Mask", 400, 490);

  const bezier = new Node("bezier");
  bezier.addComponent(createPath2D([{ command: "M", args: [580, 340] }, { command: "C", args: [580, 280, 740, 280, 740, 340] }, { command: "C", args: [740, 400, 580, 460, 580, 460] }, { command: "C", args: [580, 460, 740, 400, 740, 460] }]));
  bezier.addComponent(new Material({ stroke: { r: 0.5, g: 1.0, b: 0.6 }, strokeWidth: 3 }));
  scene.add(bezier);
  addLbl("Bézier Path", 660, 490);

  const gradLine = new Node("gradient-line");
  gradLine.addComponent(createPath2D([{ command: "M", args: [60, 540] }, { command: "L", args: [740, 540] }]));
  gradLine.addComponent(new Material({ strokeGradient: { type: "linear", x1: 0, y1: 0.5, x2: 1, y2: 0.5, stops: [{ offset: 0, color: { r: 1, g: 0, b: 0 } }, { offset: 0.25, color: { r: 1, g: 1, b: 0 } }, { offset: 0.5, color: { r: 0, g: 1, b: 0 } }, { offset: 0.75, color: { r: 0, g: 1, b: 1 } }, { offset: 1, color: { r: 0.5, g: 0, b: 1 } }] }, strokeWidth: 4 }));
  scene.add(gradLine);
  addLbl("Stroke Gradient", 400, 570);

  function animate() { }
  return { scene, animate };
}

// ── SVG Animations ────────────────────────────────────────────────────

function svgAnimStarPath(cx: number, cy: number, points: number, outerR: number, innerR: number): Path2DCommand[] {
  const cmds: Path2DCommand[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    cmds.push({ command: i === 0 ? "M" : "L", args: [Math.round((cx + Math.cos(angle) * r) * 10) / 10, Math.round((cy + Math.sin(angle) * r) * 10) / 10] });
  }
  cmds.push({ command: "Z", args: [] });
  return cmds;
}

function svgAnimLabel(scene: Scene, text: string, x: number, y: number) {
  const label = new Node(`lbl - ${x} -${y} `);
  label.addComponent(createText(text, { fontSize: 13, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
  label.addComponent(new Material({ fill: { r: 0.55, g: 0.55, b: 0.65 } }));
  label.transform.position = { x, y, z: 0 };
  label.transform.updateLocalMatrix();
  scene.add(label);
}

function createSvgAnimations() {
  const scene = new Scene();
  const dur = "2s";

  const cam = new Node("cam");
  cam.addComponent(new Camera({ type: CameraType.Orthographic, left: 0, right: 800, top: 0, bottom: 600, near: 0.1, far: 100 }));
  scene.add(cam);

  const anTitle = new Node("title");
  anTitle.addComponent(createText("SVG Animations", { fontSize: 30, fontFamily: "system-ui, sans-serif", fontWeight: "bold", textAnchor: "middle" }));
  anTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  anTitle.transform.position = { x: 400, y: 40, z: 0 };
  anTitle.transform.updateLocalMatrix();
  scene.add(anTitle);

  const pulse = new Node("pulse");
  pulse.addComponent(createSphere(45));
  pulse.addComponent(new Material({ fillGradient: { type: "radial", cx: 0.4, cy: 0.4, r: 0.6, stops: [{ offset: 0, color: { r: 1, g: 0.3, b: 0.3 } }, { offset: 1, color: { r: 0.8, g: 0, b: 0 } }] } }));
  pulse.addComponent(new Animation([{ type: "animate", attributeName: "opacity", values: "1;0.2;1", dur, repeatCount: "indefinite" }]));
  pulse.transform.position = { x: 130, y: 160, z: 0 };
  pulse.transform.updateLocalMatrix();
  scene.add(pulse);
  svgAnimLabel(scene, "Pulse", 130, 230);

  const spinner = new Node("spinner");
  spinner.addComponent(createBox(70, 70, 0));
  spinner.addComponent(new Material({ fill: { r: 0.3, g: 0.6, b: 1.0 }, stroke: { r: 0.1, g: 0.3, b: 0.8 }, strokeWidth: 2 }));
  spinner.addComponent(new Animation([{ type: "animateTransform", transformType: "rotate", from: "0 0 0", to: "360 0 0", dur, repeatCount: "indefinite" }]));
  spinner.transform.position = { x: 400, y: 160, z: 0 };
  spinner.transform.updateLocalMatrix();
  scene.add(spinner);
  svgAnimLabel(scene, "Rotate", 400, 230);

  const diamond = new Node("diamond");
  diamond.addComponent(createPath2D([{ command: "M", args: [0, -40] }, { command: "L", args: [40, 0] }, { command: "L", args: [0, 40] }, { command: "L", args: [-40, 0] }, { command: "Z", args: [] }]));
  diamond.addComponent(new Material({ fill: { r: 0.2, g: 0.9, b: 0.5 }, stroke: { r: 0, g: 0.5, b: 0.2 }, strokeWidth: 2 }));
  diamond.addComponent(new Animation([{ type: "animateTransform", transformType: "scale", values: "1;1.4;1", dur, repeatCount: "indefinite" }]));
  diamond.transform.position = { x: 670, y: 160, z: 0 };
  diamond.transform.updateLocalMatrix();
  scene.add(diamond);
  svgAnimLabel(scene, "Scale", 670, 230);

  const colorBox = new Node("color-cycle");
  colorBox.addComponent(createBox(120, 80, 0));
  colorBox.addComponent(new Material({ fill: { r: 1, g: 0, b: 0 } }));
  colorBox.addComponent(new Animation([{ type: "animate", attributeName: "fill", values: "rgb(255,0,0);rgb(0,255,0);rgb(0,0,255);rgb(255,0,0)", dur, repeatCount: "indefinite" }]));
  colorBox.transform.position = { x: 130, y: 380, z: 0 };
  colorBox.transform.updateLocalMatrix();
  scene.add(colorBox);
  svgAnimLabel(scene, "Color Cycle", 130, 445);

  const bouncer = new Node("bouncer");
  bouncer.addComponent(createSphere(25));
  bouncer.addComponent(new Material({ fill: { r: 1, g: 0.8, b: 0.1 } }));
  bouncer.addComponent(new Animation([{ type: "animate", attributeName: "cy", values: "-40;40;-40", dur, repeatCount: "indefinite", calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.42 0 0.58 1;0.42 0 0.58 1" }]));
  bouncer.transform.position = { x: 400, y: 380, z: 0 };
  bouncer.transform.updateLocalMatrix();
  scene.add(bouncer);
  svgAnimLabel(scene, "Bounce", 400, 445);

  const combinedStar = new Node("combined-star");
  combinedStar.addComponent(createPath2D(svgAnimStarPath(0, 0, 6, 45, 20)));
  combinedStar.addComponent(new Material({ fillGradient: { type: "linear", x1: 0, y1: 0, x2: 1, y2: 1, stops: [{ offset: 0, color: { r: 1, g: 0.5, b: 0 } }, { offset: 1, color: { r: 1, g: 0, b: 0.5 } }] } }));
  combinedStar.addComponent(new Animation([
    { type: "animateTransform", transformType: "rotate", from: "0 0 0", to: "360 0 0", dur: "2s", repeatCount: "indefinite" },
    { type: "animate", attributeName: "opacity", values: "1;0.4;1", dur, repeatCount: "indefinite" },
  ]));
  combinedStar.transform.position = { x: 670, y: 380, z: 0 };
  combinedStar.transform.updateLocalMatrix();
  scene.add(combinedStar);
  svgAnimLabel(scene, "Combined", 670, 445);

  const footer = new Node("footer");
  footer.addComponent(createText("All animations are declarative SVG — no JavaScript loop needed.", { fontSize: 13, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
  footer.addComponent(new Material({ fill: { r: 0.4, g: 0.4, b: 0.5 } }));
  footer.transform.position = { x: 400, y: 560, z: 0 };
  footer.transform.updateLocalMatrix();
  scene.add(footer);

  function animate() { }
  return { scene, animate };
}

// ── SVG Interactive ───────────────────────────────────────────────────

function createSvgInteractive() {
  const scene = new Scene();
  const cols = 5;
  const rows = 3;

  const cam = new Node("cam");
  cam.addComponent(new Camera({ type: CameraType.Orthographic, left: 0, right: 800, top: 0, bottom: 600, near: 0.1, far: 100 }));
  scene.add(cam);

  const siTitle = new Node("title");
  siTitle.addComponent(createText("SVG Interactive", { fontSize: 28, fontFamily: "system-ui, sans-serif", fontWeight: "bold", textAnchor: "middle" }));
  siTitle.addComponent(new Material({ fill: { r: 0.9, g: 0.9, b: 0.95 } }));
  siTitle.transform.position = { x: 400, y: 36, z: 0 };
  siTitle.transform.updateLocalMatrix();
  scene.add(siTitle);

  const siSubtitle = new Node("subtitle");
  siSubtitle.addComponent(createText("Interactive shapes with click & hover events", { fontSize: 12, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
  siSubtitle.addComponent(new Material({ fill: { r: 0.45, g: 0.45, b: 0.55 } }));
  siSubtitle.transform.position = { x: 400, y: 60, z: 0 };
  siSubtitle.transform.updateLocalMatrix();
  scene.add(siSubtitle);

  const SI_PALETTE = [
    { r: 0.95, g: 0.3, b: 0.3 }, { r: 0.3, g: 0.65, b: 1.0 },
    { r: 0.2, g: 0.85, b: 0.5 }, { r: 1.0, g: 0.75, b: 0.15 },
    { r: 0.7, g: 0.3, b: 0.9 }, { r: 1.0, g: 0.5, b: 0.2 },
    { r: 0.3, g: 0.9, b: 0.9 }, { r: 0.9, g: 0.4, b: 0.7 },
  ];
  const paddingX = 80;
  const paddingTop = 90;
  const availW = 800 - paddingX * 2;
  const availH = 600 - paddingTop - 80;
  const cellW = availW / cols;
  const cellH = availH / rows;
  const shapeSize = Math.min(cellW, cellH) * 0.55;
  const shapes = ["circle", "rect", "diamond", "star"];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const cx = paddingX + cellW * (c + 0.5);
      const cy = paddingTop + cellH * (r + 0.5);
      const color = SI_PALETTE[idx % SI_PALETTE.length];
      const shapeType = shapes[idx % shapes.length];
      const node = new Node(`tile - ${r} -${c} `);
      switch (shapeType) {
        case "circle": node.addComponent(createSphere(shapeSize * 0.45)); break;
        case "rect": node.addComponent(createBox(shapeSize * 0.85, shapeSize * 0.65, 0)); break;
        case "diamond": node.addComponent(createPath2D([{ command: "M", args: [0, -shapeSize * 0.45] }, { command: "L", args: [shapeSize * 0.45, 0] }, { command: "L", args: [0, shapeSize * 0.45] }, { command: "L", args: [-shapeSize * 0.45, 0] }, { command: "Z", args: [] }])); break;
        case "star": node.addComponent(createPath2D(svgAnimStarPath(0, 0, 5, shapeSize * 0.45, shapeSize * 0.2))); break;
      }
      node.addComponent(new Material({ fill: color, stroke: { r: color.r * 0.6, g: color.g * 0.6, b: color.b * 0.6 }, strokeWidth: 2 }));
      node.addComponent(new Interactive({ cursor: "pointer" }));
      node.transform.position = { x: cx, y: cy, z: 0 };
      node.transform.updateLocalMatrix();
      scene.add(node);
    }
  }

  const statusText = new Node("status");
  statusText.addComponent(createText("Click on any shape to interact", { fontSize: 16, fontFamily: "system-ui, sans-serif", textAnchor: "middle", fontWeight: "bold" }));
  statusText.addComponent(new Material({ fill: { r: 0.6, g: 0.8, b: 1.0 } }));
  statusText.transform.position = { x: 400, y: 560, z: 0 };
  statusText.transform.updateLocalMatrix();
  scene.add(statusText);

  function animate() { }
  return { scene, animate };
}

// ── Nested Transforms ─────────────────────────────────────────────────

function createNestedTransforms() {
  const scene = new Scene();
  const ntDepth = 3;

  const ntCam = new Node("camera");
  ntCam.addComponent(new Camera({ type: CameraType.Orthographic, left: -10, right: 10, top: -10, bottom: 10, near: 0.1, far: 100 }));
  ntCam.transform.position = { x: 0, y: 0, z: 5 };
  scene.add(ntCam);

  const ntColors = [
    { r: 0.9, g: 0.3, b: 0.3 }, { r: 0.3, g: 0.7, b: 0.9 },
    { r: 0.3, g: 0.9, b: 0.4 }, { r: 0.9, g: 0.7, b: 0.2 },
    { r: 0.8, g: 0.3, b: 0.8 },
  ];

  let currentParent: Node = scene.root;
  const ntNodes: Node[] = [];
  for (let i = 0; i < ntDepth; i++) {
    const size = 2 - i * 0.3;
    const offset = 3 - i * 0.5;
    const node = new Node(`level - ${i} `);
    node.addComponent(createBox(size, size, 0.1));
    node.addComponent(new Material({ fill: ntColors[i % ntColors.length], stroke: { r: 0.1, g: 0.1, b: 0.1 }, strokeWidth: 0.1, opacity: 0.8 }));
    node.transform.position = { x: offset, y: 0, z: 0 };
    currentParent.add(node);
    ntNodes.push(node);
    currentParent = node;
    const pivot = new Node(`pivot - ${i} `);
    pivot.addComponent(createSphere(0.2, 12, 12));
    pivot.addComponent(new Material({ fill: { r: 0.2, g: 0.2, b: 0.2 }, opacity: 0.9 }));
    node.add(pivot);
  }

  function animate(time: number) {
    ntNodes.forEach((node, i) => {
      const rotationSpeed = 0.5 * (1 + i * 0.3);
      const angle = time * rotationSpeed + i * Math.PI / 4;
      node.transform.rotation = { x: 0, y: 0, z: Math.sin(angle / 2), w: Math.cos(angle / 2) };
      node.transform.updateLocalMatrix();
    });
  }

  return { scene, animate };
}

// ── SvJs Generative ───────────────────────────────────────────────────

function createSvJsGenerative() {
  const svgSize = 1000;
  const iterations = 50;
  const baseHue = 180;
  const baseRotation = 45;

  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });
  svg.rect(svgSize, svgSize, 0, 0).fill("#181818");

  for (let i = 0; i < iterations; i++) {
    const center = 500;
    const radiusX = 100 + i * 3;
    const radiusY = 300 + i * 2;
    const rotation = baseRotation + i * 2;
    let hue = baseHue < 180 ? baseHue + i * 3 : baseHue - i * 3;
    hue = hue % 360;
    svg.ellipse(radiusX, radiusY, center, center)
      .fill("none")
      .stroke(`hsl(${hue} 80% 80% / 0.6)`)
      .rotate(rotation, center, center);
  }

  return { scene: svg, animate: () => { } };
}

// ── Export all examples ────────────────────────────────────────────────

export const EXAMPLES: ExampleDef[] = [
  {
    id: "gltf-animation",
    title: "glTF Animation",
    description: "Carga de modelo .glb (BoxAnimated) y reproducción de animaciones usando AnimationMixer.",
    category: "3d",
    factory: createGLTFDemo,
  },

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
  {
    id: "pbr-showcase",
    title: "PBR Material Showcase",
    description:
      "Esferas y cubos con materiales PBR variando metalness, roughness y emissive. Demuestra las nuevas propiedades de Material para renderizado físico.",
    category: "3d",
    factory: createPBRShowcase,
  },
  {
    id: "ortho-demo",
    title: "Orthographic Camera",
    description:
      "Vista ortográfica isométrica de una grilla de torres animadas. Demuestra CameraType.Orthographic con perspectiva sin distorsión.",
    category: "3d",
    factory: createOrthoDemo,
  },
  {
    id: "interactive-cubes",
    title: "Interactive Cubes",
    description:
      "Grilla 3x3 de cubos interactivos con componente Interactive y cursor pointer. Demuestra EventEmitter, Interactive y raycasting.",
    category: "3d",
    factory: createInteractiveCubes,
  },
  {
    id: "interpolation-comparison",
    title: "Interpolation Modes",
    description:
      "Tres esferas animadas con AnimationMixer usando Linear, Step y CubicSpline. Compara visualmente los modos de interpolación de KeyframeTrack.",
    category: "3d",
    factory: createInterpolationComparison,
  },
  {
    id: "filter-showcase",
    title: "SVG Filters",
    description:
      "Filtros SVG declarativos: Gaussian Blur progresivo y Drop Shadow con variaciones. Demuestra Material.filter con blur y dropShadow.",
    category: "svg",
    factory: createFilterShowcase,
  },
  {
    id: "clip-mask-demo",
    title: "Clip-Path & Mask",
    description:
      "Formas con clip-path (diamante, estrella) y mask (círculo, opacidad). Demuestra SvgClipPathDef y SvgMaskDef en Material.",
    category: "svg",
    factory: createClipMaskDemo,
  },
  {
    id: "svg-animation",
    title: "SVG Native Animation",
    description:
      "Animaciones SVG nativas con <animate> y <animateTransform>: pulse, rotate, scale, translate, skewX y combinadas.",
    category: "svg",
    factory: createSvgAnimationShowcase,
  },
  {
    id: "interactive-demo",
    title: "Interactive Demo",
    description:
      "Objetos interactivos con click, hover, cambio de color y animación. Demuestra el sistema de eventos e Interactive component.",
    category: "3d",
    factory: createInteractiveDemo,
  },
  {
    id: "hover-showcase",
    title: "Hover Showcase",
    description:
      "5 efectos hover distintos: levitar, girar, crecer, cambio de color y pulsar. Cada objeto usa un cursor CSS diferente.",
    category: "3d",
    factory: createHoverShowcase,
  },
  {
    id: "click-playground",
    title: "Click Playground",
    description:
      "Click counter, toggle on/off, efecto de presión, ciclo de colores y explosión/reagrupación. Demuestra click, pointerdown y pointerup.",
    category: "3d",
    factory: createClickPlayground,
  },
  {
    id: "wheel-bubbling",
    title: "Wheel & Bubbling",
    description:
      "Rueda del mouse para escalar objetos, event bubbling padre→hijo con stopPropagation(), y pointer tracking con pointermove.",
    category: "3d",
    factory: createWheelAndBubbling,
  },
  {
    id: "camera-viewpoints",
    title: "Camera Viewpoints",
    description:
      "Múltiples puntos de vista (orbital, frontal, cenital, lateral) sobre una escena con pilares y esferas. Demuestra posicionamiento y animación de cámaras.",
    category: "3d",
    factory: createCameraViewpoints,
  },
  {
    id: "svg-showcase",
    title: "SVG Showcase",
    description:
      "Catálogo visual de capacidades SVG: gradientes lineales/radiales, filtros (blur, drop-shadow), clip-path, mask, paths Bézier y stroke gradient.",
    category: "svg",
    factory: createSvgShowcase,
  },
  {
    id: "svg-animations",
    title: "SVG Animations",
    description:
      "Animaciones SVG nativas declarativas sin JavaScript: pulse (opacity), rotate, scale, color cycle, bounce (translate) y combinadas.",
    category: "svg",
    factory: createSvgAnimations,
  },
  {
    id: "svg-interactive",
    title: "SVG Interactive",
    description:
      "Grilla de figuras SVG interactivas con eventos click y hover. Usa renderToSVGElement con el componente Interactive para event delegation.",
    category: "svg",
    factory: createSvgInteractive,
  },
  {
    id: "nested-transforms",
    title: "Nested Transforms",
    description:
      "Jerarquía de transformaciones anidadas (parent → child → grandchild). Verifica que localMatrix + grupos SVG componen correctamente.",
    category: "svg",
    factory: createNestedTransforms,
  },
  {
    id: "svjs-generative",
    title: "Generative Native",
    description:
      "Arte generativo usando el wrapper nativo SvJs con elipses, control de iteraciones, hue y rotación.",
    category: "svjs",
    factory: createSvJsGenerative,
  },
  {
    id: "textures",
    title: "Textures & Environment",
    description: "PBR materials with textures (maps for diffuse, normal, roughness, metalness) and environment settings (fog, background).",
    category: "3d",
    factory: createTexturesScene,
  },
  {
    id: "look-at",
    title: "Transform: LookAt",
    description: "Demonstrates the lookAt() method. Watcher objects track a moving target in real-time.",
    category: "3d",
    factory: createLookAtScene,
  },
  {
    id: "physics-demo",
    title: "Physics: Jenga",
    description: "Simulation using Rapier physics engine. Dynamic cubes falling on a static floor with full collision detection.",
    category: "3d",
    factory: createPhysicsScene,
  },
  {
    id: "instancing-demo",
    title: "Performance: Instancing",
    description: "Renders 2000 dynamic cubes using InstancedMesh. Demonstrates high-performance rendering with matrix and color updates.",
    category: "3d",
    factory: createInstancingScene,
  },
  {
    id: "shadows-demo",
    title: "Lighting: Shadows",
    description: "Directional light casting shadows from a sphere and cube onto a plane. Demonstrates shadow map support.",
    category: "3d",
    factory: createShadowsScene,
  },
  {
    id: "neon-city-demo",
    title: "Post-FX: Neon City",
    description: "Cyberpunk-style scene demonstrating Bloom and Tone Mapping post-processing effects on emissive materials.",
    category: "3d",
    factory: createNeonCityScene,
  },
  {
    id: "fire-smoke-demo",
    title: "Particles: Fire & Smoke",
    description: "Particle system demonstration showing cpu-simulated fire and smoke effects.",
    category: "3d",
    factory: createFireSmokeScene,
  },
  {
    id: "audio-demo",
    title: "Spatial Audio",
    description: "3D positional audio. Wear headphones! The green cube emits sound as it orbits.",
    category: "3d",
    factory: createAudioScene,
  },
  {
    id: "physics-demo",
    title: "Physics: Falling Cubes",
    description: "Cannon-es physics integration (RigidBody + Collider).",
    category: "3d",
    factory: createPhysicsScene,
  },
  {
    id: "animation-demo",
    title: "Animation: Bouncing Box",
    description: "Basic animation demo using Animator component and manual updates.",
    category: "3d",
    factory: createAnimationScene,
  },
];
