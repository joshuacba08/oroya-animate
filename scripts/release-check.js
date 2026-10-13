import { readFileSync, readdirSync } from 'node:fs';
import { artifactDigest } from './artifact-digest.js';
const candidate = process.argv.includes('--candidate');
const failures = [];
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const read = (file) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { failures.push('Missing evidence: ' + file); return undefined; } };
const packages = read('validation/package-consumers.json');
if (packages?.artifactDigest !== artifactDigest()) failures.push('Package evidence does not match current built packages.');
for (const directory of readdirSync('packages')) {
  const manifest = JSON.parse(readFileSync('packages/' + directory + '/package.json', 'utf8'));
  if (manifest.version !== version || !packages?.packages?.some((entry) => entry.name === manifest.name && entry.version === version)) failures.push('Package version evidence missing or stale: ' + manifest.name);
}
if (packages && ['esm', 'cjs', 'typesNodeNextESM', 'typesNodeNextCJS'].some((key) => packages[key] !== 'passed')) failures.push('Package consumer validation failed.');
const performance = read('validation/performance-latest.json');
if (performance?.errors?.length) failures.push('Performance regression gate failed.');
if (performance?.artifactDigest !== artifactDigest()) failures.push('Performance evidence does not match current built packages.');
if (process.argv.includes('--performance-only')) {
  failures.forEach((failure) => console.error(failure)); process.exit(failures.length ? 1 : 0);
}
const endurance = read('validation/endurance-latest.json');
if (endurance?.artifactDigest !== artifactDigest()) failures.push('Endurance evidence does not match current built packages.');
if (endurance && (endurance.durationMs < 1800000 || endurance.errors.length || endurance.final.nodes || endurance.final.geometries || endurance.final.textures)) failures.push('30 minute endurance acceptance failed.');
if (!candidate) {
  const devices = read('validation/physical-devices.json');
  for (const name of ['safari-ios', 'chrome-android']) {
    const result = devices?.[name];
    if (!result || result.status !== 'passed' || !result.device || !result.browserVersion || !result.evidence || result.testedVersion !== version || result.artifactDigest !== artifactDigest()) failures.push('Physical device acceptance pending or stale: ' + name);
  }
}
failures.forEach((failure) => console.error(failure)); console.log('Release acceptance: ' + failures.length + ' outstanding checks.'); process.exitCode = failures.length ? 1 : 0;
