# @joroya/assets

> Centralized asset cache with deduplication, ref-counted release, and progress events for [Oroya Animate](https://github.com/joshuacba08/oroya-animate).

[![npm](https://img.shields.io/npm/v/@joroya/assets.svg)](https://www.npmjs.com/package/@joroya/assets)
[![License](https://img.shields.io/npm/l/@joroya/assets.svg)](../../LICENSE)

Built-in loaders for images, audio, JSON, text, and binary; pluggable via
`registerLoader` for glTF / FBX / custom formats.

## Install

```bash
npm install @joroya/assets @joroya/core
```

## Usage

```ts
import { AssetManager } from '@joroya/assets';

const assets = new AssetManager();

assets.on('progress', (e) => {
    progressBar.set(e.loaded / e.total);
});

await assets.preload([
    { url: '/tex/grass.png', type: 'image' },
    { url: '/audio/loop.mp3', type: 'audio' },
    { url: '/data/level.json', type: 'json' },
]);

const tex = assets.get<HTMLImageElement>('/tex/grass.png');

// When the texture is no longer needed:
assets.release('/tex/grass.png');
```

## Features

- **Deduplication** — concurrent `load()` calls for the same URL share one
  fetch + decode pass.
- **Ref-counting** — `load()` increments, `release()` decrements; entry is
  evicted (and in-flight request aborted) when the count hits zero.
- **Resilient preload** — per-item failures emit `error` events but don't
  reject the overall promise.
- **Pluggable loaders** — `registerLoader('gltf', myGltfLoader)` shares
  the cache for any app-specific type.

## API surface

| Symbol | Stability |
|---|---|
| `AssetManager` (class) | `@public` |
| `AssetType` (type) | `@public` |
| `PreloadEntry` (type) | `@public` |
| `AssetLoader` (type) | `@public` |
| `AssetEventMap` (type) | `@public` |

## License

MIT
