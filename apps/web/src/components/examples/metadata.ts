import type { ExampleDef } from "./ExampleCard";

export const EXAMPLES: ExampleDef[] = [
  {
    id: "gltf-animation",
    title: "glTF Animation",
    description: "Carga de modelo .glb (BoxAnimated) y reproducción de animaciones usando AnimationMixer.",
    category: "3d",
    factory: async () => (await import("./factories/createGLTFDemo")).createGLTFDemo(),
  },

  {
    id: "colour-spiral",
    title: "Colour Spiral",
    description:
      "Espiral de puntos coloridos generados proceduralmente. Demuestra createSphere, fill con paleta de colores y posicionamiento polar.",
    category: "svg",
    factory: async () => (await import("./factories/createColourSpiral")).createColourSpiral(),
  },
  {
    id: "gradient-gallery",
    title: "Gradient Gallery",
    description:
      "Barras con gradientes lineales verticales y círculos con gradientes radiales. Demuestra fillGradient lineal y radial.",
    category: "svg",
    factory: async () => (await import("./factories/createGradientGallery")).createGradientGallery(),
  },
  {
    id: "circle-overlay",
    title: "Circle Overlay",
    description:
      "Círculos translúcidos superpuestos creando profundidad. Demuestra opacity, strokeGradient y composición visual.",
    category: "svg",
    factory: async () => (await import("./factories/createCircleOverlay")).createCircleOverlay(),
  },
  {
    id: "gradient-sphere",
    title: "Gradient Sphere",
    description:
      "Esfera con gradiente radial y silueta de ciudad superpuesta. Demuestra gradientes radiales complejos y strokeGradient en marcos.",
    category: "svg",
    factory: async () => (await import("./factories/createGradientSphere")).createGradientSphere(),
  },
  {
    id: "hello-cube",
    title: "Hello Cube",
    description:
      "Cubo 3D con rotación quaternion suave y esferas orbitales. Configuración básica de escena, cámara y geometría.",
    category: "3d",
    factory: async () => (await import("./factories/createHelloCube")).createHelloCube(),
  },
  {
    id: "solar-system",
    title: "Solar System",
    description:
      "Sistema planetario con órbitas jerárquicas usando nodos pivot padre-hijo. Demuestra transforms anidados.",
    category: "3d",
    factory: async () => (await import("./factories/createSolarSystem")).createSolarSystem(),
  },
  {
    id: "color-palette",
    title: "Color Palette",
    description:
      "Figuras geométricas con diferentes formas, colores y velocidades. Muestra createBox, createSphere y temas de color.",
    category: "3d",
    factory: async () => (await import("./factories/createColorPalette")).createColorPalette(),
  },
  {
    id: "shape-grid",
    title: "Shape Grid",
    description:
      "Grilla procedural con ola sinusoidal y colores por posición. Demuestra generación procedural y animación masiva.",
    category: "3d",
    factory: async () => (await import("./factories/createShapeGrid")).createShapeGrid(),
  },
  {
    id: "procedural-city",
    title: "Procedural City",
    description:
      "Ciudad generada algorítmicamente con edificios, parque central y torre. Demuestra generación procedural y agrupación jerárquica.",
    category: "3d",
    factory: async () => (await import("./factories/createProceduralCity")).createProceduralCity(),
  },
  {
    id: "porto-pareto",
    title: "Porto Pareto",
    description:
      "Paisaje urbano generativo usando distribución de Pareto para alturas de edificios. Demuestra Gen.pareto y constrains.",
    category: "svjs",
    factory: async () => (await import("./factories/createPortoPareto")).createPortoPareto(),
  },
  {
    id: "gaussian-dist",
    title: "Gaussian Distribution",
    description:
      "Visualización de distribución normal (campana de Gauss). Demuestra Gen.gaussian y mapeo de colores.",
    category: "svjs",
    factory: async () => (await import("./factories/createGaussianDist")).createGaussianDist(),
  },
  {
    id: "colourful-grids",
    title: "Colourful Grids",
    description:
      "Grilla con patrones recortados usando clipPath y decisiones probabilísticas con Gen.chance.",
    category: "svjs",
    factory: async () => (await import("./factories/createColourfulGrids")).createColourfulGrids(),
  },
  {
    id: "interactive-galaxy",
    title: "Interactive Galaxy",
    description:
      "Sistema de partículas con efecto de paralaje que sigue al mouse. Demuestra trackCursor y reactividad.",
    category: "svjs",
    factory: async () => (await import("./factories/createInteractiveGalaxy")).createInteractiveGalaxy(),
  },
  {
    id: "pbr-showcase",
    title: "PBR Material Showcase",
    description:
      "Esferas y cubos con materiales PBR variando metalness, roughness y emissive. Demuestra las nuevas propiedades de Material para renderizado físico.",
    category: "3d",
    factory: async () => (await import("./factories/createPBRShowcase")).createPBRShowcase(),
  },
  {
    id: "ortho-demo",
    title: "Orthographic Camera",
    description:
      "Vista ortográfica isométrica de una grilla de torres animadas. Demuestra CameraType.Orthographic con perspectiva sin distorsión.",
    category: "3d",
    factory: async () => (await import("./factories/createOrthoDemo")).createOrthoDemo(),
  },
  {
    id: "interactive-cubes",
    title: "Interactive Cubes",
    description:
      "Grilla 3x3 de cubos interactivos con componente Interactive y cursor pointer. Demuestra EventEmitter, Interactive y raycasting.",
    category: "3d",
    factory: async () => (await import("./factories/createInteractiveCubes")).createInteractiveCubes(),
  },
  {
    id: "interpolation-comparison",
    title: "Interpolation Modes",
    description:
      "Tres esferas animadas con AnimationMixer usando Linear, Step y CubicSpline. Compara visualmente los modos de interpolación de KeyframeTrack.",
    category: "3d",
    factory: async () => (await import("./factories/createInterpolationComparison")).createInterpolationComparison(),
  },
  {
    id: "filter-showcase",
    title: "SVG Filters",
    description:
      "Filtros SVG declarativos: Gaussian Blur progresivo y Drop Shadow con variaciones. Demuestra Material.filter con blur y dropShadow.",
    category: "svg",
    factory: async () => (await import("./factories/createFilterShowcase")).createFilterShowcase(),
  },
  {
    id: "clip-mask-demo",
    title: "Clip-Path & Mask",
    description:
      "Formas con clip-path (diamante, estrella) y mask (círculo, opacidad). Demuestra SvgClipPathDef y SvgMaskDef en Material.",
    category: "svg",
    factory: async () => (await import("./factories/createClipMaskDemo")).createClipMaskDemo(),
  },
  {
    id: "svg-animation",
    title: "SVG Native Animation",
    description:
      "Animaciones SVG nativas con <animate> y <animateTransform>: pulse, rotate, scale, translate, skewX y combinadas.",
    category: "svg",
    factory: async () => (await import("./factories/createSvgAnimationShowcase")).createSvgAnimationShowcase(),
  },
  {
    id: "interactive-demo",
    title: "Interactive Demo",
    description:
      "Objetos interactivos con click, hover, cambio de color y animación. Demuestra el sistema de eventos e Interactive component.",
    category: "3d",
    factory: async () => (await import("./factories/createInteractiveDemo")).createInteractiveDemo(),
  },
  {
    id: "hover-showcase",
    title: "Hover Showcase",
    description:
      "5 efectos hover distintos: levitar, girar, crecer, cambio de color y pulsar. Cada objeto usa un cursor CSS diferente.",
    category: "3d",
    factory: async () => (await import("./factories/createHoverShowcase")).createHoverShowcase(),
  },
  {
    id: "click-playground",
    title: "Click Playground",
    description:
      "Click counter, toggle on/off, efecto de presión, ciclo de colores y explosión/reagrupación. Demuestra click, pointerdown y pointerup.",
    category: "3d",
    factory: async () => (await import("./factories/createClickPlayground")).createClickPlayground(),
  },
  {
    id: "wheel-bubbling",
    title: "Wheel & Bubbling",
    description:
      "Rueda del mouse para escalar objetos, event bubbling padre→hijo con stopPropagation(), y pointer tracking con pointermove.",
    category: "3d",
    factory: async () => (await import("./factories/createWheelAndBubbling")).createWheelAndBubbling(),
  },
  {
    id: "camera-viewpoints",
    title: "Camera Viewpoints",
    description:
      "Múltiples puntos de vista (orbital, frontal, cenital, lateral) sobre una escena con pilares y esferas. Demuestra posicionamiento y animación de cámaras.",
    category: "3d",
    factory: async () => (await import("./factories/createCameraViewpoints")).createCameraViewpoints(),
  },
  {
    id: "svg-showcase",
    title: "SVG Showcase",
    description:
      "Catálogo visual de capacidades SVG: gradientes lineales/radiales, filtros (blur, drop-shadow), clip-path, mask, paths Bézier y stroke gradient.",
    category: "svg",
    factory: async () => (await import("./factories/createSvgShowcase")).createSvgShowcase(),
  },
  {
    id: "svg-animations",
    title: "SVG Animations",
    description:
      "Animaciones SVG nativas declarativas sin JavaScript: pulse (opacity), rotate, scale, color cycle, bounce (translate) y combinadas.",
    category: "svg",
    factory: async () => (await import("./factories/createSvgAnimations")).createSvgAnimations(),
  },
  {
    id: "svg-interactive",
    title: "SVG Interactive",
    description:
      "Grilla de figuras SVG interactivas con eventos click y hover. Usa renderToSVGElement con el componente Interactive para event delegation.",
    category: "svg",
    factory: async () => (await import("./factories/createSvgInteractive")).createSvgInteractive(),
  },
  {
    id: "nested-transforms",
    title: "Nested Transforms",
    description:
      "Jerarquía de transformaciones anidadas (parent → child → grandchild). Verifica que localMatrix + grupos SVG componen correctamente.",
    category: "svg",
    factory: async () => (await import("./factories/createNestedTransforms")).createNestedTransforms(),
  },
  {
    id: "svjs-generative",
    title: "Generative Native",
    description:
      "Arte generativo usando el wrapper nativo SvJs con elipses, control de iteraciones, hue y rotación.",
    category: "svjs",
    factory: async () => (await import("./factories/createSvJsGenerative")).createSvJsGenerative(),
  },
  {
    id: "textures",
    title: "Textures & Environment",
    description: "PBR materials with textures (maps for diffuse, normal, roughness, metalness) and environment settings (fog, background).",
    category: "3d",
    factory: async () => (await import("../../scenes/textures")).createTexturesScene(),
  },
  {
    id: "look-at",
    title: "Transform: LookAt",
    description: "Demonstrates the lookAt() method. Watcher objects track a moving target in real-time.",
    category: "3d",
    factory: async () => (await import("../../scenes/look-at")).createLookAtScene(),
  },
  {
    id: "instancing-demo",
    title: "Performance: Instancing",
    description: "Renders 2000 dynamic cubes using InstancedMesh. Demonstrates high-performance rendering with matrix and color updates.",
    category: "3d",
    factory: async () => (await import("../../scenes/instancing-demo")).createInstancingScene(),
  },
  {
    id: "shadows-demo",
    title: "Lighting: Shadows",
    description: "Directional light casting shadows from a sphere and cube onto a plane. Demonstrates shadow map support.",
    category: "3d",
    factory: async () => (await import("../../scenes/shadows-demo")).createShadowsScene(),
  },
  {
    id: "neon-city-demo",
    title: "Post-FX: Neon City",
    description: "Cyberpunk-style scene demonstrating Bloom and Tone Mapping post-processing effects on emissive materials.",
    category: "3d",
    factory: async () => (await import("../../scenes/neon-city-demo")).createNeonCityScene(),
  },
  {
    id: "fire-smoke-demo",
    title: "Particles: Fire & Smoke",
    description: "Particle system demonstration showing cpu-simulated fire and smoke effects.",
    category: "3d",
    factory: async () => (await import("../../scenes/fire-smoke-demo")).createFireSmokeScene(),
  },
  {
    id: "audio-demo",
    title: "Spatial Audio",
    description: "3D positional audio. Wear headphones! The green cube emits sound as it orbits.",
    category: "3d",
    factory: async () => (await import("../../scenes/audio-demo")).createAudioScene(),
  },
  {
    id: "physics-demo",
    title: "Physics: Falling Cubes",
    description: "Cannon-es physics integration (RigidBody + Collider).",
    category: "3d",
    factory: async () => (await import("../../scenes/physics-demo")).createPhysicsScene(),
  },
  {
    id: "animation-demo",
    title: "Animation: Bouncing Box",
    description: "Basic animation demo using Animator component and manual updates.",
    category: "3d",
    factory: async () => (await import("../../scenes/animation-demo")).createAnimationScene(),
  },
  {
    id: "trigger-volumes",
    title: "Physics: Trigger Volumes",
    description: "Sensor colliders fire trigger-enter / trigger-exit when bodies overlap them — without contact response. The zone glows when occupied.",
    category: "3d",
    factory: async () => (await import("../../scenes/trigger-volumes-demo")).createTriggerVolumesScene(),
  },
  {
    id: "animator-crossfade",
    title: "Animator: Cross-fade between three clips",
    description: "Hero cube cycles between idle / walk / spin clips using Animator.crossFade. Quaternion blending with nlerp + hemisphere correction.",
    category: "3d",
    factory: async () => (await import("../../scenes/animator-crossfade-demo")).createAnimatorCrossfadeScene(),
  },
  {
    id: "joints-chain",
    title: "Physics: Chain of joints",
    description: "Five spheres on point-to-point constraints — Newton's-cradle-style swing with elastic collisions.",
    category: "3d",
    factory: async () => (await import("../../scenes/joints-chain-demo")).createJointsChainScene(),
  },
];
