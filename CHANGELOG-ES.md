# Registro de Cambios

Todos los cambios notables de Oroya Animate se documentarán en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2026-05-16

> **Primer release de producción.** Motor, ecosistema de desarrollo y herramientas de autoría están todos en su sitio. Todo lo etiquetado `@public` se publica bajo la política de estabilidad en [`docs/api-stability.md`](docs/api-stability.md) — los cambios incompatibles requieren bump mayor con ventana de deprecación de 1 versión mayor.

### Agregado
- **Sistema de plugins** (`@joroya/core/plugins`): `PluginRegistry`, `Plugin`, `ComponentHandler`. `ThreeRenderer.usePlugin(plugin)` instala handlers con precedencia sobre las ramas built-in. Packages third-party pueden extender el renderer sin forkearlo. 7 tests.
- **Tags de estabilidad de API** (`docs/api-stability.md`): convención `@public`/`@experimental`/`@internal` con auditoría vía `pnpm api:check`. Tagueada la superficie principal.
- **Editor visual** (`apps/editor`, alpha): editor de escenas en React con panel de jerarquía, inspector de transform (inputs numéricos por eje), y Save/Load usando la serialización de v0.10. Escena starter pre-cargada, botones Add Cube / Delete.
- **Hook de aceleración WASM** (`@joroya/core/math/MathBackend`): registro `getMathBackend()`/`registerMathBackend(backend)`. Default JS puro; packages futuros (`@joroya/wasm-math`) lo reemplazan sin cambios en código consumidor. La API está en su sitio para evitar un breaking change posterior. 3 tests.
- **Test aclarativo de InstancedMesh**: documenta que `InstancedMesh` no se deserializa por diseño (GPU state) mientras los `Float32Array` sí sobreviven el round-trip de v0.10.
- **EPIC**: [OA-011 — Production Ready (v1.0)](docs/features/OA-011/EPIC.md).

### Cambiado
- Todos los paquetes del workspace + root saltan de `0.12.0` a `1.0.0`. La forma del API pública no cambia; el bump señala estabilidad, no breakage.

### Compromisos de estabilidad
- Símbolos `@public` no cambian de forma sin bump mayor y al menos 1 versión mayor de deprecación.
- Símbolos `@experimental` (React/Vue, `Vehicle`, `solve2BoneIK`, `PluginRegistry`, math backend) pueden evolucionar en minors. Fijá la versión si dependés de ellos.

## [0.12.0] - 2026-05-16

### Agregado
- **Skinned mesh / animación esquelética glTF**: nuevo componente `Skin` con nombres de huesos + inverse bind matrices. `BufferGeometryDef` extendido con `skinIndices` y `skinWeights`. `loadGLTF` extrae atributos de skinning. `ThreeRenderer` construye `THREE.SkinnedMesh` y resuelve la `THREE.Skeleton` en un post-pass para que las referencias adelantadas a huesos funcionen.
- **IK analítica de 2 huesos** (`solve2BoneIK`): solución cerrada por ley de cosenos, O(1) por llamada. Vector polo opcional para fijar el plano del codo. 6 tests.
- **Helper `Vehicle`** (`@joroya/physics`): wrapper sobre `CANNON.RaycastVehicle`. API `drive/steer/brake/syncWheelNodes`. Soporta ruedas con/sin tracción y dirección independientes. 5 tests.
- **`PhysicsSystem.getBody(node)`**: materialización eager de bodies, usado por `Vehicle` para enlazar el chasis sin esperar al siguiente step.
- **EPIC**: [OA-010 — Skinned Mesh, IK y Vehículos](docs/features/OA-010/EPIC.md).

### Cambiado
- `BufferGeometry` en el renderer ahora alambrá los atributos `skinIndex` + `skinWeight` cuando están presentes.
- `ThreeRenderer.rebuildScene` resuelve bindings de skin post-traverse para soportar referencias adelantadas a huesos.

## [0.11.0] - 2026-05-15

### Agregado
- **`@joroya/inspector` (paquete nuevo)** — overlay de debug en DOM vanilla para un `Scene`. Jerarquía click-to-select, vista de transform y componentes del nodo seleccionado, métricas rodantes de FPS / tiempo de frame / peor hitch, y stats del scene graph. Framework-agnóstico (sin dep de React/Vue). Refresh DOM con throttling.
- **`@joroya/input` (paquete nuevo)** — capa unificada de teclado / ratón / gamepad con mapeo declarativo de acciones. `bindAction('jump', [{ key: 'Space' }, { gamepad: 'A' }])` y luego eventos `action-down` / `action` / `action-up`. Standard mapping de Gamepad + ejes analógicos. Auto-limpia estado en window blur.
- **`@joroya/assets` (paquete nuevo)** — cache centralizada con deduplicación, release ref-counted y eventos de progreso. Loaders integrados (`image`, `audio` → `AudioBuffer`, `json`, `text`, `binary`); extensible vía `registerLoader`. `preload([...])` emite `progress` / `loaded` / `error` por ítem; los fallos individuales no rechazan la promesa global.
- **`@joroya/react` (paquete nuevo, alpha)** — bindings de React. `<OroyaCanvas>` posee scene + renderer + loop RAF y expone hooks `useFrame(dt)`, `useScene()`, `useParentNode()`. Componentes JSX: `<Group>`, `<Box>`, `<Sphere>`, `<Plane>`, `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>`.
- **`@joroya/vue` (paquete nuevo, alpha)** — composables Vue 3. `useOroyaCanvas(canvasRef)`, `useFrame((dt) => ...)`, `useNode((node) => setup)`. Usa `shallowRef` para que la reactividad no recurra por el scene graph.
- **22 tests nuevos** en los 3 paquetes framework-agnósticos.
- **EPIC**: [OA-009 — Ecosistema (Inspector, Input, Assets, Framework Wrappers)](docs/features/OA-009/EPIC.md).

### Cambiado
- El glob de `pnpm lint` ahora incluye `.tsx` para cubrir el JSX del wrapper de React.
- Roadmap del README: v0.11.0 promovido de "Planned" a "Shipped".

## [0.10.0] - 2026-05-15

### Agregado
- **Serialización completa de typed arrays**: `Float32Array`, `Uint8Array`, `Uint16Array` y `Uint32Array` sobreviven a JSON vía base64 (formato compatible con glTF). Esto desbloquea save/load de `AnimationClip`, `BufferGeometryDef` y matrices de `InstancedMesh` — prerrequisitos del editor visual v1.0.
- **Deserialización para cada componente publicado**: `RigidBody`, `Collider`, `Animator`, `PostProcessing`, `ParticleSystem`, `AudioListener`, `AudioSource`, `Environment`. 9 nuevos tests de round-trip.
- **Paridad de backends para `Animator`**: `renderToSVG`, `renderToSVGElement` y `Canvas2DRenderer.render` ahora ejecutan `Scene.update(dt)` antes del pase de matrices, aceptando `options.dt` (default `1/60`). El Animator funciona en los tres backends.
- **ESLint con flat config**: `no-explicit-any`, `no @ts-ignore` y unused-vars. Script `pnpm lint` + gate en CI.
- **EPIC**: [OA-008 — Serialización, Paridad de Backends y Endurecimiento](docs/features/OA-008/EPIC.md).

### Cambiado
- `pnpm test` ahora ejecuta `vitest run` (sin watch) para que CI no cuelgue. `pnpm test:watch` cubre el modo interactivo anterior.
- `apps/web/src/scenes/animation-demo.ts` reescrito con la API real de `Animator` (clips idle/walk/spin + `crossFadeTo` + eventos `footstep`).
- `packages/core/src/components/index.ts` ahora es un barrel completo.
- Roadmap del README sincronizado con la realidad.

### Corregido
- **Bug: `deserialize` perdía la mitad de los nodos root**. `forEach` mutaba el array fuente al reparentar. Sustituido por snapshot + for-loop.
- `EventEmitter` ya no usa `any` en su Set interno.
- `loadGLTF.ts`, `InstancedMeshComponent.getMatrixAt` y `Gen.random` ya no usan `any`.

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
- [Documentación Principal](https://oroya-animate.oroyajs.com)
- [Repositorio GitHub](https://github.com/joshuacba08/oroya-animate)
