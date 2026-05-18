import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const workspacePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@joroya/assets': workspacePath('./packages/assets/src/index.ts'),
      '@joroya/core': workspacePath('./packages/core/src/index.ts'),
      '@joroya/input': workspacePath('./packages/input/src/index.ts'),
      '@joroya/inspector': workspacePath('./packages/inspector/src/index.ts'),
      '@joroya/loader-gltf': workspacePath('./packages/loader-gltf/src/index.ts'),
      '@joroya/physics': workspacePath('./packages/physics/src/index.ts'),
      '@joroya/react': workspacePath('./packages/react/src/index.ts'),
      '@joroya/renderer-canvas2d': workspacePath('./packages/renderer-canvas2d/src/index.ts'),
      '@joroya/renderer-svg': workspacePath('./packages/renderer-svg/src/index.ts'),
      '@joroya/renderer-three': workspacePath('./packages/renderer-three/src/index.ts'),
      '@joroya/vue': workspacePath('./packages/vue/src/index.ts'),
    },
  },
});
