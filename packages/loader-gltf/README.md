# @joroya/loader-gltf

> glTF/GLB 3D model loader for Oroya Animate scene graphs

[![NPM Version](https://img.shields.io/npm/v/@joroya/loader-gltf?style=flat-square)](https://www.npmjs.com/package/@joroya/loader-gltf)
[![License](https://img.shields.io/npm/l/@joroya/loader-gltf?style=flat-square)](https://github.com/joshuacba08/oroya-animate/blob/main/LICENSE)

Part of [Oroya Animate](https://github.com/joshuacba08/oroya-animate) - an engine-agnostic 2D/3D graphics library.

## Features

- glTF/GLB support - Load industry-standard 3D models
- Scene graph conversion - Automatically converts to Oroya nodes
- Material import - Preserves color, PBR material fields, opacity, and double-sided hints where available
- Mesh support - Handles static meshes, skinned meshes, geometry buffers, and skeleton metadata
- Blender compatible - Export from Blender and import seamlessly
- Async loading - Non-blocking model loading

## Installation

```bash
npm install @joroya/core @joroya/loader-gltf three
```

## Quick Example

```typescript
import { loadGLTF } from '@joroya/loader-gltf';

// Load a glTF model
const { scene, animations } = await loadGLTF('/models/spaceship.glb');

console.log(scene.root.children.length, animations.length);
```

## API

### loadGLTF

```typescript
loadGLTF(url: string): Promise<{ scene: Scene; animations: AnimationClip[] }>
```

Loads a glTF or GLB file and returns an Oroya `Scene` plus translated animation clips.

## Supported Features

- Meshes and buffer geometry
- Materials (color, PBR fields, opacity, double-sided)
- Node hierarchy
- Transformations
- Animation clips for position, rotation, and scale tracks
- Skinned meshes via `Skin` + skin indices/weights
- 🚧 Morph targets (planned)

## Usage Example

```typescript
import { Scene, Node, Camera, CameraType } from '@joroya/core';
import { loadGLTF } from '@joroya/loader-gltf';
import { ThreeRenderer } from '@joroya/renderer-three';

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
  
  // Load model and attach its root children under this scene
  const result = await loadGLTF('/models/robot.glb');
  for (const child of [...result.scene.root.children]) {
    scene.add(child);
  }
  
  // Render
  const renderer = new ThreeRenderer({
    canvas: document.getElementById('canvas'),
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  renderer.mount(scene);

  function animate() {
    renderer.render();
    requestAnimationFrame(animate);
  }
  animate();
}

main();
```

## Error Handling

```typescript
try {
  const result = await loadGLTF('/models/scene.glb');
  for (const child of [...result.scene.root.children]) {
    scene.add(child);
  }
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
  import { Scene } from 'https://unpkg.com/@joroya/core@1.0.0/dist/index.js';
  import { loadGLTF } from 'https://unpkg.com/@joroya/loader-gltf@1.0.0/dist/index.js';
  
  const scene = new Scene();
  const result = await loadGLTF('/model.glb');
  for (const child of [...result.scene.root.children]) {
    scene.add(child);
  }
</script>
```

## Contributing

See the [Contributing Guide](https://github.com/joshuacba08/oroya-animate/blob/main/docs/contributing.md).

## License

MIT © [joshuacba08](https://github.com/joshuacba08)
