import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    external: ['@joroya/core', '@dimforge/rapier3d-compat'],
    sourcemap: true,
    clean: true,
    treeshake: true,
});
