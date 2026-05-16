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

- 📖 [Full Documentation](https://oroya-animate.vercel.app)
- 📚 [SVG Renderer Guide](https://oroya-animate.vercel.app/docs/renderers#svg-renderer)
- 🎓 [SVG Tutorials](https://oroya-animate.vercel.app/docs/tutorials)

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
