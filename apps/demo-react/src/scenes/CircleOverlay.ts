import {
  Scene, Node, createSphere, createBox, Material, Camera, CameraType,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const circleOverlayControls: ControlDef[] = [
  { type: 'slider', key: 'layers', label: 'Capas', min: 3, max: 12, step: 1, defaultValue: 6, rebuild: true },
  {
    type: 'select', key: 'colorScheme', label: 'Colores', defaultValue: 'teal', rebuild: true,
    options: [
      { value: 'teal', label: 'Turquesa' },
      { value: 'warm', label: 'Cálido' },
      { value: 'purple', label: 'Púrpura' },
      { value: 'dual', label: 'Dual' },
    ],
  },
  {
    type: 'select', key: 'animate', label: 'Animar', defaultValue: 'yes', rebuild: false,
    options: [
      { value: 'yes', label: 'Sí' },
      { value: 'no', label: 'No' },
    ],
  },
];

const colorSchemes = {
  teal: { r: 0.0, g: 0.6, b: 0.65 },
  warm: { r: 0.85, g: 0.4, b: 0.2 },
  purple: { r: 0.55, g: 0.3, b: 0.7 },
  dual: { r: 0.0, g: 0.5, b: 0.75 }, // primary, secondary will be different
};

export function createCircleOverlayScene(params: ParamValues) {
  const scene = new Scene();
  const layers = (params.layers as number) || 6;
  const scheme = (params.colorScheme as string) || 'teal';

  const baseColor = colorSchemes[scheme as keyof typeof colorSchemes] ?? colorSchemes.teal;
  const secondaryColor = scheme === 'dual' 
    ? { r: 0.9, g: 0.35, b: 0.25 } 
    : baseColor;

  // Orthographic camera for 2D SVG rendering
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000,
    top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Light background
  const bg = new Node('background');
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: { r: 0.97, g: 0.97, b: 0.95 } }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  scene.add(bg);

  const circleNodes: Node[] = [];
  const centerX = 500, centerY = 500;
  const maxRadius = 350;
  const minRadius = 60;

  // Create overlapping circles from large to small
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const radius = maxRadius - t * (maxRadius - minRadius);
    const opacity = 0.15 + t * 0.35;

    // Alternate colors for dual scheme
    const useSecondary = scheme === 'dual' && i % 2 === 1;
    const color = useSecondary ? secondaryColor : baseColor;

    const circle = new Node(`circle-${i}`);
    circle.addComponent(createSphere(radius, 64, 64));
    circle.addComponent(new Material({
      fill: color,
      opacity: opacity,
    }));
    circle.transform.position = {
      x: centerX,
      y: centerY,
      z: 0,
    };
    scene.add(circle);
    circleNodes.push(circle);
  }

  // Outline circle
  const outline = new Node('outline');
  outline.addComponent(createSphere(maxRadius + 10, 64, 64));
  outline.addComponent(new Material({
    fill: { r: 0, g: 0, b: 0 },
    opacity: 0,
    stroke: { r: 0.3, g: 0.3, b: 0.3 },
    strokeWidth: 2,
  }));
  outline.transform.position = { x: centerX, y: centerY, z: 0 };
  scene.add(outline);

  function animate(time: number, p: ParamValues) {
    if (p.animate !== 'yes') return;

    // Gentle breathing animation
    circleNodes.forEach((node, i) => {
      const phase = (i / circleNodes.length) * Math.PI * 2;
      const scale = 1 + 0.03 * Math.sin(time * 0.001 + phase);
      node.transform.scale = { x: scale, y: scale, z: 1 };
    });
  }

  return { scene, animate };
}
