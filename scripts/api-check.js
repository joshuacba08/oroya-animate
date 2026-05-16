#!/usr/bin/env node
// scripts/api-check.js
//
// Walks every package's `src/index.ts` (the public barrel) and reports
// re-exports that don't trace back to a TSDoc block tagged with one of
// `@public`, `@experimental`, or `@internal`.
//
// This is informational, not a CI gate — its purpose is to make a
// missing tag visible in code review so we don't accidentally ship an
// untagged export.
//
// Usage: `pnpm api:check`

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packagesDir = join(__dirname, '..', 'packages');

const SUPPORTED_TAGS = ['@public', '@experimental', '@internal'];
const STABILITY_RE = new RegExp(SUPPORTED_TAGS.map((t) => t.replace('@', '@')).join('|'));

let totalMissing = 0;
let totalScanned = 0;

const packages = readdirSync(packagesDir).filter((p) => {
    try {
        return statSync(join(packagesDir, p, 'src', 'index.ts')).isFile();
    } catch {
        return false;
    }
});

for (const pkg of packages) {
    const root = join(packagesDir, pkg, 'src');
    const exportsFromBarrel = readBarrel(join(root, 'index.ts'));
    const missing = [];
    for (const name of exportsFromBarrel) {
        const location = findSymbolDefinition(root, name);
        if (!location) continue; // Re-exported from a sub-barrel; deferred check.
        totalScanned++;
        if (!hasStabilityTag(location.file, location.line)) {
            missing.push(`${name}  ←  ${location.file.replace(root + '/', '')}:${location.line}`);
        }
    }
    if (missing.length > 0) {
        console.log(`\n📦 @joroya/${pkg}  —  ${missing.length} export(s) missing a stability tag:`);
        for (const m of missing) console.log(`   ${m}`);
        totalMissing += missing.length;
    }
}

const banner = totalMissing > 0
    ? `❗ ${totalMissing} of ${totalScanned} exports lack a stability tag.`
    : `✅ All ${totalScanned} exports across ${packages.length} packages carry a stability tag.`;
console.log(`\n${banner}`);
// Always exit 0 — informational only.
process.exit(0);

// ── helpers ───────────────────────────────────────────────────

function readBarrel(file) {
    const src = readFileSync(file, 'utf8');
    const names = new Set();
    // `export { Foo, Bar as Baz } from ...`
    const namedRe = /export\s*(?:type)?\s*\{([^}]*)\}/g;
    let m;
    while ((m = namedRe.exec(src))) {
        for (const part of m[1].split(',')) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            const original = trimmed.split(/\s+as\s+/)[0].trim();
            if (original) names.add(original);
        }
    }
    // `export * from ...` is opaque from here — we skip and let the
    // sub-barrel's own re-exports surface their definitions.
    return Array.from(names);
}

function findSymbolDefinition(root, symbolName) {
    return walk(root, symbolName);
}

function walk(dir, symbolName) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
            const found = walk(full, symbolName);
            if (found) return found;
            continue;
        }
        if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
        const src = readFileSync(full, 'utf8');
        const lines = src.split('\n');
        // Match `export ... <symbolName>` at start of a line (allowing
        // optional `type` / `const` / `class` etc.). Crude but works for
        // the canonical shapes we use.
        const pattern = new RegExp(
            String.raw`^export\s+(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(?:type|interface|class|function|const|let|enum|var)\s+${escapeRe(symbolName)}\b`,
        );
        for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
                return { file: full, line: i + 1 };
            }
        }
    }
    return null;
}

function hasStabilityTag(file, line) {
    const src = readFileSync(file, 'utf8').split('\n');
    // Look backwards from the declaration line for the closing `*/` of a
    // jsdoc, then scan that block.
    for (let i = line - 2; i >= 0 && i >= line - 40; i--) {
        const t = src[i].trim();
        if (t.endsWith('*/')) {
            // Walk back to `/**` collecting the block.
            for (let j = i; j >= 0; j--) {
                if (src[j].trim().startsWith('/**')) {
                    const block = src.slice(j, i + 1).join(' ');
                    return STABILITY_RE.test(block);
                }
            }
            return false;
        }
        if (t === '' || t.startsWith('//')) continue;
        // Hit a non-comment line before the jsdoc — none present.
        return false;
    }
    return false;
}

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
