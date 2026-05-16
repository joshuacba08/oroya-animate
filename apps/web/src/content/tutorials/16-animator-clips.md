---
title: "Animator: clip library, crossfade, and keyframe events"
description: "Drive named animation clips with play() / crossFade() and react to footstep-style keyframe events."
order: 16
level: "intermediate"
duration: "20 min"
---

# Tutorial 16: Animator — clip library, crossfade, and keyframe events

> **Level:** Intermediate
> **Time:** 20 minutes
> **You'll learn:** how the `Animator` component drives a clip library, how `crossFade` blends transitions, and how to fire footstep / hit-frame events from keyframes.

The `Animator` component sits on a node and owns an `AnimationMixer` that mutates `node.transform` on the *target* nodes (by name). Because the mixer operates at the scene-graph level, animation works on **all three backends** — Three.js, SVG, and Canvas2D — without any backend-specific glue.

---

## Step 1 — Build a clip library

A clip is engine-agnostic data: a list of keyframe tracks (`times` + `values` as `Float32Array`s) plus optional named events.

```ts
import {
    Scene, Node, Camera, CameraType, Light, LightType,
    createBox, createPlane, Material,
    Animator,
    type AnimationClip,
} from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";

const scene = new Scene();

// … standard camera + lights + ground here …

const hero = new Node("hero");
hero.addComponent(createBox(1, 1, 1, { castShadow: true }));
hero.addComponent(new Material({ color: { r: 1, g: 0.55, b: 0.2 } }));
hero.transform.position = { x: 0, y: 1, z: 0 };
scene.add(hero);

// Three clips, all targeting the node named "hero".
const idle: AnimationClip = {
    name: "idle",
    duration: 2.0,
    tracks: [{
        targetNodeName: "hero",
        property: "position",
        times: new Float32Array([0, 1.0, 2.0]),
        values: new Float32Array([
            0, 1.00, 0,
            0, 1.15, 0,   // gentle bob
            0, 1.00, 0,
        ]),
        interpolation: "linear",
    }],
};

const walk: AnimationClip = {
    name: "walk",
    duration: 2.0,
    tracks: [{
        targetNodeName: "hero",
        property: "position",
        times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
        values: new Float32Array([
            -2, 1.0, 0,
             0, 1.2, 0,
             2, 1.0, 0,
             0, 1.2, 0,
            -2, 1.0, 0,
        ]),
        interpolation: "linear",
    }],
    // Footstep events — fire on heel-strike frames.
    events: [
        { time: 0.5, name: "footstep", data: { foot: "right" } },
        { time: 1.5, name: "footstep", data: { foot: "left" } },
    ],
};

const spin: AnimationClip = {
    name: "spin",
    duration: 2.0,
    tracks: [{
        targetNodeName: "hero",
        property: "rotation",
        // Quaternion track: identity → 90° → 180° → 270° → identity (around Y)
        times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
        values: new Float32Array([
            0, 0, 0, 1,
            0, Math.SQRT1_2, 0, Math.SQRT1_2,
            0, 1, 0, 0,
            0, Math.SQRT1_2, 0, -Math.SQRT1_2,
            0, 0, 0, 1,
        ]),
        interpolation: "linear",
    }],
};
```

---

## Step 2 — Attach an Animator and bind it to the scene

```ts
const animator = new Animator({
    animations: { idle, walk, spin },
    autoplay: "idle",
});
hero.addComponent(animator);
animator.bindToScene(scene);    // required so the mixer can resolve "hero" by name
```

The Animator can live on any node — it doesn't have to be the node it animates. A common pattern is to put it on the **camera** or scene root.

---

## Step 3 — Tick the animator from the render loop

`ThreeRenderer.render(dt)` calls `scene.update(dt)` first, which runs every component's `onUpdate(dt)` — including the Animator's. So you don't have to call anything manually:

```ts
const renderer = new ThreeRenderer({
    canvas: document.getElementById("canvas") as HTMLCanvasElement,
    width: window.innerWidth,
    height: window.innerHeight,
});
renderer.mount(scene);

let last = performance.now();
function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    renderer.render(dt);    // → scene.update(dt) → animator.onUpdate(dt) → mixer.update(dt)
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

---

## Step 4 — Switch clips with crossFade

`play(name)` swaps clips instantly. `crossFade(name, duration)` ramps the new clip in over `duration` seconds while ramping the previous clip out — sampling during the fade is a weighted blend of both clips.

```ts
const btnIdle = document.querySelector("#btn-idle")!;
const btnWalk = document.querySelector("#btn-walk")!;
const btnSpin = document.querySelector("#btn-spin")!;

btnIdle.addEventListener("click", () => animator.crossFade("idle", 0.4));
btnWalk.addEventListener("click", () => animator.crossFade("walk", 0.4));
btnSpin.addEventListener("click", () => animator.crossFade("spin", 0.4));
```

Quaternion blending uses normalized-lerp with hemisphere correction, so rotations don't snap through the long way around.

---

## Step 5 — React to keyframe events

The Animator forwards mixer events through `on()`. Footstep, hit-frame, dialogue cue — anything you place on a clip's `events` array fires the moment the play-head crosses it.

```ts
animator.on("keyframe-event", (e) => {
    if (e.event.name === "footstep") {
        const foot = (e.event.data as { foot: string }).foot;
        // Play a step SFX, spawn a dust particle, etc.
        console.log(`step (${foot})`);
    }
});

// Non-looping clips also fire a `finished` event:
animator.on("finished", (e) => {
    console.log(`${e.clip.name} done`);
});
```

Events are de-duplicated per loop iteration — they fire once per crossing even if the `dt` jumps past them in a single tick.

---

## Step 6 — Speed and loop control per call

```ts
animator.crossFade("walk", 0.3, { loop: true, speed: 1.5 });   // run faster
animator.play("attack", { loop: false });                        // one-shot
```

Speed is a multiplier on `dt`; `0.5` is half-speed, `2.0` is double. Negative speed isn't supported — for reverse playback, run a separate clip with reversed keyframe times.

---

## What to try next

- **Cubicspline interpolation**: glTF uses it. Set `interpolation: "cubicspline"` on a track and provide values in glTF's `[in-tangent, value, out-tangent]` layout.
- **Multiple concurrent clips**: call `crossFade("walk")` while another fade is mid-flight — the mixer blends across as many active clips as you push at it.
- **Load animations from glTF**: `@joroya/loader-gltf` returns `AnimationClip[]` alongside the scene. Drop them into your Animator's library with `addClip(clip)`.
