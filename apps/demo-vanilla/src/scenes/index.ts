import type { DemoSceneDef } from '../types';
import { helloCubeControls, createHelloCubeScene } from './hello-cube';
import { colorPaletteControls, createColorPaletteScene } from './color-palette';
import { solarSystemControls, createSolarSystemScene } from './solar-system';
import { shapeGridControls, createShapeGridScene } from './shape-grid';
import { cameraViewpointsControls, createCameraViewpointsScene } from './camera-viewpoints';
import { proceduralCityControls, createProceduralCityScene } from './procedural-city';

export const DEMO_SCENES: DemoSceneDef[] = [
  {
    id: 'hello-cube',
    label: 'Hello Cube',
    description: 'Un cubo 3D con rotación quaternion suave. Demuestra la configuración básica de escena, cámara y geometría.',
    controls: helloCubeControls,
    factory: createHelloCubeScene,
  },
  {
    id: 'color-palette',
    label: 'Color Palette',
    description: 'Figuras geométricas con diferentes formas, colores y velocidades. Muestra createBox, createSphere y temas de color.',
    controls: colorPaletteControls,
    factory: createColorPaletteScene,
  },
  {
    id: 'solar-system',
    label: 'Solar System',
    description: 'Sistema planetario con órbitas jerárquicas usando nodos pivot padre-hijo. Demuestra transforms anidados.',
    controls: solarSystemControls,
    factory: createSolarSystemScene,
  },
  {
    id: 'shape-grid',
    label: 'Shape Grid',
    description: 'Grilla procedural con ola sinusoidal y colores por posición. Demuestra generación procedural y animación masiva.',
    controls: shapeGridControls,
    factory: createShapeGridScene,
  },
  {
    id: 'camera-viewpoints',
    label: 'Camera Viewpoints',
    description: 'Múltiples puntos de vista (orbital, frontal, cenital, lateral) sobre una escena con pilares y esferas. Demuestra posicionamiento y animación de cámaras.',
    controls: cameraViewpointsControls,
    factory: createCameraViewpointsScene,
  },
  {
    id: 'procedural-city',
    label: 'Procedural City',
    description: 'Ciudad generada algorítmicamente con edificios, parque central y torre destacada. Demuestra generación procedural y agrupación jerárquica.',
    controls: proceduralCityControls,
    factory: createProceduralCityScene,
  },
];
