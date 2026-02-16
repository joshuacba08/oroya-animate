#!/usr/bin/env node
/**
 * Sync version across all packages in the monorepo
 * Usage: node scripts/sync-versions.js <version>
 * Example: node scripts/sync-versions.js 0.4.0
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';
import { resolve } from 'path';

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Error: Version argument required');
  console.log('Usage: node scripts/sync-versions.js <version>');
  console.log('Example: node scripts/sync-versions.js 0.4.0');
  process.exit(1);
}

// Validate version format (semver)
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`❌ Error: Invalid version format: ${newVersion}`);
  console.log('Expected format: X.Y.Z or X.Y.Z-prerelease');
  process.exit(1);
}

console.log(`📦 Syncing version to ${newVersion}...\n`);

// Find all package.json files in packages/
const packagePaths = globSync('./packages/*/package.json');

if (packagePaths.length === 0) {
  console.error('❌ Error: No packages found in ./packages/');
  process.exit(1);
}

let successCount = 0;
let errorCount = 0;

packagePaths.forEach(path => {
  try {
    const fullPath = resolve(path);
    const pkg = JSON.parse(readFileSync(fullPath, 'utf-8'));
    
    const oldVersion = pkg.version;
    pkg.version = newVersion;
    
    writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
    
    console.log(`✅ ${pkg.name}: ${oldVersion} → ${newVersion}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to update ${path}:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Updated: ${successCount}`);
if (errorCount > 0) {
  console.log(`   ❌ Failed: ${errorCount}`);
}

console.log(`\n💡 Next steps:`);
console.log(`   1. Review changes: git diff`);
console.log(`   2. Build packages: pnpm build`);
console.log(`   3. Commit: git commit -am "Release v${newVersion}"`);
console.log(`   4. Tag: git tag v${newVersion}`);
console.log(`   5. Push: git push && git push --tags`);

process.exit(errorCount > 0 ? 1 : 0);
