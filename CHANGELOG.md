# Changelog

All notable changes to Oroya Animate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2026-05-15

### Added
- **Shadow System**: `castShadow` / `receiveShadow` flags on every `GeometryDef` variant; `castShadow`, `shadowBias`, `shadowMapSize` on `DirectionalLightDef`, `PointLightDef`, `SpotLightDef`. Three.js backend enables `PCFSoftShadowMap` by default and applies flags to meshes, instanced meshes and lights.
- **Post-Processing Pipeline**: Declarative `PostProcessing` component with `bloom`, `toneMapping` (Reinhard / Cineon / ACESFilmic), `exposure` and `antialiasing` (SMAA). The Three.js backend assembles an idempotent `EffectComposer` chain (RenderPass → UnrealBloomPass → SMAAPass → OutputPass) and toggles passes via `.enabled` without reallocating GPU resources.
- **Particle System**: CPU-simulated `ParticleSystem` component (max count, emission rate, gravity, start/end color, start/end size, optional texture). Three.js backend renders it as `THREE.Points` with vertex colors and additive blending.
- **Spatial Audio**: `AudioListener` and `AudioSource` components mapped to `THREE.AudioListener` and `THREE.PositionalAudio`. Decoded buffers cached per URL; cone and distance-model attenuation are passed through.
- **EPIC**: [OA-006 — Advanced Rendering & Effects](docs/features/OA-006/EPIC.md).
- **Tests**: Vitest coverage for shadow flags, particle emission/decay/gravity, and `PostProcessing` definition serialization.

### Changed
- `PostProcessingDef.fxaa` (boolean, unused) renamed to `antialiasing` with an SMAA implementation behind it.
- `AudioSourceDef.url` is now formally documented (chosen over `buffer` to keep the scene graph serializable and let each backend reuse its own loader / cache).
- `PostProcessing` is officially anchored to the **active Camera node** so multi-camera setups (split-screen, picture-in-picture) carry independent FX chains.

### Fixed
- Removed `// @ts-ignore` and `any` from the Three.js post-processing path. `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `SMAAPass`, `OutputPass` and `Pass` now resolve through `@types/three`. `composer` is typed as `EffectComposer | null`, `renderPostFX` takes `PostProcessingDef`.

## [0.5.0] - 2026-02-17

### Added
- **Full glTF/GLB Loader**: Complete support for loading 3D models with geometry and materials from Blender and other 3D tools via `@joroya/loader-gltf`
- **Canvas2D Renderer**: New browser-native Canvas2D rendering backend in `@joroya/renderer-canvas2d` for lightweight 2D graphics
- **Boolean Operations (CSG)**: Constructive Solid Geometry support for 2D/3D boolean operations (union, subtract, intersect) using `three-csg-ts`
- **Cubic Spline Interpolation**: Advanced animation interpolation for smooth keyframe transitions
- **Quaternion SLERP**: Proper spherical linear interpolation for rotations

### Improved
- **SVG Backend**: Complete transformation support and group handling in `@joroya/renderer-svg`
- **Animation System**: Enhanced interpolation methods including cubic spline for professional-grade animations

### Changed
- Organization scope changed from `@oroya` to `@joroya` across all packages

## [0.4.0] - 2026-01-XX

### Added
- **Animation System**: KeyframeTrack, AnimationClip, AnimationMixer with linear/step/cubicspline interpolation
- **Interactivity System**: EventEmitter, Interactive component, InteractionEvent, BoundingBox (AABB)
- **Raycasting**: 3D pointer events (click, hover, drag) in Three.js renderer
- **DOM Event Delegation**: 2D interactivity in SVG renderer
- **Orbit Controls**: OrbitControlsWrapper for camera manipulation (orbit, pan, zoom)
- **Orthographic Camera**: Support in all renderers
- **Buffer Geometry**: Text geometry support with AABB computation
- **SvJs Generative Art Engine**: Gaussian, Pareto, Perlin noise distributions and generators
- **SVG Advanced Features**: Gradients, filters, clip-paths, masks, `<animate>` / `<animateTransform>`
- **Documentation Website**: Astro-powered site deployed to Vercel
- **i18n Infrastructure**: English, Spanish, and Japanese translation support

## [0.3.0] - 2025-12-XX

### Fixed
- Build pipeline stabilized: all 4 packages compile successfully (CJS + ESM + DTS)
- Correct `package.json` exports with proper file extensions and `types`-first condition order
- TypeScript `composite: false` override for tsup DTS compatibility
- Syntax errors in renderer-svg template literals

### Added
- Barrel files (`index.ts`) for all module directories
- Extended `MaterialDef` with SVG-specific properties (`fill`, `stroke`, `strokeWidth`)
- Missing `@types/three` dependency to `@joroya/loader-gltf`
- [Programming Principles](docs/programming-principles.md) documentation
- [Build Errors Postmortem](docs/troubleshooting/build-errors-postmortem.md) documentation

### Removed
- Dead code and unused imports across packages

## [0.2.0] - 2025-11-XX

### Added
- Functional Scene Graph API (`Scene`, `Node`, `Transform` with matrix math)
- Component system (`Geometry`, `Material`, `Camera`)
- Geometry primitives: `createBox`, `createSphere`, `createPath2D`
- Three.js renderer with dynamic scene rendering
- Camera component integrated into scene graph (Perspective)
- World matrix computation via `updateWorldMatrices()`
- Working demos: Vanilla JS and React with animated rotating cubes
- TSDoc on all public API surfaces
- Comprehensive documentation in `docs/` folder

## [0.1.0] - 2025-10-XX

### Added
- Initial monorepo setup with pnpm workspaces
- TypeScript + tsup build pipeline
- Base packages: `@joroya/core`, `@joroya/renderer-three`, `@joroya/renderer-svg`, `@joroya/loader-gltf`
- Initial Scene Graph interfaces and base classes
- Demo apps (Vanilla JS + React)

---

## Package Links

### Published Packages
- [@joroya/core](https://www.npmjs.com/package/@joroya/core) - Core scene graph and components
- [@joroya/renderer-three](https://www.npmjs.com/package/@joroya/renderer-three) - Three.js WebGL renderer
- [@joroya/renderer-svg](https://www.npmjs.com/package/@joroya/renderer-svg) - SVG renderer
- [@joroya/renderer-canvas2d](https://www.npmjs.com/package/@joroya/renderer-canvas2d) - Canvas2D renderer (New in 0.5.0)
- [@joroya/loader-gltf](https://www.npmjs.com/package/@joroya/loader-gltf) - glTF/GLB model loader

### Documentation
- [Main Documentation](https://oroya-animate.vercel.app)
- [GitHub Repository](https://github.com/joshuacba08/oroya-animate)
