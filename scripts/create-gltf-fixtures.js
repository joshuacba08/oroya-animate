import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Tiny, self-contained fixtures; regenerating them never needs Blender or network.
const views = []; const chunks = []; let offset = 0;
const append = (array) => {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const index = views.length; views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length });
  chunks.push(bytes); const padding = (4 - bytes.length % 4) % 4; chunks.push(Buffer.alloc(padding)); offset += bytes.length + padding;
  return index;
};
const matrices = new Float32Array(32);
for (const start of [0, 16]) for (const index of [0, 5, 10, 15]) matrices[start + index] = 1;
matrices[16 + 13] = -1;
const positions = append(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]));
const indices = append(new Uint16Array([0, 1, 2]));
const times = append(new Float32Array([0, 1]));
const translations = append(new Float32Array([1, 0, 0, 2, 0, 0]));
const joints = append(new Uint16Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]));
const weights = append(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]));
const inverse = append(matrices);
const binary = Buffer.concat(chunks);
const gltf = {
  asset: { version: '2.0', generator: 'Oroya deterministic test fixtures' },
  scene: 0, scenes: [{ nodes: [0, 1] }],
  nodes: [{ name: 'triangle', mesh: 0, skin: 0, translation: [1, 0, 0] }, { name: 'hip', children: [2] }, { name: 'tip', translation: [0, 1, 0] }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0, JOINTS_0: 4, WEIGHTS_0: 5 }, indices: 1, material: 0 }] }],
  materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.8, 0.2, 0.1, 0.75], metallicFactor: 0.3, roughnessFactor: 0.4 }, alphaMode: 'BLEND', doubleSided: true }],
  skins: [{ joints: [1, 2], inverseBindMatrices: 6, skeleton: 1 }],
  animations: [{ name: 'move', samplers: [{ input: 2, output: 3, interpolation: 'LINEAR' }], channels: [{ sampler: 0, target: { node: 0, path: 'translation' } }] }],
  accessors: [
    { bufferView: positions, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
    { bufferView: indices, componentType: 5123, count: 3, type: 'SCALAR' },
    { bufferView: times, componentType: 5126, count: 2, type: 'SCALAR', min: [0], max: [1] },
    { bufferView: translations, componentType: 5126, count: 2, type: 'VEC3' },
    { bufferView: joints, componentType: 5123, count: 3, type: 'VEC4' },
    { bufferView: weights, componentType: 5126, count: 3, type: 'VEC4' },
    { bufferView: inverse, componentType: 5126, count: 2, type: 'MAT4' },
  ], bufferViews: views, buffers: [{ byteLength: binary.length, uri: 'data:application/octet-stream;base64,' + binary.toString('base64') }],
};
const destination = resolve('packages/loader-gltf/tests/fixtures'); mkdirSync(destination, { recursive: true });
writeFileSync(resolve(destination, 'animated-skin.gltf'), JSON.stringify(gltf, null, 2) + '\n');
delete gltf.buffers[0].uri;
const jsonBytes = Buffer.from(JSON.stringify(gltf));
const paddedJSON = Buffer.concat([jsonBytes, Buffer.alloc((4 - jsonBytes.length % 4) % 4, 32)]);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + paddedJSON.length + 8 + binary.length, 8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(paddedJSON.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length); binHeader.writeUInt32LE(0x004e4942, 4);
writeFileSync(resolve(destination, 'animated-skin.glb'), Buffer.concat([header, jsonHeader, paddedJSON, binHeader, binary]));
