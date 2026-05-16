---
title: "Visual editor (alpha)"
description: "Tour of apps/editor — the React-based scene authoring tool that ships with v1.0."
order: 20
level: "beginner"
duration: "10 min"
---

# Tutorial 20: Visual editor (alpha)

> **Level:** Beginner
> **Time:** 10 minutes
> **You'll learn:** what `apps/editor` does, how it uses the v0.10 serialization layer, and how to extend it for your own workflow.

> **Status:** alpha. Layout and feature set will evolve through 1.x. The file format it writes (`.json` via `serialize()`) is `@public` and stable across the 1.x series.

---

## Run it locally

```bash
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate
pnpm install
pnpm build                              # build all workspace packages first
pnpm --filter editor dev                # starts the editor on http://localhost:5173
```

The starter scene loads: a hero cube, a sphere, a lit ground plane, and a perspective camera.

---

## The three panels

| Region | Purpose |
|---|---|
| **Left** — Hierarchy | List of every node in the scene tree. Click to select. |
| **Center** — Canvas | Live `ThreeRenderer` view. The render loop ticks at requestAnimationFrame. |
| **Right** — Inspector | Editable transform for the selected node (position / rotation quaternion / scale) + a read-only list of attached components. |

A toolbar at the top exposes **+ Cube** (spawn a random-colored cube), **Save** (download `scene.json`), **Load** (file picker → `deserialize()` → mount), and **Delete** (remove the selected node).

---

## How it's built

The editor is intentionally small — about 400 lines of React. The key pieces:

1. **`OroyaCanvas`** is *not* used here. The editor mounts a `ThreeRenderer` directly because the host layout (3-pane grid) wants full control over canvas sizing and the React Strict Mode lifecycle.
2. **Scene mutations bump a `revision` counter.** React doesn't observe the Oroya tree natively (the tree is plain mutable objects). The editor keeps a `useState` counter that increments on every structural change (add node, delete, load); the panels include the counter as a hidden span so React re-renders them.
3. **Save / Load round-trip uses `serialize()` / `deserialize()`** from `@joroya/core`. The serialization layer (v0.10.0) handles `Float32Array`-backed animation tracks, buffer geometries, and instanced mesh matrices via base64-encoded typed arrays.
4. **Transform edits write directly to `node.transform`** then call `updateLocalMatrix()`. The next frame's `updateWorldMatrices()` propagates the change to the rendered object.

Read the source under [`apps/editor/src/`](https://github.com/joshuacba08/oroya-animate/tree/main/apps/editor/src):
- `Editor.tsx` — the shell + render loop + state.
- `HierarchyPanel.tsx` — tree view.
- `TransformInspector.tsx` — number-input grid.
- `Toolbar.tsx` — buttons + file picker.

---

## What the editor can't do (yet)

- **Gizmos**: no 3D translate / rotate / scale handles. You edit by typing numbers. Gizmos ship post-1.0.
- **Euler rotation**: rotation is exposed as a raw quaternion (`x, y, z, w`). A future mode toggle will add Euler / axis-angle editing.
- **Undo / redo**: every edit is destructive. Save often.
- **Component editing**: you can see what components a node has, but not add / remove them from the UI. Use the **Save → edit JSON → Load** workflow for now.
- **Material editor**: no color picker. Material colors come from whatever the source scene set.

These are all post-1.0 items on the project roadmap.

---

## Extend it for your project

Because the editor is a regular Vite + React app under `apps/editor/`, you can fork it as a starting point for project-specific tooling:

- Add a panel that exposes your custom components.
- Hook the file format to a backend (S3 upload instead of browser download).
- Layer plugin-aware visualizations on top of the `Inspector` package.

The core editor doesn't ship as an npm package — it's a reference app. Copy `apps/editor/` into your own monorepo and adjust from there.

---

## Save / Load formal contract

The JSON the editor produces is the same format `serialize(scene)` produces from any code path. Properties:

- **Stable**: the format won't change shape within the 1.x series.
- **Engine-agnostic**: no Three.js references. A Scene saved here loads in the SVG / Canvas2D renderers too (with the obvious caveats — those backends can't render shadows, audio, or 3D-only geometry).
- **Skips runtime-only components**: `InstancedMesh` GPU state and `Script` closures are intentionally not deserialized; the application owns their lifecycle.

If you need to introspect what a saved scene contains, just `JSON.parse(text)` and inspect — it's a plain tree of nodes and components.

---

## What to try next

- **Build the editor for production**: `pnpm --filter editor build` produces a static bundle in `apps/editor/dist/` you can host anywhere.
- **Combine with the Inspector overlay**: the editor's hierarchy panel is a custom React component; the standalone `@joroya/inspector` is the DOM overlay. They share the same `collectSceneStats` / `FrameMetrics` helpers if you want metrics in your own editor fork.
- **Reload over a glTF source**: drop a `loadGLTF()` call in `buildStarterScene()` to import a Blender model on every boot.
