# OA-011: Production Ready (v1.0.0)

**Status**: Shipped
**Feature Tag**: `OA-011`
**Target Version**: v1.0.0
**New Packages**: none (only `apps/editor` is added)
**Touched Packages**: `@joroya/core`, `@joroya/renderer-three`, every public surface

## Abstract

The v0.x line built the engine, the developer ecosystem, and the content
tools. v1.0.0 makes them **safe to depend on**: a documented stability
policy, a plugin system third-party packages can extend without forking,
a visible editor that proves the serialization layer works end-to-end,
and a WASM integration point that future acceleration packages can plug
into without breaking any existing consumer.

Critically, **the public API surface does not change from v0.12.x**.
v1.0.0 is a *commitment*, not a rewrite — it says "these symbols are
stable; we accept the cost of a major bump for any breaking change to
them; we will give you one major version of deprecation notice."

## Context

By v0.12.0 the library had:

- A complete engine: scene graph, 3 renderers, physics, animation, audio,
  post-fx, particles, shadows, skinned meshes, IK, vehicles.
- A complete ecosystem: inspector, input, assets, React + Vue wrappers.
- 158 tests, 0 `any` in source, ESLint + CI gates.

What it *didn't* have was the signals that distinguish a "useful library"
from a "production library":

1. **No stability policy.** A consumer pinning `^0.12` had no way to know
   whether `solve2BoneIK` was stable, alpha, or about to be renamed.
2. **No extensibility contract.** Adding a third-party component type
   meant forking `ThreeRenderer` because its `createThreeObject` was a
   hard-coded `if/else` over component types.
3. **No content-tooling proof.** v0.10.0 shipped serialization but no
   tool *used* it — the closest was a CLI-style round-trip test.
4. **No path to WASM** without breaking changes. Once a future package
   wanted to swap in WASM math, every renderer / physics / animation
   call site would need updating.

OA-011 closes all four.

## Features

### 1. Plugin System

```ts
// A third-party package defines a custom voxel component handler:
const voxelPlugin: Plugin = {
    name: 'voxel-renderer',
    handlers: [{
        componentType: 'VoxelGrid',
        create(node) {
            return buildVoxelMesh(node);
        },
        update(node, mesh, dt) {
            updateVoxelLOD(mesh, node, dt);
        },
        dispose(node, mesh) {
            mesh.geometry.dispose();
        },
    }],
    update(dt, scene) {
        // optional global per-frame hook
    },
};

renderer.usePlugin(voxelPlugin);
```

- **`Plugin`** (interface): `name`, `handlers?`, `update?(dt, scene)`,
  `dispose?()`.
- **`ComponentHandler`** (interface): `componentType`, `create(node)`,
  `update?(node, obj, dt)`, `dispose?(node, obj)`.
- **`PluginRegistry`** (class): O(1) component-type lookup; iterates active
  plugins once per frame. Resides in `@joroya/core/plugins`.
- **`ThreeRenderer.usePlugin(plugin)` / `removePlugin(plugin)`**: install
  / remove. Handler dispatch runs **before** built-in branches so a
  handler can *replace* a default (return an `Object3D`) or *augment*
  one (return `null` to fall through).

The hook in `createThreeObject` iterates `oroyaNode.components.keys()`,
queries the registry, and delegates if a match is found. Per-frame, the
renderer fires registry-level `update(dt, scene)` and per-object
`handler.update(node, obj, dt)` after `scene.update(dt)` but before the
world-matrix sync. Disposal runs on `rebuildScene()` so plugin GPU
resources are released cleanly when the scene swaps.

### 2. API Stability Policy

[`docs/api-stability.md`](../../api-stability.md) defines the
three-tag system inspired by `@microsoft/api-extractor`:

| Tag             | Stability        | Breaking-change policy |
|-----------------|------------------|------------------------|
| `@public`       | Stable           | Major bump + 1-major deprecation window |
| `@experimental` | In flux          | May change in any minor |
| `@internal`     | Not public       | Importing across packages is unsupported |

The `pnpm api:check` script walks every package's `src/index.ts` barrel
and reports re-exports lacking a tag. It is informational (not yet a CI
gate), but makes accidentally-untagged exports visible during review.

**Initial tagging** (applied in v1.0.0):

- `@public`: `Scene`, `Node`, `Transform`, `Camera`, `Light`, `Geometry`,
  `Material`, `Animation`, `Animator`, `Environment`, `Collider`,
  `RigidBody`, `ParticleSystem`, `PostProcessing`, `AudioListener`,
  `AudioSource`, `Skin`, `Interactive`, `EventEmitter`, `Inspector`,
  `FrameMetrics`, `collectSceneStats`, `InputManager`, `AssetManager`,
  `PhysicsSystem`, `ThreeRenderer`, `OrbitControlsWrapper`,
  `renderToSVG`, `renderToSVGElement`, `CanvasRenderer`, `loadGLTF`,
  `serialize`, `deserialize`, math helpers.
- `@experimental`: `@joroya/react` (all of it), `@joroya/vue` (all of it),
  `solve2BoneIK`, `Vehicle`, `PluginRegistry`, math backend registry.
- The rest is documented as `@public` by default convention.

### 3. Visual Editor (`apps/editor`, alpha)

A React-based scene editor sitting on top of `@joroya/react`,
`@joroya/inspector`, and `@joroya/renderer-three`. Three panels:

- **Left**: hierarchy tree (`HierarchyPanel`) — click to select.
- **Center**: rendered canvas + free-orbit camera.
- **Right**: transform inspector (`TransformInspector`) — per-axis number
  inputs for position / rotation quaternion / scale.

The toolbar provides:
- **+ Cube**: spawn a new colored cube at a random position.
- **Save**: `serialize(scene)` → JSON blob → browser download as
  `scene.json`.
- **Load**: file picker → `deserialize(text)` → `renderer.mount(loaded)`.
- **Delete**: remove the selected node.

This is alpha because:
- No 3D gizmo handles (translate / rotate / scale). Numeric edit only.
- Rotation editor exposes the raw quaternion. A future iteration will
  add Euler-angle and axis-angle modes.
- No undo/redo stack — every edit is destructive.

The editor proves end-to-end that v0.10.0 serialization round-trips
scenes losslessly, including `Float32Array`-backed animation data,
buffer geometries, and instanced meshes.

### 4. WASM Acceleration Hook

```ts
// In a future @joroya/wasm-math package:
import { registerMathBackend, type MathBackend } from '@joroya/core';

const wasmBackend: MathBackend = {
    name: 'wasm-simd',
    multiplyMatrices: (a, b, out) => wasmModule.multiplyMatrices(a, b, out),
};

registerMathBackend(wasmBackend);
```

- **`MathBackend`** (interface): currently `multiplyMatrices(a, b, out)`,
  will grow as we identify hot paths.
- **`getMathBackend()`**: read the active backend.
- **`registerMathBackend(backend | null)`**: install or restore default.
- **Default backend**: pure-TS implementation, exhaustive and faithful.

No production WASM ships in v1.0. The point is the hook — without it,
swapping in a WASM backend later would touch every call site in the
renderer / physics / animation packages. With it, the swap is a single
import in the consumer app.

### 5. Test Coverage Closure

v1.0 brings the test count to **170 passing tests** across 23 files:

| Suite | Count | Coverage |
|---|---|---|
| Core scene-graph | 12 | Node hierarchy, Scene, dispatch, BBox, culling |
| Core animation | 21 | Animator, AnimationMixer, easing, spring |
| Core math | 9 | IK (6), MathBackend (3) |
| Core components | 30 | Shadow, PostProcessing, ParticleSystem, Skin, Plugin |
| Core serialization | 11 | TypedArray round-trips (9), InstancedMesh notes (2) |
| Core events | 7 | EventEmitter (incl. interaction bubbling) |
| Inspector | 5 | FrameMetrics + SceneStats |
| Input | 9 | Key, mouse, action lifecycle, blur, unbind |
| Assets | 8 | Dedup, ref-count, progress, error resilience |
| Physics | 14 | Gravity, stack, triggers, joints, raycast, vehicle |
| Renderer-SVG | 40 | Full SVG output validation + Animator parity |

The remaining surface (renderer interactivity, glTF loader internals,
React/Vue wrappers, editor app) is covered by manual testing against
the demo apps. Full Playwright E2E is post-1.0.

## User Stories

- As a **library consumer**, I want to read the CHANGELOG and know that
  symbols marked `@public` are safe to depend on without my code
  breaking under `pnpm update`.
- As a **third-party plugin author**, I want to ship a `@my-org/oroya-voxels`
  package that adds a `VoxelGrid` component without forking
  `ThreeRenderer`.
- As an **artist or game designer**, I want a visual tool to lay out a
  scene and save it as JSON, then load it back into my game code.
- As a **performance-sensitive consumer**, I want a clean upgrade path
  from pure-JS math to WASM math — without rewriting my app.

## Implementation Tasks

### Phase A — Plugin system ✅
- [x] `PluginRegistry`, `Plugin`, `ComponentHandler` in `@joroya/core/plugins`.
- [x] `ThreeRenderer.usePlugin` / `removePlugin` + dispatch in `createThreeObject`.
- [x] Per-frame `plugins.update(dt, scene)` hook + per-object `handler.update`.
- [x] Dispose hook on `rebuildScene()`.
- [x] 7 Vitest unit tests.

### Phase B — API stability ✅
- [x] `docs/api-stability.md` policy document.
- [x] `scripts/api-check.js` — informational lint of barrel exports.
- [x] `pnpm api:check` script.
- [x] `@public` / `@experimental` tags applied to the main classes.

### Phase C — Visual editor ✅
- [x] `apps/editor` Vite + React 18 + `@joroya/react` app.
- [x] Three-panel layout (hierarchy / canvas / inspector).
- [x] `HierarchyPanel` with click-to-select.
- [x] `TransformInspector` with per-axis number inputs.
- [x] `Toolbar` with + Cube / Save / Load / Delete.
- [x] Starter scene (camera + sun + ambient + ground + hero + ball).
- [x] Production build verified (`pnpm --filter editor build`).

### Phase D — WASM hook ✅
- [x] `MathBackend` interface in `@joroya/core/math/MathBackend`.
- [x] Pure-JS default backend (faithful Matrix4 multiply).
- [x] `getMathBackend()` / `registerMathBackend(backend | null)` API.
- [x] 3 Vitest tests (default, register, restore).

### Phase E — Test coverage ✅
- [x] `InstancedMeshSerialization.test.ts` documents the
      intentionally-skipped deserialize path + verifies typed-array
      round-trip for app-level persistence.
- [x] `MathBackend.test.ts` covers the registry lifecycle.
- [x] `Plugin.test.ts` covers the registry, handler dispatch, dispose.

### Phase F — Metadata ✅
- [x] Bump every workspace package + root to `1.0.0`.
- [x] CHANGELOG entries (en / es / ja).
- [x] README roadmap: v1.0.0 row promoted to Shipped, Post-1.0 items declared.
- [x] EPIC OA-011 (this file).

## Acceptance Criteria

1. `pnpm lint` succeeds on every `src/**.{ts,tsx}` file.
2. `pnpm typecheck` succeeds on all 14 workspace packages + the editor
   app.
3. `pnpm test` passes — 170 tests across 23 files.
4. `pnpm --filter "./packages/**" build` produces CJS + ESM + DTS for
   every workspace package at `1.0.0`.
5. `pnpm --filter editor build` produces a static bundle.
6. A plugin that registers a handler for `ComponentType.Geometry` and
   returns a custom `THREE.Object3D` is invoked instead of the default
   mesh builder — verified by `Plugin.test.ts`.
7. `registerMathBackend(fakeBackend)` followed by
   `getMathBackend().multiplyMatrices(...)` invokes the fake, not the
   default — verified by `MathBackend.test.ts`.
8. The editor app boots in the browser, displays the starter scene,
   responds to "+ Cube" / Save / Load / Delete, and survives a
   serialize→deserialize round trip without losing nodes.

## Out of Scope (post-1.0)

- **Production WASM payload** (`@joroya/wasm-math`): the *integration
  point* ships in v1.0; the actual WASM module is a follow-up release
  once we have a real perf-benchmark target.
- **3D gizmos** (translate / rotate / scale handles) in the editor.
- **Multi-bone IK** (CCD / FABRIK) beyond the 2-bone analytical solver.
- **Playwright E2E suite** running the editor + demos.
- **Animation timeline editor** integrated into the visual editor.
- **Touch gestures** (pinch / swipe / rotate) on top of `@joroya/input`.
- **`api-extractor` integration** beyond the lightweight `api:check`
  script. The script catches the common case (untagged barrel exports);
  a full extractor would catch type-level breaking changes too.

## Compatibility

- **From v0.12.x**: no source changes required. Every v0.12.x export
  remains in v1.0.0 with the same shape. The version bump signals
  stability commitment, not breakage.
- **From v0.11.x and earlier**: see the CHANGELOG entries for each
  intermediate version. No deprecation windows existed pre-1.0.

## Dependencies

No new runtime deps. The editor app adds `react`, `react-dom`, and
`@vitejs/plugin-react` to its own `package.json` — these don't leak into
any published package's dependency closure.

## References

- [`docs/api-stability.md`](../../api-stability.md) — the policy this
  EPIC introduces.
- [`docs/programming-principles.md`](../../programming-principles.md) §1.1
  (engine-agnostic core), §3.2 (no `any`), §2.1 (barrels).
- [`docs/features/OA-008/EPIC.md`](../OA-008/EPIC.md) — serialization
  layer the editor builds on.
- [`docs/features/OA-009/EPIC.md`](../OA-009/EPIC.md) — ecosystem layer
  (`@joroya/react`, `@joroya/inspector`) reused by the editor.
- [`CHANGELOG.md`](../../../CHANGELOG.md) v1.0.0 entry.
