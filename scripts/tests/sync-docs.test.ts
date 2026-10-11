import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { manifest, renderDocument, syncDocs } from '../sync-docs.js';
describe('canonical document synchronization', () => {
  it('is idempotent and keeps all currently generated documents synchronized', () => {
    expect(syncDocs(true)).toBe(0);
  });
  it('preserves frontmatter, route slugs and fenced code while routing links', () => {
    const entry = manifest.find((item: { topic: string; locale: string }) => item.topic === 'getting-started' && item.locale === 'es');
    const metadata = '---\ntitle: Original\norder: 42\n---\n';
    const source = '[Renderer](renderers-es.md)\n' + String.fromCharCode(96).repeat(3) + 'ts\nconst text = "[Renderer](renderers-es.md)";\n' + String.fromCharCode(96).repeat(3);
    const result = renderDocument(source, metadata, entry);
    expect(result.startsWith(metadata)).toBe(true);
    expect(result).toContain('[Renderer](/es/docs/renderers)');
    expect(result).toContain('const text = "[Renderer](renderers-es.md)"');
    expect(renderDocument(source, result, entry)).toBe(result);
  });
  it('detects drift and distinguishes tutorial topics sharing a number', () => {
    const physics = manifest.find((item: { topic: string }) => item.topic === 'physics-basics');
    const canvas = manifest.find((item: { topic: string }) => item.topic === 'canvas2d-renderer');
    expect(physics.route).not.toBe(canvas.route);
    const current = readFileSync(physics.target, 'utf8');
    expect(renderDocument('changed', current, physics)).not.toBe(current);
  });
});
