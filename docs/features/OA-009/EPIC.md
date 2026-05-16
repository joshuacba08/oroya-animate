# OA-009: Ecosystem (Inspector, Input, Assets, Framework Wrappers)

**Status**: Shipped
**Feature Tag**: `OA-009`
**Target Version**: v0.11.0
**New Packages**: `@joroya/inspector`, `@joroya/input`, `@joroya/assets`, `@joroya/react`, `@joroya/vue`

## Abstract

Until v0.10, Oroya Animate was a runtime — scene graph + renderer + physics +
animation. To call the library "pre-1.0", the *application-developer surface*
needed four pieces the runtime alone doesn't provide: a way to debug what's
on the screen, a way to read input, a way to load and cache assets, and a
way to express scenes from inside the framework the host app is already
using. v0.11.0 ships all four.

## Context

The README listed v0.9.0 as "Ecosystem & DX" in the original roadmap. That
slot was consumed by Physics + Animation (the real v0.9.0 / OA-007). The
ecosystem layer became the implied v0.11.0 milestone after the v1.0 gap
audit ([CHANGELOG.md](../../../CHANGELOG.md) v0.10.0 "Tier 1"). This EPIC
ships every item that was on that list.

None of the new packages add cross-cutting changes to existing code — they
all build *on top of* `@joroya/core` (and `@joroya/renderer-three` for the
React/Vue wrappers). Existing apps are unaffected; the new capabilities are
opt-in.

## Features

### 1. `@joroya/inspector` — Visual Debug Overlay

A framework-agnostic DOM panel that mounts over any canvas:

- **Hierarchy view** with click-to-select.
- **Selected-node inspector**: ID, position, rotation, scale, components list.
- **Frame metrics**: FPS, average frame time, max hitch over a 60-sample
  rolling window.
- **Scene stats**: total nodes, total components, count per component type.
- **Position options** (top-left / top-right / bottom-left / bottom-right),
  collapsible.
- **Throttled DOM refresh** (default 5Hz UI updates vs ~60Hz simulation) to
  bound overhead.

Implementation is vanilla `document.createElement` — no React/Vue/anything,
so the same panel works regardless of the host app's framework.

### 2. `@joroya/input` — Unified Input + Action Mapping

```ts
const input = new InputManager(canvas);
input.attach();
input.bindAction('jump', [{ key: 'Space' }, { gamepad: 'A' }]);
input.on('action-down', (e) => { if (e.name === 'jump') player.jump(); });
function loop(dt) {
    input.update(dt);  // polls gamepads
    renderer.render(dt);
}
```

- **Devices**: Keyboard (`KeyboardEvent.code` for layout-stable physical
  keys), mouse (buttons + position + wheel), gamepad (Web Gamepad API
  Standard mapping — A/B/X/Y, DPad, LB/RB/LT/RT, sticks, Home/Back/Start).
- **Action mapping**: multiple bindings per action across devices; an
  action is active if *any* binding is held.
- **Three event flavors**: `action-down` (transition), `action` (continuous
  poll while held), `action-up` (transition). `update(dt)` re-polls
  gamepads and re-evaluates actions.
- **Window-blur safety**: keyboard / mouse state is cleared when the
  window loses focus so keys don't "stick" silently.
- **Direct queries** (`isKeyDown`, `getGamepadAxis`) for movement axes
  that don't map cleanly to discrete events.

### 3. `@joroya/assets` — Centralized Asset Cache

```ts
const assets = new AssetManager();
assets.on('progress', (p) => bar.set(p.loaded / p.total));
await assets.preload([
    { url: '/tex/grass.png', type: 'image' },
    { url: '/audio/loop.mp3', type: 'audio' },
    { url: '/data/level.json', type: 'json' },
]);
const tex = assets.get<HTMLImageElement>('/tex/grass.png');
// When done:
assets.release('/tex/grass.png');
```

- **Built-in loaders**: `image` (cross-origin `Image`), `audio` (decoded
  `AudioBuffer` via a transient `AudioContext`), `json`, `text`, `binary`.
- **Deduplication**: concurrent `load()` calls for the same URL share one
  fetch / decode pass.
- **Ref-counting**: `load()` increments, `release()` decrements; entry is
  evicted (and any in-flight request aborted) when the count hits zero.
- **Extensible**: `registerLoader('gltf', myGltfLoader)` plugs in custom
  decoders that share the same cache.
- **Resilient preload**: per-item errors emit `error` events but don't
  reject the overall promise — a single broken URL doesn't kill the
  loading screen.

### 4. `@joroya/react` (alpha) — React Bindings

```tsx
import { OroyaCanvas, Box, Sphere, AmbientLight, useFrame, useNodeRef } from '@joroya/react';

function Spinner() {
    const ref = useNodeRef();
    useFrame((dt) => {
        if (ref.current) ref.current.transform.rotation.y += dt;
    });
    return <Box nodeRef={ref} size={1} color={{ r: 1, g: 0.5, b: 0 }} castShadow />;
}

<OroyaCanvas style={{ height: '100vh' }}>
    <AmbientLight intensity={0.5} />
    <Spinner />
</OroyaCanvas>
```

- **`<OroyaCanvas>`** owns a `Scene` + `ThreeRenderer` + RAF loop.
- **Hooks**: `useFrame(cb)`, `useScene()`, `useParentNode()`, `useOroya()`.
- **JSX primitives**: `<Group>`, `<Box>`, `<Sphere>`, `<Plane>`,
  `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>`. Children
  attach to the Oroya scene graph through React context — never `scene.add`
  by hand.
- **Stable node identity**: Oroya nodes are `useMemo`'d so children survive
  parent re-renders.

### 5. `@joroya/vue` (alpha) — Vue 3 Composables

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useOroyaCanvas, useNode, useFrame } from '@joroya/vue';
import { createBox, Material } from '@joroya/core';

const canvasRef = ref<HTMLCanvasElement>();
useOroyaCanvas(canvasRef);

const cubeNode = useNode((node) => {
    node.addComponent(createBox(1, 1, 1));
    node.addComponent(new Material({ color: { r: 0, g: 1, b: 0 } }));
});

useFrame((dt) => {
    cubeNode.value.transform.rotation.y += dt;
});
</script>

<template>
    <canvas ref="canvasRef" style="width: 100%; height: 100vh" />
</template>
```

- **`useOroyaCanvas(canvasRef)`**: mounts scene + renderer + RAF when the
  canvas ref populates. Watches the ref so it re-mounts if the host swaps
  canvas elements.
- **`useFrame(cb)`** / **`useNode(setup)`**: lifecycle-bound — automatic
  cleanup on `onBeforeUnmount`.
- **`shallowRef` for nodes**: keeps Vue's reactivity proxy from recursing
  into the scene graph (deep reactivity over thousands of components would
  be a perf cliff).

## User Stories

- As a **developer debugging a black screen**, I want to see the scene
  graph and confirm the camera is where I think it is — Inspector does it
  in one line of code.
- As a **game developer**, I want `'KeyW' or LeftStick-up` to count as
  "move forward" without my code knowing which device fired — Input's
  action mapping is the boundary.
- As an **asset-heavy app**, I want a loading screen tied to actual
  progress, not a guess — Assets gives me `(loaded, total, currentURL)`
  per item.
- As a **React developer**, I want to write `<Box position={...} />` not
  `useEffect(() => scene.add(boxNode), [...])` — the React wrapper closes
  the boilerplate gap.

## Implementation Tasks

### Phase A — Inspector ✅
- [x] `FrameMetrics` ring-buffer FPS / avg / max tracker.
- [x] `collectSceneStats` traversal (counts per component type).
- [x] `Inspector` DOM panel — hierarchy, selection, metrics, throttled refresh.
- [x] 5 Vitest tests (FrameMetrics windowing, SceneStats counting).

### Phase B — Input ✅
- [x] `InputManager` with keyboard / mouse / wheel / gamepad polling.
- [x] Action binding API (`bindAction`, `unbindAction`).
- [x] `action-down` / `action` / `action-up` event semantics.
- [x] Window-blur state-clearing.
- [x] 9 Vitest tests (key state, action lifecycle, OR-binding, mouse, blur, unbind).

### Phase C — Assets ✅
- [x] `AssetManager` with dedup, ref-counting, abort-on-evict.
- [x] Built-in loaders for image / audio / json / text / binary.
- [x] `registerLoader` for custom asset types.
- [x] `preload` with `progress` / `loaded` / `error` events.
- [x] 8 Vitest tests (dedup, ref-count, custom loader, progress, error resilience).

### Phase D — React wrapper ✅
- [x] `<OroyaCanvas>` with `ResizeObserver`-driven sizing and RAF loop.
- [x] React context for scene / parent-node / frame registry.
- [x] Hooks: `useFrame`, `useScene`, `useParentNode`, `useOroya`.
- [x] Primitives: `<Group>`, `<Box>`, `<Sphere>`, `<Plane>`, `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>`.

### Phase E — Vue wrapper ✅
- [x] `useOroyaCanvas` composable.
- [x] `useFrame` / `useNode` lifecycle-bound composables.
- [x] `shallowRef` for node refs to bound reactivity overhead.

### Phase F — Hardening ✅
- [x] `pnpm lint` glob extended to `.tsx` (catches React JSX).
- [x] All 5 packages typecheck + build clean (CJS + ESM + DTS).
- [x] No `any` introduced (existing eslint gate enforces).

### Phase G — Metadata ✅
- [x] Bump every workspace package + root to `0.11.0`.
- [x] CHANGELOG entries (en / es / ja).
- [x] README roadmap: v0.11.0 promoted to Shipped.
- [x] EPIC OA-009 (this file).

## Acceptance Criteria

1. `pnpm typecheck` succeeds on all **14** workspace packages (was 9 in
   v0.10.0; +5 new packages).
2. `pnpm test` passes — **22 new tests** across the framework-agnostic
   packages (Inspector + Input + Assets). React/Vue wrappers ship without
   unit tests in alpha (DOM-heavy; covered by manual demo testing).
3. `pnpm lint` succeeds on every `src/**.{ts,tsx}` file.
4. `pnpm --filter "./packages/**" build` produces CJS + ESM + DTS for every
   workspace package at version `0.11.0`.
5. `new Inspector(scene).attach()` adds a visible panel to `document.body`
   that updates every ~200ms.
6. `new InputManager(window); input.bindAction('jump', [{key:'Space'}]); input.on('action-down', fn)`
   fires `fn` the first time Space is pressed and not on key-repeat.
7. `assetManager.load('/a', 'json')` and `assetManager.load('/a', 'json')`
   return the same promise (deduplication).
8. `<OroyaCanvas><Box /></OroyaCanvas>` renders a cube without the
   application calling `scene.add` or `new Node` directly.

## Out of Scope (deferred to OA-010 / v0.12.0)

- **Skinned-mesh demo** and full glTF skeletal playback (the
  `THREE.AnimationMixer` path wired conditionally in v0.9.0).
- **2-bone IK helper** built on the `spring()` integrator.
- **Vehicle / wheel constraint** sugar over cannon-es `RaycastVehicle`.
- **React wrapper coverage** for advanced components (Audio, Animator,
  Physics body declarative props) — alpha only covers visual primitives.
- **Touch gestures** (pinch / swipe / rotate) — pointer events already
  bubble through `Interactive`; multi-touch gesture detection is its own
  scope.
- **Inspector property editing** — currently read-only. Two-way binding
  on transforms / material colors is editor-grade work and lives in v1.0
  visual-editor territory.

## Dependencies

- `react@^18 || ^19` (peer) — `@joroya/react`.
- `vue@^3.4` (peer) — `@joroya/vue`.
- No new runtime deps for inspector / input / assets — all browser-native.

## References

- [`docs/programming-principles.md`](../../programming-principles.md) §1.1
  (engine-agnostic core), §2.1 (barrel files), §3.2 (no `any`).
- [`docs/features/OA-008/EPIC.md`](../OA-008/EPIC.md) — preceding
  serialization / backend-parity / hardening release.
- [`CHANGELOG.md`](../../../CHANGELOG.md) v0.11.0 entry.
