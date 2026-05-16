---
title: "Plugins: extend the renderer without forking"
description: "Register a ComponentHandler that intercepts a custom component type and ships your own backend objects."
order: 18
level: "advanced"
duration: "20 min"
---

# Tutorial 18: Plugins — extend the renderer without forking

> **Level:** Advanced
> **Time:** 20 minutes
> **You'll learn:** how the plugin system in `@joroya/core/plugins` lets you ship a new component type with its own rendering behavior, without modifying `ThreeRenderer`.

> **Stability:** `PluginRegistry`, `Plugin`, and `ComponentHandler` are `@experimental` in v1.0 — the lifecycle (create / update / dispose) is settled, but additional renderer-host guarantees may be added in 1.x.

---

## When you'd need a plugin

The built-in renderer handles `Geometry`, `Material`, `Camera`, `Light`, `ParticleSystem`, audio, instancing, and skinned meshes. Anything beyond that — voxel grids, custom shaders, GPU compute output, third-party physics visualizers — is plugin territory.

A plugin is a small module that:

1. Defines a `ComponentHandler` for a custom `ComponentType` or string ID.
2. Returns a `THREE.Object3D` (or any backend object) from its `create(node)` method.
3. Optionally syncs per-frame state in `update(node, obj, dt)` and releases GPU resources in `dispose(node, obj)`.

The renderer queries the registry **before** its built-in branches, so a handler can replace a default or — by returning `null` — fall through.

---

## Step 1 — Define a custom component

Components are just classes that extend `Component` and declare a unique `type`. Plugin authors can use a string instead of the built-in `ComponentType` enum so they don't have to fork core.

```ts
import { Component } from "@joroya/core";

export class VoxelGridComponent extends Component {
    readonly type = "VoxelGrid";

    constructor(
        public readonly size: { x: number; y: number; z: number },
        public readonly cellSize: number,
        public readonly voxels: Uint8Array,
    ) {
        super();
    }
}
```

---

## Step 2 — Write the handler

```ts
import type { ComponentHandler } from "@joroya/core";
import * as THREE from "three";

export const voxelHandler: ComponentHandler<THREE.Object3D> = {
    componentType: "VoxelGrid",

    create(node) {
        const grid = node.components.get("VoxelGrid" as never) as unknown as VoxelGridComponent;
        if (!grid) return null;

        // Build a single InstancedMesh — one cube per non-zero voxel.
        const cubeGeo = new THREE.BoxGeometry(grid.cellSize, grid.cellSize, grid.cellSize);
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff8844 });

        let count = 0;
        for (let i = 0; i < grid.voxels.length; i++) if (grid.voxels[i] !== 0) count++;

        const mesh = new THREE.InstancedMesh(cubeGeo, cubeMat, count);
        const m = new THREE.Matrix4();
        let idx = 0;
        for (let z = 0; z < grid.size.z; z++) {
            for (let y = 0; y < grid.size.y; y++) {
                for (let x = 0; x < grid.size.x; x++) {
                    const voxelIndex = x + y * grid.size.x + z * grid.size.x * grid.size.y;
                    if (grid.voxels[voxelIndex] === 0) continue;
                    m.setPosition(x * grid.cellSize, y * grid.cellSize, z * grid.cellSize);
                    mesh.setMatrixAt(idx++, m);
                }
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        return mesh;
    },

    update(node, mesh, dt) {
        // Optional per-frame hook — animate, LOD, etc.
    },

    dispose(node, mesh) {
        const instanced = mesh as unknown as THREE.InstancedMesh;
        instanced.geometry.dispose();
        (instanced.material as THREE.Material).dispose();
    },
};
```

---

## Step 3 — Bundle as a Plugin and install

A `Plugin` is the unit you install. It groups one or more `ComponentHandler`s and can carry registry-level lifecycle hooks (`update(dt, scene)`, `dispose()`).

```ts
import type { Plugin } from "@joroya/core";

export const voxelPlugin: Plugin = {
    name: "voxel-renderer",
    handlers: [voxelHandler],
    update(dt, scene) {
        // Optional: scene-wide per-frame work (e.g. LOD selection).
    },
    dispose() {
        // Optional: free any shared resources the plugin owns.
    },
};
```

Install on the renderer **after** `mount()`:

```ts
const renderer = new ThreeRenderer({ canvas, width, height });
renderer.mount(scene);
renderer.usePlugin(voxelPlugin);

// Now any node carrying a VoxelGridComponent renders as instanced cubes.
const node = new Node("terrain");
node.addComponent(new VoxelGridComponent(
    { x: 16, y: 16, z: 16 },
    0.5,
    generateTerrain(),
));
scene.add(node);
```

---

## Plugin precedence

The renderer dispatches in this order:

1. For each component on the node, query the plugin registry.
2. If a handler exists and returns a non-`null` object, **that** is used.
3. If the handler returns `null`, fall through to the next component on the node.
4. If no handler matches, run the built-in `if/else` chain (Geometry → Camera → Light → …).

This means plugins can both **replace** defaults (return a real object) and **augment** them (return `null` so the built-in branch runs, but the plugin still sees `update(dt)` calls for tracking purposes).

---

## Disposal lifecycle

`renderer.rebuildScene()` and `renderer.dispose()` walk every plugin-managed object and call the handler's `dispose(node, obj)`. This is where you release `geometry.dispose()` / `material.dispose()` / `texture.dispose()` — the renderer doesn't know what your custom object owns, so it asks you.

---

## What ships in the plugin API

```ts
interface Plugin {
    readonly name: string;
    readonly handlers?: ComponentHandler[];
    update?(dt: number, scene: Scene): void;
    dispose?(): void;
}

interface ComponentHandler<BackendObject = unknown> {
    readonly componentType: ComponentType | string;
    create(node: Node): BackendObject | null;
    update?(node: Node, backendObject: BackendObject, dt: number): void;
    dispose?(node: Node, backendObject: BackendObject): void;
}
```

Read the full surface in `@joroya/core` exports and the [OA-011 EPIC](https://github.com/joshuacba08/oroya-animate/blob/main/docs/features/OA-011/EPIC.md).

---

## What to try next

- **Multi-handler plugin**: register handlers for multiple component types from the same package (e.g. `VoxelGrid` + `VoxelChunk`).
- **Cross-renderer plugin**: a plugin can declare component handlers per backend by checking the renderer type in its `create`. Today only Three.js is wired; SVG / Canvas2D plugin dispatch is post-1.0.
- **Publish your plugin**: `@<your-org>/oroya-plugin-voxels` — the convention is to name plugins after their `componentType`.
