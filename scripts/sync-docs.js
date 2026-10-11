#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const manifest = JSON.parse(readFileSync(join(root, 'scripts/docs-manifest.json'), 'utf8'));
const normalize = (text) => text.replace(/\r\n/g, '\n');

/** Preserve site metadata and slugs, route canonical links, leave code intact. */
export function renderDocument(source, current, entry, entries = manifest) {
  const metadata = normalize(current).match(/^---\n([\s\S]*?)\n---\n/)?.[1];
  if (!metadata) throw new Error('Missing frontmatter: ' + entry.target);
  let fence = false;
  const body = normalize(source).split('\n').map((line) => {
    if (/^\s*\x60{3}|^\s*~~~/.test(line)) { fence = !fence; return line; }
    if (fence) return line;
    return line.replace(/\]\(([^#\s)]+)(#[^\s)]*)?\)/g, (match, href, anchor = '') => {
      if (/^(?:[a-z]+:|\/)/i.test(href)) return match;
      const path = posix.normalize(posix.join(posix.dirname(entry.source), href));
      const destination = entries.find((item) => item.source === path && item.locale === entry.locale)
        ?? entries.find((item) => item.source === path);
      if (destination) return '](' + destination.route + anchor + ')';
      return '](https://github.com/joshuacba08/oroya-animate/blob/main/' + path + anchor + ')';
    });
  }).join('\n');
  return '---\n' + metadata + '\n---\n' + body.trimEnd() + '\n';
}
export function syncDocs(check = false) {
  let stale = 0;
  for (const entry of manifest) {
    const current = readFileSync(join(root, entry.target), 'utf8');
    const expected = renderDocument(readFileSync(join(root, entry.source), 'utf8'), current, entry);
    if (normalize(current) === expected) continue;
    stale++;
    if (check) console.error('Out of sync: ' + entry.target);
    else writeFileSync(join(root, entry.target), expected);
  }
  return stale;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check'), stale = syncDocs(check);
  console.log(manifest.length + ' canonical documents; ' + stale + ' changed.');
  if (check && stale) process.exitCode = 1;
}
