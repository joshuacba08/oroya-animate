# OA-008: Serialization, Backend Parity & Hardening

**Status**: Shipped
**Feature Tag**: `OA-008`
**Target Version**: v0.10.0
**Related Packages**: `@joroya/core`, `@joroya/renderer-svg`, `@joroya/renderer-canvas2d`, `@joroya/loader-gltf`

## Abstract

Pay down the structural debt accumulated through v0.7-0.9. Three problems
in particular were blocking the v1.0 vision:

1. **Serialization didn't round-trip the data the new components produce.**
   `Float32Array` fields silently stringified to `{}`. `AnimationClip`,
   `BufferGeometryDef`, `InstancedMeshComponent` — none of them survived
   `serialize() → deserialize()`. A visual editor that can't reliably load
   what it saves isn't an editor.
2. **`Animator` only worked on the Three.js renderer.** SVG and Canvas2D
   backends had no `Scene.update(dt)` invocation, so `Animator` mutations
   never fired on those backends. The engine-agnostic claim of `@joroya/core`
   was, in practice, untrue for animation.
3. **No automated guardrails for `any` / `@ts-ignore`.** The programming
   principles forbid them, but only by convention. Without an ESLint gate,
   any contributor (including future Claude sessions) could re-introduce
   them.

This EPIC closes those three. It also fixes one silent correctness bug
discovered while writing the new tests.

## Context

`OA-007/EPIC.md` deferred several integration concerns to a later release.
The list of pre-1.0 hygiene items grew further during the v1.0 gap audit
([CHANGELOG.md](../../../CHANGELOG.md) v0.10.0). Of that list, this EPIC
ships the items the v0.11+ work depends on:

- **Tier 3 #1** (Float32Array serialization) — blocks the v1.0 visual editor.
- **Tier 3 #2** (renderer parity for Animator) — blocks the framework wrappers
  (`@joroya/react` / `@joroya/vue` can't promise that scenes work cross-backend
  if they actually don't).
- **Tier 3 #3** (animation demo using the real API) — blocks documentation.
- **Tier 3 #4** (README roadmap synced) — public-facing accuracy.
- **Tier 3 #5** (ESLint) — enforces §3.2 of the programming principles.
- **Tier 3 #6** (CHANGELOG vs README disagreement) — resolved by #4.

Inspector, Input Manager, Asset Manager, and framework wrappers move to
v0.11.0 (OA-009).

## Features

### 1. TypedArray Serialization

`packages/core/src/serialization/typedArrays.ts` exports a
replacer/reviver pair that encodes any of `Float32Array`, `Uint8Array`,
`Uint16Array`, `Uint32Array` as `{ __typedArray: <name>, base64: <data> }`
on the wire. The format is glTF-compatible — external tooling that already
speaks glTF binary buffers can consume Oroya scene dumps directly. Decoding
materializes the original concrete typed array (not a generic `ArrayBuffer`
view) so consumer code sees the exact type it serialized.

### 2. Complete Component Deserialization

Every shipped scene-graph component now has a deserializer:

| Component | Deserialized via |
|---|---|
| Transform | `Object.assign(new Transform(), sComp)` (preserves matrices) |
| Geometry, Material, Camera, Light, Environment | `new X(sComp.definition)` |
| Animation, Interactive | constructor pass-through |
| **RigidBody, Collider, Animator, PostProcessing, ParticleSystem, AudioListener, AudioSource** | new in v0.10.0 |

`InstancedMesh` and `Script` remain intentionally non-deserialized: the
former owns runtime GPU buffers driven by application code, the latter
holds a JS closure that can't survive JSON. Persisting them requires an
application-level adapter.

### 3. Backend Parity for `Animator`

`scene.update(dt)` now runs before every backend's world-matrix pass:

- `ThreeRenderer.render(dt?)` — already shipped in v0.9.0.
- `renderToSVG(scene, { ..., dt })` — added.
- `renderToSVGElement(scene, { ..., dt })` — added.
- `Canvas2DRenderer.render(scene, { ..., dt })` — added.

All four default to `1/60` if `dt` is omitted, so existing call sites
keep working unchanged. Property-track animation (position/rotation/scale)
now drives identical motion across backends.

### 4. ESLint Flat Config

`eslint.config.js` enforces:

- `@typescript-eslint/no-explicit-any` — error
- `@typescript-eslint/ban-ts-comment` — `@ts-ignore` and `@ts-nocheck` are
  errors; `@ts-expect-error` requires a description
- `@typescript-eslint/no-unused-vars` — error, with `^_` exception for
  intentionally-unused destructuring

CI runs `pnpm lint` **before** `pnpm typecheck`, so style violations fail
fast.

### 5. Animation Demo Rebuilt on the Real Animator

`apps/web/src/scenes/animation-demo.ts` previously declared an `Animator`
component and then drove animation with a separate manual `animate(time)`
function. v0.10.0 replaces that with a real clip library (`idle`, `walk`,
`spin`), `crossFadeTo`, and `keyframe-event` listeners for footsteps — the
public API documented in OA-007 is now demonstrated in the docs site.

### 6. README Roadmap Sync

The README listed v0.7.0 as "Planned" and v0.5.0 as the latest shipped.
v0.6/v0.7/v0.8/v0.9 are now marked shipped with links to their EPICs;
v0.10/v0.11/v0.12/v1.0 milestones are declared with concrete deliverables.

## Bug Fix (caught by the new test suite)

`deserialize()` used `rootNode.children.forEach((c) => scene.add(c))`.
`scene.add` calls `parent.remove(child)` on the source, which mutates
`rootNode.children` mid-iteration. `forEach` does not re-walk skipped
indices, so every other root-level node was lost on round-trip. The fix
snapshots the children array before iteration.

This was invisible until the new "round-trips four components on four
sibling nodes" test fired — exactly the case the bug touched.

## User Stories

- As a **visual editor user**, I want to save my scene and reopen it
  later with all animation tracks, mesh data, and instance matrices
  intact.
- As a **library user evaluating Oroya for an SVG infographic**, I want
  `Animator`-driven motion to work on the SVG renderer the same way it
  works on Three.js.
- As a **contributor**, I want CI to reject PRs that introduce `any` or
  `@ts-ignore` before a reviewer has to spot them.

## Implementation Tasks

### Phase A — Serialization ✅
- [x] `typedArrays.ts` with replacer/reviver and base64 encoding.
- [x] Refactor `json.ts` to use the replacer/reviver pair.
- [x] Add deserializers for the 8 missing component types.
- [x] Complete `packages/core/src/components/index.ts` barrel.
- [x] Vitest coverage: 4 typed-array round-trips + 5 component round-trips.

### Phase B — Backend Parity ✅
- [x] `renderToSVG` + `renderToSVGElement` accept `options.dt`, call
      `scene.update(dt)`.
- [x] `Canvas2DRenderOptions.dt` + `renderToCanvas` calls `scene.update(dt)`.
- [x] Vitest coverage in `renderer-svg/tests/AnimatorParity.test.ts`.

### Phase C — Demo Audit ✅
- [x] Rewrite `apps/web/src/scenes/animation-demo.ts` against the real
      Animator API.
- [x] Three clips (idle/walk/spin), crossFade controller, keyframe events.

### Phase D — ESLint ✅
- [x] `eslint.config.js` flat config.
- [x] `pnpm lint` script.
- [x] CI gate added before typecheck.
- [x] Fix the 6 pre-existing `any` violations surfaced by the rule.

### Phase E — Bug Fix ✅
- [x] Snapshot `rootNode.children` before reparenting in `deserialize()`.

### Phase F — Metadata ✅
- [x] Bump `0.9.0 → 0.10.0` on all 7 `package.json` files (root + 6 packages).
- [x] CHANGELOG entries (en / es / ja).
- [x] README roadmap sync.
- [x] EPIC OA-008 (this file).

## Acceptance Criteria

1. `pnpm lint` succeeds with zero errors on every package's `src/`.
2. `pnpm typecheck` succeeds on all 9 workspace packages.
3. `pnpm test` (= `vitest run`) passes — including the new
   `SerializationRoundtrip` (9 tests) and `AnimatorParity` (1 test).
4. `JSON.parse(JSON.stringify(scene, typedArrayReplacer), typedArrayReviver)`
   recovers a `Float32Array` byte-for-byte identical to the source.
5. A scene with an `Animator` running the `slide` clip moves the target
   node identically when rendered via `ThreeRenderer.render(dt)`,
   `renderToSVG({ ..., dt })`, or `Canvas2DRenderer.render({ ..., dt })`.
6. `git diff` shows zero `// @ts-ignore` and zero `: any` (outside the
   one documented exception in `EventEmitter` and test files).

## Out of Scope (deferred)

- **Inspector / Debug UI** → OA-009 (v0.11.0).
- **Input Manager (Gamepad/Touch/Keyboard gestures)** → OA-009.
- **Asset Manager with ref-counting** → OA-009.
- **Framework wrappers (`@joroya/react`, `@joroya/vue`)** → OA-009.
- **Skinned-mesh demo / glTF skeleton playback** → OA-010 (v0.12.0).
- **IK helper / vehicle constraint sugar** → OA-010.
- **Plugin system / API extractor / WASM modules** → v1.0.0.

## Dependencies

- `eslint@^9.0.0` and `typescript-eslint@^8.0.0` — new dev deps in the root
  `package.json`. Flat config requires ESLint 9+.

## References

- [`docs/programming-principles.md`](../../programming-principles.md) §3.2
  (no `any`), §4.1 (no unused imports), §2.1 (barrel files).
- [`docs/troubleshooting/build-errors-postmortem.md`](../../troubleshooting/build-errors-postmortem.md)
  — the originating ban on `@ts-ignore`.
- [`docs/features/OA-007/EPIC.md`](../OA-007/EPIC.md) — preceding release
  with the deferred items this EPIC partially closes.
- [`CHANGELOG.md`](../../../CHANGELOG.md) v0.10.0 entry.
