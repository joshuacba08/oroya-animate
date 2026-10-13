# @joroya/renderer-svg

> Lightweight SVG renderer for Oroya Animate scene graphs

[![NPM Version](https://img.shields.io/npm/v/@joroya/renderer-svg?style=flat-square)](https://www.npmjs.com/package/@joroya/renderer-svg)
[![License](https://img.shields.io/npm/l/@joroya/renderer-svg?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- Vector graphics - Resolution-independent SVG output
- Lightweight - No heavy dependencies
- Filters and gradients - Advanced SVG features support
- Server-side rendering - Works in Node.js
- 2D primitives - Box/rect, sphere/circle, path, text, and flattened geometry shapes
- Export - Save as SVG files or DOM elements
- Persistent scenes - Stable SVG nodes, live text/material updates and delegated events

## Installation

```bash
npm install @joroya/core @joroya/renderer-svg
```

## Quick Example

```typescript
import { Scene, Node, createSphere, Material } from '@joroya/core';
import { renderToSVG } from '@joroya/renderer-svg';

// Create scene
const scene = new Scene();

// Add circle
const circle = new Node('circle');
circle.addComponent(createSphere(50, 32, 32));
circle.addComponent(new Material({ 
  fill: { r: 0.2, g: 0.6, b: 1 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2
}));
circle.transform.position = { x: 200, y: 200, z: 0 };
circle.transform.updateLocalMatrix();
scene.add(circle);

// Render to SVG
const svgString = renderToSVG(scene, {
  width: 400,
  height: 400
});

document.body.innerHTML = svgString;
```

## API

### renderToSVG

```typescript
renderToSVG(
  scene: Scene,
  options: {
    width: number;
    height: number;
    dt?: number;
    viewBox?: string;
  }
): string
```

Returns an SVG string. For interactive DOM output, use `renderToSVGElement(scene, options)`.

### Persistent SVG scenes (since 1.3.0)

`SvgRenderer` updates a mounted SVG without replacing its root, node groups or
unchanged geometry elements. Use the 1.3 release of core and renderer together.
The 1.2.0 snapshot APIs remain available with the same contracts.

```typescript
import { AnimationMixer, Material, Node, Scene, createBox } from '@joroya/core';
import { SvgRenderer } from '@joroya/renderer-svg';

const scene = new Scene();
const cursor = new Node('cursor');
cursor.addComponent(createBox(60, 40, 0));
cursor.addComponent(new Material({ fill: { r: 0.95, g: 0.42, b: 0.23 } }));
scene.add(cursor);

const renderer = new SvgRenderer({
  width: 640,
  height: 320,
  container: document.getElementById('scene')!,
  title: 'Array iteration',
  description: 'The highlighted card is the current element.',
});
renderer.mount(scene); // Draws the initial state; does not advance time.

const mixer = new AnimationMixer(scene);
mixer.play({
  name: 'visit',
  duration: 2,
  tracks: [{
    targetNodeName: 'cursor',
    property: 'position',
    times: new Float32Array([0, 1, 2]),
    values: new Float32Array([100, 160, 0, 260, 160, 0, 420, 160, 0]),
    interpolation: 'linear',
  }],
}, { loop: false });
mixer.pause();

mixer.seek(1); // Reconstruct a pose without firing step events.
renderer.render(0, { advanceScene: false });

// Preserve application annotations and focus when frames change.
renderer.getNodeElement(cursor.id)?.setAttribute('aria-label', 'Current element');
renderer.setSize(800, 400);

// On unmount: cancel the application's RAF loop, then release this renderer.
renderer.dispose();
```

The renderer owns no animation loop. An application can drive `render(dt)`, or
advance a mixer/scene itself and draw with `advanceScene: false`. Use Transform
setters (`setPosition`, `setScale`, `setRotation`) for subsequent manual edits;
changing `position.x` alone does not invalidate a previously drawn matrix.
Material and text definitions may be edited in place and are sampled on redraw.

`mount` binds unbound Animator components. Only bindings created by this renderer
are released on disposal. Bind Animators in application code when sharing a scene
between backends, and advance that scene once. One renderer instance owns its DOM;
callers may annotate node groups with ARIA/keyboard attributes, but should not
insert unmanaged children into them. Native SMIL animations have their own SVG
clock; for one deterministic pedagogical timeline, use mixer-driven poses and
explicit text/material states rather than mixing independent SMIL playback.

`renderToSVG` and `renderToSVGElement` remain snapshot/export functions. They
retain their existing output contracts. See the full [educational animation
requirements](../../docs/features/OA-012/EPIC.md).

## Generative Art

Perfect for creating generative art and data visualizations:

```typescript
import { Scene, Node, createSphere, Material } from '@joroya/core';
import { renderToSVG } from '@joroya/renderer-svg';

const scene = new Scene();

// Create spiral
for (let i = 0; i < 100; i++) {
  const angle = i * 0.5;
  const radius = i * 2;
  
  const circle = new Node(`circle-${i}`);
  circle.addComponent(createSphere(5, 16, 16));
  circle.addComponent(new Material({
    fill: {
      r: Math.sin(angle) * 0.5 + 0.5,
      g: Math.cos(angle) * 0.5 + 0.5,
      b: 0.5
    }
  }));
  
  circle.transform.position = {
    x: Math.cos(angle) * radius + 200,
    y: Math.sin(angle) * radius + 200,
    z: 0,
  };
  circle.transform.updateLocalMatrix();
  
  scene.add(circle);
}

const svg = renderToSVG(scene, { width: 400, height: 400 });
document.body.innerHTML = svg;
```

## Export SVG

```typescript
// Get SVG as string
const svgString = renderToSVG(scene, { width: 400, height: 400 });

// Download as file
const blob = new Blob([svgString], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'scene.svg';
link.click();
```

## Documentation

- 📖 [Full Documentation](https://oroya-animate.oroyajs.com)
- 📚 [SVG Renderer Guide](https://oroya-animate.oroyajs.com/docs/renderers#svg-renderer)
- 🎓 [SVG Tutorials](https://oroya-animate.oroyajs.com/docs/tutorials)

## CDN Usage

```html
<script type="module">
  import { Scene, Node, createSphere } from 'https://unpkg.com/@joroya/core@1.0.0/dist/index.js';
  import { renderToSVG } from 'https://unpkg.com/@joroya/renderer-svg@1.0.0/dist/index.js';
  
  // Your code here
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
