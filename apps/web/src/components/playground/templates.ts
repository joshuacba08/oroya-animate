export interface PlaygroundTemplate {
  id: string;
  title: string;
  category: "3d" | "svg" | "svjs";
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
];
