import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { auditExports } from '../api-check.js';
describe('resolved export audit', () => {
  it('handles declarations, aliases, types, stars and cycles without duplicate declarations', () => {
    const items = auditExports([resolve('scripts/tests/fixtures/api/index.ts')]);
    expect(items.filter((item: { declarationName: string }) => item.declarationName === 'Direct')).toHaveLength(1);
    expect(items.some((item: { declarationName: string; name: string; kind: string }) => item.declarationName === 'Shape' && item.kind === 'ok')).toBe(true);
    expect(items.some((item: { declarationName: string; name: string; kind: string }) => item.name === 'direct' && item.kind === 'ok')).toBe(true);
    expect(items.some((item: { declarationName: string; name: string; kind: string }) => item.name === 'secret' && item.kind === 'internal')).toBe(true);
    expect(items.some((item: { kind: string }) => item.kind === 'unresolved')).toBe(true);
    expect(items.some((item: { declarationName: string; name: string; kind: string }) => item.name === 'untagged' && item.kind === 'missing')).toBe(true);
  });
});
