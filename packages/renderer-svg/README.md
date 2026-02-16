# @oroya/renderer-svg

> Lightweight SVG renderer for Oroya Animate scene graphs

[![NPM Version](https://img.shields.io/npm/v/@oroya/renderer-svg?style=flat-square)](https://www.npmjs.com/package/@oroya/renderer-svg)
[![License](https://img.shields.io/npm/l/@oroya/renderer-svg?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- 🎨 **Vector Graphics** - Resolution-independent SVG output
- 🪶 **Lightweight** - No heavy dependencies
- 🎭 **Filters & Gradients** - Advanced SVG features support
- 🔄 **Server-Side Rendering** - Works in Node.js
- 📦 **2D Primitives** - Circle, rectangle, path, and more
- 🖼️ **Export** - Save as SVG files or DOM elements

## Installation

```bash
npm install @oroya/core @oroya/renderer-svg
```

## Quick Example

```typescript
import { Scene, Node, createCircle, Material } from '@oroya/core';
import { renderSVG } from '@oroya/renderer-svg';

// Create scene
const scene = new Scene();

// Add circle
const circle = new Node('circle');
circle.addComponent(createCircle(50));
circle.addComponent(new Material({ 
  color: { r: 0.2, g: 0.6, b: 1 },
  stroke: { r: 0, g: 0, b: 0 },
  strokeWidth: 2
}));
circle.transform.position.set(200, 200, 0);
scene.add(circle);

// Render to SVG
const svgElement = renderSVG(scene, { 
  width: 400, 
  height: 400 
});

document.body.appendChild(svgElement);
```

## API

### renderSVG

```typescript
renderSVG(
  scene: Scene,
  options: {
    width: number;
    height: number;
    background?: string;
    viewBox?: string;
  }
): SVGElement
```

Returns a native SVG DOM element that can be appended to the document or exported.

## Generative Art

Perfect for creating generative art and data visualizations:

```typescript
import { Scene, Node, createPath2D, Material } from '@oroya/core';
import { renderSVG } from '@oroya/renderer-svg';

const scene = new Scene();

// Create spiral
for (let i = 0; i < 100; i++) {
  const angle = i * 0.5;
  const radius = i * 2;
  
  const circle = new Node(`circle-${i}`);
  circle.addComponent(createCircle(5));
  circle.addComponent(new Material({
    color: {
      r: Math.sin(angle) * 0.5 + 0.5,
      g: Math.cos(angle) * 0.5 + 0.5,
      b: 0.5
    }
  }));
  
  circle.transform.position.set(
    Math.cos(angle) * radius + 200,
    Math.sin(angle) * radius + 200,
    0
  );
  
  scene.add(circle);
}

const svg = renderSVG(scene, { width: 400, height: 400 });
document.body.appendChild(svg);
```

## Export SVG

```typescript
// Get SVG as string
const svgString = svgElement.outerHTML;

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
  import { Scene, Node, createCircle } from 'https://unpkg.com/@oroya/core@0.3.0/dist/index.js';
  import { renderSVG } from 'https://unpkg.com/@oroya/renderer-svg@0.3.0/dist/index.js';
  
  // Your code here
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
