import {
  Scene, Node, createBox, createSphere, Material, Camera, CameraType,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const generativeArtControls: ControlDef[] = [
  {
    type: 'select', key: 'composition', label: 'Composición', defaultValue: 'albers', rebuild: true,
    options: [
      { value: 'albers', label: 'Albers' },
      { value: 'mondrian', label: 'Mondrian' },
      { value: 'bauhaus', label: 'Bauhaus' },
      { value: 'dusk', label: 'Atardecer' },
    ],
  },
  {
    type: 'select', key: 'useBlur', label: 'Difuminar', defaultValue: 'no', rebuild: true,
    options: [
      { value: 'yes', label: 'Sí' },
      { value: 'no', label: 'No' },
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

// Color compositions inspired by famous artists
const compositions = {
  albers: {
    bg: { r: 0.95, g: 0.92, b: 0.88 },
    colors: [
      { r: 0.82, g: 0.35, b: 0.25 }, // warm red
      { r: 0.9, g: 0.55, b: 0.3 },   // orange
      { r: 0.98, g: 0.75, b: 0.45 }, // yellow
      { r: 0.6, g: 0.25, b: 0.22 },  // dark red
    ],
  },
  mondrian: {
    bg: { r: 0.97, g: 0.95, b: 0.9 },
    colors: [
      { r: 0.9, g: 0.15, b: 0.15 },  // red
      { r: 0.15, g: 0.3, b: 0.6 },   // blue
      { r: 0.95, g: 0.85, b: 0.2 },  // yellow
      { r: 0.1, g: 0.1, b: 0.1 },    // black
    ],
  },
  bauhaus: {
    bg: { r: 0.12, g: 0.12, b: 0.14 },
    colors: [
      { r: 0.9, g: 0.3, b: 0.25 },   // red
      { r: 0.95, g: 0.7, b: 0.2 },   // yellow
      { r: 0.2, g: 0.45, b: 0.7 },   // blue
      { r: 0.95, g: 0.95, b: 0.9 },  // off-white
    ],
  },
  dusk: {
    bg: { r: 0.15, g: 0.12, b: 0.2 },
    colors: [
      { r: 0.4, g: 0.25, b: 0.5 },    // deep purple
      { r: 0.85, g: 0.45, b: 0.4 },   // coral
      { r: 0.95, g: 0.7, b: 0.5 },    // peach
      { r: 0.25, g: 0.35, b: 0.55 },  // twilight blue
    ],
  },
};

export function createGenerativeArtScene(params: ParamValues) {
  const scene = new Scene();
  const compositionKey = (params.composition as string) || 'albers';
  const useBlur = params.useBlur === 'yes';

  const palette = compositions[compositionKey as keyof typeof compositions] ?? compositions.albers;

  // Orthographic camera for 2D SVG rendering
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 1000,
    top: 0, bottom: 1000,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Background
  const bg = new Node('background');
  bg.addComponent(createBox(1000, 1000, 0));
  bg.addComponent(new Material({ fill: palette.bg }));
  bg.transform.position = { x: 500, y: 500, z: 0 };
  scene.add(bg);

  const animatedNodes: Node[] = [];

  // Create composition based on style
  if (compositionKey === 'albers') {
    // Nested squares - Homage to the Square style
    const sizes = [600, 450, 320, 200];
    const offsets = [0, 30, 50, 60];
    palette.colors.forEach((color, i) => {
      const sq = new Node(`square-${i}`);
      sq.addComponent(createBox(sizes[i], sizes[i], 0));
      sq.addComponent(new Material({
        fill: color,
        filter: useBlur ? { effects: [{ type: 'blur', stdDeviation: 2 }] } : undefined,
      }));
      sq.transform.position = { x: 500, y: 500 + offsets[i], z: 0 };
      scene.add(sq);
      animatedNodes.push(sq);
    });
  } else if (compositionKey === 'mondrian') {
    // Geometric blocks with black lines
    const blocks = [
      { x: 200, y: 200, w: 300, h: 250, colorIdx: 0 },
      { x: 700, y: 150, w: 250, h: 200, colorIdx: 1 },
      { x: 300, y: 650, w: 400, h: 250, colorIdx: 2 },
      { x: 750, y: 550, w: 200, h: 300, colorIdx: 3 },
    ];
    blocks.forEach((b, i) => {
      const block = new Node(`block-${i}`);
      block.addComponent(createBox(b.w, b.h, 0));
      block.addComponent(new Material({
        fill: palette.colors[b.colorIdx],
        stroke: { r: 0.1, g: 0.1, b: 0.1 },
        strokeWidth: 8,
        filter: useBlur ? { effects: [{ type: 'blur', stdDeviation: 1 }] } : undefined,
      }));
      block.transform.position = { x: b.x, y: b.y, z: 0 };
      scene.add(block);
      animatedNodes.push(block);
    });
  } else if (compositionKey === 'bauhaus') {
    // Circles and geometric shapes
    const shapes = [
      { type: 'circle', x: 300, y: 350, r: 200, colorIdx: 0 },
      { type: 'circle', x: 650, y: 400, r: 150, colorIdx: 1 },
      { type: 'rect', x: 500, y: 750, w: 600, h: 150, colorIdx: 2 },
      { type: 'circle', x: 450, y: 500, r: 80, colorIdx: 3 },
    ];
    shapes.forEach((s, i) => {
      const shape = new Node(`shape-${i}`);
      if (s.type === 'circle') {
        shape.addComponent(createSphere(s.r!, 64, 64));
      } else {
        shape.addComponent(createBox(s.w!, s.h!, 0));
      }
      shape.addComponent(new Material({
        fill: palette.colors[s.colorIdx],
        filter: useBlur ? { effects: [{ type: 'blur', stdDeviation: 3 }] } : undefined,
      }));
      shape.transform.position = { x: s.x, y: s.y, z: 0 };
      scene.add(shape);
      animatedNodes.push(shape);
    });
  } else if (compositionKey === 'dusk') {
    // Layered circles with gradients
    const layers = [
      { x: 500, y: 600, r: 350, colorIdx: 0, opacity: 0.7 },
      { x: 400, y: 450, r: 250, colorIdx: 1, opacity: 0.8 },
      { x: 550, y: 400, r: 180, colorIdx: 2, opacity: 0.85 },
      { x: 450, y: 350, r: 100, colorIdx: 3, opacity: 0.9 },
    ];
    layers.forEach((l, i) => {
      const layer = new Node(`layer-${i}`);
      layer.addComponent(createSphere(l.r, 64, 64));
      layer.addComponent(new Material({
        fill: palette.colors[l.colorIdx],
        opacity: l.opacity,
        filter: useBlur ? { effects: [{ type: 'blur', stdDeviation: 5 }] } : undefined,
      }));
      layer.transform.position = { x: l.x, y: l.y, z: 0 };
      scene.add(layer);
      animatedNodes.push(layer);
    });
  }

  function animate(time: number, p: ParamValues) {
    if (p.animate !== 'yes') return;

    // Subtle breathing animation
    animatedNodes.forEach((node, i) => {
      const phase = (i / animatedNodes.length) * Math.PI * 2;
      const scale = 1 + 0.015 * Math.sin(time * 0.0008 + phase);
      node.transform.scale = { x: scale, y: scale, z: 1 };
    });
  }

  return { scene, animate };
}
