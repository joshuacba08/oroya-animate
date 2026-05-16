---
title: "Developer tools: Inspector, Input, and Assets"
description: "Debug overlay, action-mapped input, and a preloading asset cache — the three packages that turn a demo into an app."
order: 19
level: "intermediate"
duration: "25 min"
---

# Tutorial 19: Developer tools — Inspector, Input, and Assets

> **Level:** Intermediate
> **Time:** 25 minutes
> **You'll learn:** how to attach a debug overlay, map keyboard and gamepad input to logical actions, and preload assets with progress events.

These three packages turn a working demo into a shippable app: a way to see what's wrong, a way to drive it from real input devices, and a way to load content without "white screen until everything fetches".

---

## `@joroya/inspector` — debug overlay

The inspector mounts a fixed-position DOM panel showing the scene-graph hierarchy, the selected node's transform, and FPS / frame-time metrics. It is **framework-agnostic** — plain `document.createElement` — so it works regardless of whether your host app uses React, Vue, Astro, or nothing.

```bash
npm install @joroya/inspector @joroya/core
```

```ts
import { Inspector } from "@joroya/inspector";

const inspector = new Inspector(scene, {
    position: "top-right",       // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    refreshIntervalMs: 200,      // throttle DOM updates (default 200ms = 5Hz UI)
    startCollapsed: false,
});
inspector.attach();

// in your render loop:
function frame(now: number) {
    const dt = computeDt(now);
    inspector.update(dt);    // records frame time, refreshes panel on schedule
    renderer.render(dt);
}
```

Click any row in the hierarchy panel to select that node; the panel below shows its transform values and the list of attached components. Click the header (`⚙ Oroya Inspector`) to collapse / expand.

For headless metrics without the DOM panel, the package also exports `FrameMetrics` (rolling FPS / avg / max-hitch tracker) and `collectSceneStats(scene)` (component counts).

---

## `@joroya/input` — action-mapped input

Most engines bind game logic directly to `keydown` listeners. That fails the moment you want gamepad support, key rebinding, or accessibility re-mapping. The `InputManager` introduces a layer of indirection: **map device events to logical action names**, and let game code react to action names.

```bash
npm install @joroya/input @joroya/core
```

```ts
import { InputManager } from "@joroya/input";

const input = new InputManager();
input.attach();

// Multiple bindings per action — OR semantics. Pressing any of them activates the action.
input.bindAction("jump",          [{ key: "Space" },  { gamepad: "A" }]);
input.bindAction("move-forward",  [{ key: "KeyW" },   { key: "ArrowUp" }]);
input.bindAction("move-back",     [{ key: "KeyS" },   { key: "ArrowDown" }]);
input.bindAction("fire",          [{ mouseButton: 0 }, { gamepad: "RT" }]);
```

### Three event flavors

```ts
input.on("action-down", (e) => {
    // One-shot — fires on the transition from inactive to active.
    if (e.name === "jump") player.jump();
});

input.on("action", (e) => {
    // Continuous — fires every poll while the action is held.
    if (e.name === "fire") player.fireProjectile();
});

input.on("action-up", (e) => {
    // One-shot on release.
    if (e.name === "fire") player.stopFiring();
});
```

### Per-frame poll (required for gamepad)

```ts
function frame(now: number) {
    const dt = computeDt(now);
    input.update(dt);   // re-polls gamepads, emits `action` for held actions
    // … rest of the loop …
}
```

### Direct queries for analog axes

```ts
const leftStickX = input.getGamepadAxis(0, 0);  // -1..1
const leftStickY = input.getGamepadAxis(0, 1);
player.transform.position.x += leftStickX * speed * dt;
player.transform.position.z += leftStickY * speed * dt;
```

### Blur safety

When the window loses focus, the manager clears all keyboard / mouse state — keys can't "stick" silently. Re-pressing on focus regains the down state via the normal `keydown` event.

---

## `@joroya/assets` — preloader with progress

Image, audio, JSON, text, and binary loaders, all sharing one cache. The cache is **deduplicating** (two concurrent `load("/x.png")` calls do one fetch) and **ref-counted** (`release(url)` decrements; entries evict at 0).

```bash
npm install @joroya/assets @joroya/core
```

```ts
import { AssetManager } from "@joroya/assets";

const assets = new AssetManager();

assets.on("progress", (e) => {
    progressBar.style.width = `${(e.loaded / e.total) * 100}%`;
});

assets.on("error", (e) => {
    console.error(`Failed to load ${e.url}`, e.error);
    // Per-item errors don't reject the overall promise.
});

await assets.preload([
    { url: "/tex/grass.png",  type: "image" },
    { url: "/tex/stone.png",  type: "image" },
    { url: "/audio/loop.mp3", type: "audio" },
    { url: "/data/level.json", type: "json"  },
]);

// All assets are now in the cache. Synchronous accessor:
const grassImg = assets.get<HTMLImageElement>("/tex/grass.png");
const loopBuf = assets.get<AudioBuffer>("/audio/loop.mp3");
```

When you're done with an asset (e.g. a level unloads), call `release(url)`. When the ref count hits zero the entry is evicted and any in-flight fetch is aborted via `AbortController`.

### Custom loaders for app-specific types

```ts
import { type AssetLoader } from "@joroya/assets";
import { loadGLTF } from "@joroya/loader-gltf";

const gltfLoader: AssetLoader<{ scene: Scene; animations: AnimationClip[] }> = async (url, signal) => {
    // signal lets you abort on release(); loadGLTF doesn't honor it directly,
    // but you can wrap the call to bail out if the signal fires mid-decode.
    return loadGLTF(url);
};

assets.registerLoader("gltf", gltfLoader);

await assets.preload([
    { url: "/models/hero.glb", type: "gltf" as never },
]);
```

---

## Wiring them together

Putting all three on a single `requestAnimationFrame` loop:

```ts
const inspector = new Inspector(scene);
inspector.attach();

const input = new InputManager();
input.attach();
input.bindAction("save", [{ key: "KeyS" }]);
input.on("action-down", (e) => {
    if (e.name === "save") {
        const json = serialize(scene);
        downloadBlob(json);
    }
});

const assets = new AssetManager();
await assets.preload([/* … */]);

let last = performance.now();
function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    input.update(dt);
    inspector.update(dt);
    renderer.render(dt);

    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

---

## What to try next

- **Hook input to physics**: bind a `"throw"` action that calls `physics.world.bodies[i].applyImpulse(...)` to launch a node forward.
- **Build a loading screen**: a thin HTML overlay that listens to `assets.on("progress")` and fades out when `loaded === total`.
- **Multi-gamepad**: `getGamepadAxis(index, axis)` accepts a gamepad index — wire two players to `index: 0` and `index: 1` for couch co-op.
