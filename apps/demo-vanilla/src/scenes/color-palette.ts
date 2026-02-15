import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const colorPaletteControls: ControlDef[] = [
  { type: 'slider', key: 'speed', label: 'Velocidad', min: 0.2, max: 3, step: 0.1, defaultValue: 1 },
  { type: 'slider', key: 'bobbing', label: 'Flotación', min: 0, max: 1.5, step: 0.05, defaultValue: 0.4 },
  { type: 'slider', key: 'spacing', label: 'Espaciado', min: 1, max: 4, step: 0.1, defaultValue: 2, rebuild: true },
  {
    type: 'select', key: 'theme', label: 'Tema', defaultValue: 'gems', rebuild: true,
    options: [
      { value: 'gems', label: 'Gemas' },
      { value: 'warm', label: 'Cálido' },
      { value: 'cool', label: 'Frío' },
      { value: 'neon', label: 'Neón' },
    ],
  },
];

interface ShapeDef {
  name: string;
  geometry: 'box' | 'sphere';
  color: { r: number; g: number; b: number };
  size: number;
}

const themes: Record<string, ShapeDef[]> = {
  gems: [
    { name: 'ruby',     geometry: 'box',    color: { r: 0.9, g: 0.1, b: 0.2 }, size: 1.0 },
    { name: 'amber',    geometry: 'sphere', color: { r: 1.0, g: 0.7, b: 0.0 }, size: 0.7 },
    { name: 'emerald',  geometry: 'box',    color: { r: 0.0, g: 0.8, b: 0.4 }, size: 1.2 },
    { name: 'sapphire', geometry: 'sphere', color: { r: 0.1, g: 0.4, b: 0.9 }, size: 0.8 },
    { name: 'amethyst', geometry: 'box',    color: { r: 0.6, g: 0.2, b: 0.8 }, size: 0.9 },
  ],
  warm: [
    { name: 'flame',    geometry: 'sphere', color: { r: 1.0, g: 0.3, b: 0.0 }, size: 0.9 },
    { name: 'sunset',   geometry: 'box',    color: { r: 1.0, g: 0.5, b: 0.2 }, size: 1.1 },
    { name: 'gold',     geometry: 'sphere', color: { r: 1.0, g: 0.85, b: 0.2 }, size: 0.8 },
    { name: 'coral',    geometry: 'box',    color: { r: 1.0, g: 0.4, b: 0.4 }, size: 1.0 },
    { name: 'peach',    geometry: 'sphere', color: { r: 1.0, g: 0.7, b: 0.6 }, size: 0.7 },
  ],
  cool: [
    { name: 'ice',      geometry: 'box',    color: { r: 0.7, g: 0.9, b: 1.0 }, size: 1.0 },
    { name: 'ocean',    geometry: 'sphere', color: { r: 0.0, g: 0.4, b: 0.8 }, size: 0.8 },
    { name: 'mint',     geometry: 'box',    color: { r: 0.3, g: 0.9, b: 0.7 }, size: 1.1 },
    { name: 'sky',      geometry: 'sphere', color: { r: 0.4, g: 0.7, b: 1.0 }, size: 0.9 },
    { name: 'lavender', geometry: 'box',    color: { r: 0.6, g: 0.5, b: 0.9 }, size: 0.8 },
  ],
  neon: [
    { name: 'pink',     geometry: 'sphere', color: { r: 1.0, g: 0.0, b: 0.6 }, size: 0.9 },
    { name: 'cyan',     geometry: 'box',    color: { r: 0.0, g: 1.0, b: 0.9 }, size: 1.0 },
    { name: 'yellow',   geometry: 'sphere', color: { r: 1.0, g: 1.0, b: 0.0 }, size: 0.8 },
    { name: 'green',    geometry: 'box',    color: { r: 0.2, g: 1.0, b: 0.2 }, size: 1.1 },
    { name: 'violet',   geometry: 'sphere', color: { r: 0.7, g: 0.0, b: 1.0 }, size: 0.9 },
  ],
};

export function createColorPaletteScene(params: ParamValues) {
  const scene = new Scene();
  const spacing = params.spacing as number;
  const theme = (params.theme as string) || 'gems';
  const palette = themes[theme] ?? themes.gems;

  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 100,
  }));
  cam.transform.position = { x: 0, y: 2, z: 10 };
  scene.add(cam);

  const nodes: Node[] = [];
  const count = palette.length;
  const totalWidth = (count - 1) * spacing;

  palette.forEach((shape, i) => {
    const node = new Node(shape.name);

    if (shape.geometry === 'box') {
      node.addComponent(createBox(shape.size, shape.size, shape.size));
    } else {
      node.addComponent(createSphere(shape.size, 32, 32));
    }

    node.addComponent(new Material({ color: shape.color }));
    node.transform.position = { x: i * spacing - totalWidth / 2, y: 0, z: 0 };
    scene.add(node);
    nodes.push(node);
  });

  function animate(time: number, p: ParamValues) {
    const speed = p.speed as number;
    const bobbing = p.bobbing as number;

    nodes.forEach((node, i) => {
      const s = (0.5 + i * 0.3) * speed;
      const angle = time * s;

      node.transform.rotation = {
        x: Math.sin(angle / 2) * 0.5,
        y: Math.sin(angle / 2),
        z: 0,
        w: Math.cos(angle / 2),
      };
      node.transform.position.y = Math.sin(time * 1.5 * speed + i * 1.2) * bobbing;
      node.transform.updateLocalMatrix();
    });
  }

  return { scene, animate };
}
