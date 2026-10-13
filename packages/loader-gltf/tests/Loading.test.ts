import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ComponentType, Material, Geometry, Skin, AnimationMixer, serialize, deserialize, type Diagnostic } from '@joroya/core';
import { parseGLTF } from '../src';

describe('real glTF and GLB parsing', () => {
  it('deinterleaves position/normal buffers using attribute stride', async () => {
    vi.stubGlobal('ProgressEvent', class {});
    const data = JSON.parse(readFileSync(new URL('./fixtures/animated-skin.gltf', import.meta.url), 'utf8'));
    const original = Buffer.from(data.buffers[0].uri.split(',')[1], 'base64');
    const interleaved = new Float32Array([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1]);
    const bytes = Buffer.concat([original, Buffer.from(interleaved.buffer)]);
    const view = data.bufferViews.length; data.bufferViews.push({ buffer: 0, byteOffset: original.length, byteLength: interleaved.byteLength, byteStride: 24 });
    data.accessors[0].bufferView = view;
    data.accessors.push({ bufferView: view, byteOffset: 12, componentType: 5126, count: 3, type: 'VEC3' });
    data.meshes[0].primitives[0].attributes.NORMAL = data.accessors.length - 1;
    data.buffers[0] = { byteLength: bytes.length, uri: 'data:application/octet-stream;base64,' + bytes.toString('base64') };
    const result = await parseGLTF(JSON.stringify(data));
    const definition = result.scene.findNodeByName('triangle')!.getComponent<Geometry>(ComponentType.Geometry)!.definition;
    if (definition.type !== 'Buffer') throw new Error('Expected buffer geometry.');
    expect(Array.from(definition.positions)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(Array.from(definition.normals!)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]); vi.unstubAllGlobals();
  });
  it('resolves anonymous nodes and normalized integer skin weights', async () => {
    vi.stubGlobal('ProgressEvent', class {});
    const data = JSON.parse(readFileSync(new URL('./fixtures/animated-skin.gltf', import.meta.url), 'utf8'));
    for (const node of data.nodes) delete node.name;
    const bytes = Buffer.from(data.buffers[0].uri.split(',')[1], 'base64');
    const weights = data.bufferViews[data.accessors[5].bufferView];
    bytes.fill(0, weights.byteOffset, weights.byteOffset + weights.byteLength);
    for (let i = 0; i < 3; i++) bytes[weights.byteOffset + i * 4] = 255;
    data.accessors[5].componentType = 5121; data.accessors[5].normalized = true;
    data.buffers[0].uri = 'data:application/octet-stream;base64,' + bytes.toString('base64');
    const result = await parseGLTF(JSON.stringify(data));
    const target = result.scene.findNodeByName(result.animations[0].tracks[0].targetNodeName)!;
    expect(target).toBeDefined();
    const definition = target.getComponent<Geometry>(ComponentType.Geometry)!.definition;
    if (definition.type === 'Buffer') expect(Array.from(definition.skinWeights!)).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
    const mixer = new AnimationMixer(result.scene); mixer.play(result.animations[0], { loop: false }); mixer.update(0.5);
    expect(target.transform.position.x).toBeCloseTo(1.5); vi.unstubAllGlobals();
  });
  it.each(['gltf', 'glb'])('translates hierarchy, PBR, animation and skin from local %s', async (extension) => {
    if (typeof ProgressEvent === 'undefined') vi.stubGlobal('ProgressEvent', class { constructor(public type: string) {} });
    const bytes = readFileSync(new URL('./fixtures/animated-skin.' + extension, import.meta.url));
    const data = extension === 'gltf' ? bytes.toString('utf8') : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const result = await parseGLTF(data); const node = result.scene.findNodeByName('triangle')!;
    expect(node.transform.position.x).toBe(1); expect(result.scene.findNodeByName('tip')!.parent!.name).toBe('hip');
    expect(node.getComponent<Material>(ComponentType.Material)!.definition).toMatchObject({ opacity: 0.75, metalness: 0.3, roughness: 0.4, doubleSided: true });
    expect(node.getComponent<Skin>(ComponentType.Skin)!.definition.boneNames).toEqual(['hip', 'tip']);
    expect(node.getComponent<Geometry>(ComponentType.Geometry)!.definition).toMatchObject({ skinIndices: expect.any(Uint16Array), skinWeights: expect.any(Float32Array) });
    const mixer = new AnimationMixer(result.scene); mixer.play(result.animations[0], { loop: false }); mixer.update(0.5); expect(node.transform.position.x).toBeCloseTo(1.5);
    expect(deserialize(serialize(result.scene)).findNodeByName('triangle')).toBeDefined(); vi.unstubAllGlobals();
  });
  it('reports unsupported tracks and respects pre-cancellation', async () => {
    const data = JSON.parse(readFileSync(new URL('./fixtures/animated-skin.gltf', import.meta.url), 'utf8'));
    data.animations[0].channels[0].target.path = 'weights';
    const diagnostics: Diagnostic[] = []; vi.stubGlobal('ProgressEvent', class {});
    await parseGLTF(JSON.stringify(data), { onDiagnostic: (value) => diagnostics.push(value) });
    expect(diagnostics.some((value) => value.code === 'UNSUPPORTED_GLTF_FEATURE')).toBe(true);
    const abort = new AbortController(); abort.abort(); await expect(parseGLTF('{}', { signal: abort.signal })).rejects.toMatchObject({ name: 'AbortError' }); vi.unstubAllGlobals();
  });
});
