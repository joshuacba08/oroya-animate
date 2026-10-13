# Contributing & Development

This guide describes the scripts and workspace layout in this checkout.

## Setup

Use pnpm 9 (the root `packageManager` pins 9.1.0). Library package manifests declare Node.js 18 or newer; the docs app has its own toolchain requirements. Check the installed Astro/Vite engine requirements when choosing a Node version for the website.

```bash
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate
pnpm install
pnpm build
```

Workspace consumers load compiled `dist/` files. Build packages before starting a demo or the docs app.

## Root commands

| Command | Purpose |
| --- | --- |
| `pnpm build` | Build all 11 packages with tsup (ESM, CJS, declarations) |
| `pnpm build:web` | Check documentation synchronization, build packages, then build the Astro site |
| `pnpm typecheck` | Run declared workspace typecheck scripts; packages and all four apps |
| `pnpm lint` / `pnpm lint:fix` | Lint package and app source files / apply fixes |
| `pnpm test` / `pnpm test:watch` | Run Vitest once / watch |
| `pnpm dev:react` / `pnpm dev:vanilla` | Start the Vite demo apps |
| `pnpm dev:web` | Start the Astro docs app |
| `pnpm docs:sync` | Generate managed Astro guide bodies from `docs/` |
| `pnpm docs:check` | Fail if managed guide bodies differ from their source |
| `pnpm api:check` | Informational AST audit of all resolved public exports |
| `pnpm sync-versions` | Align package versions; review its changes before publishing |
| `pnpm clean` | Run `rm -rf dist .turbo` recursively; requires a shell with `rm` |
| `pnpm publish:packages` | Build and publish packages to npm |
| `pnpm deploy:web` | Dispatch the verified documentation deployment through GitHub Actions |

Publishing and deployment commands modify external services. Run them only as part of an intended release.

## Development workflow

Build once, then keep these running in separate terminals:

```bash
pnpm --filter "./packages/**" dev
```

```bash
pnpm dev:react
# Or: pnpm dev:vanilla / pnpm dev:web
```

For one package:

```bash
pnpm --filter @joroya/core dev
pnpm --filter @joroya/core typecheck
```

The visual editor is an Vite app with tested basic authoring:

```bash
pnpm --filter editor dev
```

## Workspace

```text
packages/
  core/               Scene graph, math, components, animation, serialization, plugins
  renderer-three/     Three.js WebGL backend
  renderer-svg/       SVG string and DOM output
  renderer-canvas2d/  Browser Canvas2D backend
  loader-gltf/        glTF/GLB scene and clip import
  physics/            cannon-es systems and helpers
  assets/             Asset cache and preloading
  input/              Keyboard, mouse and gamepad actions
  inspector/          Scene inspection and frame metrics
  react/              Stable React bindings
  vue/                Stable Vue 3 composables
apps/
  demo-react/         React showcase
  demo-vanilla/       Vanilla examples
  editor/             Basic scene editor with undo/redo
  web/                Astro documentation site
docs/                 Repository guides and feature notes
```

## Documentation workflow

The guides listed in `scripts/docs-manifest.json` have their source in `docs/`.
Spanish and Japanese sources use `-es.md` and `-ja.md` suffixes.
The corresponding files in `apps/web/src/content/docs*/` keep their
frontmatter; their bodies are generated. Edit the source, then run:

```bash
pnpm docs:sync
pnpm docs:check
pnpm build:web
```

The synchronizer converts local guide links to localized site routes and
repository file links to GitHub links. Guides outside its explicit list
are outside synchronization until added to the manifest. Tutorials use topic slugs, with localized sources in docs/tutorials/es and docs/tutorials/ja. New site entries need
frontmatter, and sidebar links must be added in `DocsSidebar.astro`.
Localized routes fall back to English when a translation is absent.

Keep examples aligned with exported interfaces: rotations are quaternions,
direct transform writes need a matrix refresh, explicit lights are needed
for standard Three.js materials, and renderers already advance scene logic.
See [Renderers](renderers.md) and [Serialization](serialization.md).

## Validation

Before opening a PR:

```bash
pnpm build
pnpm docs:check
pnpm docs:validate
pnpm api:check:strict
pnpm lint
pnpm typecheck
pnpm test
```

For website or guide changes, also run `pnpm build:web` and `pnpm test:browser`.

The example checker covers standalone TypeScript/TSX programs throughout the manifest.
Mark a fence `ts complete` or `tsx complete` to require checking, and `ts fragment` to identify a setup fragment.
For programs spread across tutorial steps, wrap the relevant Markdown region in
`<!-- docs-example:start -->` and `<!-- docs-example:end -->`; its TypeScript fences compile together in order.
Build packages before typechecking their consumers. CI validates library packages on Node 18/20 and all apps on Node 24, including astro check, app builds, link/example checks and strict API audit. Deployment uses that complete validation workflow.

Vitest discovers tests under `packages/*/tests/` and
`packages/core/test/`; the root vitest.config.ts resolves workspace packages to source.
Coverage includes scene semantics, animation, serialization, SVG output,
physics, input, assets, inspection, plugins, and math.

```bash
pnpm test -- packages/core/tests/Node.test.ts
```

## Implementation conventions

- Keep TypeScript strict and avoid `any` escapes.
- Core depends only on `uuid`, never renderers or external engines.
- Renderers and systems depend on core and their own engine packages.
- Extend core contracts before reading new fields in a renderer.
- Export new public symbols through the appropriate barrels.
- Keep `composite: false` in package tsconfigs for tsup declarations.
- Put `types` first in package `exports`, then `import` and `require`.
- Declare required `@types/*` in each consuming package.

See [Programming Principles](programming-principles.md),
[API Stability](api-stability.md), and [Migration to v1](migration-v1.md).
