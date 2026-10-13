import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { artifactDigest } from './artifact-digest.js';

const root = process.cwd(); const destination = mkdtempSync(join(tmpdir(), 'oroya-consumer-'));
mkdirSync(resolve(root, 'validation'), { recursive: true });
if (!process.env.npm_execpath) throw new Error('Run through pnpm verify:packages.');
const pnpm = (args, cwd = root) => {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(result.stdout + result.stderr);
  return result.stdout;
};
const packages = readdirSync(resolve(root, 'packages')).map((folder) => ({ folder,
  manifest: JSON.parse(readFileSync(resolve(root, 'packages', folder, 'package.json'), 'utf8')) }));
for (const { folder } of packages) pnpm(['pack', '--pack-destination', destination], resolve(root, 'packages', folder));
const dependencies = { react: '19.0.0', 'react-dom': '19.0.0', vue: '3.5.13', three: '0.165.0', 'cannon-es': '0.20.0' };
for (const { manifest } of packages) {
  const tarball = readdirSync(destination).find((name) => name === manifest.name.replace('@', '').replace('/', '-') + '-' + manifest.version + '.tgz');
  if (!tarball) throw new Error('Missing packed ' + manifest.name);
  dependencies[manifest.name] = 'file:' + resolve(destination, tarball).replaceAll('\\', '/');
}
const overrides = Object.fromEntries(Object.entries(dependencies).filter(([name]) => name.startsWith('@joroya/')));
writeFileSync(resolve(destination, 'package.json'), JSON.stringify({ name: 'oroya-external-consumer', private: true, type: 'module', dependencies, pnpm: { overrides },
  devDependencies: { typescript: '5.9.3', '@types/react': '19.0.0', '@types/node': '20.19.33', '@types/three': '0.165.0' } }, null, 2));
pnpm(['install', '--no-frozen-lockfile'], destination);
const names = packages.map(({ manifest }) => manifest.name);
const esm = names.map((name) => 'await import(' + JSON.stringify(name) + ');').join('\n') + '\n';
const cjs = names.map((name) => 'require(' + JSON.stringify(name) + ');').join('\n') + '\n';
writeFileSync(resolve(destination, 'consumer.mjs'), esm + "import { Scene, Node, RigidBody, serialize, deserialize } from '@joroya/core';\nimport { renderToSVG } from '@joroya/renderer-svg';\nimport { PhysicsSystem } from '@joroya/physics';\nconst scene = deserialize(serialize(new Scene()));\nif (!renderToSVG(scene, { width: 100, height: 100 }).includes('<svg')) throw new Error('SVG consumer failed');\nconst body = new Node('body'); body.addComponent(new RigidBody({})); scene.add(body); const physics = new PhysicsSystem(); physics.update(0, scene); if (physics.world.bodies.length !== 1) throw new Error('Core identity mismatch'); physics.dispose();\n");
writeFileSync(resolve(destination, 'consumer.cjs'), cjs);
for (const file of ['consumer.mjs', 'consumer.cjs']) {
  const result = spawnSync(process.execPath, [file], { cwd: destination, encoding: 'utf8', windowsHide: true });
  if (result.status) throw new Error(result.stdout + result.stderr);
}
const source = names.map((name, index) => 'import * as package' + index + ' from ' + JSON.stringify(name) + ';\nvoid package' + index + ';').join('\n') +
  "\nimport { Scene, serialize, deserialize, type RenderOptions } from '@joroya/core';\nimport { OroyaCanvas } from '@joroya/react';\nimport { useOroyaCanvas } from '@joroya/vue';\nconst scene: Scene = deserialize(serialize(new Scene()));\nconst options: RenderOptions = { advanceScene: false };\nvoid scene; void options; void OroyaCanvas; void useOroyaCanvas;\n";
for (const extension of ['mts', 'cts']) writeFileSync(resolve(destination, 'consumer.' + extension), source);
for (const extension of ['mts', 'cts']) pnpm(['exec', 'tsc', '--noEmit', '--strict', '--skipLibCheck', 'false', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.' + extension], destination);
writeFileSync(resolve(root, 'validation/package-consumers.json'), JSON.stringify({ timestamp: new Date().toISOString(), artifactDigest: artifactDigest(), node: process.versions.node,
  packages: packages.map(({ manifest }) => ({ name: manifest.name, version: manifest.version })), esm: 'passed', cjs: 'passed', typesNodeNextESM: 'passed', typesNodeNextCJS: 'passed', directory: destination }, null, 2) + '\n');
console.log('Verified ' + packages.length + ' packed packages outside the monorepo: ESM, CJS and NodeNext declarations.');
