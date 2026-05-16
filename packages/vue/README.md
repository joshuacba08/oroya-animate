# @joroya/vue

> Vue 3 composables for [Oroya Animate](https://github.com/joshuacba08/oroya-animate) — scene-graph composition from `<script setup>`.

[![npm](https://img.shields.io/npm/v/@joroya/vue.svg)](https://www.npmjs.com/package/@joroya/vue)
[![License](https://img.shields.io/npm/l/@joroya/vue.svg)](../../LICENSE)

> **⚠ alpha** — all exports are tagged `@experimental`. Composable signatures
> may evolve through v1.x. Pin the version if you depend on specific shapes.

## Install

```bash
npm install @joroya/vue @joroya/core @joroya/renderer-three vue
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useOroyaCanvas, useNode, useFrame } from '@joroya/vue';
import { createBox, Material } from '@joroya/core';

const canvasRef = ref<HTMLCanvasElement>();
useOroyaCanvas(canvasRef);

const cube = useNode((node) => {
    node.addComponent(createBox(1, 1, 1));
    node.addComponent(new Material({ color: { r: 1, g: 0.5, b: 0 } }));
});

useFrame((dt) => {
    cube.value.transform.rotation.y += dt;
    cube.value.transform.updateLocalMatrix();
});
</script>

<template>
    <canvas ref="canvasRef" style="width: 100%; height: 100vh" />
</template>
```

## Composables

- `useOroyaCanvas(canvasRef, options?)` — mounts a Scene + ThreeRenderer +
  RAF loop on the canvas ref.
- `useFrame((dt) => void)` — per-frame callback; auto-deregistered on unmount.
- `useNode((node) => setup)` — create + attach an Oroya `Node`; returns a
  shallow ref to the node.
- `useOroya()` — full context (scene + parent + frame registry).

Internally uses `shallowRef` for node refs so Vue's reactivity does not
recurse into the scene graph (which would be a perf cliff at scale).

## License

MIT
