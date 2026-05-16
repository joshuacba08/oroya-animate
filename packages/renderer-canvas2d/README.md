# @joroya/renderer-canvas2d

> Browser-native Canvas2D renderer for [Oroya Animate](https://github.com/joshuacba08/oroya-animate) scenes.

[![npm](https://img.shields.io/npm/v/@joroya/renderer-canvas2d.svg)](https://www.npmjs.com/package/@joroya/renderer-canvas2d)
[![License](https://img.shields.io/npm/l/@joroya/renderer-canvas2d.svg)](../../LICENSE)

A lightweight 2D backend for the Oroya scene graph using the HTML
Canvas 2D API. Useful for 2D infographics, generative art, or simple
games where WebGL is overkill.

## Install

```bash
npm install @joroya/renderer-canvas2d @joroya/core
```

## Usage

```ts
import { CanvasRenderer } from '@joroya/renderer-canvas2d';
import { Scene, Node, createBox, Material, Camera, CameraType } from '@joroya/core';

const scene = new Scene();
// … populate scene …

const renderer = new CanvasRenderer();
const canvas = renderer.mount(document.getElementById('app')!, {
    width: 800,
    height: 600,
});

renderer.startLoop(() => {
    renderer.render(scene, { width: 800, height: 600, dt: 1 / 60 });
});
```

Runs `scene.update(dt)` automatically before each render, so
`Animator`, `ParticleSystem`, and custom `onUpdate` hooks work on this
backend.

## License

MIT
