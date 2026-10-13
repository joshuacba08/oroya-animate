import { readdirSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { registryVersion, registryTag, waitForRegistry } from './registry-version.js';

const tag = process.argv[2];
const acceptPendingDevices = process.argv.includes('--accept-pending-devices');
if (!['next', 'latest'].includes(tag)) throw new Error('Choose next or latest explicitly.');
const packages = readdirSync('packages').map((directory) => ({ directory, manifest: JSON.parse(readFileSync(resolve('packages', directory, 'package.json'), 'utf8')) }));
const versions = new Set(packages.map(({ manifest }) => manifest.version));
if (versions.size !== 1) throw new Error('Release package versions must match.');
const version = packages[0].manifest.version;
if (tag === 'next' && !version.includes('-')) throw new Error('next requires a prerelease version.');
if (tag === 'latest' && version.includes('-')) throw new Error('latest requires a stable version.');
if (!process.env.npm_execpath) throw new Error('Run through pnpm.');
const run = (args, cwd = process.cwd()) => {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8', windowsHide: true });
  if (result.status) throw new Error(result.stdout + result.stderr);
  return result.stdout;
};
// Keep direct CLI publication subject to the same evidence gate as Actions.
const acceptance = spawnSync(process.execPath, ['scripts/release-check.js', ...(tag === 'next' ? ['--candidate'] : []), ...(acceptPendingDevices ? ['--accept-pending-devices'] : [])], { encoding: 'utf8', windowsHide: true });
if (acceptance.status !== 0) throw new Error(acceptance.stdout + acceptance.stderr);
if (tag === 'latest' && !acceptPendingDevices) {
  const candidates = new Set();
  for (const { manifest } of packages) {
    const candidate = await registryTag(manifest.name, 'next');
    if (typeof candidate !== 'string' || !candidate.startsWith(version + '-')) throw new Error('Publish an accepted ' + version + ' candidate under next before promoting ' + manifest.name);
    candidates.add(candidate);
  }
  if (candidates.size !== 1) throw new Error('All packages must share the same candidate version under next.');
}
const pending = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]));
const tarballs = mkdtempSync(resolve(tmpdir(), 'oroya-release-'));
for (const { directory } of packages) run(['pack', '--pack-destination', tarballs], resolve('packages', directory));
while (pending.size) {
  const ready = [...pending.values()].find(({ manifest }) => Object.keys(manifest.dependencies ?? {}).every((name) => !pending.has(name)));
  if (!ready) throw new Error('Workspace dependency cycle.');
  // A partial npm publication can be retried: never replace an existing version.
  const exists = await registryVersion(ready.manifest.name, version);
  const archive = resolve(tarballs, ready.manifest.name.replace('@', '').replace('/', '-') + '-' + version + '.tgz');
  if (!exists) console.log(run(['exec', 'npm', 'publish', archive, '--access', 'public', '--tag', 'release-staging', '--provenance'], resolve('packages', ready.directory)));
  pending.delete(ready.manifest.name);
}
// Registry replicas can cache a missing version for over a minute. Publish in
// dependency order, then verify all versions together before moving public tags.
await Promise.all(packages.map(async ({ manifest }) => {
  await waitForRegistry(() => registryVersion(manifest.name, version), version);
  console.log('Verified ' + manifest.name + '@' + version);
}));
// Update the dist-tag only after every compatible package version is available.
for (const { manifest } of packages) run(['exec', 'npm', 'dist-tag', 'add', manifest.name + '@' + version, tag]);
for (const { manifest } of packages) {
  await waitForRegistry(() => registryTag(manifest.name, tag), version);
}
