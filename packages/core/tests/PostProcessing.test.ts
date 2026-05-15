import { describe, expect, it } from 'vitest';
import { PostProcessing, PostProcessingDef, ToneMapping } from '../src/components/PostProcessing';
import { ComponentType } from '../src/components/Component';
import { Node } from '../src/nodes/Node';

describe('PostProcessing component', () => {
  it('defaults to an empty definition (no passes implied)', () => {
    const pp = new PostProcessing();
    expect(pp.type).toBe(ComponentType.PostProcessing);
    expect(pp.definition).toEqual({});
  });

  it('preserves bloom, tone-mapping, exposure and antialiasing fields verbatim', () => {
    const def: PostProcessingDef = {
      bloom: { enabled: true, threshold: 0.8, strength: 1.5, radius: 0.4 },
      toneMapping: ToneMapping.ACESFilmic,
      exposure: 1.2,
      antialiasing: true,
    };
    const pp = new PostProcessing(def);
    expect(pp.definition.bloom).toEqual({ enabled: true, threshold: 0.8, strength: 1.5, radius: 0.4 });
    expect(pp.definition.toneMapping).toBe(ToneMapping.ACESFilmic);
    expect(pp.definition.exposure).toBe(1.2);
    expect(pp.definition.antialiasing).toBe(true);
  });

  it('attaches to a Node via the components map keyed by ComponentType', () => {
    const node = new Node('camera');
    const pp = new PostProcessing({ antialiasing: true });
    node.addComponent(pp);
    expect(node.hasComponent(ComponentType.PostProcessing)).toBe(true);
    const retrieved = node.getComponent<PostProcessing>(ComponentType.PostProcessing);
    expect(retrieved?.definition.antialiasing).toBe(true);
  });

  it('exposes every ToneMapping curve as a string enum value', () => {
    expect(ToneMapping.None).toBe('None');
    expect(ToneMapping.Reinhard).toBe('Reinhard');
    expect(ToneMapping.Cineon).toBe('Cineon');
    expect(ToneMapping.ACESFilmic).toBe('ACESFilmic');
  });
});
