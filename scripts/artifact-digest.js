import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function artifactDigest() {
  const hash = createHash('sha256');
  for (const name of readdirSync('packages').sort()) {
    hash.update(name);
    hash.update(readFileSync(resolve('packages', name, 'dist/index.js'), 'utf8').replaceAll('\r\n', '\n'));
  }
  return hash.digest('hex');
}
