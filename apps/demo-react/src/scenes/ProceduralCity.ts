import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const proceduralCityControls: ControlDef[] = [
  { type: 'slider', key: 'gridSize', label: 'Tamaño ciudad', min: 3, max: 8, step: 1, defaultValue: 5, rebuild: true },
  { type: 'slider', key: 'maxHeight', label: 'Altura máxima', min: 3, max: 20, step: 0.5, defaultValue: 10, rebuild: true },
  { type: 'slider', key: 'density', label: 'Densidad', min: 1, max: 6, step: 1, defaultValue: 3, rebuild: true },
  { type: 'slider', key: 'orbitSpeed', label: 'Velocidad cámara', min: 0, max: 1, step: 0.02, defaultValue: 0.25 },
  {
    type: 'select', key: 'style', label: 'Estilo', defaultValue: 'modern', rebuild: true,
    options: [
      { value: 'modern', label: 'Moderno' },
      { value: 'sunset', label: 'Atardecer' },
      { value: 'neon', label: 'Neón' },
    ],
  },
];

// Seeded random for consistent layouts within a rebuild
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface ColorStyle {
  ground: { r: number; g: number; b: number };
  road: { r: number; g: number; b: number };
  roadLine: { r: number; g: number; b: number };
  buildingBase: { r: number; g: number; b: number };
  buildingVariance: number;
  rooftop: { r: number; g: number; b: number };
  park: { r: number; g: number; b: number };
  parkDark: { r: number; g: number; b: number };
  treeTrunk: { r: number; g: number; b: number };
  tower: { r: number; g: number; b: number };
  towerAccent: { r: number; g: number; b: number };
  accent: { r: number; g: number; b: number };
  beacon: { r: number; g: number; b: number };
}

const colorStyles: Record<string, ColorStyle> = {
  modern: {
    ground: { r: 0.14, g: 0.14, b: 0.18 },
    road: { r: 0.1, g: 0.1, b: 0.13 },
    roadLine: { r: 0.35, g: 0.35, b: 0.25 },
    buildingBase: { r: 0.35, g: 0.4, b: 0.5 },
    buildingVariance: 0.18,
    rooftop: { r: 0.28, g: 0.32, b: 0.42 },
    park: { r: 0.12, g: 0.5, b: 0.2 },
    parkDark: { r: 0.08, g: 0.35, b: 0.15 },
    treeTrunk: { r: 0.3, g: 0.2, b: 0.1 },
    tower: { r: 0.85, g: 0.72, b: 0.3 },
    towerAccent: { r: 0.95, g: 0.82, b: 0.4 },
    accent: { r: 0.3, g: 0.55, b: 0.9 },
    beacon: { r: 1.0, g: 0.3, b: 0.2 },
  },
  sunset: {
    ground: { r: 0.2, g: 0.12, b: 0.1 },
    road: { r: 0.15, g: 0.1, b: 0.08 },
    roadLine: { r: 0.45, g: 0.3, b: 0.15 },
    buildingBase: { r: 0.45, g: 0.3, b: 0.25 },
    buildingVariance: 0.14,
    rooftop: { r: 0.5, g: 0.35, b: 0.28 },
    park: { r: 0.25, g: 0.45, b: 0.12 },
    parkDark: { r: 0.18, g: 0.35, b: 0.1 },
    treeTrunk: { r: 0.35, g: 0.2, b: 0.12 },
    tower: { r: 1.0, g: 0.55, b: 0.2 },
    towerAccent: { r: 1.0, g: 0.7, b: 0.3 },
    accent: { r: 0.9, g: 0.4, b: 0.2 },
    beacon: { r: 1.0, g: 0.6, b: 0.1 },
  },
  neon: {
    ground: { r: 0.04, g: 0.04, b: 0.08 },
    road: { r: 0.03, g: 0.03, b: 0.06 },
    roadLine: { r: 0.0, g: 0.6, b: 0.7 },
    buildingBase: { r: 0.1, g: 0.1, b: 0.2 },
    buildingVariance: 0.08,
    rooftop: { r: 0.12, g: 0.12, b: 0.25 },
    park: { r: 0.0, g: 0.7, b: 0.35 },
    parkDark: { r: 0.0, g: 0.5, b: 0.25 },
    treeTrunk: { r: 0.15, g: 0.1, b: 0.2 },
    tower: { r: 0.9, g: 0.0, b: 0.5 },
    towerAccent: { r: 1.0, g: 0.1, b: 0.7 },
    accent: { r: 0.0, g: 1.0, b: 0.9 },
    beacon: { r: 0.0, g: 1.0, b: 0.5 },
  },
};

function randomColor(
  rand: () => number,
  base: { r: number; g: number; b: number },
  variance: number,
) {
  return {
    r: Math.min(1, Math.max(0, base.r + (rand() - 0.5) * variance)),
    g: Math.min(1, Math.max(0, base.g + (rand() - 0.5) * variance)),
    b: Math.min(1, Math.max(0, base.b + (rand() - 0.5) * variance)),
  };
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

export function createProceduralCityScene(params: ParamValues) {
  const scene = new Scene();
  const gridSize = params.gridSize as number;
  const maxHeight = params.maxHeight as number;
  const density = params.density as number;
  const styleName = (params.style as string) || 'modern';
  const cs = colorStyles[styleName] ?? colorStyles.modern;

  const rand = seededRandom(42);

  const blockSize = 6;
  const streetWidth = 2.2;
  const totalSize = gridSize * (blockSize + streetWidth);
  const offset = -totalSize / 2;
  const centerIdx = Math.floor(gridSize / 2);

  // ── Camera ──────────────────────────────────────────────────────────
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 48,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 400,
  }));
  cam.transform.position = { x: 0, y: 18, z: totalSize * 0.8 };
  scene.add(cam);

  // ── Ground ──────────────────────────────────────────────────────────
  const groundPad = 14;
  const ground = new Node('ground');
  ground.addComponent(createBox(totalSize + groundPad, 0.15, totalSize + groundPad));
  ground.addComponent(new Material({ color: cs.ground }));
  ground.transform.position = { x: 0, y: -0.075, z: 0 };
  scene.add(ground);

  // ── Roads (visible street grid) ────────────────────────────────────
  // Horizontal roads
  for (let row = 0; row <= gridSize; row++) {
    const roadZ = offset + row * (blockSize + streetWidth) - streetWidth / 2;
    const road = new Node(`road-h-${row}`);
    road.addComponent(createBox(totalSize + groundPad * 0.5, 0.05, streetWidth * 0.9));
    road.addComponent(new Material({ color: cs.road }));
    road.transform.position = { x: 0, y: 0.01, z: roadZ + streetWidth / 2 };
    scene.add(road);

    // Center dashed line
    const dashCount = Math.floor(totalSize / 2.5);
    for (let d = 0; d < dashCount; d++) {
      if (d % 2 !== 0) continue; // dash-gap pattern
      const dash = new Node(`dash-h-${row}-${d}`);
      dash.addComponent(createBox(1.0, 0.02, 0.08));
      dash.addComponent(new Material({ color: cs.roadLine }));
      dash.transform.position = {
        x: offset + d * 2.5 + 1.25,
        y: 0.06,
        z: roadZ + streetWidth / 2,
      };
      scene.add(dash);
    }
  }
  // Vertical roads
  for (let col = 0; col <= gridSize; col++) {
    const roadX = offset + col * (blockSize + streetWidth) - streetWidth / 2;
    const road = new Node(`road-v-${col}`);
    road.addComponent(createBox(streetWidth * 0.9, 0.05, totalSize + groundPad * 0.5));
    road.addComponent(new Material({ color: cs.road }));
    road.transform.position = { x: roadX + streetWidth / 2, y: 0.01, z: 0 };
    scene.add(road);
  }

  // ── City container ─────────────────────────────────────────────────
  const city = new Node('city');
  scene.add(city);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const block = new Node(`block-${row}-${col}`);
      const blockX = offset + col * (blockSize + streetWidth) + blockSize / 2;
      const blockZ = offset + row * (blockSize + streetWidth) + blockSize / 2;
      block.transform.position = { x: blockX, y: 0, z: blockZ };
      city.add(block);

      // ── Central park ───────────────────────────────────────────
      if (row === centerIdx && col === centerIdx) {
        // Park ground
        const park = new Node('central-park');
        park.addComponent(createBox(blockSize - 0.3, 0.12, blockSize - 0.3));
        park.addComponent(new Material({ color: cs.park }));
        park.transform.position = { x: 0, y: 0.06, z: 0 };
        block.add(park);

        // Park paths (cross pattern)
        for (let axis = 0; axis < 2; axis++) {
          const path = new Node(`park-path-${axis}`);
          const w = axis === 0 ? blockSize - 1 : 0.3;
          const d = axis === 0 ? 0.3 : blockSize - 1;
          path.addComponent(createBox(w, 0.03, d));
          path.addComponent(new Material({ color: cs.parkDark }));
          path.transform.position = { x: 0, y: 0.14, z: 0 };
          block.add(path);
        }

        // Trees with trunks + canopies
        const treePositions = [
          { x: -1.5, z: -1.5 }, { x: 1.5, z: -1.5 },
          { x: -1.5, z: 1.5 }, { x: 1.5, z: 1.5 },
          { x: 0, z: -2.0 }, { x: 0, z: 2.0 },
        ];
        for (let t = 0; t < treePositions.length; t++) {
          const tp = treePositions[t];
          // Trunk
          const trunk = new Node(`tree-trunk-${t}`);
          trunk.addComponent(createBox(0.12, 0.8, 0.12));
          trunk.addComponent(new Material({ color: cs.treeTrunk }));
          trunk.transform.position = { x: tp.x, y: 0.52, z: tp.z };
          block.add(trunk);
          // Canopy
          const canopy = new Node(`tree-canopy-${t}`);
          canopy.addComponent(createSphere(0.55 + rand() * 0.15, 12, 12));
          canopy.addComponent(new Material({
            color: {
              r: cs.park.r + (rand() - 0.5) * 0.08,
              g: cs.park.g + rand() * 0.12,
              b: cs.park.b + (rand() - 0.5) * 0.04,
            },
          }));
          canopy.transform.position = { x: tp.x, y: 1.15 + rand() * 0.2, z: tp.z };
          block.add(canopy);
        }

        // Central fountain (sphere on pedestal)
        const fountainBase = new Node('fountain-base');
        fountainBase.addComponent(createBox(1.0, 0.2, 1.0));
        fountainBase.addComponent(new Material({ color: cs.rooftop }));
        fountainBase.transform.position = { x: 0, y: 0.22, z: 0 };
        block.add(fountainBase);

        const fountain = new Node('fountain');
        fountain.addComponent(createSphere(0.35, 16, 16));
        fountain.addComponent(new Material({ color: cs.accent }));
        fountain.transform.position = { x: 0, y: 0.65, z: 0 };
        block.add(fountain);

        continue;
      }

      // ── Buildings ──────────────────────────────────────────────
      const distFromCenter = Math.sqrt(
        Math.pow(row - centerIdx, 2) + Math.pow(col - centerIdx, 2),
      );
      const heightFactor = 1 - (distFromCenter / gridSize) * 0.5;

      for (let b = 0; b < density; b++) {
        const height = 1.0 + rand() * maxHeight * heightFactor;
        const width = 0.7 + rand() * 1.6;
        const depth = 0.7 + rand() * 1.6;
        // Clamp position so the building (including its size) stays inside the block
        const halfBlock = blockSize / 2;
        const maxOffX = halfBlock - width / 2 - 0.2;
        const maxOffZ = halfBlock - depth / 2 - 0.2;
        const bx = (rand() - 0.5) * Math.max(0, maxOffX) * 2;
        const bz = (rand() - 0.5) * Math.max(0, maxOffZ) * 2;

        // Building body — color based on height (taller = lighter)
        const heightRatio = height / (maxHeight * 1.5);
        const bColor = lerpColor(
          randomColor(rand, cs.buildingBase, cs.buildingVariance),
          { r: cs.buildingBase.r + 0.15, g: cs.buildingBase.g + 0.15, b: cs.buildingBase.b + 0.15 },
          heightRatio,
        );
        const building = new Node(`building-${row}-${col}-${b}`);
        building.addComponent(createBox(width, height, depth));
        building.addComponent(new Material({ color: bColor }));
        building.transform.position = { x: bx, y: height / 2, z: bz };
        block.add(building);

        // Rooftop detail (flat slab or small element)
        if (rand() > 0.3) {
          const roof = new Node(`roof-${row}-${col}-${b}`);
          const roofType = rand();
          if (roofType < 0.4) {
            // AC unit / box
            roof.addComponent(createBox(width * 0.3, 0.3, depth * 0.3));
            roof.addComponent(new Material({ color: cs.rooftop }));
          } else if (roofType < 0.7) {
            // Antenna sphere
            roof.addComponent(createSphere(0.12, 8, 8));
            roof.addComponent(new Material({ color: cs.accent }));
          } else {
            // Helipad-like flat
            roof.addComponent(createBox(width * 0.6, 0.06, depth * 0.6));
            roof.addComponent(new Material({ color: cs.rooftop }));
          }
          roof.transform.position = { x: bx, y: height + 0.15, z: bz };
          block.add(roof);
        }

        // Tall buildings get a beacon light (sphere on top)
        if (height > maxHeight * 0.7 && rand() > 0.5) {
          const beacon = new Node(`beacon-${row}-${col}-${b}`);
          beacon.addComponent(createSphere(0.08, 8, 8));
          beacon.addComponent(new Material({ color: cs.beacon }));
          beacon.transform.position = { x: bx, y: height + 0.45, z: bz };
          block.add(beacon);
        }
      }
    }
  }

  // ── Main tower (stepped/tapered design) ────────────────────────────
  const towerBaseHeight = maxHeight * 0.8;
  const towerMidHeight = maxHeight * 0.5;
  const towerTopHeight = maxHeight * 0.4;
  const towerX = 2.5;
  const towerZ = -2.5;

  // Base section (widest)
  const tBase = new Node('tower-base');
  tBase.addComponent(createBox(2.2, towerBaseHeight, 2.2));
  tBase.addComponent(new Material({ color: cs.tower }));
  tBase.transform.position = { x: towerX, y: towerBaseHeight / 2, z: towerZ };
  city.add(tBase);

  // Mid section (narrower)
  const tMid = new Node('tower-mid');
  tMid.addComponent(createBox(1.6, towerMidHeight, 1.6));
  tMid.addComponent(new Material({ color: cs.towerAccent }));
  tMid.transform.position = { x: towerX, y: towerBaseHeight + towerMidHeight / 2, z: towerZ };
  city.add(tMid);

  // Top section (narrowest)
  const tTop = new Node('tower-top');
  tTop.addComponent(createBox(1.0, towerTopHeight, 1.0));
  tTop.addComponent(new Material({ color: cs.tower }));
  tTop.transform.position = { x: towerX, y: towerBaseHeight + towerMidHeight + towerTopHeight / 2, z: towerZ };
  city.add(tTop);

  // Tower ledges (accent bands between sections)
  const ledgeYs = [towerBaseHeight, towerBaseHeight + towerMidHeight];
  for (let i = 0; i < ledgeYs.length; i++) {
    const ledge = new Node(`tower-ledge-${i}`);
    const ledgeSize = 2.4 - i * 0.5;
    ledge.addComponent(createBox(ledgeSize, 0.15, ledgeSize));
    ledge.addComponent(new Material({ color: cs.accent }));
    ledge.transform.position = { x: towerX, y: ledgeYs[i], z: towerZ };
    city.add(ledge);
  }

  // Antenna
  const totalTowerH = towerBaseHeight + towerMidHeight + towerTopHeight;
  const antenna = new Node('antenna');
  antenna.addComponent(createBox(0.12, totalTowerH * 0.25, 0.12));
  antenna.addComponent(new Material({ color: cs.accent }));
  antenna.transform.position = { x: towerX, y: totalTowerH + totalTowerH * 0.125, z: towerZ };
  city.add(antenna);

  // Beacon on antenna top
  const towerBeacon = new Node('tower-beacon');
  towerBeacon.addComponent(createSphere(0.18, 12, 12));
  towerBeacon.addComponent(new Material({ color: cs.beacon }));
  towerBeacon.transform.position = { x: towerX, y: totalTowerH + totalTowerH * 0.25 + 0.15, z: towerZ };
  city.add(towerBeacon);

  // ── Secondary landmark (near opposite corner) ──────────────────────
  const lm2X = -3;
  const lm2Z = 3;
  const lm2H = maxHeight * 0.9;

  const lm2 = new Node('landmark-2');
  lm2.addComponent(createBox(1.5, lm2H, 1.5));
  lm2.addComponent(new Material({ color: cs.accent }));
  lm2.transform.position = { x: lm2X, y: lm2H / 2, z: lm2Z };
  city.add(lm2);

  const lm2Crown = new Node('landmark-2-crown');
  lm2Crown.addComponent(createSphere(0.6, 16, 16));
  lm2Crown.addComponent(new Material({ color: cs.accent }));
  lm2Crown.transform.position = { x: lm2X, y: lm2H + 0.4, z: lm2Z };
  city.add(lm2Crown);

  // ── Animation ──────────────────────────────────────────────────────
  function animate(time: number, p: ParamValues) {
    const orbitSpeed = p.orbitSpeed as number;
    const angle = time * orbitSpeed;
    const radius = totalSize * 0.65;

    cam.transform.position = {
      x: Math.sin(angle) * radius,
      y: 14 + Math.sin(time * orbitSpeed * 0.35) * 5,
      z: Math.cos(angle) * radius,
    };
    cam.transform.updateLocalMatrix();

    // Beacon pulse (scale trick via position oscillation is subtle)
    towerBeacon.transform.position.y =
      totalTowerH + totalTowerH * 0.25 + 0.15 + Math.sin(time * 3) * 0.05;
    towerBeacon.transform.updateLocalMatrix();

    // Fountain sphere bob
    scene.traverse((node) => {
      if (node.name === 'fountain') {
        node.transform.position.y = 0.65 + Math.sin(time * 1.5) * 0.1;
        node.transform.updateLocalMatrix();
      }
    });
  }

  return { scene, animate };
}
