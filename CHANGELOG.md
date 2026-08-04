# Changelog

All notable changes to Oroya Animate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-04

### Added
- Deterministic authoring controls on `AnimationMixer` and `Animator`: `seek`, `pause`, `resume`,
  pure `sampleAt`, and `tick` backed by an injectable monotonic clock.
- Versioned `serializeAnimationClip` / `deserializeAnimationClip` helpers that round-trip typed
  keyframe arrays through JSON-safe data.
- Reliable event delivery when one update crosses multiple loop iterations.

### Fixed
- Non-looping clips now apply their exact final pose before reporting that playback finished.

## [1.0.0] - 2026-05-16

> **First production release.** The engine, the developer ecosystem, and the
> content tooling are all in place. Everything tagged `@public` in the
> source ships under the stability policy in [`docs/api-stability.md`](docs/api-stability.md) —
> breaking changes require a major version bump and a 1-major deprecation
> window.

### Added
- **Plugin system** (`@joroya/core/plugins`): new `PluginRegistry`, `Plugin`, and `ComponentHandler` types. `ThreeRenderer.usePlugin(plugin)` installs handlers that take precedence over built-in component branches — third-party packages can now extend the renderer without forking. Plugin handlers fire `create` / `update(dt)` / `dispose` hooks; per-frame plugin updates run between scene update and the world-matrix sync pass. 7 unit tests.
- **API stability tags** (`docs/api-stability.md`): `@public`, `@experimental`, `@internal` JSDoc convention enforced via the new `pnpm api:check` script. v1.0 surface is tagged across the main classes — `Scene`, `Node`, `ThreeRenderer`, `OrbitControlsWrapper`, `Inspector`, `FrameMetrics`, `InputManager`, `AssetManager`, `PhysicsSystem` are `@public`; `Vehicle`, `solve2BoneIK`, `PluginRegistry`, React/Vue bindings are `@experimental`.
- **Visual editor** (`apps/editor`, alpha): React-based scene editor with hierarchy panel, transform inspector (per-axis number inputs for position / rotation quaternion / scale), and Save / Load via the v0.10.0 serialization round-trip. Pre-populates with a hero cube / ball / lit ground starter scene. Includes "Add Cube" for incremental composition and "Delete" for the selected node.
- **WASM acceleration hook** (`@joroya/core/math/MathBackend`): `getMathBackend()` / `registerMathBackend(backend)` registry. Default backend is pure JS; companion packages (e.g. future `@joroya/wasm-math`) drop in a WASM implementation without changes to consumer code. The hook is in place even though no production WASM ships in v1.0 — this avoids a breaking change later. 3 unit tests.
- **`InstancedMesh` serialization clarification** test: documents that `InstancedMesh` is intentionally not deserialized (GPU runtime state is owned by app code) while the underlying `Float32Array` data round-trips through the v0.10 typed-array layer when persisted manually.
- **EPIC**: [OA-011 — Production Ready (v1.0)](docs/features/OA-011/EPIC.md).

### Changed
- Every workspace package + the root jump from `0.12.0` to `1.0.0`. The shape of the public API does not change from v0.12.x — the bump signals stability, not breakage.
- README roadmap: v1.0.0 row promoted to Shipped; post-1.0 items (multi-bone IK, gizmos, full Playwright E2E, production WASM) documented as future work.

### Stability commitments
- `@public` symbols listed in `docs/api-stability.md` will not change shape without a major bump and a deprecation window of at least one major version.
- `@experimental` symbols (currently: `@joroya/react`, `@joroya/vue`, `Vehicle`, `solve2BoneIK`, `PluginRegistry`, math backend hooks) may evolve in minor releases. Pin the version if you depend on them.
- Pre-1.0 CHANGELOG entries (v0.1.0 – v0.12.0) are preserved as historical record. Migrations between those versions did not have deprecation windows; from v1.0.0 forward they do.

## [0.12.0] - 2026-05-16

### Added
- **Skinned mesh / glTF skeletal animation** (`@joroya/core`, `@joroya/loader-gltf`, `@joroya/renderer-three`): new `Skin` component holds bone names + inverse bind matrices. `BufferGeometryDef` extended with optional `skinIndices: Uint16Array` and `skinWeights: Float32Array` (per-vertex bone refs + weights, 4 per vertex). `loadGLTF` extracts skin attributes from `THREE.SkinnedMesh` and produces matching `Skin` components. `ThreeRenderer` builds a `THREE.SkinnedMesh` instead of `Mesh` when both are present and resolves the `THREE.Skeleton` in a post-pass after every Oroya node has its Three.js peer. Bone Nodes animate normally through the core `Animator` → `AnimationMixer` → `node.transform` path; the SkinnedMesh follows automatically (no separate `THREE.AnimationMixer` needed for property tracks).
- **2-bone analytical IK** (`@joroya/core/math/IK`): `solve2BoneIK(rootPos, midPos, endPos, target, pole?)` returns `{ rootRotation, midRotation, reached }` using the law-of-cosines closed-form. Optional pole vector picks the bend plane (elbow direction); a sensible default is chosen when omitted. O(1) per solve — no iteration. Apply to arms / legs / antennas. 6 tests cover reachability, degenerate (target=root), full-extension (target too far), pole-flip determinism, end-effector placement.
- **Vehicle helper** (`@joroya/physics/Vehicle`): high-level wrapper over `CANNON.RaycastVehicle`. Construct against an existing chassis node; `addWheel({ chassisPosition, radius, isDriving, isSteering, node })` registers wheels with optional Oroya node mirrors. `drive(force)` / `steer(angle)` / `brake(force)` act on all matching wheels; `syncWheelNodes()` writes simulated wheel poses back to their nodes each step. 5 tests covering construction, wheel tagging, transform sync, dispose.
- **`PhysicsSystem.getBody(node)`** — public eager body materialization. `Vehicle` uses it to bind the chassis without waiting for the next `update()` tick.
- **`Skin` deserialization** added to the `json.ts` switch. `Skin` exported from the components barrel + the root `@joroya/core` index.
- **EPIC**: [OA-010 — Skinned Mesh, IK & Vehicles](docs/features/OA-010/EPIC.md).

### Changed
- The `BufferGeometry` case in `ThreeRenderer.buildGeometryFromDef` now wires `skinIndex` + `skinWeight` Three.js buffer attributes when the corresponding fields are present on `BufferGeometryDef`.
- `ThreeRenderer.rebuildScene` clears a new `pendingSkinBindings` queue and runs `resolveSkinBindings()` after the traversal, so skinned meshes whose bones haven't been visited yet still bind correctly.

## [0.11.0] - 2026-05-15

### Added
- **`@joroya/inspector` (new package)** — vanilla-DOM debug overlay for an Oroya `Scene`. Click-to-select hierarchy, transform / components view for the selected node, rolling FPS / frame-time / max-hitch metrics, and scene-graph stats (node + component counts by type). Framework-agnostic (no React/Vue dep). Throttled DOM refresh keeps overhead bounded.
- **`@joroya/input` (new package)** — unified keyboard / mouse / gamepad layer with declarative action mapping. `bindAction('jump', [{ key: 'Space' }, { gamepad: 'A' }])` then react to `action-down` / `action` / `action-up` events. Gamepad Standard mapping (A/B/X/Y, DPad, sticks, triggers) plus analog axis reads. Auto-clears state on window blur so keys don't "stick".
- **`@joroya/assets` (new package)** — centralized asset cache with deduplication, ref-counted release, and progress events. Built-in loaders for `image`, `audio` (decoded `AudioBuffer`), `json`, `text`, `binary`; pluggable via `registerLoader` for app-specific types (glTF, FBX, etc.). `preload([...])` emits per-item `progress` / `loaded` / `error`; failed items don't reject the overall promise.
- **`@joroya/react` (new package, alpha)** — React bindings. `<OroyaCanvas>` owns the scene + renderer + RAF loop and exposes `useFrame(dt)`, `useScene()`, `useParentNode()` hooks. JSX components: `<Group>`, `<Box>`, `<Sphere>`, `<Plane>`, `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>`. Children attach to the Oroya scene graph through React context — no manual `scene.add()`.
- **`@joroya/vue` (new package, alpha)** — Vue 3 composables. `useOroyaCanvas(canvasRef)` mounts the renderer, `useFrame((dt) => ...)`, `useNode((node) => setup)` build the scene graph from `<script setup>`. Uses `shallowRef` so Vue reactivity doesn't recurse into the scene graph.
- **22 new tests** across the 3 framework-agnostic packages (FrameMetrics + SceneStats + AssetManager dedup/refcount/progress + InputManager keyboard/mouse/blur/bindings/actions).
- **EPIC**: [OA-009 — Ecosystem (Inspector, Input, Assets, Framework Wrappers)](docs/features/OA-009/EPIC.md).

### Changed
- `pnpm lint` glob now matches both `.ts` and `.tsx` so the React wrapper's JSX is linted in CI.
- README roadmap entry for v0.11.0 promoted from "Planned" to "Shipped".

## [0.10.0] - 2026-05-15

### Added
- **Full serialization round-trip for typed arrays**: `Float32Array`, `Uint8Array`, `Uint16Array` and `Uint32Array` survive JSON via base64 encoding (glTF-compatible format). This unblocks save/load of `AnimationClip` (times/values), `BufferGeometryDef` (positions/normals/uvs/indices), and `InstancedMeshComponent` matrices — the prerequisites for the v1.0 visual editor.
- **Deserialization for every shipped component**: `RigidBody`, `Collider`, `Animator`, `PostProcessing`, `ParticleSystem`, `AudioListener`, `AudioSource`, `Environment` (in addition to the pre-existing Transform / Geometry / Material / Camera / Light / Animation / Interactive). 9 new round-trip tests covering each.
- **Backend parity for `Animator`**: `renderToSVG`, `renderToSVGElement` and `Canvas2DRenderer.render` now run `Scene.update(dt)` before their world-matrix pass, accepting an `options.dt` parameter (default `1/60`). Animator-driven property animation now works on all three backends, not just Three.js.
- **ESLint with flat config**: `eslint.config.js` enforces `no-explicit-any`, `no @ts-ignore`, and unused-vars rules (`docs/programming-principles.md` §3.2 + §4.1, codified). `pnpm lint` script + CI gate added before typecheck.
- **EPIC**: [OA-008 — Serialization, Backend Parity & Hardening](docs/features/OA-008/EPIC.md).

### Changed
- `pnpm test` now invokes `vitest run` (no-watch mode) so CI doesn't hang. `pnpm test:watch` covers the previous interactive behavior.
- `apps/web/src/scenes/animation-demo.ts` rewritten to use the real `Animator` API (idle / walk / spin clip library + `crossFadeTo` controller + `footstep` keyframe events). The old manual `animate(time)` loop is gone.
- `packages/core/src/components/index.ts` is now a complete barrel (`Animator`, `AudioListener`, `AudioSource`, `Collider`, `InstancedMeshComponent`, `Interactive`, `ParticleSystem`, `PostProcessing`, `RigidBody` — previously missing).
- README roadmap synced to reality: v0.6 / v0.7 / v0.8 / v0.9 marked shipped, v0.10 / v0.11 / v0.12 / v1.0 milestones declared.

### Fixed
- **Bug: `deserialize` lost half of root-level nodes**. `rootNode.children.forEach((c) => scene.add(c))` mutated the source array mid-iteration (`scene.add` reparents the child, which removes it from `rootNode`), skipping every other entry. Replaced with a snapshot + for-loop. Round-trip tests guard against regression.
- `EventEmitter` no longer types its internal handler set as `any`; only the public `EventMap` bound retains `Record<string, any>` (standard pattern, documented with an inline eslint-disable + rationale).
- `loadGLTF.ts`, `InstancedMeshComponent.getMatrixAt`, and `Gen.random` no longer use `any` for their working types.

## [0.9.0] - 2026-05-15

### Added
- **Physics package (`@joroya/physics`)**: `PhysicsSystem` driving a `cannon-es` world from any `Scene`. Reads `RigidBody` + `Collider` from `@joroya/core`, syncs world-space transforms back to each node every step. World-space initial pose is decomposed from `worldMatrix` so spawn positions match the scene.
- **Joints / Constraints**: `addHingeConstraint`, `addPointToPointConstraint`, `addDistanceConstraint` (cannon-es-backed). Enables ragdolls, pendulums, ropes, vehicle wheels.
- **Collision events**: `Node.events` now emits `collide-begin`, `collide`, `collide-end` for solid contacts and `trigger-enter`, `trigger-stay`, `trigger-exit` for sensor colliders. Payload includes the other node, contact point, normal, and impact velocity.
- **Sensor / trigger colliders**: `Collider.isTrigger` produces collision events without applying contact response (checkpoints, damage zones, proximity sensors).
- **Collision filtering**: `Collider.collisionGroup` and `collisionMask` bitmasks for layered simulations.
- **Physics raycast**: `PhysicsSystem.raycast` and `raycastAll` return `{ node, point, normal, distance }` against rigid bodies. Click-to-pick now works against the physics world, not just the visual scene.
- **Animator component (full)**: `play(name)`, `stop()`, `crossFade(name, duration)`, `addClip(clip)`, plus an `autoplay` option. Drives `node.transform` on target nodes through the engine-agnostic `AnimationMixer` of `@joroya/core`.
- **Animation blending**: `AnimationMixer` now supports multiple concurrent clips with per-clip weight and crossfade ramps. Quaternion blends use nlerp + hemisphere correction to avoid sign-flip artifacts.
- **Keyframe events**: `AnimationClip.events: KeyframeEvent[]` fires named events on a per-`Animator.on('keyframe-event', ...)` channel as the play-head crosses each event time. Use for footsteps, attack hit-frames, dialogue cues.
- **Animation `finished` event**: non-looping clips emit `finished` on the mixer when they reach their duration.
- **Easing + spring helpers**: `linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, cubic and sine variants, `easeOutElastic`, plus a critically-dampable `spring(current, target, velocity, stiffness, damping, dt)` integrator for camera follow / UI snap / IK.
- **`Scene.update(dt)` runs every frame** through `ThreeRenderer.render(dt)`, so `Component.onUpdate` (including `Animator`) is now first-class.
- **Tests**: `Animator` (play/stop/crossFade/events/finished), `Easing` (8 cases including critical-damping spring), `PhysicsSystem` (gravity/stack/triggers/joints/raycast).
- **EPIC**: [OA-007 — Physics & Animation](docs/features/OA-007/EPIC.md).

### Changed
- `ThreeRenderer.render(dt?: number)` takes an optional real `dt`. The hard-coded `0.016` is gone — `Animator`, `PhysicsSystem` (when wired by the app), and `THREE.AnimationMixer` all see real frame time. Default is `1/60` when omitted to keep the still-frame API working.
- `THREE.AnimationMixer` is now created only when a node has an actual `THREE.SkinnedMesh` descendant. Plain property animation runs entirely through the core `AnimationMixer`, keeping the renderer engine-specific code path narrow.
- `Collider` definition extended with `isTrigger`, `collisionGroup`, `collisionMask` (default 1 / -1).
- `Animator.definition.animations` is now typed as `Record<string, AnimationClip>` instead of `Record<string, any>`.

### Removed
- **`@joroya/physics`'s rapier-based orphan code**: `PhysicsWorld.ts` and duplicate `components/{RigidBody,Collider}.ts` (which imported `@dimforge/rapier3d-compat` without declaring it). The package is now single-backend (`cannon-es`) per the v0.9.0 design decision. The `RigidBody` and `Collider` components live in `@joroya/core` exclusively.

### Fixed
- `pnpm typecheck` now passes on every workspace package, including `@joroya/physics` (was previously blocked by missing rapier dependency).
- `packages/physics/tsconfig.json` now extends `tsconfig.base.json` (was a bespoke config bypassing strict mode and unused-checks).

## [0.8.0] - 2026-05-15

### Added
- **Shadow System**: `castShadow` / `receiveShadow` flags on every `GeometryDef` variant; `castShadow`, `shadowBias`, `shadowMapSize` on `DirectionalLightDef`, `PointLightDef`, `SpotLightDef`. Three.js backend enables `PCFSoftShadowMap` by default and applies flags to meshes, instanced meshes and lights.
- **Post-Processing Pipeline**: Declarative `PostProcessing` component with `bloom`, `toneMapping` (Reinhard / Cineon / ACESFilmic), `exposure` and `antialiasing` (SMAA). The Three.js backend assembles an idempotent `EffectComposer` chain (RenderPass → UnrealBloomPass → SMAAPass → OutputPass) and toggles passes via `.enabled` without reallocating GPU resources.
- **Particle System**: CPU-simulated `ParticleSystem` component (max count, emission rate, gravity, start/end color, start/end size, optional texture). Three.js backend renders it as `THREE.Points` with vertex colors and additive blending.
- **Spatial Audio**: `AudioListener` and `AudioSource` components mapped to `THREE.AudioListener` and `THREE.PositionalAudio`. Decoded buffers cached per URL; cone and distance-model attenuation are passed through.
- **EPIC**: [OA-006 — Advanced Rendering & Effects](docs/features/OA-006/EPIC.md).
- **Tests**: Vitest coverage for shadow flags, particle emission/decay/gravity, and `PostProcessing` definition serialization.

### Changed
- `PostProcessingDef.fxaa` (boolean, unused) renamed to `antialiasing` with an SMAA implementation behind it.
- `AudioSourceDef.url` is now formally documented (chosen over `buffer` to keep the scene graph serializable and let each backend reuse its own loader / cache).
- `PostProcessing` is officially anchored to the **active Camera node** so multi-camera setups (split-screen, picture-in-picture) carry independent FX chains.

### Fixed
- Removed `// @ts-ignore` and `any` from the Three.js post-processing path. `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `SMAAPass`, `OutputPass` and `Pass` now resolve through `@types/three`. `composer` is typed as `EffectComposer | null`, `renderPostFX` takes `PostProcessingDef`.

## [0.5.0] - 2026-02-17

### Added
- **Full glTF/GLB Loader**: Complete support for loading 3D models with geometry and materials from Blender and other 3D tools via `@joroya/loader-gltf`
- **Canvas2D Renderer**: New browser-native Canvas2D rendering backend in `@joroya/renderer-canvas2d` for lightweight 2D graphics
- **Boolean Operations (CSG)**: Constructive Solid Geometry support for 2D/3D boolean operations (union, subtract, intersect) using `three-csg-ts`
- **Cubic Spline Interpolation**: Advanced animation interpolation for smooth keyframe transitions
- **Quaternion SLERP**: Proper spherical linear interpolation for rotations

### Improved
- **SVG Backend**: Complete transformation support and group handling in `@joroya/renderer-svg`
- **Animation System**: Enhanced interpolation methods including cubic spline for professional-grade animations

### Changed
- Organization scope changed from `@oroya` to `@joroya` across all packages

## [0.4.0] - 2026-01-XX

### Added
- **Animation System**: KeyframeTrack, AnimationClip, AnimationMixer with linear/step/cubicspline interpolation
- **Interactivity System**: EventEmitter, Interactive component, InteractionEvent, BoundingBox (AABB)
- **Raycasting**: 3D pointer events (click, hover, drag) in Three.js renderer
- **DOM Event Delegation**: 2D interactivity in SVG renderer
- **Orbit Controls**: OrbitControlsWrapper for camera manipulation (orbit, pan, zoom)
- **Orthographic Camera**: Support in all renderers
- **Buffer Geometry**: Text geometry support with AABB computation
- **SvJs Generative Art Engine**: Gaussian, Pareto, Perlin noise distributions and generators
- **SVG Advanced Features**: Gradients, filters, clip-paths, masks, `<animate>` / `<animateTransform>`
- **Documentation Website**: Astro-powered site deployed to Vercel
- **i18n Infrastructure**: English, Spanish, and Japanese translation support

## [0.3.0] - 2025-12-XX

### Fixed
- Build pipeline stabilized: all 4 packages compile successfully (CJS + ESM + DTS)
- Correct `package.json` exports with proper file extensions and `types`-first condition order
- TypeScript `composite: false` override for tsup DTS compatibility
- Syntax errors in renderer-svg template literals

### Added
- Barrel files (`index.ts`) for all module directories
- Extended `MaterialDef` with SVG-specific properties (`fill`, `stroke`, `strokeWidth`)
- Missing `@types/three` dependency to `@joroya/loader-gltf`
- [Programming Principles](docs/programming-principles.md) documentation
- [Build Errors Postmortem](docs/troubleshooting/build-errors-postmortem.md) documentation

### Removed
- Dead code and unused imports across packages

## [0.2.0] - 2025-11-XX

### Added
- Functional Scene Graph API (`Scene`, `Node`, `Transform` with matrix math)
- Component system (`Geometry`, `Material`, `Camera`)
- Geometry primitives: `createBox`, `createSphere`, `createPath2D`
- Three.js renderer with dynamic scene rendering
- Camera component integrated into scene graph (Perspective)
- World matrix computation via `updateWorldMatrices()`
- Working demos: Vanilla JS and React with animated rotating cubes
- TSDoc on all public API surfaces
- Comprehensive documentation in `docs/` folder

## [0.1.0] - 2025-10-XX

### Added
- Initial monorepo setup with pnpm workspaces
- TypeScript + tsup build pipeline
- Base packages: `@joroya/core`, `@joroya/renderer-three`, `@joroya/renderer-svg`, `@joroya/loader-gltf`
- Initial Scene Graph interfaces and base classes
- Demo apps (Vanilla JS + React)

---

## Package Links

### Published Packages
- [@joroya/core](https://www.npmjs.com/package/@joroya/core) - Core scene graph and components
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three) - Three.js WebGL renderer
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg) - SVG renderer
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d) - Canvas2D renderer (New in 0.5.0)
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf) - glTF/GLB model loader

### Documentation
- [Main Documentation](https://oroya-animate.oroyajs.com)
- [GitHub Repository](https://github.com/joshuacba08/oroya-animate)
