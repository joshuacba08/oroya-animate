import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['@joroya/core', '@dimforge/rapier3d-compat'],
    sourcemap: true,
});
