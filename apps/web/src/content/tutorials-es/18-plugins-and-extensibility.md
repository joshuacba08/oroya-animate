---
title: "Plugins: extender el renderer sin forkearlo"
description: "Registrá un ComponentHandler que intercepta un tipo de componente custom y produce tus propios objetos backend."
order: 18
level: "advanced"
duration: "20 min"
---

# Tutorial 18: Plugins — extender el renderer sin forkearlo

> **Nivel:** Avanzado
> **Tiempo:** 20 minutos
> **Aprenderás:** cómo el sistema de plugins en `@joroya/core/plugins` te permite shippear un nuevo tipo de componente con su propio comportamiento de rendering, sin modificar `ThreeRenderer`.

> **Estabilidad:** `PluginRegistry`, `Plugin`, y `ComponentHandler` son `@experimental` en v1.0.

---

## Cuándo necesitarías un plugin

El renderer built-in maneja `Geometry`, `Material`, `Camera`, `Light`, `ParticleSystem`, audio, instancing, y skinned meshes. Cualquier cosa más allá — voxel grids, shaders custom, salida de GPU compute, visualizadores de física terceros — es territorio de plugin.

Un plugin es un módulo chico que:

1. Define un `ComponentHandler` para un `ComponentType` o ID string custom.
2. Devuelve un `THREE.Object3D` (o cualquier objeto backend) desde su `create(node)`.
3. Opcionalmente sincroniza estado por frame en `update(node, obj, dt)` y libera GPU en `dispose(node, obj)`.

El renderer consulta el registry **antes** de sus ramas built-in.

---

## Paso 1 — Definir un componente custom

```ts
import { Component } from "@joroya/core";

export class VoxelGridComponent extends Component {
    readonly type = "VoxelGrid";
    constructor(
        public readonly size: { x: number; y: number; z: number },
        public readonly cellSize: number,
        public readonly voxels: Uint8Array,
    ) { super(); }
}
```

---

## Paso 2 — Escribir el handler

```ts
import type { ComponentHandler } from "@joroya/core";
import * as THREE from "three";

export const voxelHandler: ComponentHandler<THREE.Object3D> = {
    componentType: "VoxelGrid",
    create(node) {
        // Construir un THREE.InstancedMesh — un cubo por voxel no-cero.
        // … código del builder …
        return mesh;
    },
    update(node, mesh, dt) {
        // Hook opcional por frame
    },
    dispose(node, mesh) {
        // Liberar GPU resources
    },
};
```

---

## Paso 3 — Bundle y registro

```ts
import type { Plugin } from "@joroya/core";

export const voxelPlugin: Plugin = {
    name: "voxel-renderer",
    handlers: [voxelHandler],
};

renderer.usePlugin(voxelPlugin);
```

---

## Precedencia de plugins

1. Para cada componente del nodo, consulta el registry de plugins.
2. Si un handler existe y devuelve no-`null`, **ese** objeto se usa.
3. Si devuelve `null`, cae al siguiente componente del nodo.
4. Si ningún handler matchea, corre la cadena built-in.

Los plugins pueden **reemplazar** defaults (devolver objeto) o **augmentar** (devolver null pero recibir `update(dt)`).

---

## Lifecycle de disposal

`renderer.rebuildScene()` y `renderer.dispose()` recorren cada objeto de plugin y llaman `handler.dispose(node, obj)`. Ahí liberás `geometry.dispose()` / `material.dispose()` / `texture.dispose()`.

---

## Próximos pasos

- **Plugin multi-handler**: registrá handlers para múltiples tipos desde el mismo paquete.
- **Publicar tu plugin**: `@<tu-org>/oroya-plugin-voxels` — la convención es nombrar plugins por su `componentType`.
