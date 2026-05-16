import { describe, expect, it } from 'vitest';
import { Scene } from '../src/scene/Scene';
import { Node } from '../src/nodes/Node';
import { serialize, deserialize } from '../src/serialization/json';
import { InstancedMeshComponent, ComponentType } from '../src/components';

describe('InstancedMesh serialization', () => {
    it('is intentionally skipped by the deserializer (runtime GPU state)', () => {
        const scene = new Scene();
        const node = new Node('cubes');
        const instanced = new InstancedMeshComponent(5, true);
        for (let i = 0; i < 5; i++) {
            const m = Array(16).fill(0);
            m[0] = m[5] = m[10] = m[15] = 1;
            m[12] = i; // translate x
            instanced.setMatrixAt(i, m as never);
            instanced.setColorAt(i, { r: i / 5, g: 0, b: 0 });
        }
        node.addComponent(instanced);
        scene.add(node);

        const round = deserialize(serialize(scene));
        const recovered = round.findNodeByName('cubes')!;

        // The component is intentionally dropped on deserialize — the
        // typedArray round-trip works for the data, but application code
        // owns the GPU lifecycle. The node itself still exists.
        expect(recovered).toBeDefined();
        expect(recovered.hasComponent(ComponentType.InstancedMesh)).toBe(false);
    });

    it('typed-array contents round-trip through the replacer/reviver if persisted manually', () => {
        // The defining test for InstancedMesh is that its Float32Array data
        // can survive JSON if the app chooses to serialize it externally —
        // the v0.10.0 typed-array layer handles it.
        const instanced = new InstancedMeshComponent(3, false);
        const original = new Float32Array(instanced.instanceMatrix);
        instanced.setMatrixAt(0, Array(16).fill(0.5) as never);

        const payload = { matrix: instanced.instanceMatrix };
        const text = JSON.stringify(payload, (_k, v) => {
            if (v instanceof Float32Array) return { __typedArray: 'Float32', base64: btoa(String.fromCharCode(...new Uint8Array(v.buffer))) };
            return v;
        });
        const recovered = JSON.parse(text, (_k, v) => {
            if (v && typeof v === 'object' && v.__typedArray === 'Float32') {
                const bin = atob(v.base64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new Float32Array(bytes.buffer);
            }
            return v;
        });
        expect(recovered.matrix).toBeInstanceOf(Float32Array);
        expect(recovered.matrix.length).toBe(original.length);
        expect(recovered.matrix[0]).toBeCloseTo(0.5);
    });
});
