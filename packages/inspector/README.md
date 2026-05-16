# @joroya/inspector

> Framework-agnostic debug overlay for [Oroya Animate](https://github.com/joshuacba08/oroya-animate) scenes.

[![npm](https://img.shields.io/npm/v/@joroya/inspector.svg)](https://www.npmjs.com/package/@joroya/inspector)
[![License](https://img.shields.io/npm/l/@joroya/inspector.svg)](../../LICENSE)

A vanilla-DOM panel that mounts over your canvas and shows:

- **Hierarchy tree** with click-to-select.
- **Selected-node inspector** — transform values + component list.
- **Frame metrics** — FPS, avg frame time, max hitch over a rolling window.
- **Scene stats** — node count, component count by type.

No React / Vue / framework dependency — works on top of any host app.

## Install

```bash
npm install @joroya/inspector @joroya/core
```

## Usage

```ts
import { Inspector } from '@joroya/inspector';

const inspector = new Inspector(scene, { position: 'top-right' });
inspector.attach();

// in your render loop:
function frame(dt) {
    inspector.update(dt);
    renderer.render(dt);
}

// when done:
inspector.detach();
```

## API surface

| Symbol | Stability |
|---|---|
| `Inspector` (class) | `@public` |
| `FrameMetrics` (class) | `@public` |
| `collectSceneStats(scene)` | `@public` |
| `SceneStats` (type) | `@public` |

See the project's [API stability policy](../../docs/api-stability.md).

## License

MIT
