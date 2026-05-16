# API Stability Policy

Starting with **v1.0.0**, Oroya Animate follows a tagged stability model
inspired by `@microsoft/api-extractor`. Every export from a `@joroya/*`
package's barrel (`src/index.ts`) carries one of three TSDoc tags:

| Tag | Stability | Breaking change policy |
|-----|-----------|------------------------|
| `@public` | Stable | Breaking changes require a **major** version bump. Two-version deprecation window before removal. |
| `@experimental` | In flux | May change shape or be removed in any minor release. Pin the version if you depend on it. |
| `@internal` | Implementation detail | Not part of the public surface. Importing from outside its declaring package is unsupported and may break in any release. |

Untagged exports default to `@public` (so the policy is conservative — if
you forgot to tag something, you owe semver coverage on it).

## Examples

```ts
/**
 * @public
 * Engine-agnostic scene-graph container.
 */
export class Scene { ... }

/**
 * @experimental
 * 2-bone analytical IK solver. Argument shape may change.
 */
export function solve2BoneIK(...) { ... }

/**
 * @internal
 * Renderer-private cache key format. Not exported from the barrel.
 */
export function makeCacheKey(...) { ... }
```

## What ships as `@experimental` in v1.0.0

These pieces are deliberately tagged experimental because their shape is
still settling:

- **`@joroya/react`** and **`@joroya/vue`** — alpha framework wrappers.
  Component prop names and hook signatures may change as the React /
  Vue communities give feedback.
- **`solve2BoneIK`** — argument order (world-space vs local-space inputs)
  may be reworked once a multi-bone IK solver lands.
- **`Vehicle`** — wheel-options shape mirrors cannon-es directly; we may
  introduce friction tweaks per wheel as a follow-up.
- **`PluginRegistry` / `ComponentHandler`** — the lifecycle (`create` /
  `update` / `dispose`) is settled, but the host-side dispatch contract
  (when to call `update` relative to physics / animation) may grow new
  guarantees.
- **WASM acceleration hooks** (`registerMathBackend`) — the surface is
  in place but no production WASM ships yet.

Everything else exported from the `@joroya/core`, `@joroya/renderer-*`,
`@joroya/loader-gltf`, `@joroya/physics`, `@joroya/inspector`,
`@joroya/input`, and `@joroya/assets` package barrels is `@public`.

## Tooling

- `pnpm api:check` — scans every barrel for exports lacking a stability
  tag and reports them. Currently informational (not a CI gate) — the
  intent is to make accidental missing tags visible during code review.
- Per-package `dist/index.d.ts` is the canonical surface. If a symbol is
  in that file, it is part of the public API regardless of in-source
  tag. Use `@internal` *and* keep the symbol out of the barrel for
  internals.

## Migration windows

A `@public` symbol marked `@deprecated` in version `N.x.y` remains
present (with a console.warn on first use, where possible) through
version `(N+1).x.y`. It is removed in `(N+2).0.0`. This gives consumers
at least one major version of notice for every breaking change.

## Pre-1.0 history

Versions 0.1.0 through 0.12.0 predate this policy. The CHANGELOG records
every breaking change in those versions, but no formal deprecation
windows existed — pre-1.0 callers absorbed those breaks directly. From
v1.0.0 forward, that does not happen on `@public` APIs.
