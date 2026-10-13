import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../..', import.meta.url));
const packages = ['core', 'renderer-three', 'renderer-svg', 'renderer-canvas2d', 'physics', 'loader-gltf', 'input', 'assets', 'inspector', 'react', 'vue'];
export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: [
    { find: /^react-dom(\/.*)?$/, replacement: resolve(root, 'apps/editor/node_modules/react-dom') + '$1' },
    { find: /^react(\/.*)?$/, replacement: resolve(root, 'apps/editor/node_modules/react') + '$1' },
    { find: 'vue', replacement: resolve(root, 'packages/vue/node_modules/vue/dist/vue.runtime.esm-bundler.js') },
    ...packages.map((name) => ({ find: '@joroya/' + name, replacement: resolve(root, 'packages', name, 'dist/index.js') })),
  ] },
  server: { host: '127.0.0.1', port: 4175, strictPort: true, fs: { allow: [root] } },
};
