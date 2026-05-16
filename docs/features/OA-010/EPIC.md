# OA-010: Skinned Mesh, IK & Vehicles

**Status**: Shipped
**Feature Tag**: `OA-010`
**Target Version**: v0.12.0
**Related Packages**: `@joroya/core`, `@joroya/loader-gltf`, `@joroya/renderer-three`, `@joroya/physics`

## Abstract

Three independent capabilities that, together, complete the engine's
content-pipeline story before v1.0:

1. **Skinned mesh / glTF skeletal animation** — closes the v0.9.0 dual-track
   commitment by actually wiring `THREE.SkinnedMesh` to the core animation
   mixer.
2. **Analytical 2-bone IK** — the procedural-animation building block that
   complements the keyframe mixer.
3. **`Vehicle` helper** — declarative arcade vehicles built on `cannon-es`
   `RaycastVehicle`.

None of these are speculative; each was explicitly deferred from a prior
EPIC.

## Context

By v0.11.0 the engine had the runtime (scene graph, render, physics,
animation, audio, post-fx) and the developer ecosystem (inspector, input,
assets, framework wrappers). What it didn't have was content-creation
parity:

- **Skinned meshes**: OA-007 wired a `THREE.AnimationMixer` slot but
  `findSkinnedDescendant` would never find one — `loadGLTF` discarded skin
  data and the renderer always built plain `THREE.Mesh`. A character art
  pipeline was therefore impossible.
- **Procedural pose adjustment**: the `spring()` integrator in v0.9.0
  smooths scalar / vector values, but rigging-style "make the hand reach
  this point" required hand-rolling the math each time.
- **Vehicles**: `cannon-es` exposes `RaycastVehicle` but its API is verbose
  (wheel indices, manual `applyEngineForce` loops, `worldTransform`
  read-back). Building a driving demo took hundreds of lines of glue.

OA-010 ships all three with their tests and EPIC-grade documentation.

## Features

### 1. Skinned Mesh / glTF Skeletal Animation

**Core changes**

- `BufferGeometryDef` extended with optional `skinIndices: Uint16Array`
  (4 per vertex, indexes into bone list) and `skinWeights: Float32Array`
  (4 per vertex, sum to 1).
- New `Skin` component (`ComponentType.Skin`):
  - `boneNames: string[]` — order-significant, pairs with `skinIndices`.
  - `inverseBindMatrices: Float32Array` — flat array of 16-float matrices,
    one per bone.
  - `skeletonRoot?: string` — optional armature root name.
- Round-trip support: `Skin` is serializable through the v0.10.0 typed-array
  pipeline (base64-encoded `Float32Array`), tested.

**glTF loader**

- `translateGeometry` now detects `THREE.SkinnedMesh` and pulls `skinIndex` /
  `skinWeight` attributes into the def.
- New `translateSkin` extracts `skeleton.bones` and `skeleton.boneInverses`
  into a `Skin` component.
- Bone names are preserved verbatim — the same names the animation tracks
  target, so animation continues to work through the engine-agnostic
  `AnimationMixer`.

**Three.js renderer**

- New `pendingSkinBindings` queue on `ThreeRenderer`. The Geometry-creation
  branch checks for a `Skin` component and emits `THREE.SkinnedMesh`
  instead of `THREE.Mesh`, then queues a binding.
- New `resolveSkinBindings()` runs after the full scene traversal: builds a
  name → `Object3D` index, walks each pending mesh's bone list, constructs
  `THREE.Skeleton(bones, boneInverses)`, calls `mesh.bind(skeleton)`.
- A missing bone is logged and skipped (vs. crashing) — broken skin is
  rendered, not the whole frame.
- `buildGeometryFromDef` wires `skinIndex` (itemSize 4) + `skinWeight`
  (itemSize 4) buffer attributes when present.

**Why no separate `THREE.AnimationMixer`**: bone Nodes are regular
`Node`s with names. The core `AnimationMixer` already targets nodes by
name (that's how every other animation works). When the bone's Oroya
`Transform` mutates, the corresponding `THREE.Object3D` matrix updates in
the next render pass, and `THREE.Skeleton.update()` recomputes vertex
positions from there. The dual-track scaffolding from OA-007 stays in
place as a hook for morph-target animation or non-skeletal Three-native
clips, but **regular skeletal animation flows through the core mixer**.

### 2. 2-Bone Analytical IK

`@joroya/core/math/IK.ts` exports `solve2BoneIK(rootPos, midPos, endPos,
target, pole?): { rootRotation, midRotation, reached }`.

**Algorithm**:

1. Compute segment lengths `l1 = |root → mid|`, `l2 = |mid → end|`.
2. Distance from root to target = `d`, clamped to `[|l1 - l2|, l1 + l2]`
   so unreachable targets fall back to full extension (vs. NaN).
3. Law of cosines:
   - `cos(rootAngle) = (l1² + d² - l2²) / (2 · l1 · d)`
   - `cos(midAngle)  = (l1² + l2² - d²) / (2 · l1 · l2)`
4. Build the bend plane from `(toTarget × pole)`. With no pole, pick a
   stable default axis based on the target direction.
5. Express root and mid rotations in world space.

**Pole vector** chooses the bend direction (where the elbow points).
Without one, the solver picks a deterministic axis; flipping the pole
inverts the elbow.

**Out of scope**: 3+ bone chains (use FABRIK or CCD), joint limits
(can be applied as a post-step), and IK targets that themselves rotate
(the solver returns rotations; positions are caller-supplied).

### 3. `Vehicle` Helper

`@joroya/physics/Vehicle.ts` wraps `CANNON.RaycastVehicle`:

```ts
const vehicle = new Vehicle({ chassisNode, physics });
vehicle.addWheel({ chassisPosition: {x:  1, y: 0, z:  1.5}, radius: 0.4, isDriving:  true, node: wheelFL });
vehicle.addWheel({ chassisPosition: {x: -1, y: 0, z:  1.5}, radius: 0.4, isDriving:  true, node: wheelFR });
vehicle.addWheel({ chassisPosition: {x:  1, y: 0, z: -1.5}, radius: 0.4, isSteering: true, node: wheelRL });
vehicle.addWheel({ chassisPosition: {x: -1, y: 0, z: -1.5}, radius: 0.4, isSteering: true, node: wheelRR });

function frame(dt: number) {
    vehicle.drive(input.isActionActive('forward') ? 500 : 0);
    vehicle.steer(steerAxis * 0.4);
    physics.update(dt, scene);
    vehicle.syncWheelNodes();
    renderer.render(dt);
}
```

- Wheel registration tags driving / steering independently — `drive(force)`
  applies to all driving wheels, `steer(angle)` to all steering wheels,
  `brake(force)` to every wheel.
- Optional `node` per wheel: `syncWheelNodes()` mirrors the simulated
  pose back to the Oroya transform after each step so the visual mesh
  follows the physical wheel.
- `dispose()` removes the vehicle from the world.

**Companion change**: `PhysicsSystem.getBody(node)` is new — eager body
materialization. Used by the `Vehicle` constructor to bind the chassis
before the next `update()` cycle.

## User Stories

- As a **character artist**, I export a Blender rig + skinned mesh + walk
  cycle as `.glb`. `loadGLTF` produces a Scene where bones animate and
  the mesh follows them, with no manual wiring.
- As a **gameplay programmer**, I make the hand reach the doorknob with
  `solve2BoneIK(shoulder, elbow, hand, doorknobPos)` — two function calls
  per frame.
- As a **driving-demo author**, I describe the wheels declaratively and
  the vehicle drives — no looping over `wheelInfos` to call
  `applyEngineForce` four times.

## Implementation Tasks

### Phase A — Skin in core ✅
- [x] Extend `BufferGeometryDef` with `skinIndices` / `skinWeights`.
- [x] `Skin` component + `SkinDef` + `ComponentType.Skin` enum entry.
- [x] Export from `components/index.ts` barrel and root `index.ts`.
- [x] Add `Skin` case to the `json.ts` deserializer switch.
- [x] 2 Vitest tests (construction + serialize round-trip).

### Phase B — glTF loader ✅
- [x] `translateGeometry(geo, isSkinned)` extracts skinning attributes.
- [x] `translateSkin(mesh)` produces a `Skin` component.
- [x] `translateNode` attaches the `Skin` to the node when applicable.

### Phase C — ThreeRenderer ✅
- [x] `pendingSkinBindings` queue on the renderer.
- [x] Geometry branch emits `THREE.SkinnedMesh` when a `Skin` is present.
- [x] `resolveSkinBindings()` after the scene traversal.
- [x] `buildGeometryFromDef` wires `skinIndex` + `skinWeight` attributes.

### Phase D — IK ✅
- [x] `solve2BoneIK` analytical solver in `@joroya/core/math/IK.ts`.
- [x] Pole-vector support with stable default selection.
- [x] Export from `math/index.ts`.
- [x] 6 Vitest tests (reachable / unreachable / degenerate / pole flip /
      end-effector placement / NaN safety).

### Phase E — Vehicle ✅
- [x] `Vehicle` class wrapping `CANNON.RaycastVehicle`.
- [x] `addWheel` / `drive` / `steer` / `brake` / `syncWheelNodes` / `dispose`.
- [x] `PhysicsSystem.getBody(node)` for eager body materialization.
- [x] Export from `physics/index.ts`.
- [x] 5 Vitest tests (construction, missing-RB throws, addWheel state,
      syncWheelNodes, dispose).

### Phase F — Metadata ✅
- [x] Bump every workspace package + root to `0.12.0`.
- [x] CHANGELOG entries (en / es / ja).
- [x] README roadmap: v0.12.0 promoted to Shipped.
- [x] EPIC OA-010 (this file).

## Acceptance Criteria

1. `pnpm typecheck` succeeds on all 14 workspace packages.
2. `pnpm test` passes — 158 total (+13 new across IK, Skin, Vehicle).
3. `pnpm lint` succeeds with no `any` / `@ts-ignore` introduced.
4. `pnpm --filter "./packages/**" build` produces CJS + ESM + DTS for every
   package at `0.12.0`.
5. A `Skin` component round-trips through `serialize() → deserialize()` with
   its `Float32Array` IBMs byte-identical (Float32 precision).
6. `solve2BoneIK(root, mid, end, target)` with `target` within reach
   produces a rotation pair that, when applied, places the end-effector at
   the target within 5cm.
7. `new Vehicle({ chassisNode, physics })` succeeds when the chassis has a
   `RigidBody` + `Collider`, and `vehicle.brake(10)` keeps the chassis
   stationary after 10 simulated steps.

## Out of Scope (deferred to v1.0)

- **3+ bone IK chains** (CCD or FABRIK) — `solve2BoneIK` covers the
  arm/leg case which is 90% of IK use.
- **Joint angle limits** — caller applies these as a post-step clamp.
- **Morph-target / blend-shape animation** — the dual-track hook still
  exists but morph-target tracks aren't a glTF-loader supported path yet.
- **Wheel skid/slip audio events** — `Vehicle.raw.sliding` is exposed by
  cannon-es; emitting it as a `Node.events` channel is a small follow-up.
- **Visual editor integration** for IK / vehicle constraints — lives in
  v1.0 territory.

## Dependencies

No new runtime deps. `Skin` + `IK` ship in `@joroya/core` (zero deps).
`Vehicle` uses the existing `cannon-es` already in `@joroya/physics`.

## References

- [`docs/programming-principles.md`](../../programming-principles.md) §1.1
  (engine-agnostic core), §2.1 (barrels), §3.2 (no `any`).
- [`docs/features/OA-007/EPIC.md`](../OA-007/EPIC.md) — the dual-track
  animation scaffolding completed here.
- [`docs/features/OA-008/EPIC.md`](../OA-008/EPIC.md) — TypedArray
  serialization, reused by `Skin`.
- [`docs/features/OA-009/EPIC.md`](../OA-009/EPIC.md) — preceding ecosystem
  layer.
- [`CHANGELOG.md`](../../../CHANGELOG.md) v0.12.0 entry.
