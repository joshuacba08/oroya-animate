import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@oroya/core';

/**
 * Color Palette — Multiple shapes with different geometries, colors, and rotation speeds.
 * Based on Tutorial 2: Paleta de Colores.
 */

interface ShapeDef {
  name: string;
  geometry: 'box' | 'sphere';
  color: { r: number; g: number; b: number };
  position: { x: number; y: number; z: number };
  size: number;
}

const palette: ShapeDef[] = [
  { name: 'ruby',     geometry: 'box',    color: { r: 0.9, g: 0.1, b: 0.2 }, position: { x: -4, y: 0, z: 0 }, size: 1.0 },
  { name: 'amber',    geometry: 'sphere', color: { r: 1.0, g: 0.7, b: 0.0 }, position: { x: -2, y: 0, z: 0 }, size: 0.7 },
  { name: 'emerald',  geometry: 'box',    color: { r: 0.0, g: 0.8, b: 0.4 }, position: { x:  0, y: 0, z: 0 }, size: 1.2 },
  { name: 'sapphire', geometry: 'sphere', color: { r: 0.1, g: 0.4, b: 0.9 }, position: { x:  2, y: 0, z: 0 }, size: 0.8 },
  { name: 'amethyst', geometry: 'box',    color: { r: 0.6, g: 0.2, b: 0.8 }, position: { x:  4, y: 0, z: 0 }, size: 0.9 },
];

export function createColorPaletteScene() {
  const scene = new Scene();

  // Camera — pulled back to see all objects
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

  // Generate shape nodes
  const nodes: Node[] = [];

  palette.forEach((shape) => {
    const node = new Node(shape.name);

    if (shape.geometry === 'box') {
      node.addComponent(createBox(shape.size, shape.size, shape.size));
    } else {
      node.addComponent(createSphere(shape.size, 32, 32));
    }

    node.addComponent(new Material({ color: shape.color }));
    node.transform.position = shape.position;

    scene.add(node);
    nodes.push(node);
  });

  // Animation: each shape rotates at a different speed with vertical bobbing
  function animate(time: number) {
    nodes.forEach((node, i) => {
      const speed = 0.5 + i * 0.3;
      const angle = time * speed;

      node.transform.rotation = {
        x: Math.sin(angle / 2) * 0.5,
        y: Math.sin(angle / 2),
        z: 0,
        w: Math.cos(angle / 2),
      };

      // Vertical bobbing
      const baseY = palette[i].position.y;
      node.transform.position.y = baseY + Math.sin(time * 1.5 + i * 1.2) * 0.4;

      node.transform.updateLocalMatrix();
    });
  }

  return { scene, animate };
}
