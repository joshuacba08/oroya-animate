# Registro de Cambios

Todos los cambios notables de Oroya Animate se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [0.9.0] - 2026-05-15

### Agregado
- **Paquete de física (`@joroya/physics`)**: `PhysicsSystem` que opera un mundo de `cannon-es` sobre cualquier `Scene`. Lee `RigidBody` + `Collider` desde `@joroya/core` y sincroniza transforms en espacio mundo cada step.
- **Joints / Restricciones**: `addHingeConstraint`, `addPointToPointConstraint`, `addDistanceConstraint`. Habilitan ragdolls, péndulos, cuerdas, ruedas.
- **Eventos de colisión**: `Node.events` ahora emite `collide-begin`, `collide`, `collide-end` para contactos sólidos y `trigger-enter`, `trigger-stay`, `trigger-exit` para sensores. El payload incluye nodo, punto y normal de contacto e impulso.
- **Colliders sensor/trigger**: `Collider.isTrigger` genera eventos sin respuesta de contacto.
- **Filtros de colisión**: `collisionGroup` y `collisionMask` por bitmask.
- **Raycast físico**: `PhysicsSystem.raycast` y `raycastAll` devuelven `{ node, point, normal, distance }` contra bodies.
- **Componente Animator (completo)**: `play(name)`, `stop()`, `crossFade(name, duration)`, `addClip(clip)` + `autoplay`. Anima nodos mediante el `AnimationMixer` engine-agnóstico de core.
- **Animation blending**: el `AnimationMixer` soporta múltiples clips concurrentes con peso por clip y rampas de crossfade. Las mezclas de cuaterniones usan nlerp con corrección de hemisferio.
- **Eventos por keyframe**: `AnimationClip.events: KeyframeEvent[]` emite eventos nombrados a medida que la cabeza de reproducción los cruza.
- **Evento `finished`**: clips sin loop emiten `finished` al llegar a su duración.
- **Helpers de easing + spring**: `linear`, `easeInQuad/easeOutQuad/easeInOutQuad`, variantes cúbicas y sinusoidales, `easeOutElastic`, y un integrador `spring(...)` con amortiguación crítica.
- **`Scene.update(dt)` corre cada frame** a través de `ThreeRenderer.render(dt)`, por lo que `Component.onUpdate` es ahora ciudadano de primera clase.
- **Tests**: `Animator`, `Easing` y `PhysicsSystem`.
- **EPIC**: [OA-007 — Física y Animación](docs/features/OA-007/EPIC.md).

### Cambiado
- `ThreeRenderer.render(dt?: number)` acepta `dt` real. El `0.016` hardcoded desaparece.
- `THREE.AnimationMixer` solo se crea cuando un nodo tiene un `SkinnedMesh` descendiente real.
- `Collider` añade `isTrigger`, `collisionGroup`, `collisionMask`.
- `Animator.definition.animations` ahora tipado como `Record<string, AnimationClip>` (sin `any`).

### Eliminado
- Código rapier huérfano en `@joroya/physics` (`PhysicsWorld.ts` y duplicados de RigidBody/Collider). El paquete es ahora single-backend (`cannon-es`).

### Corregido
- `pnpm typecheck` pasa en todos los paquetes, incluyendo `@joroya/physics` (antes bloqueado por dependencia faltante).
- `packages/physics/tsconfig.json` extiende `tsconfig.base.json`.

## [0.8.0] - 2026-05-15

### Agregado
- **Sistema de Sombras**: Flags `castShadow` / `receiveShadow` en todas las variantes de `GeometryDef`; `castShadow`, `shadowBias`, `shadowMapSize` en `DirectionalLightDef`, `PointLightDef` y `SpotLightDef`. El backend de Three.js activa `PCFSoftShadowMap` por defecto y aplica los flags a meshes, instanced meshes y luces.
- **Pipeline de Post-Procesado**: Componente declarativo `PostProcessing` con `bloom`, `toneMapping` (Reinhard / Cineon / ACESFilmic), `exposure` y `antialiasing` (SMAA). El backend ensambla una cadena `EffectComposer` idempotente (RenderPass → UnrealBloomPass → SMAAPass → OutputPass) y activa/desactiva passes mediante `.enabled` sin reasignar recursos de GPU.
- **Sistema de Partículas**: Componente `ParticleSystem` simulado en CPU (límite, tasa de emisión, gravedad, color inicial/final, tamaño inicial/final, textura opcional). El backend de Three.js lo renderiza como `THREE.Points` con vertex colors y blending aditivo.
- **Audio Espacial**: Componentes `AudioListener` y `AudioSource` mapeados a `THREE.AudioListener` y `THREE.PositionalAudio`. Buffers decodificados cacheados por URL; atenuación por cono y modelo de distancia pasan tal cual.
- **EPIC**: [OA-006 — Renderizado y Efectos Avanzados](docs/features/OA-006/EPIC.md).
- **Tests**: Cobertura Vitest para flags de sombra, emisión/decaimiento/gravedad de partículas y serialización de `PostProcessing`.

### Cambiado
- `PostProcessingDef.fxaa` (booleano, sin implementación) renombrado a `antialiasing` y respaldado por SMAA.
- `AudioSourceDef.url` queda documentado oficialmente (elegido sobre `buffer` para mantener el scene graph serializable y permitir que cada backend reutilice su propio loader/cache).
- `PostProcessing` se ancla oficialmente al **Camera node activo** para que las configuraciones multi-cámara (split-screen, picture-in-picture) tengan cadenas de FX independientes.

### Corregido
- Eliminados `// @ts-ignore` y `any` del camino de post-procesado en Three.js. `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `SMAAPass`, `OutputPass` y `Pass` ahora se resuelven desde `@types/three`. `composer` tipado como `EffectComposer | null`, `renderPostFX` acepta `PostProcessingDef`.

## [0.5.0] - 2026-02-17

### Agregado
- **Cargador glTF/GLB Completo**: Soporte completo para cargar modelos 3D con geometría y materiales desde Blender y otras herramientas 3D vía `@joroya/loader-gltf`
- **Renderizador Canvas2D**: Nuevo backend de renderizado Canvas2D nativo del navegador en `@joroya/renderer-canvas2d` para gráficos 2D ligeros
- **Operaciones Booleanas (CSG)**: Soporte de Geometría Sólida Constructiva para operaciones booleanas 2D/3D (unión, resta, intersección) usando `three-csg-ts`
- **Interpolación Spline Cúbica**: Interpolación avanzada de animación para transiciones suaves entre keyframes
- **SLERP de Cuaterniones**: Interpolación lineal esférica apropiada para rotaciones

### Mejorado
- **Backend SVG**: Soporte completo de transformaciones y manejo de grupos en `@joroya/renderer-svg`
- **Sistema de Animación**: Métodos de interpolación mejorados incluyendo spline cúbica para animaciones de grado profesional

### Cambiado
- Scope de organización cambiado de `@oroya` a `@joroya` en todos los paquetes

## [0.4.0] - 2026-01-XX

### Agregado
- **Sistema de Animación**: KeyframeTrack, AnimationClip, AnimationMixer con interpolación lineal/paso/cubicspline
- **Sistema de Interactividad**: EventEmitter, componente Interactive, InteractionEvent, BoundingBox (AABB)
- **Raycasting**: Eventos de puntero 3D (clic, hover, arrastre) en renderizador Three.js
- **Delegación de Eventos DOM**: Interactividad 2D en renderizador SVG
- **Controles de Órbita**: OrbitControlsWrapper para manipulación de cámara (órbita, paneo, zoom)
- **Cámara Ortográfica**: Soporte en todos los renderizadores
- **Buffer Geometry**: Soporte de geometría de texto con cálculo AABB
- **Motor de Arte Generativo SvJs**: Distribuciones y generadores Gaussianos, Pareto, ruido Perlin
- **Características Avanzadas SVG**: Degradados, filtros, clip-paths, máscaras, `<animate>` / `<animateTransform>`
- **Sitio Web de Documentación**: Sitio impulsado por Astro desplegado en Vercel
- **Infraestructura i18n**: Soporte de traducción en inglés, español y japonés

## [0.3.0] - 2025-12-XX

### Corregido
- Pipeline de construcción estabilizado: los 4 paquetes compilan exitosamente (CJS + ESM + DTS)
- Exportaciones correctas de `package.json` con extensiones de archivo apropiadas y orden de condición `types`-first
- Anulación de `composite: false` de TypeScript para compatibilidad con tsup DTS
- Errores de sintaxis en plantillas literales de renderer-svg

### Agregado
- Archivos barrel (`index.ts`) para todos los directorios de módulos
- `MaterialDef` extendido con propiedades específicas de SVG (`fill`, `stroke`, `strokeWidth`)
- Dependencia `@types/three` faltante a `@joroya/loader-gltf`
- Documentación de [Principios de Programación](docs/programming-principles.md)
- Documentación de [Análisis Post-Mortem de Errores de Construcción](docs/troubleshooting/build-errors-postmortem.md)

### Eliminado
- Código muerto e importaciones no utilizadas en los paquetes

## [0.2.0] - 2025-11-XX

### Agregado
- API funcional de Grafo de Escena (`Scene`, `Node`, `Transform` con matemáticas de matrices)
- Sistema de componentes (`Geometry`, `Material`, `Camera`)
- Primitivas geométricas: `createBox`, `createSphere`, `createPath2D`
- Renderizador Three.js con renderizado dinámico de escena
- Componente de cámara integrado en grafo de escena (Perspectiva)
- Cálculo de matriz mundial vía `updateWorldMatrices()`
- Demostraciones funcionales: Vanilla JS y React con cubos rotatorios animados
- TSDoc en todas las superficies de API públicas
- Documentación completa en la carpeta `docs/`

## [0.1.0] - 2025-10-XX

### Agregado
- Configuración inicial de monorepo con espacios de trabajo pnpm
- Pipeline de construcción TypeScript + tsup
- Paquetes base: `@joroya/core`, `@joroya/renderer-three`, `@joroya/renderer-svg`, `@joroya/loader-gltf`
- Interfaces iniciales de Grafo de Escena y clases base
- Aplicaciones de demostración (Vanilla JS + React)

---

## Enlaces de Paquetes

### Paquetes Publicados
- [@joroya/core](https://www.npmjs.com/package/@joroya/core) - Grafo de escena central y componentes
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three) - Renderizador WebGL Three.js
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg) - Renderizador SVG
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d) - Renderizador Canvas2D (Nuevo en 0.5.0)
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf) - Cargador de modelos glTF/GLB

### Documentación
- [Documentación Principal](https://oroya-animate.vercel.app)
- [Repositorio GitHub](https://github.com/joshuacba08/oroya-animate)
