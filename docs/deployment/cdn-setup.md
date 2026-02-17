# CDN Setup & Usage

This guide explains how to use Oroya Animate packages directly from CDN without npm installation.

## 倹 Available CDN Providers

Oroya Animate packages are automatically available on multiple CDNs once published to NPM:

### 1. **unpkg** (Recommended)
- URL: `https://unpkg.com/@joroya/[package]@[version]`
- Auto-updates: Yes
- Fast: Yes
- Examples below use unpkg

### 2. **jsDelivr**
- URL: `https://cdn.jsdelivr.net/npm/@joroya/[package]@[version]`
- CDN Stats: Available
- Multi-CDN: Yes

### 3. **esm.sh**
- URL: `https://esm.sh/@joroya/[package]@[version]`
- Optimized for Deno
- TypeScript support

## 逃 Package CDN URLs

### Core Package
```html
<!-- ESM (Module) - Latest -->
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core/dist/index.js';
</script>

<!-- ESM - Specific Version -->
<script type="module">
  import { Scene, Node } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
</script>

<!-- CommonJS -->
<script src="https://unpkg.com/@joroya/core@0.3.0/dist/index.cjs"></script>
```

### Three.js Renderer
```html
<script type="module">
  import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@0.3.0/dist/index.js';
</script>
```

### SVG Renderer
```html
<script type="module">
  import { renderSVG } from 'https://unpkg.com/@joroya/renderer-svg@0.3.0/dist/index.js';
</script>
```

### glTF Loader
```html
<script type="module">
  import { loadGLTF } from 'https://unpkg.com/@joroya/loader-gltf@0.3.0/dist/index.js';
</script>
```

## 噫 Quick Start Examples

### Example 1: Hello Cube (Three.js)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oroya Animate - Hello Cube</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <script type="module">
    import { 
      Scene, 
      Node, 
      Camera, 
      CameraType, 
      createBox, 
      Material 
    } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
    
    import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@0.3.0/dist/index.js';

    // Create scene
    const scene = new Scene();

    // Add camera
    const cameraNode = new Node('camera');
    cameraNode.addComponent(new Camera({
      type: CameraType.Perspective,
      fov: 75,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 1000
    }));
    cameraNode.transform.position.z = 5;
    scene.add(cameraNode);

    // Add cube
    const cube = new Node('cube');
    cube.addComponent(createBox(1, 1, 1));
    cube.addComponent(new Material({ 
      color: { r: 1, g: 0.5, b: 0 } 
    }));
    scene.add(cube);

    // Create renderer
    const renderer = new ThreeRenderer({
      canvas: document.getElementById('canvas'),
      width: window.innerWidth,
      height: window.innerHeight
    });

    // Animation loop
    function animate() {
      cube.transform.rotation.x += 0.01;
      cube.transform.rotation.y += 0.01;
      renderer.render(scene, cameraNode);
      requestAnimationFrame(animate);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      renderer.resize(window.innerWidth, window.innerHeight);
      const camera = cameraNode.getComponent(Camera);
      camera.aspect = window.innerWidth / window.innerHeight;
    });
  </script>
</body>
</html>
```

### Example 2: SVG Circle

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Oroya Animate - SVG</title>
  <style>
    body { 
      margin: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: #f0f0f0; 
    }
  </style>
</head>
<body>
  <div id="svg-container"></div>

  <script type="module">
    import { 
      Scene, 
      Node, 
      createCircle, 
      Material 
    } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
    
    import { renderSVG } from 'https://unpkg.com/@joroya/renderer-svg@0.3.0/dist/index.js';

    // Create scene
    const scene = new Scene();

    // Add circle
    const circle = new Node('circle');
    circle.addComponent(createCircle(50));
    circle.addComponent(new Material({ 
      color: { r: 0.2, g: 0.6, b: 1 } 
    }));
    circle.transform.position.x = 200;
    circle.transform.position.y = 200;
    scene.add(circle);

    // Render to SVG
    const svgElement = renderSVG(scene, { 
      width: 400, 
      height: 400 
    });
    
    document.getElementById('svg-container').appendChild(svgElement);

    // Animate
    let angle = 0;
    setInterval(() => {
      angle += 0.05;
      circle.transform.position.x = 200 + Math.cos(angle) * 50;
      circle.transform.position.y = 200 + Math.sin(angle) * 50;
      
      // Re-render
      const newSvg = renderSVG(scene, { width: 400, height: 400 });
      const container = document.getElementById('svg-container');
      container.innerHTML = '';
      container.appendChild(newSvg);
    }, 50);
  </script>
</body>
</html>
```

## 笞呻ｸ・Version Pinning Strategies

### Latest Version (Auto-update)
```javascript
// Always latest - not recommended for production
import { Scene } from 'https://unpkg.com/@joroya/core/dist/index.js';
```

### Latest Minor Version
```javascript
// Latest patch within 0.3.x
import { Scene } from 'https://unpkg.com/@joroya/core@0.3/dist/index.js';
```

### Exact Version (Recommended)
```javascript
// Exact version - most stable
import { Scene } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
```

### SHA Hash (Maximum Stability)
```javascript
// Immutable by commit hash
import { Scene } from 'https://unpkg.com/@joroya/core@0.3.0?hash=abc123';
```

## 耳 Import Maps (Better DX)

Use import maps for cleaner imports:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
    {
      "imports": {
        "@joroya/core": "https://unpkg.com/@joroya/core@0.3.0/dist/index.js",
        "@joroya/renderer-three": "https://unpkg.com/@joroya/renderer-three@0.3.0/dist/index.js",
        "@joroya/renderer-svg": "https://unpkg.com/@joroya/renderer-svg@0.3.0/dist/index.js",
        "three": "https://unpkg.com/three@0.165.0/build/three.module.js"
      }
    }
  </script>
</head>
<body>
  <script type="module">
    // Clean imports!
    import { Scene, Node } from '@joroya/core';
    import { ThreeRenderer } from '@joroya/renderer-three';
    
    // Your code here...
  </script>
</body>
</html>
```

## 答 TypeScript Support from CDN

Use esm.sh for built-in TypeScript support:

```typescript
import { Scene, Node } from 'https://esm.sh/@joroya/core@0.3.0';

const scene: Scene = new Scene();
const node: Node = new Node('test');
```

## 剥 Exploring Package Contents

### View All Files
```
https://unpkg.com/@joroya/core@0.3.0/
```

### View package.json
```
https://unpkg.com/@joroya/core@0.3.0/package.json
```

### View Type Definitions
```
https://unpkg.com/@joroya/core@0.3.0/dist/index.d.ts
```

## 笞｡ Performance Optimization

### 1. Use HTTP/2 Server Push
```html
<link rel="modulepreload" href="https://unpkg.com/@joroya/core@0.3.0/dist/index.js">
```

### 2. Bundle for Production
For production, consider bundling:
```bash
npm install @joroya/core @joroya/renderer-three
# Use Vite, Webpack, or Rollup to bundle
```

### 3. Service Worker Caching
```javascript
// Cache CDN resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('oroya-v1').then((cache) => {
      return cache.addAll([
        'https://unpkg.com/@joroya/core@0.3.0/dist/index.js',
        'https://unpkg.com/@joroya/renderer-three@0.3.0/dist/index.js'
      ]);
    })
  );
});
```

## 訣 Multiple CDN Fallback

```html
<script type="module">
  async function loadOroya() {
    const cdns = [
      'https://unpkg.com/@joroya/core@0.3.0/dist/index.js',
      'https://cdn.jsdelivr.net/npm/@joroya/core@0.3.0/dist/index.js',
      'https://esm.sh/@joroya/core@0.3.0'
    ];
    
    for (const cdn of cdns) {
      try {
        const module = await import(cdn);
        return module;
      } catch (e) {
        console.warn(`Failed to load from ${cdn}`, e);
      }
    }
    throw new Error('All CDNs failed');
  }
  
  const { Scene, Node } = await loadOroya();
</script>
```

## 投 CDN Analytics

### unpkg Statistics
View download stats: `https://unpkg.com/@joroya/core/stats`

### jsDelivr Statistics
View stats: `https://www.jsdelivr.com/package/npm/@joroya/core`

## 圷 Limitations & Considerations

### 笞・・Not Recommended For:
- Large production applications (use npm + bundler)
- Applications requiring tree-shaking
- Projects with complex dependency management

### 笨・Perfect For:
- Quick prototypes and experiments
- CodePen, JSFiddle, CodeSandbox
- Educational content and tutorials
- Landing pages with simple 3D/2D graphics
- Documentation demos

## 雌 Educational Platforms

### CodePen Template
```html
<!-- HTML -->
<canvas id="canvas"></canvas>

<!-- CSS -->
body { margin: 0; }
canvas { display: block; }

<!-- JS -->
import { Scene, Node, Camera, CameraType, createBox, Material } from 'https://unpkg.com/@joroya/core@0.3.0/dist/index.js';
import { ThreeRenderer } from 'https://unpkg.com/@joroya/renderer-three@0.3.0/dist/index.js';

// Your code here
```

### JSFiddle Setup
1. Set to "JavaScript + Modules"
2. Add imports at top
3. Write code

### StackBlitz / CodeSandbox
These platforms work great with CDN imports or npm installs.

## 迫 Related Documentation

- [NPM Publishing](./npm-publishing.md) - Publish packages to enable CDN access
- [Getting Started](../getting-started.md) - Local development setup
- [API Reference](../api-reference.md) - Complete API documentation
