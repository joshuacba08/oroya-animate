# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

Root scripts (run from repo root with `pnpm <script>`):

| Script | What it does |
|---|---|
| `pnpm install` | Install all workspace deps (pnpm 9, Node 18+) |
| `pnpm build` | Build every package under `packages/*` with tsup (CJS + ESM + `.d.ts`) |
| `pnpm build:web` | Build packages, then the Astro docs site under `apps/web` |
| `pnpm typecheck` | `tsc --noEmit` recursively across the workspace |
| `pnpm test` | Run Vitest once |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm dev:react` | Start `apps/demo-react` (Vite) |
| `pnpm dev:vanilla` | Start `apps/demo-vanilla` (Vite) |
| `pnpm dev:web` | Start `apps/web` (Astro) |
| `pnpm clean` | Remove all `dist/` and `.turbo/` |
| `pnpm sync-versions` | Run `scripts/sync-versions.js` to align package versions |

Filter scoped commands (per-package):

```bash
pnpm --filter @joroya/core build          # build one package
pnpm --filter @joroya/core dev            # tsup --watch
pnpm --filter @joroya/core typecheck      # tsc --noEmit
pnpm --filter "./packages/**" dev         # watch ALL packages in parallel
```

Run a single test file:

```bash
pnpm test -- packages/core/tests/Node.test.ts
```

Tests live in two directories under `packages/core/` — `tests/` (unit) and `test/` (e.g. `culling.test.ts`). There is no top-level vitest config; Vitest picks up both by convention.

### Build-before-dev is mandatory

Workspace packages are consumed through their compiled `dist/`, **not** their `src/`. After cloning or after editing a package, run `pnpm build` once before launching any demo. For active package development, keep `pnpm --filter "./packages/**" dev` (tsup watch) running in another terminal alongside the demo's dev server.

## Architecture

### "Define once, render anywhere"

The scene graph in `@joroya/core` is an intermediate representation. Renderers are translators (a compiler-style pattern): they read the scene graph and emit Three.js objects, an SVG string, Canvas2D draw calls, etc. The same scene can be rendered by multiple backends without changing the scene code.

### Strict unidirectional dependency rule

```
@joroya/core  ←  renderers / loaders / physics  ←  apps
```

- `@joroya/core` **must not** import from any renderer, loader, `three`, `cannon-es`, or any other engine. Its only runtime dep is `uuid`. This is enforced by convention, not tooling — preserve it when adding code.
- Renderers (`renderer-three`, `renderer-svg`, `renderer-canvas2d`), loaders (`loader-gltf`), and `physics` import only from `@joroya/core` plus their own engine deps.
- Apps may import any workspace package.

### Simplified ECS

- **Entity** = `Node` (in `packages/core/src/nodes/Node.ts`) — has `id`, `name`, `parent`, `children`, a `components` map keyed by `ComponentType`, and an `EventEmitter` for interaction.
- **Component** = data attached to a node (`Transform`, `Geometry`, `Material`, `Camera`, `Light`, `Interactive`, `RigidBody`, `Collider`, `Animator`, `AudioListener`, `AudioSource`, `PostProcessing`, `ParticleSystem`, `InstancedMesh`, `Environment`, …). All extend `Component` and declare a `type: ComponentType`.
- **System** = renderer code, plus `Scene.update(dt)` / `Scene.updateWorldMatrices()`. Components carry data only; rendering logic lives in renderers.

Invariants:
- **One component per `ComponentType` per node.** The components map is keyed by type — adding a second `Geometry` overwrites the first.
- Every `Node` automatically owns a `Transform` (added in its constructor). Access it via `node.transform`.
- Mutating `transform.position/rotation/scale` sets `isDirty`; `updateWorldMatrix()` recomputes the local matrix only when dirty and multiplies by the parent's world matrix.

### Render lifecycle

1. **Build** — User constructs `Scene`, adds `Node`s with components.
2. **Mount** — `renderer.mount(scene)` traverses the graph, creates backend objects (e.g. `THREE.Mesh`), and stores them in `nodeMap`/`reverseNodeMap`.
3. **Per-frame** — User mutates transforms / runs `scene.update(dt)`. Then `renderer.render()` calls `scene.updateWorldMatrices()` and syncs each backend object from its node's world matrix.
4. **Dispose** — `renderer.dispose()` releases GPU/audio/event resources.

The Three.js renderer additionally handles raycasting for `Interactive` components, `OrbitControlsWrapper`, post-processing via `EffectComposer`, CSG via `three-csg-ts`, texture/audio loading, and instanced meshes.

### Workspace layout

```
packages/
  core/               @joroya/core — Scene, Node, Components, Math, serialization, events
  renderer-three/     @joroya/renderer-three — WebGL backend (peerDep: three)
  renderer-svg/       @joroya/renderer-svg — SVG string backend (works in Node)
  renderer-canvas2d/  @joroya/renderer-canvas2d — Canvas2D backend
  loader-gltf/        @joroya/loader-gltf — glTF/GLB → scene graph
  physics/            @joroya/physics — cannon-es integration (RigidBody/Collider components live in core)
apps/
  demo-react/         Vite + React showcase
  demo-vanilla/       Minimal vanilla JS demos
  web/                Astro docs site (deployed to Vercel)
```

`@joroya/core`'s public surface is re-exported from `packages/core/src/index.ts`. When you add a new component, math type, or system to core, add the corresponding `export *` line here — downstream packages import from the package root.

## Conventions that bite if ignored

These come from `docs/programming-principles.md` and `docs/troubleshooting/build-errors-postmortem.md`:

- **Contract-first.** Before a renderer reads a new property off a core component/definition, that property must already exist on the core interface. Don't reach for `as any` to bypass this — extend the core type instead.
- **Barrel files.** Any directory imported as a module (`'../components'`, `'../math'`, …) needs an `index.ts` re-exporting its public surface. Without it, tsup/esbuild can't resolve the import.
- **`composite: false` in every package's `tsconfig.json`.** The root `tsconfig.base.json` sets `composite: true`, but tsup's DTS worker conflicts with it. Each package's tsconfig overrides to `false`.
- **`exports` field shape.** Packages are `"type": "module"`, so tsup emits `.js` (ESM) and `.cjs` (CJS). The `exports` map must list `types` **first**, then `import`, then `require` — Node evaluates conditions in order.
- **Per-package `@types/*`.** Type packages are not shared across the monorepo. If `loader-gltf` uses `three`, it declares its own `@types/three`, even though `renderer-three` already does.
- **No literal newlines inside `'...'` / `"..."` strings.** Use `'\n'` escapes — a real newline in a single/double-quoted string breaks the build.
- **TypeScript strict mode is non-negotiable.** `noUnusedLocals`, `noUnusedParameters`, no `any` escapes. Add a real interface or install proper `@types/*`.

## CI and validation

`.github/workflows/ci.yml` runs on push/PR to `main`/`develop` on Node 18 and 20:

```
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Run these three locally before opening a PR. The docs site is deployed to Vercel via `pnpm deploy:web` (or `.github/workflows/deploy-web.yml`); package publishing is gated through `.github/workflows/publish.yml` and `pnpm publish:packages`.

## Where to look first

- New backend / renderer behavior → `packages/renderer-three/src/ThreeRenderer.ts` is the reference implementation (mount/render/dispose, raycasting, instancing, post-processing, audio).
- Core scene-graph semantics → `packages/core/src/nodes/Node.ts`, `packages/core/src/scene/Scene.ts`, `packages/core/src/components/*`.
- Math (matrices, quaternions, AABB, frustum, interpolation) → `packages/core/src/math/`.
- Serialization round-trip → `packages/core/src/serialization/json.ts` (tested in `packages/core/tests/`).
- Feature-level design notes for in-flight work → `docs/features/OA-XXX/`.
