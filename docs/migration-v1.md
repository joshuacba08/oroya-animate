# Migration to v1.0

This guide covers every consumer-visible change from each v0.x version
up to v1.0.0. **If you are on v0.12.x, there is nothing to migrate** —
v1.0.0 is byte-for-byte API-compatible with v0.12.0; the bump signals
stability, not breakage.

## TL;DR

| If you are on… | Migration cost | Read |
|---|---|---|
| v0.12.x | None | [Stability commitments](#stability-commitments) |
| v0.10.x or v0.11.x | None | The 0.10 → 0.12 entries below |
| v0.9.x | None (additive changes only) | The 0.9 → 0.10 entry below |
| v0.8.x | None (additive changes only) | The 0.8 → 0.9 entry below |
| v0.7.x or earlier | Several rename + restructure passes | The full 0.x history in [`CHANGELOG.md`](../CHANGELOG.md) |

## What v1.0 commits to

After v1.0.0, breaking changes to any symbol tagged `@public` follow
this policy:

1. The breaking change ships in version `N.x.y` with a `@deprecated`
   tag on the old shape and a `console.warn` on first use (when feasible).
2. The old shape remains usable through every release in the `N` major
   series.
3. The old shape is removed in `(N+1).0.0` — at least one full major
   version of notice.

`@experimental` symbols (listed in [`api-stability.md`](api-stability.md))
do **not** get this guarantee. They may change in minor releases. Pin the
version (`"@joroya/react": "1.2.3"` rather than `"^1.2.3"`) if you depend
on them.

## Per-version migration notes

### v0.12.x → 1.0.0

**No source changes.** The v1.0.0 bump promotes commitments, not shapes.
Every export from v0.12.x is present in v1.0.0 with an identical
signature. Run `pnpm update` and you're done.

What is *new* (additive, opt-in):

- **Plugin system** (`PluginRegistry`, `ThreeRenderer.usePlugin`) — only
  affects you if you install plugins.
- **`getMathBackend()` / `registerMathBackend()`** — only affects you if
  you register a backend.
- **`api:check` script** — read-only audit, nothing changes about your
  build.

### v0.11.x → v0.12.0

- **New components**: `Skin` (skeletal animation). Optional; existing
  code does not change.
- **`BufferGeometryDef` gained `skinIndices` and `skinWeights`** — both
  optional. Static meshes are unaffected.
- **New helpers**: `solve2BoneIK` in `@joroya/core`, `Vehicle` in
  `@joroya/physics`. Additive.
- **`PhysicsSystem.getBody(node)`** — new public method.

### v0.10.x → v0.11.0

- **Five new packages**: `@joroya/inspector`, `@joroya/input`,
  `@joroya/assets`, `@joroya/react`, `@joroya/vue`. None depend on each
  other; install only what you use.
- No changes to existing package APIs.

### v0.9.x → v0.10.0

- **`PostProcessingDef.fxaa` → `PostProcessingDef.antialiasing`**. The
  old field never worked (the renderer didn't read it); the rename also
  switched the implementation from a missing FXAA pass to a real SMAA
  pass. Existing code that wrote `fxaa: true` was silently a no-op
  before — now they should write `antialiasing: true`.
- **TypedArrays survive serialization**: scenes that contain
  `AnimationClip`, `BufferGeometry`, or `InstancedMesh` now round-trip
  cleanly through `serialize` / `deserialize`. If you wrote a
  workaround that base64-encoded these manually, you can drop it.

### v0.8.x → v0.9.0

- **New `Animator` component** with `play` / `stop` / `crossFade` API.
  The pre-v0.9 stub component had no methods; existing usage was
  necessarily a no-op or a placeholder.
- **`@joroya/physics` cleaned of rapier orphans**. If you were
  importing `RigidBody`, `Collider`, or related from
  `@joroya/physics/components/*`, switch to `@joroya/core` exports —
  the canonical components have lived there since v0.9.
- **`ThreeRenderer.render(dt?)`**: accepts an optional frame-time
  argument. Callers that didn't pass one still work (defaults to
  `1/60`), but animation looks crisper with a real `dt`.

### v0.7.x and earlier

See the full historical CHANGELOG. Pre-v0.7 versions predate this
project's monorepo stabilization (v0.3.0's "Build Stabilization" entry).
The simplest migration path from a 0.6.x or earlier release is to read
each intermediate CHANGELOG section sequentially.

## Stability commitments

Symbols ship under one of three tags (full list in
[`api-stability.md`](api-stability.md)):

- `@public` — breaking change requires a major bump.
- `@experimental` — may change in minors.
- `@internal` — not part of the public API.

If a symbol from a package's `dist/index.d.ts` is *not* listed in the
stability doc, treat it as `@public` (the conservative default).

## Need help?

- Open an issue at <https://github.com/joshuacba08/oroya-animate/issues>
  with the version you're coming from and the symbol you're stuck on.
- The [`CHANGELOG.md`](../CHANGELOG.md) is the authoritative log of
  every shape-affecting change.
