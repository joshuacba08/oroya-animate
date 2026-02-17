# Oroya Animate 

<div align="center">

[![Versión NPM](https://img.shields.io/npm/v/@joroya/core?style=flat-square&logo=npm&label=@joroya/core)](https://www.npmjs.com/package/@joroya/core)
[![Licencia](https://img.shields.io/github/license/joshuacba08/oroya-animate?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)
[![Estado CI](https://img.shields.io/github/actions/workflow/status/joshuacba08/oroya-animate/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/joshuacba08/oroya-animate/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9+-orange?style=flat-square&logo=pnpm)](https://pnpm.io/)

**[Documentación](https://oroya-animate.vercel.app)** • **[NPM](https://www.npmjs.com/org/joroya)** • **[CDN](https://unpkg.com/@joroya/core)** • **[GitHub](https://github.com/joshuacba08/oroya-animate)**

</div>

Una biblioteca profesional de gráficos 2D/3D agnóstica al motor para la web. Construida con TypeScript, diseñada para escalabilidad y rendimiento.

## 🎯 Visión

Oroya Animate es una biblioteca de gráficos de alto nivel que desacopla la lógica de escena de la implementación de renderizado. Permite a los desarrolladores definir grafos de escena complejos una vez y renderizarlos usando diferentes backends como Three.js (WebGL), SVG o Canvas2D.

## 🎯 Características Clave

- **🦺 TypeScript Primero:** API completamente tipada para una experiencia de desarrollo robusta.
- **🧩 Arquitectura Modular:** Estructura de monorepo para clara separación de responsabilidades.
- **🔌 Agnóstico al Motor:** Define tu escena una vez, renderízala en cualquier lugar.
- **🎨 Múltiples Backends:** Soporte oficial para Three.js (3D), SVG (2D) y Canvas2D.
- **📦 Soporte glTF/GLB:** Carga modelos 3D complejos directamente en el grafo de escena agnóstico.
- **🎥 Cámara en Grafo de Escena:** Cámaras perspectivas y ortográficas como nodos del grafo de escena.
- **🎬 Sistema de Animación:** Animación basada en keyframes con `AnimationMixer` e interpolación.
- **🖱️ Interactividad:** Sistema de eventos integrado con raycasting (3D) y eventos DOM (SVG).
- **🌐 Controles de Órbita:** Controles de cámara con mouse/táctiles para escenas 3D.
- **🎨 Arte Generativo:** Motor SvJs con ruido, distribuciones y primitivas SVG.
- **⚛️ Compatible con React:** Wrappers optimizados para frameworks frontend modernos.

## 📦 Estructura del Proyecto

Este proyecto se gestiona como un monorepo usando espacios de trabajo de `pnpm`:

### Paquetes
- [`@joroya/core`](packages/core): El corazón de la biblioteca. Contiene el Grafo de Escena, sistema de Nodos y Componentes base.
- [`@joroya/renderer-three`](packages/renderer-three): Backend de renderizado WebGL impulsado por Three.js.
- [`@joroya/renderer-svg`](packages/renderer-svg): Backend de renderizado 2D ligero para SVG.
- [`@joroya/renderer-canvas2d`](packages/renderer-canvas2d): Backend de renderizado Canvas2D nativo del navegador.
- [`@joroya/loader-gltf`](packages/loader-gltf): Utilidades para importar modelos 3D al ecosistema Oroya.

### Aplicaciones
- [`demo-react`](apps/demo-react): Demostración de Oroya Animate trabajando con React y Three.js.
- [`demo-vanilla`](apps/demo-vanilla): Ejemplos mínimos usando JavaScript vanilla.
- [`web`](apps/web): Sitio web de documentación impulsado por Astro (desplegado en Vercel).

## 📚 Documentación

La documentación detallada está disponible en la carpeta [`docs/`](docs/) y en el sitio web:

### Documentación Principal
- [**Visión General de Arquitectura**](docs/architecture.md): Aprende sobre el diseño central agnóstico al motor.
- [**Comenzando**](docs/getting-started.md): Tu primera escena en 5 minutos.
- [**Grafo de Escena y Transformaciones**](docs/scene-graph.md): Inmersión profunda en nodos y componentes.
- [**Referencia API**](docs/api-reference.md): Referencia completa de clases, interfaces y funciones.
- [**Renderizadores**](docs/renderers.md): Documentación de backends Three.js, SVG y Canvas2D.
- [**Serialización**](docs/serialization.md): Guardar y cargar escenas como JSON.

### Despliegue y Publicación
- [**Publicación NPM**](docs/deployment/npm-publishing.md): Publicar paquetes en el registro NPM.
- [**Configuración CDN**](docs/deployment/cdn-setup.md): Usar paquetes directamente desde CDN.
- [**Despliegue Vercel**](docs/deployment/vercel-deployment.md): Desplegar sitio web de documentación.

### Desarrollo
- [**Contribuir y Desarrollo**](docs/contributing.md): Configuración, scripts y flujo de trabajo de desarrollo.
- [**Principios de Programación**](docs/programming-principles.md): Convenciones de código y reglas arquitectónicas.

### Tutoriales
- [**Tutoriales**](docs/tutorials/README.md): Guías paso a paso de principiante a avanzado.

## 🚀 Comenzando

### Instalación

#### NPM/PNPM (Recomendado)

```bash
npm install @joroya/core @joroya/renderer-three
# o
pnpm add @joroya/core @joroya/renderer-three
# o
yarn add @joroya/core @joroya/renderer-three
```

#### CDN (Sin instalación)

```html
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
  import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@0.3.0/dist/index.js';
  // Tu código aquí...
</script>
```

### Uso Básico

```typescript
import { Scene, Node, createBox, Material, Camera, CameraType } from '@joroya/core';
import { ThreeRenderer } from '@joroya/renderer-three';

// 1. Crear una escena
const scene = new Scene();

// 2. Agregar una cámara
const cameraNode = new Node('main-camera');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);

// 3. Crear un nodo con geometría y material
const box = new Node('my-box');
box.addComponent(createBox(1, 1, 1));
box.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
scene.add(box);

// 4. Renderizar con Three.js
const renderer = new ThreeRenderer({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
  width: window.innerWidth,
  height: window.innerHeight,
});
renderer.mount(scene);
renderer.render();
```

## 🗺️ Hoja de Ruta

### v0.1.0 — Arquitectura y Configuración ✅
- [x] Monorepo con espacios de trabajo de pnpm.
- [x] Pipeline de construcción TypeScript + tsup.
- [x] Paquetes base: `@joroya/core`, `@joroya/renderer-three`, `@joroya/renderer-svg`, `@joroya/loader-gltf`.
- [x] Interfaces iniciales de Grafo de Escena y clases base.
- [x] Aplicaciones de demostración (Vanilla JS + React).

### v0.2.0 — Primer Lanzamiento Funcional ✅
- [x] API funcional de Grafo de Escena (`Scene`, `Node`, `Transform` con matemáticas de matrices).
- [x] Sistema de componentes (`Geometry`, `Material`, `Camera`).
- [x] Primitivas geométricas: `createBox`, `createSphere`, `createPath2D`.
- [x] Renderizador Three.js: renderizado dinámico de escena, soporte de Box + Sphere.
- [x] Componente de cámara integrado en el grafo de escena (Perspectiva).
- [x] Cálculo de matriz mundial vía `updateWorldMatrices()`.
- [x] Demostraciones funcionales: Vanilla JS y React con cubos rotatorios animados.
- [x] TSDoc en todas las superficies de API públicas.
- [x] Documentación completa (ver [`docs/`](docs/)).

### v0.3.0 — Estabilización de Construcción y Endurecimiento del Proyecto ✅
- [x] Pipeline de construcción corregido: los 4 paquetes compilan exitosamente (CJS + ESM + DTS).
- [x] Exportaciones correctas de `package.json` (extensiones de archivo, orden de condición `types`-first).
- [x] Anulación de TypeScript `composite: false` para compatibilidad con tsup DTS.
- [x] Archivos barrel (`index.ts`) para todos los directorios de módulos.
- [x] `MaterialDef` extendido con propiedades específicas de SVG (`fill`, `stroke`, `strokeWidth`).
- [x] `@types/three` faltante agregado a `@joroya/loader-gltf`.
- [x] Código muerto eliminado (importaciones no utilizadas).
- [x] Errores de sintaxis corregidos en plantillas literales de renderer-svg.

### v0.4.0 — Interactividad, Animación y Arte Generativo ✅
- [x] **Sistema de animación**: `AnimationClip`, `AnimationMixer`, `KeyframeTrack` con interpolación lineal/paso/cubicspline.
- [x] **Sistema de interactividad**: `EventEmitter`, componente `Interactive`, `InteractionEvent`, `BoundingBox` (AABB).
- [x] **Raycasting** en renderizador Three.js para eventos de puntero 3D (clic, hover, arrastre).
- [x] **Delegación de eventos DOM** en renderizador SVG para interactividad 2D.
- [x] **Controles de órbita**: `OrbitControlsWrapper` para manipulación de cámara (órbita, paneo, zoom).
- [x] Soporte de **cámara ortográfica** en renderizadores.
- [x] **Buffer geometry** y soporte de **Text geometry** con cálculo AABB.
- [x] **Motor de arte generativo SvJs**: clase `SvJs`, módulo `Gen` (gaussiano, pareto, ruido), `Noise` (Perlin).
- [x] **Características avanzadas SVG**: degradados, filtros, clip-paths, máscaras, `<animate>` / `<animateTransform>`.
- [x] **Sitio web de documentación** (`apps/web`) desplegado en Vercel vía Astro.
- [x] **Infraestructura i18n**: Soporte de traducción para inglés, español y japonés.

### v0.5.0 — Completitud de Renderizadores y Pipeline 3D ✅
- [x] **Cargador glTF/GLB completo** (geometría + materiales desde Blender).
- [x] **Backend SVG completo** (soporte de transformaciones, grupos).
- [x] **Renderizador Canvas2D** nativo del navegador.
- [x] **Operaciones booleanas 2D/3D (CSG)** para modelado constructivo de sólidos.
- [x] **Interpolación spline cúbica** para animaciones suaves.
- [x] **SLERP de cuaterniones apropiado** para rotaciones interpoladas.

### v1.0.0 — Listo para Producción (Visión)
- [ ] Módulos WASM de alto rendimiento.
- [ ] Editor visual de escenas.
- [ ] Wrappers de frameworks (Vue, Angular).
- [ ] Sistema de plugins para componentes personalizados.
- [ ] Integración de física.

## 🚀 Publicación y Despliegue

### Paquetes en NPM

Todos los paquetes están publicados en NPM bajo el scope `@joroya`:
- [@joroya/core](https://www.npmjs.com/package/@joroya/core)
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three)
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg)
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d)
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf)

### Disponible en CDN

Todos los paquetes están automáticamente disponibles en múltiples CDNs:
- **unpkg:** `https://unpkg.com/@joroya/core`
- **jsDelivr:** `https://cdn.jsdelivr.net/npm/@joroya/core`
- **esm.sh:** `https://esm.sh/@joroya/core`

### Sitio Web de Documentación

Disponible en: **https://oroya-animate.vercel.app** (desplegado vía Vercel)

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee nuestra [Guía de Contribución](docs/contributing.md) para detalles sobre:
- Configuración de desarrollo
- Convenciones de código
- Proceso de pull request
- Reporte de problemas

## 📄 Licencia

MIT © [joshuacba08](https://github.com/joshuacba08)

---

<div align="center">

**Hecho con ❤️ por el Colaborador de IA Oroya**

[Reportar Bug](https://github.com/joshuacba08/oroya-animate/issues) · [Solicitar Característica](https://github.com/joshuacba08/oroya-animate/issues) · [Discusiones](https://github.com/joshuacba08/oroya-animate/discussions)

</div>
