# Contributing & Development

Guide for setting up the dev environment, running the project locally, and contributing.

---

## Prerequisites

- **Node.js** v18 or higher
- **pnpm** v9+ (managed via [Corepack](https://nodejs.org/api/corepack.html))

To enable Corepack (ensures the correct pnpm version is used automatically):

```bash
corepack enable
```

---

## Setup

```bash
# Clone the repository
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate

# Install all dependencies (root + all packages + all apps)
pnpm install
```

---

## Available Scripts (Root)

| Script           | Command               | Description                                   |
|------------------|-----------------------|-----------------------------------------------|
| Build all packages | `pnpm build`        | Builds all packages under `packages/` with tsup. |
| Run tests        | `pnpm test`           | Runs all tests with Vitest.                   |
| Watch tests      | `pnpm test:watch`     | Runs tests in watch mode.                     |
| Dev (Vanilla)    | `pnpm dev:vanilla`    | Starts the vanilla JS demo with Vite.         |
| Dev (React)      | `pnpm dev:react`      | Starts the React demo with Vite.              |
| Clean            | `pnpm clean`          | Removes all `dist/` folders.                  |
| Typecheck        | `pnpm typecheck`      | Runs `tsc --noEmit` across all packages.      |

---

## Development Workflow

### 1. Build the core packages first

Before running any demo, make sure the packages are built:

```bash
pnpm build
```

### 2. Start a demo

```bash
# Vanilla JS demo
pnpm dev:vanilla

# React demo
pnpm dev:react
```

### 3. Make changes to a package

If you're modifying a package (e.g., `@oroya/core`), you can run its build in watch mode:

```bash
# In one terminal — watch for core changes
cd packages/core
pnpm dev

# In another terminal — run the demo
cd ../..
pnpm dev:vanilla
```

### 4. Run tests

```bash
pnpm test
```

Tests are located in `packages/core/tests/` and use [Vitest](https://vitest.dev/).

---

## Project Layout

```
oroya-animate/
├── package.json              # Root scripts and devDependencies
├── pnpm-workspace.yaml       # Workspace definition
├── tsconfig.base.json        # Shared TypeScript config
├── docs/                     # Documentation (you are here)
├── packages/
│   ├── core/                 # @oroya/core — Scene graph, nodes, components
│   ├── renderer-three/       # @oroya/renderer-three — WebGL backend
│   ├── renderer-svg/         # @oroya/renderer-svg — SVG backend
│   └── loader-gltf/          # @oroya/loader-gltf — glTF importer
└── apps/
    ├── demo-vanilla/         # Vanilla JS demo app
    └── demo-react/           # React demo app
```

---

## Build System

Each package uses [tsup](https://tsup.egoist.dev/) for building:
- Outputs both **ESM** (`.mjs`) and **CJS** (`.cjs`) formats.
- Generates TypeScript declaration files (`.d.ts`).
- Configuration is in `tsup.config.ts` inside each package.

---

## Testing Strategy

- **Framework:** [Vitest](https://vitest.dev/) (Vite-native, Jest-compatible API).
- **Location:** `packages/core/tests/`
- **Current coverage:**
  - Node creation and hierarchy (add/remove children)
  - Scene serialization/deserialization round-trip

### Running a specific test file

```bash
pnpm test -- packages/core/tests/Node.test.ts
```

---

## Code Style

- TypeScript strict mode.
- Components follow the ECS (Entity-Component System) pattern.
- The core must **never** import from any renderer or external engine.
- Renderers may import from `@oroya/core` only.
