import { describe, expect, it } from 'vitest';
import { compareAPI } from '../api-compatibility.js';
describe('declaration compatibility gate', () => {
  it('detects enum wire changes and incompatible constructor/static signatures', () => {
    const signature = { signatures: [{ parameters: [], returns: 'Node' }] };
    const baseline = { Node: { members: {}, constructors: signature, statics: { create: signature } }, ComponentType: { enumeration: { Geometry: 'Geometry' } } };
    expect(compareAPI(baseline, { Node: { members: {}, constructors: { signatures: [] }, statics: {} }, ComponentType: { enumeration: { Geometry: 'Mesh' } } })).toHaveLength(3);
  });
  it('allows optional arguments and properties while detecting removals and required additions', () => {
    const method = { signatures: [{ parameters: [{ type: 'number', optional: false }], returns: 'void' }] };
    const baseline = { 'core:CameraDef': { members: { fov: { type: 'number', optional: false } } }, 'core:render': method };
    expect(compareAPI(baseline, { 'core:CameraDef': { members: { fov: { type: 'number', optional: false }, active: { type: 'boolean', optional: true } } },
      'core:render': { signatures: [{ parameters: [{ type: 'number', optional: false }, { type: 'RenderOptions', optional: true }], returns: 'void' }] } })).toEqual([]);
    expect(compareAPI(baseline, {}).length).toBe(2);
    expect(compareAPI(baseline, { ...baseline, 'core:CameraDef': { members: { fov: { type: 'number', optional: false }, active: { type: 'boolean', optional: false } } } })).toHaveLength(1);
  });
});
