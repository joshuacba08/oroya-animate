import type { DemoSceneDef } from '../types';
import { helloCubeControls, createHelloCubeScene } from './HelloCube';
import { colorPaletteControls, createColorPaletteScene } from './ColorPalette';
import { solarSystemControls, createSolarSystemScene } from './SolarSystem';
import { shapeGridControls, createShapeGridScene } from './ShapeGrid';
import { cameraViewpointsControls, createCameraViewpointsScene } from './CameraViewpoints';
import { proceduralCityControls, createProceduralCityScene } from './ProceduralCity';
import { interactiveDemoControls, createInteractiveDemoScene } from './InteractiveDemo';

export const DEMO_SCENES: DemoSceneDef[] = [
  {
    id: 'interactive-demo',
    label: '✨ Interactive Demo',
    description: 'Objetos interactivos con click, hover, cambio de color y animación. Demuestra el sistema de eventos e Interactive component.',
    renderer: 'three',
    controls: interactiveDemoControls,
    factory: createInteractiveDemoScene,
  },
  {
    id: 'hello-cube',
    label: 'Hello Cube',
    description: 'Un cubo 3D con rotación quaternion suave. Demuestra la configuración básica de escena, cámara y geometría.',
    renderer: 'three',
    controls: helloCubeControls,
    factory: createHelloCubeScene,
  },
  {
    id: 'color-palette',
    label: 'Color Palette',
    description: 'Figuras geométricas con diferentes formas, colores y velocidades. Muestra createBox, createSphere y temas de color.',
    renderer: 'three',
    controls: colorPaletteControls,
    factory: createColorPaletteScene,
  },
  {
    id: 'solar-system',
    label: 'Solar System',
    description: 'Sistema planetario con órbitas jerárquicas usando nodos pivot padre-hijo. Demuestra transforms anidados.',
    renderer: 'three',
    controls: solarSystemControls,
    factory: createSolarSystemScene,
  },
  {
    id: 'shape-grid',
    label: 'Shape Grid',
    description: 'Grilla procedural con ola sinusoidal y colores por posición. Demuestra generación procedural y animación masiva.',
    renderer: 'three',
    controls: shapeGridControls,
    factory: createShapeGridScene,
  },
  {
    id: 'camera-viewpoints',
    label: 'Camera Viewpoints',
    description: 'Múltiples puntos de vista (orbital, frontal, cenital, lateral) sobre una escena con pilares y esferas. Demuestra posicionamiento y animación de cámaras.',
    renderer: 'three',
    controls: cameraViewpointsControls,
    factory: createCameraViewpointsScene,
  },
  {
    id: 'procedural-city',
    label: 'Procedural City',
    description: 'Ciudad generada algorítmicamente con edificios, parque central y torre destacada. Demuestra generación procedural y agrupación jerárquica.',
    renderer: 'three',
    controls: proceduralCityControls,
    factory: createProceduralCityScene,
  },
];

