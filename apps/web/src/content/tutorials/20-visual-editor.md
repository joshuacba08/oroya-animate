---
title: "Visual editor (alpha)"
description: "Tour of apps/editor — the React-based scene authoring tool that ships with v1.0."
order: 20
level: "beginner"
duration: "10 min"
---
# Tutorial 20: Basic visual editor
> **Level:** Beginner
> **Time:** 10 minutes

Run Node 24, install workspace dependencies, build the libraries, and start `pnpm --filter editor dev`. The editor is a desktop authoring application; its basic workflow is tested in Chromium, Firefox and WebKit.

1. Select a node in the hierarchy or click an object in the viewport.
2. Add a group, box, sphere or plane. New objects attach under the selection, or the scene root.
3. Edit Name and Parent; cycles are rejected without changing the scene.
4. Edit position, XYZ Euler rotation in degrees and scale. Core continues storing quaternions.
5. Edit material color, opacity, roughness, metalness or double-sided rendering.
6. Use W/E/R to move, rotate or scale with gizmos. View navigation uses an independent camera.
7. Duplicate or delete nodes. Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z or Ctrl+Y redoes. One gizmo drag is one command.
8. Save JSON. Omitted runtime data triggers a warning before downloading.
9. Load a valid scene. Viewport, hierarchy, selection and inspector switch together and history resets. Invalid files retain the current scene; replacing unsaved data requires confirmation.

`EditorController` owns the current scene, selection and reversible history. UI and renderer subscribe to that same state. Renderer, gizmos, observers, listeners and RAF are released on unmount.

The format is the existing public `serialize()` JSON shape. External assets, scripts, live playback/physics state and unsupported components require reconstruction. Duplicating a subtree creates new IDs but does not automatically retarget animation/bone names.

Timeline, project asset packaging and collaborative editing are outside this delivery. See [capabilities and acceptance](/docs/stability-1.2).
