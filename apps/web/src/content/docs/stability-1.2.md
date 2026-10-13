---
title: Stability and capabilities
order: 12
category: guide
---
# Oroya JS 1.2 — capability and acceptance matrix

The repository targets 1.2.0. Publication is a separate gate: a successful build does not mean that the npm release or physical device acceptance has occurred.

| Area | Supported contract | Limits | Evidence |
| --- | --- | --- | --- |
| Core | Acyclic graph, unique IDs, owned components, mandatory Transform, copying setters | Direct public array/map mutation bypasses graph methods; direct transform writes require invalidation | Node, Stability, RuntimeRegression tests |
| Frames | Default rendering advances the scene; `advanceScene: false` only synchronizes and draws | The caller advances a shared scene once; rendering is not pure by default | Canvas2D Parity, SVG AnimatorParity, Three Lifecycle |
| Three.js | 3D primitives, Buffer/CSG, PBR material data, cameras, lights, interaction, skinning, instancing, particles, audio and postprocessing | No Path2D/Text translator; browser audio rules apply; plugins own their resources | Lifecycle unit tests; runtime browser fixture |
| SVG | Vector primitives, Box/Sphere 2D representations, gradients, filters, text, paths, orthographic viewBox, DOM interaction and SVG animation | No 3D meshes, PBR, physics drawing, skins or GPU effects; string output has no live interaction | renderSVG, AnimatorParity, browser SVG interaction |
| Canvas2D | Box/Plane rectangles, Sphere/Circle circles, paths, text, fill/stroke, gradients, opacity and transforms | No picking, SVG filters/masks, mesh buffers or PBR | Parity tests; real pixel browser assertion |
| Persistence | Existing JSON shape and legacy omitted Transform, typed buffers, declarative component data, validation before construction | Scripts, InstancedMesh runtime state and unknown components require adapters; external assets, callbacks, live playback/physics state are not bundled | SerializationRoundtrip, RuntimeRegression, Stability |
| glTF/GLB | Local/URL loading, hierarchy, mesh buffers, PBR scalar fields, transform clips and skin metadata | Textures require an asset adapter; morph targets, multimaterial preservation and decoder extensions are not promised | Loading tests with self-contained glTF/GLB; real WebGL skin fixture |
| Assets | Deduplicated acquisitions, reference counts, cancellation, recovery after failure | `get()` does not acquire a reference; callers pair `load()` with `release()` | AssetManager, Recovery |
| Input | Keyboard/mouse/gamepad actions and down/up transitions, blur/disconnect cleanup | Gamepad state requires `update()` polling; device mapping uses the standard layout | InputManager, Gamepad |
| Physics | Fixed timestep, root-child bodies, contacts, constraints, raycasts, retirement and dispose | Root translation/rotation work; scaled roots and nested bodies are diagnosed and excluded; collider dimensions are explicit physics units | PhysicsSystem, Lifecycle, Vehicle |
| Inspector | Repeated attach/detach, scene replacement, frame metrics and stale-selection cleanup | Host calls `update()`; overlay is optional | FrameMetrics, Lifecycle |
| React/Vue | Public 1.2 bindings, committed React props, callbacks, explicit cameras, resize and cleanup | WebGL bindings; imperative core APIs cover components outside the provided wrappers | React 18/19 StrictMode, Vue Bindings; real browser mounts |
| Plugins | Public registry and Three.js lifecycle; latest handler wins; removal restores earlier handler; disposal is idempotent | Backend objects/resources remain owned by the plugin; a registry key alone does not add a core ComponentType | Plugin and Three Lifecycle tests |
| Editor | Groups/primitives, selection, names, hierarchy, numeric/Euler transforms, materials, W/E/R gizmos, viewport camera, duplicate/delete, undo/redo, Save/Load | Basic desktop authoring; no timeline, bundled project assets or automatic animation-reference remapping on duplication | EditorController tests; editor browser workflow |

## Frame ownership

Advance the shared scene with one renderer, then draw other views without advancing it again:

```ts
threeRenderer.render(dt);
renderToSVG(scene, { width: 800, height: 600, dt, advanceScene: false });
renderToCanvas(scene, canvas, { width: 800, height: 600, dt, advanceScene: false });
```

`Transform.setPosition`, `setRotation` and `setScale` copy values and invalidate local matrices. Direct writes remain supported, but must be followed by `updateLocalMatrix()` or `isDirty = true`.

Camera projection remains authored by default. Set `CameraDef.autoAspect: true` or renderer `adjustCameraToViewport: true` to opt into resize fitting. Automatic React/Vue cameras opt in; `active: true` gives explicit cameras priority. Application-owned viewport cameras and overlays do not change authored scene cameras.

## Diagnostics and persistence

Use `validateSceneJSON(json)` for `{ valid, diagnostics }`. `deserialize()` validates before creating objects and throws `SceneValidationError` on errors. Diagnostics contain `code`, `severity`, `message`, and, where applicable, `nodeId` and `path`. Incomplete triangles and unresolved bone references are warnings to preserve valid legacy data/fragments; out-of-range buffer indices, malformed definitions, duplicate IDs and nonfinite values are errors.

`serialize(scene, { onDiagnostic })` reports omitted runtime data. `deserialize(json, { onDiagnostic })` reports warnings and errors. Unknown components do not silently gain unsupported runtime behavior. Exported `threeCapabilities`, `svgCapabilities`, `canvas2DCapabilities` and core `diagnoseScene()` allow preflight checks; per-render callbacks report backend limitations.

Plugins run after the scene update and before world-matrix synchronization; handler updates see zero delta when advancement is disabled. Handlers returning null use the built-in translator. Registry conflict resolution is last-registration-wins, and unregister restores the previous registered handler. Object dispose runs before plugin unregister/dispose; neither operation transfers resource ownership to the renderer.

## Reproducible acceptance

Use Node 24 and pnpm 9.1.0. Libraries retain Node 18/20 support. Run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm architecture:check`, `pnpm api:check:strict`, `pnpm api:compat`, `pnpm docs:check`, `pnpm docs:validate`, `pnpm build:apps`, `pnpm test:browser` and `pnpm verify:packages`.

Browser tests run Chromium, Firefox and WebKit, plus Chromium/WebKit mobile profiles. Emulation is separate from the pending physical iOS/Android checks in `validation/physical-devices.json`.

`pnpm perf:record` explicitly establishes the corrected reference on the measurement machine. `pnpm perf:check` compares the same CPU, browser, viewport, Node major and DPR, rejecting CPU/frame median regressions above 10%. Scenarios use 1,000 nodes, 10,000 instances, 100 physics bodies and a skinned scene. The transfer count belongs to the development acceptance harness and measures decompressed JavaScript; it is not production gzip size. Publishing consumes the matching measured artifact evidence rather than comparing unrelated hosted-runner hardware.

`pnpm test:endurance` runs 30 minutes after 100 real mount cycles, checks that frames progress and resource counts stay bounded, and verifies zero owned geometry/texture/node allocations after disposal. JSON reports contain the SHA-256 digest of the compiled library ESM artifacts; stale evidence blocks release. Re-record evidence whenever those artifacts change.

`pnpm release:check --candidate` validates package, performance and endurance evidence. Stable `pnpm release:check` additionally requires device/browser versions, tested package version and an evidence location for Safari/iOS and Chrome/Android, bound to the same artifact digest. CI runs Windows/Linux and libraries on Node 18/20/24; physical devices are a separate release requirement.
