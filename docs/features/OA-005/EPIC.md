# OA-005: Renderer Completion & 3D Pipeline

**Status**: Planning
**Feature Tag**: `OA-005`
**Target Version**: v0.5.0
**Related Packages**: `@joroya/core`, `@joroya/renderer-three`, `@joroya/renderer-svg`, `@joroya/loader-gltf`

## Abstract

Complete the rendering pipeline by finishing the SVG backend, adding a Canvas2D renderer, implementing the full glTF/GLB loader, and adding 2D/3D boolean operations. This release also addresses animation system gaps (cubic spline interpolation, proper quaternion SLERP).

## Context

v0.4.0 established the core interactivity and animation infrastructure. However, several rendering capabilities remain incomplete:
- The SVG renderer lacks full transform propagation and group support
- No Canvas2D renderer exists despite the architecture supporting it
- The glTF loader needs geometry + material extraction from Blender exports
- The animation system uses linear quaternion interpolation instead of proper SLERP
- Boolean operations for CSG (2D/3D) are not yet implemented

## Features

### 1. Complete SVG Backend
Finish the SVG renderer to match Three.js feature parity where applicable.

- **Transform propagation**: Full matrix4-to-SVG-transform pipeline for nested groups
- **Group support**: Proper `<g>` element handling with inherited transforms
- **Scene graph traversal**: Correct parent-child transform composition
- **Material inheritance**: SVG-specific material properties cascade through groups

### 2. Canvas2D Renderer
New rendering backend using the HTML Canvas 2D API.

- **`CanvasRenderer` class**: Implements the renderer interface with Canvas2D context
- **Geometry mapping**: Box → rectangles, Sphere → arcs, Path2D → canvas paths
- **Material mapping**: Fill, stroke, gradients via `CanvasGradient`
- **Transform support**: `ctx.setTransform()` from world matrices
- **Camera support**: Perspective (projected) and Orthographic viewports
- **Interactivity**: Hit-testing via `isPointInPath()` / AABB checks

### 3. Full glTF/GLB Loader
Extract geometry, materials, and animations from glTF 2D files.

- **Mesh extraction**: vertex positions, normals, UVs → `BufferGeometryDef`
- **Material extraction**: PBR materials → `MaterialDef` (color, metalness, roughness)
- **Scene hierarchy**: glTF node tree → Oroya `Node` tree
- **Animation extraction**: glTF animations → `AnimationClip` + `KeyframeTrack`
- **GLB support**: Binary glTF parsing

### 4. Boolean Operations 2D/3D
Constructive Solid Geometry operations for combining shapes.

- **2D operations**: Union, intersection, difference on Path2D geometries
- **3D operations**: CSG on buffer geometries (mesh boolean)
- **Result geometry**: Produces new `GeometryDef` from boolean operations

### 5. Animation System Polish
Address known gaps in the animation system.

- **Cubic spline interpolation**: Proper implementation (currently falls back to linear)
- **Quaternion SLERP**: Replace linear quaternion interpolation with spherical interpolation
- **Animation events**: Callbacks at specific keyframe times
- **Animation blending**: Cross-fade between clips

## User Stories

- As a **2D developer**, I want a **complete SVG renderer** so transforms work correctly on nested elements.
- As a **game developer**, I want a **Canvas2D renderer** for lightweight 2D scenes without SVG overhead.
- As a **3D artist**, I want to **load my Blender models** directly into Oroya scenes.
- As a **creative coder**, I want **boolean operations** to combine shapes procedurally.
- As an **animator**, I want **smooth quaternion rotation** and cubic interpolation.

## Implementation Tasks

### Phase 1: SVG Backend Completion
- [ ] Implement full transform propagation through `<g>` groups
- [ ] Add group nesting with correct transform composition
- [ ] Test with deeply nested scene graphs
- [ ] Add material inheritance through SVG groups

### Phase 2: Canvas2D Renderer
- [ ] Create `@joroya/renderer-canvas` package (or integrate into existing structure)
- [ ] Implement `CanvasRenderer` class with renderer interface
- [ ] Map geometry primitives to Canvas2D drawing calls
- [ ] Implement transform application via `ctx.setTransform()`
- [ ] Add camera viewport support
- [ ] Implement hit-testing for interactivity

### Phase 3: glTF/GLB Loader
- [ ] Implement mesh geometry extraction (positions, normals, UVs, indices)
- [ ] Implement PBR material extraction
- [ ] Build scene hierarchy from glTF node tree
- [ ] Extract animations to `AnimationClip` format
- [ ] Support GLB binary format parsing
- [ ] Create demo with a Blender-exported model

### Phase 4: Boolean Operations
- [ ] Research and select CSG algorithm (or library integration)
- [ ] Implement 2D boolean operations on Path2D
- [ ] Implement 3D boolean operations on BufferGeometry
- [ ] Create demo showcasing CSG operations

### Phase 5: Animation Polish
- [ ] Implement proper cubic spline interpolation
- [ ] Implement quaternion SLERP
- [ ] Add animation event callbacks
- [ ] Add basic animation blending

## Acceptance Criteria

1. SVG renderer correctly renders nested groups with composed transforms.
2. Canvas2D renderer can render the same scene graph as Three.js and SVG renderers.
3. glTF files exported from Blender load correctly with geometry, materials, and animations.
4. Boolean operations produce correct geometry results for union, intersection, difference.
5. Quaternion rotations are smooth (no gimbal lock artifacts).
6. All packages build successfully (CJS + ESM + DTS).
7. Demos exist for each major feature.

## Dependencies

- **SVG backend**: No external dependencies
- **Canvas2D**: No external dependencies
- **glTF**: May use existing `@joroya/loader-gltf` package internals
- **Boolean ops**: May evaluate existing CSG libraries (e.g., `csg.js`, `three-bvh-csg`)
