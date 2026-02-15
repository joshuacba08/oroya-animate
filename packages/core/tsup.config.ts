import { defineConfig } from 'tsup';

// Justification: Simple, modern, and effective for library bundling.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
});
