import {
    Camera, CameraType,
    createBox, createSphere, Material,
    Node,
    Scene,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const generativeArtControls: ControlDef[] = [
  {
    type: 'select', key: 'composition', label: 'Composición', defaultValue: 'albers', rebuild: true,
    options: [
      { value: 'albers', label: 'Albers' },
      { value: 'mondrian', label: 'Mondrian' },
      { value: 'bauhaus', label: 'Bauhaus' },
      { value: 'dusk', label: 'Crepúsculo' },
    ],
  },
  { type: 'slider', key: 'blur', label: 'Desenfoque', min: 0, max: 8, step: 0.5, defaultValue: 0, rebuild: true },
  { type: 'slider', key: 'animSpeed', label: 'Animación', min: 0, max: 3, step: 0.1, defaultValue: 1 },
];

// Color compositions inspired by famous artists
const compositions = {
  // Josef Albers - color interaction study
  albers: {
    background: { r: 0.09, g: 0.09, b: 0.09 },
    elements: [
      // Main orange square
      { type: 'rect', x: 150, y: 200, w: 700, h: 600, color: { r: 0.9, g: 0.39, b: 0.07 } },
      // Blue rectangle (overlay)
      { type: 'rect', x: 650, y: 200, w: 200, h: 600, color: { r: 0.41, g: 0.59, b: 0.62 } },
      // Smaller orange rectangle
      { type: 'rect', x: 200, y: 425, w: 600, h: 150, color: { r: 0.72, g: 0.29, b: 0.03 } },
      // Yellow rectangle
      { type: 'rect', x: 325, y: 200, w: 175, h: 600, color: { r: 1.0, g: 0.83, b: 0.13 } },
      // Purple rectangle
      { type: 'rect', x: 500, y: 200, w: 175, h: 600, color: { r: 0.29, g: 0.16, b: 0.24 } },
    ],
  },
  
  // Piet Mondrian inspired - primary colors with black grid
  mondrian: {
    background: { r: 0.95, g: 0.95, b: 0.92 },
    elements: [
      // Red square (top left)
      { type: 'rect', x: 50, y: 50, w: 400, h: 350, color: { r: 0.9, g: 0.1, b: 0.1 } },
      // Blue rectangle (bottom right)
      { type: 'rect', x: 550, y: 550, w: 400, h: 400, color: { r: 0.1, g: 0.2, b: 0.6 } },
      // Yellow square (center right)
      { type: 'rect', x: 650, y: 200, w: 250, h: 250, color: { r: 1.0, g: 0.85, b: 0.0 } },
      // Black lines (vertical)
      { type: 'rect', x: 450, y: 0, w: 15, h: 1000, color: { r: 0.05, g: 0.05, b: 0.05 } },
      { type: 'rect', x: 650, y: 0, w: 15, h: 1000, color: { r: 0.05, g: 0.05, b: 0.05 } },
      // Black lines (horizontal)
      { type: 'rect', x: 0, y: 400, w: 1000, h: 15, color: { r: 0.05, g: 0.05, b: 0.05 } },
      { type: 'rect', x: 0, y: 550, w: 1000, h: 15, color: { r: 0.05, g: 0.05, b: 0.05 } },
      // Small white squares for balance
      { type: 'rect', x: 470, y: 50, w: 170, h: 340, color: { r: 0.98, g: 0.98, b: 0.95 } },
      { type: 'rect', x: 470, y: 420, w: 170, h: 120, color: { r: 0.98, g: 0.98, b: 0.95 } },
    ],
  },
  
  // Bauhaus - geometric shapes and primary colors with circles
  bauhaus: {
    background: { r: 0.12, g: 0.12, b: 0.15 },
    elements: [
      // Large red circle
      { type: 'circle', x: 300, y: 400, r: 200, color: { r: 0.85, g: 0.15, b: 0.15 } },
      // Yellow triangle (using rectangles for now)
      { type: 'rect', x: 500, y: 600, w: 300, h: 200, color: { r: 1.0, g: 0.8, b: 0.0 } },
      // Blue rectangle
      { type: 'rect', x: 600, y: 200, w: 250, h: 350, color: { r: 0.1, g: 0.3, b: 0.7 } },
      // Small accent circles
      { type: 'circle', x: 700, y: 700, r: 80, color: { r: 0.0, g: 0.0, b: 0.0 } },
      { type: 'circle', x: 700, y: 700, r: 60, color: { r: 1.0, g: 1.0, b: 1.0 } },
      // Horizontal line element
      { type: 'rect', x: 100, y: 750, w: 600, h: 8, color: { r: 1.0, g: 1.0, b: 1.0 } },
      // Vertical accent
      { type: 'rect', x: 850, y: 150, w: 10, h: 400, color: { r: 1.0, g: 0.8, b: 0.0 } },
    ],
  },
  
  // Dusk - warm sunset gradient composition
  dusk: {
    background: { r: 0.1, g: 0.05, b: 0.15 },
    elements: [
      // Sky gradient layers (simulated with overlapping shapes)
      { type: 'rect', x: 0, y: 0, w: 1000, h: 300, color: { r: 0.2, g: 0.1, b: 0.3 }, opacity: 0.8 },
      { type: 'rect', x: 0, y: 200, w: 1000, h: 300, color: { r: 0.5, g: 0.2, b: 0.4 }, opacity: 0.8 },
      { type: 'rect', x: 0, y: 400, w: 1000, h: 300, color: { r: 0.9, g: 0.4, b: 0.3 }, opacity: 0.8 },
      { type: 'rect', x: 0, y: 600, w: 1000, h: 200, color: { r: 1.0, g: 0.6, b: 0.2 }, opacity: 0.8 },
      { type: 'rect', x: 0, y: 750, w: 1000, h: 250, color: { r: 1.0, g: 0.8, b: 0.4 }, opacity: 0.8 },
      // Sun glow
      { type: 'circle', x: 500, y: 700, r: 100, color: { r: 1.0, g: 0.95, b: 0.7 } },
      { type: 'circle', x: 500, y: 700, r: 150, color: { r: 1.0, g: 0.8, b: 0.4 }, opacity: 0.5 },
      { type: 'circle', x: 500, y: 700, r: 200, color: { r: 1.0, g: 0.6, b: 0.3 }, opacity: 0.3 },
      // Silhouette elements
      { type: 'rect', x: 100, y: 850, w: 150, h: 150, color: { r: 0.05, g: 0.02, b: 0.08 } },
      { type: 'rect', x: 700, y: 820, w: 200, h: 180, color: { r: 0.05, g: 0.02, b: 0.08 } },
      { type: 'rect', x: 400, y: 870, w: 100, h: 130, color: { r: 0.05, g: 0.02, b: 0.08 } },
    ],
  },
};

type ElementDef = {
  type: 'rect' | 'circle';
  x: number;
  y: number;
  w?: number;
  h?: number;
  r?: number;
  color: { r: number; g: number; b: number };
  opacity?: number;
};

export function createGenerativeArtScene(params: ParamValues) {
  const scene = new Scene();
  const compositionKey = (params.composition as string) || 'albers';
  const blur = (params.blur as number) || 0;

  const comp = compositions[compositionKey as keyof typeof compositions] ?? compositions.albers;

  const viewSize = 1000;

  // Orthographic camera for 2D SVG rendering
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: viewSize,
    top: 0, bottom: viewSize,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Background
  const bgNode = new Node('background');
  bgNode.addComponent(createBox(viewSize, viewSize, 0));
  bgNode.addComponent(new Material({ fill: comp.background }));
  bgNode.transform.position = { x: viewSize / 2, y: viewSize / 2, z: 0 };
  scene.add(bgNode);

  // Create elements from composition
  const animatableNodes: { node: Node; baseX: number; baseY: number; idx: number }[] = [];
  
  (comp.elements as ElementDef[]).forEach((el, idx) => {
    const node = new Node(`element-${idx}`);

    if (el.type === 'rect') {
      node.addComponent(createBox(el.w!, el.h!, 0));
      node.transform.position = { x: el.x + el.w! / 2, y: el.y + el.h! / 2, z: 0 };
    } else if (el.type === 'circle') {
      node.addComponent(createSphere(el.r!, 64, 64));
      node.transform.position = { x: el.x, y: el.y, z: 0 };
    }

    // Build material definition
    const matDef: any = { fill: el.color };
    
    if (el.opacity !== undefined) {
      matDef.opacity = el.opacity;
    }
    
    // Add blur filter if specified
    if (blur > 0) {
      matDef.filter = { effects: [{ type: 'blur', stdDeviation: blur }] };
    }

    node.addComponent(new Material(matDef));
    scene.add(node);

    // Track for animation
    animatableNodes.push({
      node,
      baseX: node.transform.position.x,
      baseY: node.transform.position.y,
      idx,
    });
  });

  function animate(time: number, p: ParamValues) {
    const speed = (p.animSpeed as number) || 1;
    
    if (speed === 0) return;

    // Subtle breathing/pulsing animation
    animatableNodes.forEach((item) => {
      const phase = item.idx * 0.5;
      const scale = 1 + Math.sin(time * speed * 0.5 + phase) * 0.02;
      
      item.node.transform.scale = { x: scale, y: scale, z: 1 };
      item.node.transform.updateLocalMatrix();
    });
  }

  return { scene, animate };
}
