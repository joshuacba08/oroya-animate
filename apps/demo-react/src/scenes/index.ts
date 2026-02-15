import type { DemoSceneDef } from '../types';
import { cameraViewpointsControls, createCameraViewpointsScene } from './CameraViewpoints';
import { circleOverlayControls, createCircleOverlayScene } from './CircleOverlay';
import { clickPlaygroundControls, createClickPlaygroundScene } from './ClickPlayground';
import { colorPaletteControls, createColorPaletteScene } from './ColorPalette';
import { createGenerativeArtScene, generativeArtControls } from './GenerativeArt';
import { createGradientShowcaseScene, gradientShowcaseControls } from './GradientShowcase';
import { createHelloCubeScene, helloCubeControls } from './HelloCube';
import { createHoverShowcaseScene, hoverShowcaseControls } from './HoverShowcase';
import { createInteractiveDemoScene, interactiveDemoControls } from './InteractiveDemo';
import { createProceduralCityScene, proceduralCityControls } from './ProceduralCity';
import { createShapeGridScene, shapeGridControls } from './ShapeGrid';
import { createSolarSystemScene, solarSystemControls } from './SolarSystem';
import { createSvgAnimationsScene, svgAnimationsControls } from './SvgAnimations';
import { createSvgInteractiveScene, svgInteractiveControls } from './SvgInteractive';
import { createSvgShowcaseScene, svgShowcaseControls } from './SvgShowcase';
import { createWheelAndBubblingScene, wheelAndBubblingControls } from './WheelAndBubbling';

export const DEMO_SCENES: DemoSceneDef[] = [
  {
    id: 'interactive-demo',
    label: 'Interactive Demo',
    description: 'Objetos interactivos con click, hover, cambio de color y animación. Demuestra el sistema de eventos e Interactive component.',
    renderer: 'three',
    controls: interactiveDemoControls,
    factory: createInteractiveDemoScene,
  },
  {
    id: 'hover-showcase',
    label: 'Hover Showcase',
    description: '5 efectos hover distintos: levitar, girar, crecer, cambio de color y pulsar. Cada objeto usa un cursor CSS diferente (pointer, grab, zoom-in, crosshair, cell).',
    renderer: 'three',
    controls: hoverShowcaseControls,
    factory: createHoverShowcaseScene,
  },
  {
    id: 'click-playground',
    label: 'Click Playground',
    description: 'Click counter, toggle on/off, efecto de presión (pointerdown/up), ciclo de colores y explosión/reagrupación. Demuestra click, pointerdown y pointerup.',
    renderer: 'three',
    controls: clickPlaygroundControls,
    factory: createClickPlaygroundScene,
  },
  {
    id: 'wheel-bubbling',
    label: 'Wheel & Bubbling',
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
  {
    id: 'svg-showcase',
    label: 'SVG Showcase',
    description: 'Catálogo visual de capacidades SVG: gradientes lineales/radiales, filtros (blur, drop-shadow), clip-path, mask, paths Bézier, texto y stroke gradient.',
    renderer: 'svg',
    controls: svgShowcaseControls,
    factory: createSvgShowcaseScene,
  },
  {
    id: 'svg-animations',
    label: 'SVG Animations',
    description: 'Animaciones SVG nativas declarativas sin JavaScript: pulse (opacity), rotate, scale, color cycle, bounce (translate) y combinadas. Usa <animate> y <animateTransform>.',
    renderer: 'svg',
    controls: svgAnimationsControls,
    factory: createSvgAnimationsScene,
  },
  {
    id: 'svg-interactive',
    label: 'SVG Interactive',
    description: 'Grilla de figuras SVG interactivas con eventos click y hover. Usa renderToSVGElement con el componente Interactive para event delegation.',
    renderer: 'svg',
    controls: svgInteractiveControls,
    factory: createSvgInteractiveScene,
  },
  {
    id: 'gradient-showcase',
    label: 'Gradient Showcase',
    description: 'Muestra de gradientes lineales y radiales con múltiples stops de color. Estilos: atardecer, océano, neón, arcoíris.',
    renderer: 'svg',
    controls: gradientShowcaseControls,
    factory: createGradientShowcaseScene,
  },
  {
    id: 'circle-overlay',
    label: 'Circle Overlay',
    description: 'Círculos semi-transparentes superpuestos creando patrones de interferencia. Demuestra opacidad y composición de formas.',
    renderer: 'svg',
    controls: circleOverlayControls,
    factory: createCircleOverlayScene,
  },
  {
    id: 'generative-art',
    label: 'Generative Art',
    description: 'Composiciones de color inspiradas en artistas famosos: Albers, Mondrian, Bauhaus. Demuestra paletas de color y filtros.',
    renderer: 'svg',
    controls: generativeArtControls,
    factory: createGenerativeArtScene,
  },
];

