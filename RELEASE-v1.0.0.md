# Oroya Animate v1.0.0 — Production Ready

**Released**: 2026-05-16

After eleven feature epics, 170 tests, and twelve pre-1.0 releases,
Oroya Animate is now a production library: stable public API, plugin
system, visual editor, and a documented commitment to backwards
compatibility.

## What's in the box

A complete 2D/3D engine you can build a game, a generative-art piece, an
interactive infographic, or a scientific visualization on top of:

- **Scene-graph core** (`@joroya/core`): engine-agnostic, with
  serialization, animation mixer, interaction events, math helpers
  (matrices, quaternions, easing, springs, 2-bone IK).
- **Three rendering backends**: `@joroya/renderer-three` (WebGL via
  Three.js — full PBR, shadows, post-processing, particles, audio,
  skinned meshes), `@joroya/renderer-svg` (lightweight 2D vector),
  `@joroya/renderer-canvas2d` (browser-native 2D).
- **Physics**: `@joroya/physics` — `cannon-es`-backed rigid bodies,
  joints, sensors, raycast, `Vehicle` helper.
- **glTF loader**: `@joroya/loader-gltf` — full mesh + material +
  animation + **skinned mesh** import.
- **Developer ecosystem**: `@joroya/inspector` (debug overlay),
  `@joroya/input` (cross-device action mapping), `@joroya/assets`
  (preloader / ref-counted cache).
- **Framework wrappers** (alpha): `@joroya/react`, `@joroya/vue`.
- **Visual editor** (alpha): `apps/editor` — three-panel React app with
  hierarchy, transform inspector, Save / Load.

## Stability commitments

Every symbol tagged `@public` in the source ships under the policy
documented in [`docs/api-stability.md`](docs/api-stability.md):

- Breaking changes require a major version bump.
- A removed symbol is preceded by at least one full major version of
  `@deprecated` notice.
- `@experimental` symbols (React/Vue, `Vehicle`, `solve2BoneIK`,
  `PluginRegistry`, WASM math hook) may change in minors. Pin the version
  if you depend on them.

## What's new in v1.0 specifically

| Feature | Impact |
|---|---|
| **Plugin system** | Third-party packages extend the renderer without forking |
| **API stability tags** | Consumers can audit what's safe to depend on |
| **Visual editor** (alpha) | Authoring tool that proves serialization works end-to-end |
| **WASM acceleration hook** | Integration point ready; production WASM ships post-1.0 |
| **`api:check` script** | Audits every barrel's exports for missing stability tags |

See [`docs/features/OA-011/EPIC.md`](docs/features/OA-011/EPIC.md) for
the implementation detail, acceptance criteria, and out-of-scope items.

## Upgrade from v0.x

**From v0.12.x**: nothing to change. `pnpm update` and you're done.

**From earlier**: see [`docs/migration-v1.md`](docs/migration-v1.md) for
a per-version walk-through. The most impactful pre-1.0 break was
`fxaa` → `antialiasing` in v0.10.0 — every other 0.x → 0.12 transition
was additive.

## Numbers

- **11 published packages** (`@joroya/core`, `@joroya/renderer-three`,
  `@joroya/renderer-svg`, `@joroya/renderer-canvas2d`,
  `@joroya/loader-gltf`, `@joroya/physics`, `@joroya/inspector`,
  `@joroya/input`, `@joroya/assets`, `@joroya/react`, `@joroya/vue`).
- **1 new app** (`apps/editor`).
- **170 tests** across 23 files; all green.
- **0** `any` or `@ts-ignore` in source (ESLint-enforced).
- **CJS + ESM + DTS** for every published package.

## Post-1.0 roadmap

Documented in the README under "Post-1.0 (future)":

- Production `@joroya/wasm-math` package.
- Visual editor gizmos (translate / rotate / scale handles).
- Multi-bone IK (CCD or FABRIK).
- Playwright E2E for the editor and demos.
- Animation timeline editor.
- Touch gesture recognizer on top of `@joroya/input`.

## Thanks

Eleven EPICs, twelve releases, two language translations of every
CHANGELOG entry. The library is now what its README has been promising
since v0.1: an engine-agnostic 2D/3D graphics library you can build on
top of — and rely on.
