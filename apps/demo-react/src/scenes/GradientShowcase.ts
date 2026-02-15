import {
    Camera, CameraType,
    createBox, createSphere, Material,
    Node,
    Scene,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const gradientShowcaseControls: ControlDef[] = [
  {
    type: 'select', key: 'style', label: 'Estilo', defaultValue: 'sunset', rebuild: true,
    options: [
      { value: 'sunset', label: 'Atardecer' },
      { value: 'ocean', label: 'Océano' },
      { value: 'neon', label: 'Neón' },
      { value: 'rainbow', label: 'Arcoíris' },
    ],
  },
  { type: 'slider', key: 'barCount', label: 'Barras', min: 2, max: 6, step: 1, defaultValue: 4, rebuild: true },
  { type: 'slider', key: 'circleCount', label: 'Círculos', min: 1, max: 5, step: 1, defaultValue: 3, rebuild: true },
];

// Gradient presets for each style
const gradientStyles = {
  sunset: {
    bars: [
      { stops: [
        { offset: 0, color: { r: 0.4, g: 0.6, b: 0.9 } },
        { offset: 1, color: { r: 0.9, g: 0.7, b: 0.4 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.2, g: 0.8, b: 0.9 } },
        { offset: 0.5, color: { r: 0.9, g: 0.6, b: 0.5 } },
        { offset: 1, color: { r: 0.95, g: 0.85, b: 0.3 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.3, g: 0.9, b: 0.8 } },
        { offset: 0.3, color: { r: 0.9, g: 0.7, b: 0.9 } },
        { offset: 0.7, color: { r: 1.0, g: 0.5, b: 0.3 } },
        { offset: 1, color: { r: 1.0, g: 0.3, b: 0.2 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.95, g: 0.95, b: 0.6 } },
        { offset: 0.4, color: { r: 1.0, g: 0.7, b: 0.4 } },
        { offset: 0.7, color: { r: 0.95, g: 0.4, b: 0.3 } },
        { offset: 1, color: { r: 0.6, g: 0.2, b: 0.3 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.9, g: 0.6, b: 0.2 } },
        { offset: 1, color: { r: 0.4, g: 0.2, b: 0.5 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.3, g: 0.3, b: 0.5 } },
        { offset: 1, color: { r: 0.1, g: 0.1, b: 0.2 } },
      ]},
    ],
    circles: [
      { cx: 0.5, cy: 0.5, r: 0.5, stops: [
        { offset: 0, color: { r: 1.0, g: 1.0, b: 0.8 } },
        { offset: 0.4, color: { r: 1.0, g: 0.8, b: 0.3 } },
        { offset: 1, color: { r: 1.0, g: 0.4, b: 0.1 } },
      ]},
      { cx: 0.3, cy: 0.3, r: 0.6, stops: [
        { offset: 0, color: { r: 1.0, g: 0.9, b: 0.5 } },
        { offset: 0.6, color: { r: 1.0, g: 0.5, b: 0.2 } },
        { offset: 1, color: { r: 0.8, g: 0.2, b: 0.1 }, opacity: 0.8 },
      ]},
      { cx: 0.7, cy: 0.3, r: 0.5, stops: [
        { offset: 0, color: { r: 0.4, g: 0.8, b: 1.0 } },
        { offset: 1, color: { r: 0.2, g: 0.4, b: 0.8 }, opacity: 0.6 },
      ]},
      { cx: 0.5, cy: 0.7, r: 0.4, stops: [
        { offset: 0, color: { r: 1.0, g: 0.6, b: 0.8 } },
        { offset: 1, color: { r: 0.8, g: 0.3, b: 0.5 }, opacity: 0.5 },
      ]},
      { cx: 0.5, cy: 0.5, r: 0.7, stops: [
        { offset: 0, color: { r: 0.9, g: 0.5, b: 0.2 } },
        { offset: 1, color: { r: 0.5, g: 0.1, b: 0.3 }, opacity: 0.4 },
      ]},
    ],
  },
  ocean: {
    bars: [
      { stops: [
        { offset: 0, color: { r: 0.0, g: 0.3, b: 0.5 } },
        { offset: 1, color: { r: 0.2, g: 0.7, b: 0.8 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.1, g: 0.5, b: 0.7 } },
        { offset: 0.5, color: { r: 0.3, g: 0.8, b: 0.9 } },
        { offset: 1, color: { r: 0.0, g: 0.4, b: 0.6 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.4, g: 0.9, b: 0.95 } },
        { offset: 0.5, color: { r: 0.1, g: 0.6, b: 0.8 } },
        { offset: 1, color: { r: 0.0, g: 0.2, b: 0.4 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.0, g: 0.15, b: 0.3 } },
        { offset: 0.5, color: { r: 0.2, g: 0.5, b: 0.7 } },
        { offset: 1, color: { r: 0.5, g: 0.9, b: 0.95 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.3, g: 0.7, b: 0.8 } },
        { offset: 1, color: { r: 0.0, g: 0.3, b: 0.5 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.1, g: 0.2, b: 0.3 } },
        { offset: 1, color: { r: 0.4, g: 0.8, b: 0.9 } },
      ]},
    ],
    circles: [
      { cx: 0.5, cy: 0.5, r: 0.5, stops: [
        { offset: 0, color: { r: 0.6, g: 1.0, b: 1.0 } },
        { offset: 1, color: { r: 0.0, g: 0.4, b: 0.6 } },
      ]},
      { cx: 0.3, cy: 0.4, r: 0.6, stops: [
        { offset: 0, color: { r: 0.4, g: 0.9, b: 0.95 } },
        { offset: 1, color: { r: 0.1, g: 0.3, b: 0.5 }, opacity: 0.7 },
      ]},
      { cx: 0.6, cy: 0.6, r: 0.5, stops: [
        { offset: 0, color: { r: 0.2, g: 0.8, b: 0.9 } },
        { offset: 1, color: { r: 0.0, g: 0.2, b: 0.4 }, opacity: 0.6 },
      ]},
      { cx: 0.5, cy: 0.5, r: 0.4, stops: [
        { offset: 0, color: { r: 0.5, g: 0.95, b: 1.0 } },
        { offset: 1, color: { r: 0.1, g: 0.5, b: 0.7 }, opacity: 0.5 },
      ]},
      { cx: 0.4, cy: 0.5, r: 0.6, stops: [
        { offset: 0, color: { r: 0.3, g: 0.7, b: 0.85 } },
        { offset: 1, color: { r: 0.0, g: 0.15, b: 0.3 }, opacity: 0.4 },
      ]},
    ],
  },
  neon: {
    bars: [
      { stops: [
        { offset: 0, color: { r: 0.0, g: 1.0, b: 1.0 } },
        { offset: 1, color: { r: 1.0, g: 0.0, b: 1.0 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 1.0, g: 0.0, b: 0.5 } },
        { offset: 0.5, color: { r: 1.0, g: 1.0, b: 0.0 } },
        { offset: 1, color: { r: 0.0, g: 1.0, b: 0.5 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.0, g: 0.5, b: 1.0 } },
        { offset: 0.5, color: { r: 1.0, g: 0.0, b: 1.0 } },
        { offset: 1, color: { r: 1.0, g: 0.5, b: 0.0 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.5, g: 0.0, b: 1.0 } },
        { offset: 1, color: { r: 0.0, g: 1.0, b: 0.8 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 1.0, g: 0.2, b: 0.6 } },
        { offset: 1, color: { r: 0.2, g: 0.6, b: 1.0 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.0, g: 1.0, b: 0.3 } },
        { offset: 1, color: { r: 1.0, g: 1.0, b: 0.0 } },
      ]},
    ],
    circles: [
      { cx: 0.5, cy: 0.5, r: 0.5, stops: [
        { offset: 0, color: { r: 1.0, g: 1.0, b: 1.0 } },
        { offset: 0.3, color: { r: 0.0, g: 1.0, b: 1.0 } },
        { offset: 1, color: { r: 1.0, g: 0.0, b: 1.0 } },
      ]},
      { cx: 0.3, cy: 0.3, r: 0.5, stops: [
        { offset: 0, color: { r: 1.0, g: 0.8, b: 0.0 } },
        { offset: 1, color: { r: 1.0, g: 0.2, b: 0.0 }, opacity: 0.8 },
      ]},
      { cx: 0.7, cy: 0.7, r: 0.5, stops: [
        { offset: 0, color: { r: 0.0, g: 1.0, b: 0.5 } },
        { offset: 1, color: { r: 0.0, g: 0.3, b: 1.0 }, opacity: 0.7 },
      ]},
      { cx: 0.5, cy: 0.5, r: 0.6, stops: [
        { offset: 0, color: { r: 1.0, g: 0.0, b: 0.8 } },
        { offset: 1, color: { r: 0.3, g: 0.0, b: 0.5 }, opacity: 0.5 },
      ]},
      { cx: 0.4, cy: 0.6, r: 0.4, stops: [
        { offset: 0, color: { r: 0.5, g: 1.0, b: 1.0 } },
        { offset: 1, color: { r: 0.8, g: 0.0, b: 1.0 }, opacity: 0.6 },
      ]},
    ],
  },
  rainbow: {
    bars: [
      { stops: [
        { offset: 0, color: { r: 1.0, g: 0.0, b: 0.0 } },
        { offset: 0.17, color: { r: 1.0, g: 0.5, b: 0.0 } },
        { offset: 0.33, color: { r: 1.0, g: 1.0, b: 0.0 } },
        { offset: 0.5, color: { r: 0.0, g: 1.0, b: 0.0 } },
        { offset: 0.67, color: { r: 0.0, g: 0.0, b: 1.0 } },
        { offset: 0.83, color: { r: 0.3, g: 0.0, b: 0.5 } },
        { offset: 1, color: { r: 0.5, g: 0.0, b: 0.5 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.9, g: 0.1, b: 0.3 } },
        { offset: 0.5, color: { r: 0.9, g: 0.9, b: 0.1 } },
        { offset: 1, color: { r: 0.1, g: 0.9, b: 0.5 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.2, g: 0.6, b: 1.0 } },
        { offset: 0.5, color: { r: 0.8, g: 0.2, b: 0.8 } },
        { offset: 1, color: { r: 1.0, g: 0.6, b: 0.2 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.0, g: 0.8, b: 0.4 } },
        { offset: 0.5, color: { r: 0.0, g: 0.4, b: 0.8 } },
        { offset: 1, color: { r: 0.8, g: 0.0, b: 0.4 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 1.0, g: 0.8, b: 0.0 } },
        { offset: 0.5, color: { r: 0.0, g: 0.8, b: 1.0 } },
        { offset: 1, color: { r: 1.0, g: 0.0, b: 0.8 } },
      ]},
      { stops: [
        { offset: 0, color: { r: 0.6, g: 0.0, b: 0.9 } },
        { offset: 0.5, color: { r: 1.0, g: 0.4, b: 0.0 } },
        { offset: 1, color: { r: 0.0, g: 0.9, b: 0.6 } },
      ]},
    ],
    circles: [
      { cx: 0.5, cy: 0.5, r: 0.5, stops: [
        { offset: 0, color: { r: 1.0, g: 1.0, b: 1.0 } },
        { offset: 0.2, color: { r: 1.0, g: 0.0, b: 0.0 } },
        { offset: 0.4, color: { r: 1.0, g: 1.0, b: 0.0 } },
        { offset: 0.6, color: { r: 0.0, g: 1.0, b: 0.0 } },
        { offset: 0.8, color: { r: 0.0, g: 0.0, b: 1.0 } },
        { offset: 1, color: { r: 0.5, g: 0.0, b: 0.5 } },
      ]},
      { cx: 0.3, cy: 0.5, r: 0.5, stops: [
        { offset: 0, color: { r: 1.0, g: 0.8, b: 0.0 } },
        { offset: 0.5, color: { r: 1.0, g: 0.2, b: 0.5 } },
        { offset: 1, color: { r: 0.5, g: 0.0, b: 1.0 }, opacity: 0.7 },
      ]},
      { cx: 0.7, cy: 0.5, r: 0.5, stops: [
        { offset: 0, color: { r: 0.0, g: 1.0, b: 0.8 } },
        { offset: 0.5, color: { r: 0.2, g: 0.5, b: 1.0 } },
        { offset: 1, color: { r: 1.0, g: 0.0, b: 0.5 }, opacity: 0.6 },
      ]},
      { cx: 0.5, cy: 0.3, r: 0.4, stops: [
        { offset: 0, color: { r: 1.0, g: 0.5, b: 0.8 } },
        { offset: 1, color: { r: 0.5, g: 0.8, b: 1.0 }, opacity: 0.5 },
      ]},
      { cx: 0.5, cy: 0.7, r: 0.4, stops: [
        { offset: 0, color: { r: 0.8, g: 1.0, b: 0.5 } },
        { offset: 1, color: { r: 0.5, g: 0.2, b: 0.8 }, opacity: 0.5 },
      ]},
    ],
  },
};

export function createGradientShowcaseScene(params: ParamValues) {
  const scene = new Scene();
  const style = (params.style as string) || 'sunset';
  const barCount = (params.barCount as number) || 4;
  const circleCount = (params.circleCount as number) || 3;

  const presets = gradientStyles[style as keyof typeof gradientStyles] ?? gradientStyles.sunset;

  // Orthographic camera for 2D SVG rendering
  const cam = new Node('camera');
  cam.addComponent(new Camera({
    type: CameraType.Orthographic,
    left: 0, right: 800,
    top: 0, bottom: 800,
    near: 0.1, far: 100,
  }));
  scene.add(cam);

  // Background
  const bg = new Node('background');
  bg.addComponent(createBox(800, 800, 0));
  bg.addComponent(new Material({ fill: { r: 0.09, g: 0.09, b: 0.09 } }));
  bg.transform.position = { x: 400, y: 400, z: 0 };
  scene.add(bg);

  // Calculate layout
  const margin = 100;
  const barWidth = 60;
  const barHeight = 500;
  const barSpacing = 20;
  const barsStartX = margin + barWidth / 2;
  const barsY = 400;

  // Create gradient bars
  const bars = presets.bars.slice(0, barCount);
  bars.forEach((gradDef, i) => {
    const bar = new Node(`bar-${i}`);
    bar.addComponent(createBox(barWidth, barHeight, 0));
    bar.addComponent(new Material({
      fillGradient: {
        type: 'linear',
        x1: 0, y1: 0,
        x2: 0, y2: 1,
        stops: gradDef.stops,
      },
    }));
    bar.transform.position = {
      x: barsStartX + i * (barWidth + barSpacing),
      y: barsY,
      z: 0,
    };
    scene.add(bar);
  });

  // Create radial gradient circles
  const circlesStartX = barsStartX + barCount * (barWidth + barSpacing) + 80;
  const circleRadius = 60;
  const circleSpacing = 30;
  const circles = presets.circles.slice(0, circleCount);

  circles.forEach((circleDef, i) => {
    const circle = new Node(`circle-${i}`);
    circle.addComponent(createSphere(circleRadius, 32, 32));
    circle.addComponent(new Material({
      fillGradient: {
        type: 'radial',
        cx: circleDef.cx,
        cy: circleDef.cy,
        r: circleDef.r,
        stops: circleDef.stops,
      },
    }));
    circle.transform.position = {
      x: circlesStartX + circleRadius,
      y: 150 + i * (circleRadius * 2 + circleSpacing) + circleRadius,
      z: 0,
    };
    scene.add(circle);
  });

  function animate(_time: number, _p: ParamValues) {
    // Static scene
  }

  return { scene, animate };
}
