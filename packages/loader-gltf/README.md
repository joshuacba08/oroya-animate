# @oroya/loader-gltf

> glTF/GLB 3D model loader for Oroya Animate scene graphs

[![NPM Version](https://img.shields.io/npm/v/@oroya/loader-gltf?style=flat-square)](https://www.npmjs.com/package/@oroya/loader-gltf)
[![License](https://img.shields.io/npm/l/@oroya/loader-gltf?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- 📦 **glTF/GLB Support** - Load industry-standard 3D models
- 🏗️ **Scene Graph Conversion** - Automatically converts to Oroya nodes
- 🎨 **Material Import** - Preserves materials and textures
- 🦴 **Mesh Support** - Handles complex geometry
- 🔄 **Blender Compatible** - Export from Blender and import seamlessly
- ⚡ **Async Loading** - Non-blocking model loading

## Installation

```bash
npm install @oroya/core @oroya/loader-gltf three
```

## Quick Example

```typescript
import { Scene } from '@oroya/core';
import { loadGLTF } from '@oroya/loader-gltf';

const scene = new Scene();

// Load a glTF model
const model = await loadGLTF('/models/spaceship.glb');

// Add to scene
scene.add(model);

// Position and scale
model.transform.position.y = 2;
model.transform.scale.set(0.5, 0.5, 0.5);
```

## API

### loadGLTF

```typescript
loadGLTF(url: string): Promise<Node>
```

Loads a glTF or GLB file and returns a Node containing the entire scene hierarchy.

## Supported Features

- ✅ Meshes and geometry
- ✅ Materials (basic)
- ✅ Node hierarchy
- ✅ Transformations
- 🚧 Animations (coming soon)
- 🚧 Skinning/rigging (planned)
- 🚧 Morph targets (planned)

## Usage Example

```typescript
import { Scene, Node, Camera, CameraType } from '@oroya/core';
import { loadGLTF } from '@oroya/loader-gltf';
import { ThreeRenderer } from '@oroya/renderer-three';

async function main() {
  const scene = new Scene();
  
  // Setup camera
  const camera = new Node('camera');
  camera.addComponent(new Camera({
    type: CameraType.Perspective,
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000
  }));
  camera.transform.position.z = 10;
  scene.add(camera);
  
  // Load model
  const model = await loadGLTF('/models/robot.glb');
  scene.add(model);
  
  // Render
  const renderer = new ThreeRenderer({
    canvas: document.getElementById('canvas'),
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  function animate() {
    model.transform.rotation.y += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

main();
```

## Error Handling

```typescript
try {
  const model = await loadGLTF('/models/scene.glb');
  scene.add(model);
} catch (error) {
  console.error('Failed to load model:', error);
}
```

## Performance Tips

- Use `.glb` (binary) instead of `.gltf` (JSON) for faster loading
- Optimize models in Blender before export
- Use Draco compression for smaller file sizes
- Load models asynchronously to avoid blocking

## Documentation

- 📖 [Full Documentation](https://oroya-animate.vercel.app)
- 📚 [glTF Loader Guide](https://oroya-animate.vercel.app/docs/api-reference#gltf-loader)
- 🎓 [Model Loading Tutorial](https://oroya-animate.vercel.app/docs/tutorials)

## CDN Usage

```html
<script type="module">
  import { Scene } from 'https://unpkg.com/@oroya/core@0.3.0/dist/index.js';
  import { loadGLTF } from 'https://unpkg.com/@oroya/loader-gltf@0.3.0/dist/index.js';
  
  const scene = new Scene();
  const model = await loadGLTF('/model.glb');
  scene.add(model);
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
