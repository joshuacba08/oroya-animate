import type { DemoSceneDef } from '../types';
import { helloCubeControls, createHelloCubeScene } from './HelloCube';
import { colorPaletteControls, createColorPaletteScene } from './ColorPalette';
import { solarSystemControls, createSolarSystemScene } from './SolarSystem';
import { shapeGridControls, createShapeGridScene } from './ShapeGrid';
import { cameraViewpointsControls, createCameraViewpointsScene } from './CameraViewpoints';
import { proceduralCityControls, createProceduralCityScene } from './ProceduralCity';
import { interactiveDemoControls, createInteractiveDemoScene } from './InteractiveDemo';
import { hoverShowcaseControls, createHoverShowcaseScene } from './HoverShowcase';
import { clickPlaygroundControls, createClickPlaygroundScene } from './ClickPlayground';
import { wheelAndBubblingControls, createWheelAndBubblingScene } from './WheelAndBubbling';

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
    id: 'hover-showcase',
    label: '🎯 Hover Showcase',
    description: '5 efectos hover distintos: levitar, girar, crecer, cambio de color y pulsar. Cada objeto usa un cursor CSS diferente (pointer, grab, zoom-in, crosshair, cell).',
    renderer: 'three',
    controls: hoverShowcaseControls,
    factory: createHoverShowcaseScene,
  },
  {
    id: 'click-playground',
    label: '🖱️ Click Playground',
    description: 'Click counter, toggle on/off, efecto de presión (pointerdown/up), ciclo de colores y explosión/reagrupación. Demuestra click, pointerdown y pointerup.',
    renderer: 'three',
    controls: clickPlaygroundControls,
    factory: createClickPlaygroundScene,
  },
  {
    id: 'wheel-bubbling',
    label: '🔄 Wheel & Bubbling',
    description: 'Rueda del mouse para escalar objetos, event bubbling padre→hijo con stopPropagation(), y pointer tracking con pointermove. Demuestra wheel, bubbling y pointermove.',
    renderer: 'three',
    controls: wheelAndBubblingControls,
    factory: createWheelAndBubblingScene,
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

