# OA-006: Advanced Rendering & Effects (Visual Polish)

**Status**: Shipped
**Feature Tag**: `OA-006`
**Target Version**: v0.8.0
**Related Packages**: `@joroya/core`, `@joroya/renderer-three`

## Abstract

Bring visual fidelity to a level competitive with hand-rolled Three.js scenes
without breaking the engine-agnostic contract of the core. v0.8.0 adds
real-time shadows, a declarative post-processing chain (bloom, tone-mapping,
SMAA), a CPU-simulated particle system, and spatial audio — all expressed as
scene-graph components so they survive serialization and remain renderer-portable.

## Context

By v0.7.0 the rendering pipeline was correct but visually flat: no shadows,
no glow, no atmosphere, no audio. Earlier drafts of v0.8.0 introduced the
components piecemeal and accumulated three kinds of debt that this EPIC
formally closes:

1. **Type-safety holes in the Three.js post-processing path.** `EffectComposer`
   and its passes were imported with `// @ts-ignore`, `composer` was typed as
   `any`, and `renderPostFX` took an untyped `def`. This violated
   [§3.2 of the programming principles](../../programming-principles.md)
   ("no `any` as escape").
2. **API stubs without backing implementation.** `PostProcessingDef.fxaa` was
   declared but never wired to a real pass — consumers saw the field and
   reasonably expected antialiasing.
3. **Undocumented placement decisions.** `PostProcessing` was read off the
   active camera, but the code said *"For now, let's check the active camera
   node"*, leaving the contract ambiguous.

## Features

### 1. Shadow System

Per-mesh and per-light flags exposed through the scene graph.

- `castShadow` / `receiveShadow` on every `GeometryDef` variant (Box, Sphere,
  Cylinder, Plane, Cone, Torus, Circle, Path2D, Text, Buffer, CSG).
- `castShadow`, `shadowBias`, `shadowMapSize` on `DirectionalLightDef`,
  `PointLightDef`, `SpotLightDef`. `AmbientLightDef` deliberately omits them
  at the type level — ambient light cannot cast shadows.
- `ThreeRenderer` enables `shadowMap.enabled = true` with
  `PCFSoftShadowMap` and applies the flags to meshes, instanced meshes, and
  lights at creation time.

### 2. Post-Processing Pipeline

`PostProcessing` component anchored to the active Camera node.

| Field | Implementation |
|---|---|
| `bloom: { enabled, threshold, strength, radius }` | `UnrealBloomPass` |
| `toneMapping: None \| Reinhard \| Cineon \| ACESFilmic` | `WebGLRenderer.toneMapping` read by `OutputPass` |
| `exposure: number` | `WebGLRenderer.toneMappingExposure` |
| `antialiasing: boolean` | `SMAAPass` (replaces the unused `fxaa` flag) |

Chain order is fixed: `RenderPass → UnrealBloomPass → SMAAPass → OutputPass`.
Pass creation is idempotent — each pass is allocated once on demand and toggled
via `.enabled` afterwards, so steady-state rendering performs no GPU
reallocations.

### 3. Particle System

`ParticleSystem` component simulated on CPU inside `onUpdate(dt)`.

- Emission accumulator drains at `1 / emissionRate` seconds.
- Particles carry position, velocity, life, color, size.
- Gravity is integrated explicitly (Euler) per frame.
- Color and size interpolate from `start*` to `end*` over the lifetime.
- The Three.js backend renders particles as `THREE.Points` with
  `vertexColors`, additive blending, and `setDrawRange` to hide dead slots.

### 4. Spatial Audio

`AudioListener` (attaches to camera) and `AudioSource` (attaches to nodes).

- `AudioSource.url` is the canonical asset reference — keeps the scene graph
  JSON-serializable and lets every backend reuse its own loader. (Earlier
  drafts called this `buffer`; the change to `url` is documented in
  [`CHANGELOG.md`](../../../CHANGELOG.md).)
- Three.js backend maps `AudioSource` to `THREE.PositionalAudio` with cone
  and distance-model attenuation, caches decoded buffers per URL, and
  responds to imperative `play()` / `stop()` via the one-shot
  `shouldPlay` / `shouldStop` flags.

## User Stories

- As a **3D artist**, I want my floating cube to drop a soft shadow onto a
  ground plane so the scene reads as grounded.
- As a **demo author**, I want a glowing material to bloom without writing
  shader code.
- As a **VJ / creative coder**, I want a CPU particle fountain so I can
  build effects without committing to a custom shader.
- As a **game prototyper**, I want a sound source attached to a node so it
  pans correctly as the listener (camera) orbits it.

## Implementation Tasks

### Phase 1 — Shadows ✅
- [x] Add `castShadow` / `receiveShadow` to every `GeometryDef` variant.
- [x] Add `castShadow`, `shadowBias`, `shadowMapSize` to Directional/Point/Spot
      light defs; intentionally omit them from `AmbientLightDef`.
- [x] Enable `shadowMap` in `ThreeRenderer` constructor (`PCFSoftShadowMap`).
- [x] Apply flags to meshes, instanced meshes, and lights in
      `createThreeObject` / `createThreeInstancedMesh` / light creation.
- [x] Add Vitest coverage (`packages/core/tests/Shadow.test.ts`).

### Phase 2 — Post-Processing ✅
- [x] Component `PostProcessing` with `bloom`, `toneMapping`, `exposure`,
      `antialiasing`.
- [x] Use `EffectComposer` + `RenderPass` + `UnrealBloomPass` + `SMAAPass` +
      `OutputPass`.
- [x] Remove `// @ts-ignore` from the postprocessing imports (types ship in
      `@types/three@0.165`).
- [x] Type `composer: EffectComposer | null`, `renderPostFX(def:
      PostProcessingDef)`.
- [x] Implement SMAA behind the renamed `antialiasing` flag.
- [x] Document placement: PostProcessing lives on the active Camera node.
- [x] Add Vitest coverage (`packages/core/tests/PostProcessing.test.ts`).

### Phase 3 — Particles ✅
- [x] `ParticleSystem` component with CPU simulation in `onUpdate(dt)`.
- [x] Three.js backend renders as `THREE.Points` with vertex colors.
- [x] Add Vitest coverage (`packages/core/tests/ParticleSystem.test.ts`).

### Phase 4 — Spatial Audio ✅
- [x] `AudioListener` and `AudioSource` components in `@joroya/core`.
- [x] Map to `THREE.AudioListener` / `THREE.PositionalAudio`.
- [x] Cache decoded buffers per URL in the renderer.
- [x] Document `url` (not `buffer`) as the canonical asset reference.

## Acceptance Criteria

1. `pnpm typecheck` passes with **zero** `@ts-ignore` or `: any` in the
   post-processing path.
2. `pnpm test` covers shadow flag propagation, particle emission/decay, and
   `PostProcessing` definition round-trip.
3. `pnpm build` produces CJS + ESM + `.d.ts` for every workspace package at
   version `0.8.0`.
4. A scene with `bloom.enabled = true` shows visible glow on emissive
   materials when rendered with `ThreeRenderer`.
5. A scene with `antialiasing: true` shows smoothed edges (SMAA) compared
   to the same scene without it.
6. A `Node` with an `AudioSource` plays positional audio that attenuates
   with distance from the camera-mounted `AudioListener`.

## Out of Scope

- HDR environment maps (deferred to OA-007).
- Screen-space reflections / ambient occlusion (deferred to OA-007).
- GPU-instanced particles (current implementation is CPU only).
- Audio streaming for long-form assets (current implementation decodes
  fully into an `AudioBuffer`).

## Dependencies

- `three@^0.165.0` (already in the renderer).
- `@types/three@^0.165.0` — already a dev dep of `@joroya/renderer-three`;
  ships type declarations for `three/examples/jsm/postprocessing/*` so no
  new dependency is required.

## References

- [`docs/programming-principles.md`](../../programming-principles.md) — §3.2
  forbids `any` as escape; §1.1 keeps the core engine-agnostic.
- [`docs/troubleshooting/build-errors-postmortem.md`](../../troubleshooting/build-errors-postmortem.md)
  — explains why each package declares its own `@types/*`.
- [`CHANGELOG.md`](../../../CHANGELOG.md) — v0.8.0 entry.
