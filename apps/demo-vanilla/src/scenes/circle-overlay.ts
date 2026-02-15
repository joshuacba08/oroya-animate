import {
    Camera, CameraType,
    createBox,
    createSphere,
    Material,
    Node,
    Scene,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const circleOverlayControls: ControlDef[] = [
  { type: 'slider', key: 'layers', label: 'Capas', min: 3, max: 12, step: 1, defaultValue: 6, rebuild: true },
  { type: 'slider', key: 'baseRadius', label: 'Radio Base', min: 30, max: 80, step: 5, defaultValue: 50, rebuild: true },
  { type: 'slider', key: 'opacity', label: 'Opacidad', min: 0.05, max: 0.3, step: 0.01, defaultValue: 0.1 },
  {
    type: 'select', key: 'colorScheme', label: 'Colores', defaultValue: 'teal', rebuild: true,
    options: [
      { value: 'teal', label: 'Turquesa' },
      { value: 'warm', label: 'Cálido' },
      { value: 'purple', label: 'Púrpura' },
      { value: 'dual', label: 'Dual' },
    ],
  },
  { type: 'slider', key: 'animSpeed', label: 'Velocidad', min: 0, max: 2, step: 0.1, defaultValue: 0.5 },
];

// Color schemes for the circles
const colorSchemes = {
  teal: {
    upper: { r: 0.6, g: 0.95, b: 1.0 },   // #99eeff
    lower: { r: 0.67, g: 1.0, b: 0.93 },  // #aaffee
    outline: { r: 0.67, g: 1.0, b: 0.93 },
  },
  warm: {
    upper: { r: 1.0, g: 0.7, b: 0.4 },
    lower: { r: 1.0, g: 0.5, b: 0.3 },
    outline: { r: 1.0, g: 0.8, b: 0.5 },
  },
  purple: {
    upper: { r: 0.7, g: 0.5, b: 1.0 },
    lower: { r: 0.9, g: 0.6, b: 0.9 },
    outline: { r: 0.8, g: 0.6, b: 1.0 },
  },
  dual: {
    upper: { r: 0.6, g: 0.95, b: 1.0 },
    lower: { r: 1.0, g: 0.7, b: 0.5 },
    outline: { r: 0.8, g: 0.9, b: 0.9 },
  },
};

interface CircleNode {
  node: Node;
  baseY: number;
  phase: number;
  amplitude: number;
}

export function createCircleOverlayScene(params: ParamValues) {
  const scene = new Scene();
  const layers = (params.layers as number) || 6;
  const baseRadius = (params.baseRadius as number) || 50;
  const opacity = (params.opacity as number) || 0.1;
  const colorScheme = (params.colorScheme as string) || 'teal';

  const colors = colorSchemes[colorScheme as keyof typeof colorSchemes] ?? colorSchemes.teal;

  const viewSize = 1000;
  const centerX = viewSize / 2;
  const centerY = viewSize / 2;

  // Orthographic camera for 2D SVG rendering
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: viewSize,
    top: 0, bottom: viewSize,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Dark background
  const bgNode = new Node('background');
  bgNode.addComponent(createBox(viewSize, viewSize, 0));
  bgNode.addComponent(new Material({ fill: { r: 0.09, g: 0.09, b: 0.09 } }));
  bgNode.transform.position = { x: centerX, y: centerY, z: 0 };
  scene.add(bgNode);

  const animatedCircles: CircleNode[] = [];

  // Create overlapping circles going upward (from bottom)
  for (let i = 1; i <= layers; i++) {
    const r = baseRadius * i;
    const cy1 = viewSize - 200 - r; // Upper set - starts from bottom, moves up

    const circle1 = new Node(`circle-upper-${i}`);
    circle1.addComponent(createSphere(r, 64, 64));
    circle1.addComponent(new Material({
      fill: colors.upper,
      opacity: opacity,
    }));
    circle1.transform.position = { x: centerX, y: cy1, z: 0 };
    scene.add(circle1);
    
    animatedCircles.push({
      node: circle1,
      baseY: cy1,
      phase: i * 0.3,
      amplitude: 5 + i * 2,
    });
  }

  // Create overlapping circles going downward (from top)
  for (let i = 1; i <= layers; i++) {
    const r = baseRadius * i;
    const cy2 = 200 + r; // Lower set - starts from top, moves down

    const circle2 = new Node(`circle-lower-${i}`);
    circle2.addComponent(createSphere(r, 64, 64));
    circle2.addComponent(new Material({
      fill: colors.lower,
      opacity: opacity,
    }));
    circle2.transform.position = { x: centerX, y: cy2, z: 0 };
    scene.add(circle2);
    
    animatedCircles.push({
      node: circle2,
      baseY: cy2,
      phase: i * 0.3 + Math.PI,
      amplitude: 5 + i * 2,
    });
  }

  // Create subtle outline circle
  const maxRadius = baseRadius * layers;
  const outline = new Node('outline');
  outline.addComponent(createSphere(maxRadius + 20, 64, 64));
  outline.addComponent(new Material({
    fill: undefined, // No fill
    stroke: colors.outline,
    strokeWidth: 2,
    opacity: 0.15,
  }));
  outline.transform.position = { x: centerX, y: centerY, z: 0 };
  scene.add(outline);

  function animate(time: number, p: ParamValues) {
    const speed = (p.animSpeed as number) || 0.5;
    const currentOpacity = (p.opacity as number) || 0.1;
    
    // Gentle floating animation
    animatedCircles.forEach((item) => {
      const offset = Math.sin(time * speed + item.phase) * item.amplitude;
      item.node.transform.position.y = item.baseY + offset;
      item.node.transform.updateLocalMatrix();
      
      // Update opacity if changed
      const mat = item.node.getComponent<Material>('Material' as any);
      if (mat && mat.definition.opacity !== currentOpacity) {
        mat.definition.opacity = currentOpacity;
      }
    });
  }

  return { scene, animate };
}
