# OROYA ANIMATE



## CONTEXTO

Quiero diseñar una librería profesional de generación y renderizado de geometrías 2D y 3D orientada a web.

Debe cumplir lo siguiente:

- Escrita en TypeScript
- Publicable en npm
- Arquitectura modular (monorepo)
- Core agnóstico de motor de render
- Backends:
  - Three.js (WebGL)
  - SVG
  - Canvas2D
- Compatible con modelos exportados desde Blender (glTF/GLB)
- Capaz de manejar render dinámico (animaciones, instancing, transformaciones)
- Escalable para integración con React, Angular y Vue (wrappers opcionales)
- API limpia y profesional
- Pensada como proyecto open source serio

Actúa como:

- Arquitecto de librerías JavaScript de alto nivel
- Maintainer de proyecto open source grande
- Diseñador de API elegante
- Experto en TypeScript y diseño modular

No des respuestas superficiales. Quiero arquitectura real, coherente y escalable.

------

## OBJETIVO

Diseña la arquitectura completa del proyecto incluyendo:

1. Estructura de monorepo (pnpm workspaces)
2. Separación clara entre:
   - core
   - backends
   - loaders
   - framework adapters
3. Diseño del scene graph interno
4. Tipos TypeScript fundamentales
5. API pública elegante
6. Sistema de renderers
7. Estrategia para carga glTF desde Blender
8. Ejemplo de uso real en:
   - Vanilla JS
   - React
9. Estrategia de build (tsup o rollup)
10. Configuración de package.json moderna (exports, types)
11. Roadmap evolutivo
12. Consideraciones de performance (instancing, LOD, culling)
13. Estrategia de versionado (changesets)
14. Testing strategy (Vitest)
15. Ejemplo mínimo funcional de implementación del core

------

## RESTRICCIONES TÉCNICAS

- No mezclar lógica del core con Three.js directamente
- Core debe ser completamente agnóstico del render
- Los backends deben funcionar como "compiladores" del scene graph
- Evitar dependencias innecesarias
- API declarativa y extensible
- Código limpio y profesional

------

## SALIDA ESPERADA

Quiero que la respuesta esté organizada en:

1. Visión conceptual
2. Diagrama arquitectónico (en ASCII o Mermaid)
3. Estructura de carpetas
4. Diseño del Scene Graph
5. Definición de interfaces TypeScript clave
6. Implementación mínima del core
7. Ejemplo de Renderer Three
8. Ejemplo de Renderer SVG
9. Ejemplo de uso
10. Plan de publicación npm
## Roadmap Técnico

### v0.1.0: Arquitectura y Setup Inicial

- [x] Estructura del monorepo con pnpm workspaces.
- [x] Configuración de TypeScript y build con tsup.
- [x] Creación de paquetes base: `@oroya/core`, `@oroya/renderer-three`, `@oroya/renderer-svg`, `@oroya/loader-gltf`.
- [x] Definición inicial de la arquitectura del Scene Graph (interfaces y clases base).
- [x] Setup de demos en Vanilla JS y React.

### v0.2.0: Primera Entrega Funcional (En progreso)

- **Objetivo:** Renderizar una escena 3D básica en las demos.
- [ ] **Scene Graph API:** Implementación funcional del `Scene`, `Node` y `Transform`.
- [ ] **Componentes:** Sistema de componentes para `Geometry` y `Material`.
- [ ] **Geometrías Primitivas:** Creación de geometrías básicas (cubo, esfera) en `@oroya/core`.
- [ ] **Renderer Three.js:** Implementación del renderer para que procese el scene graph de Oroya y lo traduzca a objetos de Three.js.
- [ ] **Demos funcionales:**
    - `demo-vanilla`: Renderizar una escena con un cubo giratorio.
    - `demo-react`: Renderizar la misma escena usando un componente de React.
- [ ] **Documentación:** Añadir TSDoc al API pública del `@oroya/core`.

### v0.3.0: Carga de Modelos y Animación

- **Objetivo:** Cargar y animar modelos 3D externos.
- [ ] **Loader glTF:** Implementación completa del loader para importar modelos de Blender.
- [ ] **Sistema de Animación:** API para controlar animaciones (keyframes, timelines).
- [ ] **Cámara:** Controles de cámara básicos (orbital).

### Futuro (Post-v0.3.0)

- [ ] **Renderer SVG:** Implementación del renderer 2D.
- [ ] **Operaciones Booleanas:** Soporte para operaciones 2D/3D.
- [ ] **Integración WASM:** Módulos de alto rendimiento en C++/Rust.
- [ ] **Serialización:** Guardado y carga de escenas en formato JSON.
- [ ] **Editor Visual:** Creación de un editor de escenas web.
- [ ] **Soporte para otros frameworks:** Wrappers para Vue y Angular.

No quiero teoría abstracta.
 Quiero diseño ejecutable.

------

## NIVEL DE DETALLE

Profundo.
 Arquitectura real.
 Código real.
 Nada superficial.



Además, diseña la base para permitir:

- Boolean operations 2D/3D en el futuro
- Integración con WASM
- Serialización JSON del Scene Graph
- Editor visual futuro