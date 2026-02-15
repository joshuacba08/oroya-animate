import type { Scene } from '@oroya/core';
import type { AnimateCallback } from '../OroyaCanvas';
import { createHelloCubeScene } from './HelloCube';
import { createColorPaletteScene } from './ColorPalette';
import { createSolarSystemScene } from './SolarSystem';

export interface DemoScene {
  id: string;
  label: string;
  description: string;
  factory: () => { scene: Scene; animate: AnimateCallback };
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: 'hello-cube',
    label: 'Hello Cube',
    description: 'Un cubo 3D con rotación quaternion suave. Demuestra la configuración básica de escena, cámara y geometría.',
    factory: createHelloCubeScene,
  },
  {
    id: 'color-palette',
    label: 'Color Palette',
    description: 'Cinco gemas geométricas con diferentes formas, colores y velocidades de rotación. Muestra createBox y createSphere.',
    factory: createColorPaletteScene,
  },
  {
    id: 'solar-system',
    label: 'Solar System',
    description: 'Sistema planetario con órbitas jerárquicas usando nodos pivot padre-hijo. Demuestra transforms anidados.',
    factory: createSolarSystemScene,
  },
];
