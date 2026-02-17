---
title: "Architecture"
description: "Design philosophy, module boundaries, and the engine-agnostic approach"
order: 2
category: "concepts"
---
# Architecture Overview

Oroya Animate sigue una arquitectura desacoplada donde la representación de la escena es completamente independiente de la tecnología de renderizado.

---

## Principio fundamental

> **"Define once, render anywhere."**
>  EEl scene graph es la única fuente de verdad. Los renderers son traductores.

```mermaid
graph TD
    subgraph "Capa de entrada"
        UC["User Code"]
        GLTF["glTF / GLB Files"]
        JSON["JSON Serializado"]
    end

    subgraph "@joroya/core  EMotor agnóstico"
        SG["Scene Graph"]
        N["Node"]
        T["Transform"]
        G["Geometry"]
        M["Material"]
        C["Camera"]
        SER["Serializer"]
        MATH["Math (Matrix4)"]
    end

    subgraph "Capa de salida"
        R3["@joroya/renderer-three"]
        RS["@joroya/renderer-svg"]
        R_FUTURE["Future: Canvas2D, WebGPU..."]
    end

    subgraph "Resultado"
        WEBGL["WebGL Canvas (píxeles)"]
        SVG["SVG String (vectores)"]
    end

    UC -->|"builds"| SG
    GLTF -->|"@joroya/loader-gltf"| SG
    JSON -->|"deserialize()"| SG
    SG -->|"serialize()"| JSON

    SG --> N
    N --> T
    N --> G
    N --> M
    N --> C
    SG --> MATH

    SG -->|"mount + render"| R3
    SG -->|"renderToSVG()"| RS
    SG -.->|"futuro"| R_FUTURE

    R3 --> WEBGL
    RS --> SVG
```

---

## Capas de la arquitectura

| Capa | Paquete | Responsabilidad | Dependencias |
|------|---------|-----------------|--------------|
| **Core** | `@joroya/core` | Scene graph, componentes, transforms, serialización, math | `uuid` (única dependencia) |
| **Renderer 3D** | `@joroya/renderer-three` | Traducción a Three.js WebGL | `@joroya/core`, `three` |
| **Renderer SVG** | `@joroya/renderer-svg` | Generación de SVG puro | `@joroya/core` |
| **Loader glTF** | `@joroya/loader-gltf` | Importación de modelos 3D | `@joroya/core`, `three` |

### Grafo de dependencias

```mermaid
graph BT
    CORE["@joroya/core"]
    R3["@joroya/renderer-three"]
    RS["@joroya/renderer-svg"]
    LG["@joroya/loader-gltf"]
    THREE["three (npm)"]
    UUID["uuid (npm)"]
    DEMO["apps/demo-react"]

    CORE -->|"depends on"| UUID
    R3 -->|"depends on"| CORE
    R3 -->|"depends on"| THREE
    RS -->|"depends on"| CORE
    LG -->|"depends on"| CORE
    LG -->|"depends on"| THREE
    DEMO -->|"depends on"| CORE
    DEMO -->|"depends on"| R3
```

> **Regla clave:** Las flechas de dependencia son **unidireccionales** y siempre apuntan hacia `@joroya/core`. El core **nunca** importa de los renderers ni de los loaders.

---

## El patrón "Compiler"

Los renderers funcionan como **compiladores**: traducen una representación intermedia (el scene graph) a un formato de salida específico.

```mermaid
flowchart LR
    IR["Scene Graph\n(Representación intermedia)"] -->|"ThreeRenderer"| OUT1["THREE.Scene\nTHREE.Mesh\nTHREE.Camera"]
    IR -->|"renderToSVG()"| OUT2["<svg>\n  <path/>\n</svg>"]
    IR -.->|"Future: WebGPU"| OUT3["GPUBuffer\nGPURenderPipeline"]
```

| Concepto | Compilador clásico | Oroya Animate |
|----------|-------------------|---------------|
| Código fuente | Archivo `.c` | User Code (TypeScript) |
| Representación intermedia | AST / IR | Scene Graph |
| Backend | x86, ARM, WASM | Three.js, SVG, WebGPU |
| Salida | Código máquina | Píxeles, vectores |

Este patrón permite:
- **Agregar backends** sin modificar el core.
- **Testear sin renderer**  Ela lógica vive en el scene graph.
- **Server-side rendering**  Eel SVG renderer funciona en Node.js sin DOM.

---

## Ciclo de vida del renderizado

```mermaid
sequenceDiagram
    participant U as User Code
    participant S as Scene
    participant N as Node
    participant T as Transform
    participant R as Renderer

    Note over U,R: FASE 1  EPreparación
    U->>S: new Scene()
    U->>N: new Node('box')
    U->>N: addComponent(createBox(...))
    U->>N: addComponent(new Material(...))
    U->>S: scene.add(node)

    Note over U,R: FASE 2  EMontaje
    U->>R: renderer.mount(scene)
    R->>S: scene.traverse(callback)
    R->>R: Crear objetos del backend
    R->>R: Detectar cámara activa

    Note over U,R: FASE 3  ERender loop
    loop requestAnimationFrame
        U->>T: transform.rotation = {...}
        U->>T: transform.updateLocalMatrix()
        U->>R: renderer.render()
        R->>S: scene.updateWorldMatrices()
        S->>N: node.updateWorldMatrix(parentMatrix)
        N->>T: worldMatrix = parent ÁElocal
        R->>R: Sincronizar con backend
        R->>R: Dibujar frame
    end

    Note over U,R: FASE 4  ECleanup
    U->>R: renderer.dispose()
```

### Detalle de cada fase

| Fase | Acción | Quién la ejecuta |
|------|--------|-------------------|
| **1. Preparación** | Construir el scene graph con nodos, componentes y relaciones padre-hijo | User code |
| **2. Montaje** | `renderer.mount(scene)`  Erecorrer el árbol y crear los objetos del backend | Renderer |
| **3. Render loop** | Mutar transforms ↁE`updateLocalMatrix()` ↁE`renderer.render()` ↁEpropagar matrices ↁEdibujar | User code + Renderer |
| **4. Cleanup** | `renderer.dispose()`  Eliberar recursos GPU/memoria | User code |

---

## Modelo Entity-Component System (ECS) simplificado

Oroya usa un **ECS ligero** donde:

| ECS Term | Oroya Equivalent | Descripción |
|----------|-----------------|-------------|
| **Entity** | `Node` | Contenedor con ID y jerarquía |
| **Component** | `Transform`, `Geometry`, `Material`, `Camera` | Datos adjuntos a un nodo |
| **System** | Renderers, `updateWorldMatrices()` | Lógica que procesa componentes |

```mermaid
graph LR
    subgraph "Entity (Node)"
        N["Node 'player'"]
    end

    subgraph "Components"
        T["Transform\nposition, rotation, scale"]
        G["Geometry\nBox 1ÁEÁE"]
        M["Material\ncolor: blue"]
    end

    subgraph "Systems"
        S1["updateWorldMatrices()\nPropaga matrices"]
        S2["ThreeRenderer.render()\nDibuja con Three.js"]
    end

    N --> T
    N --> G
    N --> M
    T --> S1
    G --> S2
    M --> S2
```

### Reglas del ECS

1. **Un componente por tipo por nodo**  ENo se pueden tener dos `Geometry` en un mismo nodo.
2. **Transform es automático**  ETodos los nodos lo tienen desde su creación.
3. **Los componentes son datos**  ENo contienen lógica de renderizado.
4. **Los renderers son los "systems"**  ELeen componentes y producen salida visual.

---

## Extensibilidad

### Agregar un nuevo renderer

```typescript
class MyRenderer {
  private scene: Scene | null = null;

  mount(scene: Scene): void {
    this.scene = scene;
    scene.traverse(node => {
      const geo = node.getComponent<Geometry>(ComponentType.Geometry);
      const mat = node.getComponent<Material>(ComponentType.Material);
      // Crear objetos del motor/framework destino
    });
  }

  render(): void {
    if (!this.scene) return;
    this.scene.updateWorldMatrices();
    this.scene.traverse(node => {
      // Leer node.transform.worldMatrix
      // Sincronizar con los objetos del motor
    });
    // Dibujar frame
  }

  dispose(): void { /* liberar recursos */ }
}
```

### Agregar un nuevo loader

```typescript
async function loadMyFormat(url: string): Promise<Scene> {
  const data = await fetch(url).then(r => r.json());
  const scene = new Scene();

  for (const obj of data.objects) {
    const node = new Node(obj.name);
    node.addComponent(createBox(obj.width, obj.height, obj.depth));
    node.addComponent(new Material({ color: obj.color }));
    node.transform.position = obj.position;
    scene.add(node);
  }

  return scene;
}
```

---

## Estructura del monorepo

```
oroya-animate/
├── packages/
━E  ├── core/               ↁEMotor agnóstico (Scene, Node, Components, Math)
━E  ├── renderer-three/      ↁEBackend Three.js WebGL
━E  ├── renderer-svg/        ↁEBackend SVG puro
━E  └── loader-gltf/         ↁEImportador de modelos glTF
├── apps/
━E  └── demo-react/          ↁEAplicación demo (Vite + React)
├── docs/                    ↁEDocumentación del proyecto
└── package.json             ↁERoot del monorepo (pnpm workspaces)
```

---

## Decisiones de diseño

| Decisión | Alternativa rechazada | Razón |
|----------|----------------------|-------|
| Scene graph como IR | API directa sobre Three.js | Permite múltiples backends y testing sin GPU |
| ECS simplificado (1 comp/tipo) | ECS completo con Systems | Menor complejidad para el alcance actual |
| Quaterniones para rotación | Ángulos de Euler | Sin gimbal lock, interpolación natural (SLERP) |
| Matrices column-major | Matrices row-major | Compatible con WebGL y Three.js |
| `uuid` para IDs de nodo | IDs incrementales | IDs únicos globalmente, necesario para serialización |
| `tsup` como bundler | `tsc`, `rollup`, `esbuild` | DTS + CJS + ESM en un solo tool con configuración mínima |
| pnpm workspaces | npm/yarn workspaces | Más rápido, deduplicación estricta, mejor para monorepos |
