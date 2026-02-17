export interface PlaygroundTemplate {
  id: string;
  title: string;
  category: "3d" | "svg" | "svjs" | "canvas2d";
  description: string;
  code: string;
}

export const TEMPLATES: PlaygroundTemplate[] = [
  {
    id: "hello-cube",
    title: "Hello Cube",
    category: "3d",
    description: "Un cubo 3D rotando con Three.js",
    code: `// Hello Cube — Cubo 3D rotando
// Todas las clases de @joroya/core y renderers están disponibles como globales.
// Variables disponibles: canvas, container, onCleanup

const scene = new Scene();

// Cámara
const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 2, z: 5 };
scene.add(cam);

// Suelo
const ground = new Node("ground");
ground.addComponent(createBox(10, 0.15, 10));
ground.addComponent(new Material({ color: { r: 0.1, g: 0.1, b: 0.14 } }));
ground.transform.position = { x: 0, y: -1.5, z: 0 };
scene.add(ground);

// Cubo
const cube = new Node("cube");
cube.addComponent(createBox(1.5, 1.5, 1.5));
cube.addComponent(new Material({ color: { r: 0.29, g: 0.48, b: 1.0 } }));
scene.add(cube);

// Renderer
const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);

// Animación
let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

function loop(time) {
  if (disposed) return;
  const t = time * 0.001;
  const sin = Math.sin(t * 0.5);
  const cos = Math.cos(t * 0.5);
  cube.transform.rotation = { x: 0, y: sin, z: 0, w: cos };
  cube.transform.updateLocalMatrix();
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },
  {
    id: "color-spheres",
    title: "Esferas de colores",
    category: "3d",
    description: "Esferas animadas con colores vibrantes",
    code: `// Esferas de colores orbitando
const scene = new Scene();

const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 3, z: 8 };
scene.add(cam);

// Esfera central
const center = new Node("center");
center.addComponent(createSphere(0.8, 32, 32));
center.addComponent(new Material({ color: { r: 1, g: 1, b: 1 } }));
scene.add(center);

// Esferas orbitantes
const colors = [
  { r: 1, g: 0.2, b: 0.3 },
  { r: 0.2, g: 1, b: 0.4 },
  { r: 0.3, g: 0.4, b: 1 },
  { r: 1, g: 0.8, b: 0.1 },
  { r: 0.8, g: 0.2, b: 1 },
  { r: 0.1, g: 0.9, b: 0.9 },
];

const spheres = [];
for (let i = 0; i < colors.length; i++) {
  const s = new Node("sphere-" + i);
  s.addComponent(createSphere(0.35, 24, 24));
  s.addComponent(new Material({ color: colors[i] }));
  scene.add(s);
  spheres.push(s);
}

const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

function loop(time) {
  if (disposed) return;
  const t = time * 0.001;

  // Rotar esfera central
  center.transform.rotation = { x: 0, y: Math.sin(t * 0.3), z: 0, w: Math.cos(t * 0.3) };
  center.transform.updateLocalMatrix();

  // Orbitar esferas
  for (let i = 0; i < spheres.length; i++) {
    const angle = t * 0.5 + (i / spheres.length) * Math.PI * 2;
    const radius = 3;
    const yOff = Math.sin(t + i * 1.2) * 0.8;
    spheres[i].transform.position = {
      x: Math.cos(angle) * radius,
      y: yOff,
      z: Math.sin(angle) * radius,
    };
    spheres[i].transform.updateLocalMatrix();
  }

  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },
  {
    id: "svg-shapes",
    title: "SVG Gradientes",
    category: "svg",
    description: "Figuras SVG con gradientes lineales y radiales",
    code: `// SVG — Figuras con gradientes
// renderToSVG() convierte una escena a SVG estático

const scene = new Scene();

// Cámara ortográfica para SVG
const cam = new Node("cam");
cam.addComponent(new Camera({
  type: CameraType.Orthographic,
  left: 0, right: 500, top: 0, bottom: 500,
  near: 0.1, far: 100,
}));
scene.add(cam);

// Fondo oscuro
const bg = new Node("bg");
bg.addComponent(createBox(500, 500, 0));
bg.addComponent(new Material({ fill: { r: 0.08, g: 0.09, b: 0.12 } }));
bg.transform.position = { x: 250, y: 250, z: 0 };
bg.transform.updateLocalMatrix();
scene.add(bg);

// Barra con gradiente lineal
const bar1 = new Node("bar1");
bar1.addComponent(createBox(60, 300, 0));
bar1.addComponent(new Material({
  fillGradient: {
    type: "linear",
    x1: 0.5, y1: 0, x2: 0.5, y2: 1,
    stops: [
      { offset: 0, color: { r: 0.45, g: 0.5, b: 0.85 } },
      { offset: 1, color: { r: 0.2, g: 0.7, b: 0.9 } },
    ],
  },
}));
bar1.transform.position = { x: 100, y: 250, z: 0 };
bar1.transform.updateLocalMatrix();
scene.add(bar1);

// Barra con gradiente multicolor
const bar2 = new Node("bar2");
bar2.addComponent(createBox(60, 300, 0));
bar2.addComponent(new Material({
  fillGradient: {
    type: "linear",
    x1: 0.5, y1: 0, x2: 0.5, y2: 1,
    stops: [
      { offset: 0, color: { r: 0.0, g: 0.8, b: 0.8 } },
      { offset: 0.5, color: { r: 0.3, g: 0.8, b: 0.5 } },
      { offset: 1, color: { r: 0.85, g: 0.75, b: 0.2 } },
    ],
  },
}));
bar2.transform.position = { x: 200, y: 250, z: 0 };
bar2.transform.updateLocalMatrix();
scene.add(bar2);

// Círculo con gradiente radial
const circle1 = new Node("circle1");
circle1.addComponent(createSphere(60));
circle1.addComponent(new Material({
  fillGradient: {
    type: "radial",
    cx: 0.35, cy: 0.35, r: 0.6,
    stops: [
      { offset: 0, color: { r: 0.6, g: 0.85, b: 1 } },
      { offset: 0.5, color: { r: 0.3, g: 0.5, b: 0.9 } },
      { offset: 1, color: { r: 0.15, g: 0.2, b: 0.6 } },
    ],
  },
}));
circle1.transform.position = { x: 370, y: 160, z: 0 };
circle1.transform.updateLocalMatrix();
scene.add(circle1);

// Segundo círculo
const circle2 = new Node("circle2");
circle2.addComponent(createSphere(60));
circle2.addComponent(new Material({
  fillGradient: {
    type: "radial",
    cx: 0.4, cy: 0.4, r: 0.6,
    stops: [
      { offset: 0, color: { r: 1, g: 0.3, b: 0.1 } },
      { offset: 0.5, color: { r: 0.2, g: 0.8, b: 0.7 } },
      { offset: 1, color: { r: 0, g: 0.6, b: 0.85 } },
    ],
  },
}));
circle2.transform.position = { x: 370, y: 340, z: 0 };
circle2.transform.updateLocalMatrix();
scene.add(circle2);

// Renderizar
const svgString = renderToSVG(scene, { width: 500, height: 500 });
container.innerHTML = svgString;
const svgEl = container.querySelector("svg");
if (svgEl) {
  svgEl.style.width = "100%";
  svgEl.style.height = "100%";
}
`,
  },
  {
    id: "generative-circles",
    title: "Círculos generativos",
    category: "svjs",
    description: "Arte generativo con distribución gaussiana usando SvJs",
    code: `// Arte generativo — Círculos con distribución gaussiana
// SvJs y Gen están disponibles como globales

const svg = new SvJs();
svg.addTo(container);
svg.set({ viewBox: "0 0 500 500" });

// Fondo
const bg = svg.create("rect");
bg.set({ width: 500, height: 500, fill: "#0f172a" });

// Generar círculos con distribución gaussiana
for (let i = 0; i < 200; i++) {
  const circle = svg.create("circle");
  const x = Gen.gaussian(250, 80);
  const y = Gen.gaussian(250, 80);
  const r = Gen.gaussian(4, 3);
  const hue = Gen.gaussian(220, 40);
  const alpha = Math.random() * 0.6 + 0.2;

  circle.set({
    cx: x,
    cy: y,
    r: Math.abs(r) + 1,
    fill: \`hsla(\${hue}, 80%, 65%, \${alpha})\`,
  });
}

// Círculos de acento
for (let i = 0; i < 15; i++) {
  const circle = svg.create("circle");
  const angle = (i / 15) * Math.PI * 2;
  const radius = Gen.gaussian(120, 20);

  circle.set({
    cx: 250 + Math.cos(angle) * radius,
    cy: 250 + Math.sin(angle) * radius,
    r: Gen.gaussian(8, 4) + 2,
    fill: "none",
    stroke: \`hsla(\${Gen.gaussian(280, 30)}, 90%, 70%, 0.6)\`,
    "stroke-width": 1.5,
  });
}

svg.element.style.width = "100%";
svg.element.style.height = "100%";
`,
  },
  {
    id: "solar-system",
    title: "Sistema Solar",
    category: "3d",
    description: "Sistema solar con jerarquía padre-hijo",
    code: `// Sistema Solar — Jerarquía de transforms
const scene = new Scene();

const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 500,
}));
cam.transform.position = { x: 0, y: 8, z: 14 };
scene.add(cam);

// Sol
const sun = new Node("sun");
sun.addComponent(createSphere(1.2, 32, 32));
sun.addComponent(new Material({ color: { r: 1, g: 0.85, b: 0.2 } }));
scene.add(sun);

// Planeta 1 — órbita del sol
const orbit1 = new Node("orbit1");
scene.add(orbit1);

const planet1 = new Node("planet1");
planet1.addComponent(createSphere(0.4, 24, 24));
planet1.addComponent(new Material({ color: { r: 0.3, g: 0.5, b: 1.0 } }));
planet1.transform.position = { x: 4, y: 0, z: 0 };
orbit1.add(planet1);

// Luna de planeta 1
const moonOrbit = new Node("moonOrbit");
planet1.add(moonOrbit);

const moon = new Node("moon");
moon.addComponent(createSphere(0.15, 16, 16));
moon.addComponent(new Material({ color: { r: 0.7, g: 0.7, b: 0.7 } }));
moon.transform.position = { x: 1, y: 0, z: 0 };
moonOrbit.add(moon);

// Planeta 2
const orbit2 = new Node("orbit2");
scene.add(orbit2);

const planet2 = new Node("planet2");
planet2.addComponent(createSphere(0.55, 24, 24));
planet2.addComponent(new Material({ color: { r: 0.9, g: 0.35, b: 0.2 } }));
planet2.transform.position = { x: 7.5, y: 0, z: 0 };
orbit2.add(planet2);

// Planeta 3
const orbit3 = new Node("orbit3");
scene.add(orbit3);

const planet3 = new Node("planet3");
planet3.addComponent(createSphere(0.3, 24, 24));
planet3.addComponent(new Material({ color: { r: 0.2, g: 0.85, b: 0.5 } }));
planet3.transform.position = { x: 10.5, y: 0, z: 0 };
orbit3.add(planet3);

const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

function loop(time) {
  if (disposed) return;
  const t = time * 0.001;

  // Rotar sol
  sun.transform.rotation = { x: 0, y: Math.sin(t * 0.2), z: 0, w: Math.cos(t * 0.2) };
  sun.transform.updateLocalMatrix();

  // Rotar órbitas
  orbit1.transform.rotation = { x: 0, y: Math.sin(t * 0.4), z: 0, w: Math.cos(t * 0.4) };
  orbit1.transform.updateLocalMatrix();

  orbit2.transform.rotation = { x: 0, y: Math.sin(t * 0.25), z: 0, w: Math.cos(t * 0.25) };
  orbit2.transform.updateLocalMatrix();

  orbit3.transform.rotation = { x: 0, y: Math.sin(t * 0.15), z: 0, w: Math.cos(t * 0.15) };
  orbit3.transform.updateLocalMatrix();

  // Rotar luna
  moonOrbit.transform.rotation = { x: 0, y: Math.sin(t * 1.5), z: 0, w: Math.cos(t * 1.5) };
  moonOrbit.transform.updateLocalMatrix();

  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },
  {
    id: "empty-3d",
    title: "Escena vacía (3D)",
    category: "3d",
    description: "Punto de partida vacío para experimentar con Three.js",
    code: `// Escena vacía — Punto de partida para 3D
// Agrega nodos, geometría y materiales a tu gusto

const scene = new Scene();

// Cámara
const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 2, z: 5 };
scene.add(cam);

// --- Tu código aquí ---
// Ejemplo:
// const myNode = new Node("my-object");
// myNode.addComponent(createBox(1, 1, 1));
// myNode.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
// scene.add(myNode);

const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

function loop(time) {
  if (disposed) return;
  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },

  // ── Nuevos Playground Templates ──────────────────────────────

  {
    id: "csg-builder",
    title: "CSG Builder",
    category: "3d",
    description: "Operaciones booleanas interactivas entre geometrías",
    code: `// CSG Builder — Operaciones booleanas interactivas
// Combina geometrías con Union, Subtract e Intersect

const scene = new Scene();

// Cámara
const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 60,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 3, z: 10 };
scene.add(cam);

// Luz ambiental
const ambient = new Node("ambient");
ambient.addComponent(new Light({
  type: LightType.Ambient,
  intensity: 0.4,
}));
scene.add(ambient);

// Luz direccional
const dirLight = new Node("dir-light");
dirLight.addComponent(new Light({
  type: LightType.Directional,
  intensity: 0.8,
  target: { x: 0, y: 0, z: 0 },
}));
dirLight.transform.position = { x: 5, y: 8, z: 5 };
scene.add(dirLight);

// Suelo
const ground = new Node("ground");
ground.addComponent(createBox(14, 0.1, 8));
ground.addComponent(new Material({
  color: { r: 0.1, g: 0.1, b: 0.13 },
  roughness: 0.9,
}));
ground.transform.position = { x: 0, y: -2.2, z: 0 };
scene.add(ground);

// Etiquetas (cubos finos como bases)
const labels = ["Subtract", "Union", "Intersect"];
const positions = [-4.2, 0, 4.2];

for (let i = 0; i < 3; i++) {
  const base = new Node("base-" + i);
  base.addComponent(createBox(3, 0.08, 3));
  base.addComponent(new Material({
    color: { r: 0.15, g: 0.15, b: 0.2 },
    roughness: 0.7,
  }));
  base.transform.position = { x: positions[i], y: -2.1, z: 0 };
  scene.add(base);
}

// ── CSG: Subtract (Cubo − Esfera) ──
const csgSubtract = new Node("csg-subtract");
csgSubtract.addComponent(new Geometry({
  type: GeometryPrimitive.CSG,
  operation: CSGOperation.Subtract,
  base: { type: GeometryPrimitive.Box, width: 2, height: 2, depth: 2 },
  modifier: {
    type: GeometryPrimitive.Sphere,
    radius: 1.3,
    widthSegments: 24,
    heightSegments: 24,
  },
}));
csgSubtract.addComponent(new Material({
  color: { r: 0.35, g: 0.55, b: 1.0 },
  metalness: 0.1,
  roughness: 0.4,
}));
csgSubtract.transform.position = { x: -4.2, y: 0, z: 0 };
scene.add(csgSubtract);

// ── CSG: Union (Cubo + Esfera) ──
const csgUnion = new Node("csg-union");
csgUnion.addComponent(new Geometry({
  type: GeometryPrimitive.CSG,
  operation: CSGOperation.Union,
  base: { type: GeometryPrimitive.Box, width: 1.6, height: 1.6, depth: 1.6 },
  modifier: {
    type: GeometryPrimitive.Sphere,
    radius: 1.2,
    widthSegments: 24,
    heightSegments: 24,
  },
}));
csgUnion.addComponent(new Material({
  color: { r: 0.2, g: 0.85, b: 0.5 },
  metalness: 0.1,
  roughness: 0.4,
}));
csgUnion.transform.position = { x: 0, y: 0, z: 0 };
scene.add(csgUnion);

// ── CSG: Intersect (Cubo ∩ Esfera) ──
const csgIntersect = new Node("csg-intersect");
csgIntersect.addComponent(new Geometry({
  type: GeometryPrimitive.CSG,
  operation: CSGOperation.Intersect,
  base: { type: GeometryPrimitive.Box, width: 2, height: 2, depth: 2 },
  modifier: {
    type: GeometryPrimitive.Sphere,
    radius: 1.3,
    widthSegments: 24,
    heightSegments: 24,
  },
}));
csgIntersect.addComponent(new Material({
  color: { r: 1.0, g: 0.4, b: 0.3 },
  metalness: 0.1,
  roughness: 0.4,
}));
csgIntersect.transform.position = { x: 4.2, y: 0, z: 0 };
scene.add(csgIntersect);

// Renderer
const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);
renderer.enableOrbitControls();

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

console.log("CSG Builder — Usa el mouse para orbitar");
console.log("Subtract: Cubo − Esfera (azul)");
console.log("Union: Cubo + Esfera (verde)");
console.log("Intersect: Cubo ∩ Esfera (rojo)");

function loop(time) {
  if (disposed) return;
  const t = time * 0.001;

  // Rotación suave de cada pieza
  const nodes = [csgSubtract, csgUnion, csgIntersect];
  for (const node of nodes) {
    const half = t * 0.3;
    node.transform.rotation = {
      x: Math.sin(t * 0.15) * 0.15,
      y: Math.sin(half),
      z: 0,
      w: Math.cos(half),
    };
    node.transform.updateLocalMatrix();
  }

  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },
  {
    id: "gltf-viewer",
    title: "glTF Viewer",
    category: "3d",
    description: "Carga y visualiza modelos 3D desde archivos glTF/GLB",
    code: `// glTF Viewer — Carga y visualiza modelos 3D
// loadGLTF() carga modelos glTF/GLB desde una URL

const scene = new Scene();

// Cámara
const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 45,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 500,
}));
cam.transform.position = { x: 3, y: 2, z: 5 };
scene.add(cam);

// Iluminación
const ambientLight = new Node("ambient");
ambientLight.addComponent(new Light({
  type: LightType.Ambient,
  color: { r: 1, g: 1, b: 1 },
  intensity: 0.5,
}));
scene.add(ambientLight);

const sunLight = new Node("sun");
sunLight.addComponent(new Light({
  type: LightType.Directional,
  color: { r: 1, g: 0.95, b: 0.9 },
  intensity: 1.2,
  target: { x: 0, y: 0, z: 0 },
}));
sunLight.transform.position = { x: 5, y: 8, z: 4 };
scene.add(sunLight);

const fillLight = new Node("fill");
fillLight.addComponent(new Light({
  type: LightType.Directional,
  color: { r: 0.6, g: 0.7, b: 1.0 },
  intensity: 0.4,
  target: { x: 0, y: 0, z: 0 },
}));
fillLight.transform.position = { x: -3, y: 2, z: -2 };
scene.add(fillLight);

// Suelo
const ground = new Node("ground");
ground.addComponent(createBox(10, 0.05, 10));
ground.addComponent(new Material({
  color: { r: 0.15, g: 0.15, b: 0.18 },
  roughness: 0.8,
}));
ground.transform.position = { x: 0, y: -0.03, z: 0 };
scene.add(ground);

// Renderer
const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

// ── Cargar modelo glTF ──
// Cambia la URL por cualquier modelo .glb público
const MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb";

console.info("Cargando modelo glTF...");

loadGLTF(MODEL_URL).then(({ scene: modelScene, animations }) => {
  if (disposed) return;

  // Agregar nodos del modelo a nuestra escena
  const modelRoot = new Node("model");
  const children = [...modelScene.root.children];
  for (const child of children) {
    modelRoot.add(child);
  }

  // El pato Duck.glb está en centímetros — escalar a metros
  modelRoot.transform.scale = { x: 0.01, y: 0.01, z: 0.01 };
  scene.add(modelRoot);

  console.info(
    "Modelo cargado: " +
    children.length + " nodos raíz"
  );

  if (animations.length > 0) {
    console.info("Animaciones: " + animations.map(a => a.name).join(", "));
    const mixer = new AnimationMixer(scene);
    mixer.play(animations[0]);

    let lastTime = 0;
    function animLoop(time) {
      if (disposed) return;
      const dt = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;
      mixer.update(dt);

      const t = time * 0.001;
      modelRoot.transform.rotation = {
        x: 0, y: Math.sin(t * 0.3), z: 0, w: Math.cos(t * 0.3),
      };
      modelRoot.transform.updateLocalMatrix();
      renderer.render();
      requestAnimationFrame(animLoop);
    }
    renderer.mount(scene);
    renderer.enableOrbitControls();
    requestAnimationFrame(animLoop);
  } else {
    console.info("Sin animaciones — rotando modelo");
    renderer.mount(scene);
    renderer.enableOrbitControls();

    function loop(time) {
      if (disposed) return;
      const t = time * 0.001;
      modelRoot.transform.rotation = {
        x: 0, y: Math.sin(t * 0.3), z: 0, w: Math.cos(t * 0.3),
      };
      modelRoot.transform.updateLocalMatrix();
      renderer.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
}).catch(err => {
  console.error("Error cargando modelo: " + err.message);
});
`,
  },
  {
    id: "canvas2d-shapes",
    title: "Canvas2D Shapes",
    category: "canvas2d",
    description: "Dibujo 2D interactivo con el renderer Canvas2D",
    code: `// Canvas2D Shapes — Dibujo 2D con el renderer Canvas2D
// renderToCanvas() renderiza una escena Oroya al Canvas 2D

const scene = new Scene();

// Cámara ortográfica
const cam = new Node("cam");
cam.addComponent(new Camera({
  type: CameraType.Orthographic,
  left: 0, right: 500, top: 0, bottom: 500,
  near: 0.1, far: 100,
}));
scene.add(cam);

// ── Fondo ──
const bg = new Node("bg");
bg.addComponent(createBox(500, 500, 0));
bg.addComponent(new Material({
  fill: { r: 0.06, g: 0.07, b: 0.1 },
}));
bg.transform.position = { x: 250, y: 250, z: 0 };
bg.transform.updateLocalMatrix();
scene.add(bg);

// ── Cuadrícula decorativa ──
for (let i = 0; i < 10; i++) {
  const line = new Node("grid-h-" + i);
  line.addComponent(createBox(500, 0.5, 0));
  line.addComponent(new Material({
    fill: { r: 0.15, g: 0.16, b: 0.2 },
  }));
  line.transform.position = { x: 250, y: i * 50 + 25, z: 0 };
  line.transform.updateLocalMatrix();
  scene.add(line);

  const vline = new Node("grid-v-" + i);
  vline.addComponent(createBox(0.5, 500, 0));
  vline.addComponent(new Material({
    fill: { r: 0.15, g: 0.16, b: 0.2 },
  }));
  vline.transform.position = { x: i * 50 + 25, y: 250, z: 0 };
  vline.transform.updateLocalMatrix();
  scene.add(vline);
}

// ── Rectángulo con gradiente ──
const rect = new Node("rect");
rect.addComponent(createBox(160, 100, 0));
rect.addComponent(new Material({
  fill: { r: 0.3, g: 0.5, b: 1.0 },
  stroke: { r: 0.5, g: 0.7, b: 1.0 },
  strokeWidth: 2,
}));
rect.transform.position = { x: 130, y: 120, z: 0 };
rect.transform.updateLocalMatrix();
scene.add(rect);

// ── Círculo (esfera 2D) ──
const circle = new Node("circle");
circle.addComponent(createSphere(50));
circle.addComponent(new Material({
  fill: { r: 1.0, g: 0.4, b: 0.3 },
  stroke: { r: 1.0, g: 0.6, b: 0.5 },
  strokeWidth: 2,
}));
circle.transform.position = { x: 370, y: 120, z: 0 };
circle.transform.updateLocalMatrix();
scene.add(circle);

// ── Triángulo con Path2D ──
const tri = new Node("triangle");
tri.addComponent(createPath2D([
  { command: "M", args: [0, -55] },
  { command: "L", args: [50, 40] },
  { command: "L", args: [-50, 40] },
  { command: "Z", args: [] },
]));
tri.addComponent(new Material({
  fill: { r: 0.2, g: 0.9, b: 0.6 },
  stroke: { r: 0.4, g: 1.0, b: 0.7 },
  strokeWidth: 2,
}));
tri.transform.position = { x: 130, y: 290, z: 0 };
tri.transform.updateLocalMatrix();
scene.add(tri);

// ── Estrella con Path2D ──
const star = new Node("star");
const starPath = [];
for (let i = 0; i < 10; i++) {
  const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
  const r = i % 2 === 0 ? 50 : 22;
  const cmd = i === 0 ? "M" : "L";
  starPath.push({ command: cmd, args: [
    Math.cos(angle) * r,
    Math.sin(angle) * r,
  ]});
}
starPath.push({ command: "Z", args: [] });

star.addComponent(createPath2D(starPath));
star.addComponent(new Material({
  fill: { r: 1.0, g: 0.85, b: 0.15 },
  stroke: { r: 1.0, g: 0.9, b: 0.4 },
  strokeWidth: 1.5,
}));
star.transform.position = { x: 370, y: 290, z: 0 };
star.transform.updateLocalMatrix();
scene.add(star);

// ── Texto ──
const title = new Node("title");
title.addComponent(createText("Canvas2D Renderer", {
  fontSize: 22,
  fontFamily: "sans-serif",
  fontWeight: "bold",
  textAnchor: "middle",
}));
title.addComponent(new Material({
  fill: { r: 0.9, g: 0.9, b: 0.95 },
}));
title.transform.position = { x: 250, y: 430, z: 0 };
title.transform.updateLocalMatrix();
scene.add(title);

const subtitle = new Node("subtitle");
subtitle.addComponent(createText("Formas, paths y texto — todo en Canvas 2D", {
  fontSize: 13,
  fontFamily: "sans-serif",
  textAnchor: "middle",
}));
subtitle.addComponent(new Material({
  fill: { r: 0.5, g: 0.5, b: 0.6 },
}));
subtitle.transform.position = { x: 250, y: 460, z: 0 };
subtitle.transform.updateLocalMatrix();
scene.add(subtitle);

// ── Animación ──
let disposed = false;
onCleanup(() => { disposed = true; });

let angle = 0;
function loop() {
  if (disposed) return;
  angle += 0.02;

  // Animar posiciones suavemente
  circle.transform.position = {
    x: 370 + Math.sin(angle) * 15,
    y: 120 + Math.cos(angle * 0.7) * 10,
    z: 0,
  };
  circle.transform.updateLocalMatrix();

  star.transform.position = {
    x: 370 + Math.cos(angle * 0.8) * 10,
    y: 290 + Math.sin(angle * 1.2) * 8,
    z: 0,
  };
  star.transform.updateLocalMatrix();

  // Renderizar al canvas
  renderToCanvas(scene, canvas, {
    width: canvas.width,
    height: canvas.height,
    backgroundColor: { r: 0.06, g: 0.07, b: 0.1 },
  });

  requestAnimationFrame(loop);
}
loop();

console.info("Canvas2D Shapes — Renderizado 2D animado");
`,
  },
  {
    id: "lighting-scene",
    title: "Lighting Scene",
    category: "3d",
    description: "Escena con luz ambiental, direccional, puntual y spot",
    code: `// Lighting Scene — Diferentes tipos de luz
// Ambient, Directional, Point y Spot

const scene = new Scene();

// Cámara
const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 55,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 5, z: 12 };
scene.add(cam);

// ── Suelo ──
const floor = new Node("floor");
floor.addComponent(createBox(20, 0.15, 20));
floor.addComponent(new Material({
  color: { r: 0.18, g: 0.18, b: 0.2 },
  roughness: 0.85,
  metalness: 0.0,
}));
floor.transform.position = { x: 0, y: -0.5, z: 0 };
scene.add(floor);

// ── Objetos en la escena ──
// Esfera central
const centerSphere = new Node("center-sphere");
centerSphere.addComponent(createSphere(1.2, 32, 32));
centerSphere.addComponent(new Material({
  color: { r: 0.9, g: 0.9, b: 0.92 },
  roughness: 0.15,
  metalness: 0.7,
}));
centerSphere.transform.position = { x: 0, y: 1.2, z: 0 };
scene.add(centerSphere);

// Cubos decorativos
const cubePositions = [
  { x: -3.5, z: -1 },
  { x: 3.5, z: -1 },
  { x: -2, z: 3 },
  { x: 2, z: 3 },
];
const cubeColors = [
  { r: 0.2, g: 0.4, b: 0.9 },
  { r: 0.9, g: 0.3, b: 0.2 },
  { r: 0.2, g: 0.8, b: 0.5 },
  { r: 0.8, g: 0.7, b: 0.1 },
];

const cubes = [];
for (let i = 0; i < cubePositions.length; i++) {
  const cube = new Node("cube-" + i);
  cube.addComponent(createBox(1.2, 1.2, 1.2));
  cube.addComponent(new Material({
    color: cubeColors[i],
    roughness: 0.5,
    metalness: 0.1,
  }));
  cube.transform.position = {
    x: cubePositions[i].x,
    y: 0.6,
    z: cubePositions[i].z,
  };
  scene.add(cube);
  cubes.push(cube);
}

// ── 1. Luz ambiental (base) ──
const ambientNode = new Node("ambient-light");
ambientNode.addComponent(new Light({
  type: LightType.Ambient,
  color: { r: 0.4, g: 0.45, b: 0.6 },
  intensity: 0.3,
}));
scene.add(ambientNode);
console.log("Ambient: iluminación base suave (azulada)");

// ── 2. Luz direccional (sol) ──
const dirNode = new Node("dir-light");
dirNode.addComponent(new Light({
  type: LightType.Directional,
  color: { r: 1.0, g: 0.95, b: 0.85 },
  intensity: 0.9,
  target: { x: 0, y: 0, z: 0 },
}));
dirNode.transform.position = { x: 5, y: 10, z: 5 };
scene.add(dirNode);
console.log("Directional: simula luz solar desde arriba-derecha");

// ── 3. Luz puntual (bombilla naranja) ──
const pointNode = new Node("point-light");
pointNode.addComponent(new Light({
  type: LightType.Point,
  color: { r: 1.0, g: 0.6, b: 0.2 },
  intensity: 2.5,
  distance: 12,
  decay: 2,
}));
pointNode.transform.position = { x: -3, y: 3, z: 2 };
scene.add(pointNode);

// Indicador visual de la luz puntual
const pointBulb = new Node("point-bulb");
pointBulb.addComponent(createSphere(0.15, 12, 12));
pointBulb.addComponent(new Material({
  color: { r: 1, g: 0.6, b: 0.2 },
  emissive: { r: 1, g: 0.6, b: 0.2 },
}));
pointBulb.transform.position = { x: -3, y: 3, z: 2 };
scene.add(pointBulb);
console.log("Point: bombilla naranja flotante (izquierda)");

// ── 4. Luz spot (foco azul) ──
const spotNode = new Node("spot-light");
spotNode.addComponent(new Light({
  type: LightType.Spot,
  color: { r: 0.3, g: 0.5, b: 1.0 },
  intensity: 4.0,
  distance: 20,
  angle: 0.5,
  penumbra: 0.6,
  decay: 2,
  target: { x: 2, y: 0, z: 2 },
}));
spotNode.transform.position = { x: 4, y: 7, z: 4 };
scene.add(spotNode);

// Indicador visual del spot
const spotBulb = new Node("spot-bulb");
spotBulb.addComponent(createSphere(0.12, 12, 12));
spotBulb.addComponent(new Material({
  color: { r: 0.3, g: 0.5, b: 1 },
  emissive: { r: 0.3, g: 0.5, b: 1 },
}));
spotBulb.transform.position = { x: 4, y: 7, z: 4 };
scene.add(spotBulb);
console.log("Spot: foco azul cónico (derecha)");

// Renderer
const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);
renderer.enableOrbitControls();

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

function loop(time) {
  if (disposed) return;
  const t = time * 0.001;

  // Animar luz puntual en círculo
  const px = Math.cos(t * 0.6) * 4;
  const pz = Math.sin(t * 0.6) * 4;
  const py = 2.5 + Math.sin(t) * 0.8;
  pointNode.transform.position = { x: px, y: py, z: pz };
  pointNode.transform.updateLocalMatrix();
  pointBulb.transform.position = { x: px, y: py, z: pz };
  pointBulb.transform.updateLocalMatrix();

  // Rotar cubos
  for (let i = 0; i < cubes.length; i++) {
    const half = t * 0.4 + i * 0.8;
    cubes[i].transform.rotation = {
      x: 0, y: Math.sin(half), z: 0, w: Math.cos(half),
    };
    cubes[i].transform.updateLocalMatrix();
  }

  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },
  {
    id: "smooth-animation",
    title: "Smooth Animation",
    category: "3d",
    description: "Comparación de interpolación cubic spline vs linear vs step",
    code: `// Smooth Animation — Cubic Spline vs Linear vs Step
// AnimationMixer con diferentes modos de interpolación

const scene = new Scene();

// Cámara
const cam = new Node("camera");
cam.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 50,
  aspect: canvas.width / canvas.height,
  near: 0.1,
  far: 200,
}));
cam.transform.position = { x: 0, y: 4, z: 14 };
scene.add(cam);

// Iluminación
const ambient = new Node("ambient");
ambient.addComponent(new Light({
  type: LightType.Ambient,
  intensity: 0.5,
}));
scene.add(ambient);

const dir = new Node("dir-light");
dir.addComponent(new Light({
  type: LightType.Directional,
  intensity: 0.8,
  target: { x: 0, y: 0, z: 0 },
}));
dir.transform.position = { x: 3, y: 8, z: 5 };
scene.add(dir);

// Suelo
const ground = new Node("ground");
ground.addComponent(createBox(18, 0.08, 6));
ground.addComponent(new Material({
  color: { r: 0.1, g: 0.1, b: 0.13 },
  roughness: 0.9,
}));
ground.transform.position = { x: 0, y: -0.5, z: 0 };
scene.add(ground);

// ── Pista visual (carril para cada esfera) ──
const trackColors = [
  { r: 0.15, g: 0.2, b: 0.35 },
  { r: 0.2, g: 0.3, b: 0.15 },
  { r: 0.3, g: 0.15, b: 0.15 },
];
const trackY = [2.5, 0.8, -0.8];
const labels = ["CUBIC SPLINE", "LINEAR", "STEP"];

for (let i = 0; i < 3; i++) {
  const track = new Node("track-" + i);
  track.addComponent(createBox(14, 0.06, 0.8));
  track.addComponent(new Material({
    color: trackColors[i],
    roughness: 0.8,
  }));
  track.transform.position = { x: 0, y: trackY[i] - 0.5, z: 0 };
  scene.add(track);
}

// ── Esferas animadas ──
// Definir keyframes de posición (izquierda → derecha con curva)
const duration = 3.0;
const keyTimes = new Float32Array([0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]);

// Posiciones: va y vuelve haciendo un arco
const keyPositions = new Float32Array([
  -6, 0, 0,   // t=0.0
  -2, 1.8, 0, // t=0.5
   2, 0, 0,   // t=1.0
   6, 2.2, 0, // t=1.5
   2, 0, 0,   // t=2.0
  -2, 1.5, 0, // t=2.5
  -6, 0, 0,   // t=3.0
]);

// 1. Cubic Spline (suave)
const sphereCubic = new Node("sphere-cubic");
sphereCubic.addComponent(createSphere(0.45, 24, 24));
sphereCubic.addComponent(new Material({
  color: { r: 0.35, g: 0.55, b: 1.0 },
  roughness: 0.2,
  metalness: 0.3,
}));
sphereCubic.transform.position = { x: -6, y: trackY[0], z: 0 };
scene.add(sphereCubic);

// 2. Linear
const sphereLinear = new Node("sphere-linear");
sphereLinear.addComponent(createSphere(0.45, 24, 24));
sphereLinear.addComponent(new Material({
  color: { r: 0.3, g: 0.85, b: 0.4 },
  roughness: 0.2,
  metalness: 0.3,
}));
sphereLinear.transform.position = { x: -6, y: trackY[1], z: 0 };
scene.add(sphereLinear);

// 3. Step
const sphereStep = new Node("sphere-step");
sphereStep.addComponent(createSphere(0.45, 24, 24));
sphereStep.addComponent(new Material({
  color: { r: 1.0, g: 0.35, b: 0.3 },
  roughness: 0.2,
  metalness: 0.3,
}));
sphereStep.transform.position = { x: -6, y: trackY[2], z: 0 };
scene.add(sphereStep);

// ── Crear AnimationClips ──

// Clip Linear
const clipLinear = {
  name: "linear-bounce",
  duration: duration,
  tracks: [{
    targetNodeName: "sphere-linear",
    property: "position",
    times: keyTimes,
    values: keyPositions.map((v, i) => {
      // Desplazar Y al carril linear
      return i % 3 === 1 ? v + trackY[1] : v;
    }),
    interpolation: "linear",
  }],
};

// Ajustar posiciones Y para cada carril
const makePosValues = (baseY) => {
  const out = new Float32Array(keyPositions.length);
  for (let i = 0; i < keyPositions.length; i += 3) {
    out[i] = keyPositions[i];         // x
    out[i + 1] = keyPositions[i + 1] + baseY; // y + carril
    out[i + 2] = keyPositions[i + 2]; // z
  }
  return out;
};

// Clip Step
const clipStep = {
  name: "step-bounce",
  duration: duration,
  tracks: [{
    targetNodeName: "sphere-step",
    property: "position",
    times: keyTimes,
    values: makePosValues(trackY[2]),
    interpolation: "step",
  }],
};

// ── Mixer para Linear y Step ──
const mixerLinear = new AnimationMixer(scene);
mixerLinear.play(clipLinear);

const mixerStep = new AnimationMixer(scene);
mixerStep.play(clipStep);

// ── Cubic spline manual (hermite) ──
// Interpolación manual ya que AnimationMixer cubicspline espera
// formato glTF (3 valores por keyframe)
function hermiteScalar(t, p0, m0, p1, m1) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2*t3 - 3*t2 + 1)*p0 + (t3 - 2*t2 + t)*m0
       + (-2*t3 + 3*t2)*p1 + (t3 - t2)*m1;
}

function getCubicPos(time) {
  const numKeys = keyTimes.length;
  let i1 = 0;
  for (let i = 0; i < numKeys - 1; i++) {
    if (time >= keyTimes[i] && time < keyTimes[i + 1]) {
      i1 = i;
      break;
    }
  }
  if (time >= keyTimes[numKeys - 1]) i1 = numKeys - 2;

  const i2 = i1 + 1;
  const t1 = keyTimes[i1];
  const t2 = keyTimes[i2];
  const alpha = t2 === t1 ? 0 : (time - t1) / (t2 - t1);
  const td = t2 - t1;

  // Auto-tangentes (Catmull-Rom estilo)
  const getVal = (idx, comp) => keyPositions[idx * 3 + comp];
  const tangent = (idx, comp) => {
    if (idx <= 0) return (getVal(1, comp) - getVal(0, comp));
    if (idx >= numKeys - 1)
      return (getVal(numKeys - 1, comp) - getVal(numKeys - 2, comp));
    return 0.5 * (getVal(idx + 1, comp) - getVal(idx - 1, comp));
  };

  const x = hermiteScalar(alpha,
    getVal(i1, 0), tangent(i1, 0) * td,
    getVal(i2, 0), tangent(i2, 0) * td
  );
  const y = hermiteScalar(alpha,
    getVal(i1, 1), tangent(i1, 1) * td,
    getVal(i2, 1), tangent(i2, 1) * td
  );
  return { x, y: y + trackY[0], z: 0 };
}

// Renderer
const renderer = new ThreeRenderer({
  canvas,
  width: canvas.width,
  height: canvas.height,
});
renderer.mount(scene);

let disposed = false;
onCleanup(() => { disposed = true; renderer.dispose(); });

console.log("Smooth Animation — Comparación de interpolación");
console.log("Azul: Cubic Spline (curvas suaves)");
console.log("Verde: Linear (línea recta entre keyframes)");
console.log("Rojo: Step (saltos discretos)");

let lastTime = 0;
function loop(time) {
  if (disposed) return;
  const dt = lastTime ? (time - lastTime) / 1000 : 0;
  lastTime = time;

  // Actualizar mixers
  mixerLinear.update(dt);
  mixerStep.update(dt);

  // Actualizar cubic spline manualmente
  const elapsed = (time * 0.001) % duration;
  const cubicPos = getCubicPos(elapsed);
  sphereCubic.transform.position = cubicPos;
  sphereCubic.transform.updateLocalMatrix();

  renderer.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
`,
  },
];
