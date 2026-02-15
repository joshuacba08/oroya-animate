import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const proceduralCityControls: ControlDef[] = [
  { type: 'slider', key: 'gridSize', label: 'Tamaño ciudad', min: 3, max: 8, step: 1, defaultValue: 5, rebuild: true },
  { type: 'slider', key: 'maxHeight', label: 'Altura máxima', min: 3, max: 20, step: 0.5, defaultValue: 10, rebuild: true },
  { type: 'slider', key: 'density', label: 'Densidad', min: 1, max: 6, step: 1, defaultValue: 3, rebuild: true },
  { type: 'slider', key: 'orbitSpeed', label: 'Velocidad cámara', min: 0, max: 1, step: 0.02, defaultValue: 0.3 },
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
  buildingBase: { r: number; g: number; b: number };
  buildingVariance: number;
  park: { r: number; g: number; b: number };
  tower: { r: number; g: number; b: number };
  accent: { r: number; g: number; b: number };
}

const styles: Record<string, ColorStyle> = {
  modern: {
    ground: { r: 0.18, g: 0.18, b: 0.22 },
    buildingBase: { r: 0.4, g: 0.45, b: 0.55 },
    buildingVariance: 0.15,
    park: { r: 0.1, g: 0.6, b: 0.2 },
    tower: { r: 0.9, g: 0.75, b: 0.3 },
    accent: { r: 0.3, g: 0.5, b: 0.9 },
  },
  sunset: {
    ground: { r: 0.25, g: 0.15, b: 0.12 },
    buildingBase: { r: 0.5, g: 0.35, b: 0.3 },
    buildingVariance: 0.12,
    park: { r: 0.3, g: 0.5, b: 0.15 },
    tower: { r: 1.0, g: 0.5, b: 0.15 },
    accent: { r: 0.9, g: 0.4, b: 0.2 },
  },
  neon: {
    ground: { r: 0.05, g: 0.05, b: 0.1 },
    buildingBase: { r: 0.15, g: 0.15, b: 0.25 },
    buildingVariance: 0.1,
    park: { r: 0.0, g: 0.8, b: 0.4 },
    tower: { r: 1.0, g: 0.0, b: 0.6 },
    accent: { r: 0.0, g: 1.0, b: 0.9 },
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

export function createProceduralCityScene(params: ParamValues) {
  const scene = new Scene();
  const gridSize = params.gridSize as number;
  const maxHeight = params.maxHeight as number;
  const density = params.density as number;
  const styleName = (params.style as string) || 'modern';
  const colorStyle = styles[styleName] ?? styles.modern;

  const rand = seededRandom(42);

  const blockSize = 6;
  const streetWidth = 1.8;
  const totalSize = gridSize * (blockSize + streetWidth);

  // Camera
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 50,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 300,
  }));
  cam.transform.position = { x: 0, y: 15, z: totalSize * 0.8 };
  scene.add(cam);

  // Ground
  const ground = new Node('ground');
  ground.addComponent(createBox(totalSize + 4, 0.1, totalSize + 4));
  ground.addComponent(new Material({ color: colorStyle.ground }));
  ground.transform.position = { x: 0, y: -0.05, z: 0 };
  scene.add(ground);

  // City container
  const city = new Node('city');
  scene.add(city);

  const offset = -totalSize / 2;
  const centerIdx = Math.floor(gridSize / 2);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const block = new Node(`block-${row}-${col}`);
      const blockX = offset + col * (blockSize + streetWidth) + blockSize / 2;
      const blockZ = offset + row * (blockSize + streetWidth) + blockSize / 2;
      block.transform.position = { x: blockX, y: 0, z: blockZ };
      city.add(block);

      // Central block becomes a park
      if (row === centerIdx && col === centerIdx) {
        const park = new Node('central-park');
        park.addComponent(createBox(blockSize - 0.5, 0.15, blockSize - 0.5));
        park.addComponent(new Material({ color: colorStyle.park }));
        park.transform.position = { x: 0, y: 0.08, z: 0 };
        block.add(park);

        // Park trees (small spheres)
        for (let t = 0; t < 4; t++) {
          const tree = new Node(`tree-${t}`);
          tree.addComponent(createSphere(0.5, 12, 12));
          tree.addComponent(new Material({
            color: {
              r: colorStyle.park.r + rand() * 0.1,
              g: colorStyle.park.g + rand() * 0.15,
              b: colorStyle.park.b,
            },
          }));
          tree.transform.position = {
            x: (rand() - 0.5) * (blockSize - 2),
            y: 0.7,
            z: (rand() - 0.5) * (blockSize - 2),
          };
          block.add(tree);
        }
        continue;
      }

      // Buildings within each block
      for (let b = 0; b < density; b++) {
        // Distance from center affects max height (downtown is taller)
        const distFromCenter = Math.sqrt(
          Math.pow(row - centerIdx, 2) + Math.pow(col - centerIdx, 2),
        );
        const heightFactor = 1 - (distFromCenter / gridSize) * 0.6;
        const height = 0.8 + rand() * maxHeight * heightFactor;

        const margin = 0.8;
        const maxOff = blockSize / 2 - margin;
        const bx = (rand() - 0.5) * maxOff * 2;
        const bz = (rand() - 0.5) * maxOff * 2;

        const width = 0.6 + rand() * 1.8;
        const depth = 0.6 + rand() * 1.8;

        const building = new Node(`building-${row}-${col}-${b}`);
        building.addComponent(createBox(width, height, depth));
        building.addComponent(new Material({
          color: randomColor(rand, colorStyle.buildingBase, colorStyle.buildingVariance),
        }));
        building.transform.position = { x: bx, y: height / 2, z: bz };
        block.add(building);
      }
    }
  }

  // Main tower
  const towerHeight = maxHeight * 1.8;
  const tower = new Node('main-tower');
  tower.addComponent(createBox(1.2, towerHeight, 1.2));
  tower.addComponent(new Material({ color: colorStyle.tower }));
  tower.transform.position = { x: 2.5, y: towerHeight / 2, z: -2.5 };
  city.add(tower);

  // Tower antenna
  const antenna = new Node('antenna');
  antenna.addComponent(createBox(0.15, towerHeight * 0.3, 0.15));
  antenna.addComponent(new Material({ color: colorStyle.accent }));
  antenna.transform.position = { x: 0, y: towerHeight * 0.65, z: 0 };
  tower.add(antenna);

  // Accent sphere on tower top
  const topSphere = new Node('tower-top');
  topSphere.addComponent(createSphere(0.25, 16, 16));
  topSphere.addComponent(new Material({ color: colorStyle.accent }));
  topSphere.transform.position = { x: 0, y: towerHeight * 0.8, z: 0 };
  tower.add(topSphere);

  function animate(time: number, p: ParamValues) {
    const orbitSpeed = p.orbitSpeed as number;
    const angle = time * orbitSpeed;

    const radius = totalSize * 0.7;
    cam.transform.position = {
      x: Math.sin(angle) * radius,
      y: 12 + Math.sin(time * orbitSpeed * 0.4) * 4,
      z: Math.cos(angle) * radius,
    };
    cam.transform.updateLocalMatrix();
  }

  return { scene, animate };
}
