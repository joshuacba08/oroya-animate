import { describe, expect, it } from 'vitest';
import { Skin, ComponentType } from '../src/components';
import { Node } from '../src/nodes/Node';
import { Scene } from '../src/scene/Scene';
import { serialize, deserialize } from '../src/serialization/json';
import type { SkinDef } from '../src/components';

describe('Skin component', () => {
    it('preserves boneNames and inverseBindMatrices on construction', () => {
        const def: SkinDef = {
            boneNames: ['hip', 'spine', 'shoulder'],
            inverseBindMatrices: new Float32Array(3 * 16),
            skeletonRoot: 'hip',
        };
        const skin = new Skin(def);
        expect(skin.type).toBe(ComponentType.Skin);
        expect(skin.definition.boneNames).toEqual(['hip', 'spine', 'shoulder']);
        expect(skin.definition.inverseBindMatrices).toHaveLength(48);
        expect(skin.definition.skeletonRoot).toBe('hip');
    });

    it('round-trips through serialize/deserialize with Float32Array intact', () => {
        const scene = new Scene();
        const mesh = new Node('character-mesh');

        // Sample IBM: identity for bone 0, scale-by-2 for bone 1.
        const ibm = new Float32Array(2 * 16);
        ibm[0] = 1; ibm[5] = 1; ibm[10] = 1; ibm[15] = 1;
        ibm[16 + 0] = 2; ibm[16 + 5] = 2; ibm[16 + 10] = 2; ibm[16 + 15] = 1;

        mesh.addComponent(new Skin({
            boneNames: ['root', 'tip'],
            inverseBindMatrices: ibm,
            skeletonRoot: 'root',
        }));
        scene.add(mesh);

        const round = deserialize(serialize(scene));
        const recovered = round.findNodeByName('character-mesh')!.getComponent<Skin>(ComponentType.Skin)!;
        expect(recovered.definition.boneNames).toEqual(['root', 'tip']);
        expect(recovered.definition.inverseBindMatrices).toBeInstanceOf(Float32Array);
        expect(Array.from(recovered.definition.inverseBindMatrices.slice(0, 16))).toEqual(
            Array.from(ibm.slice(0, 16)),
        );
        expect(recovered.definition.skeletonRoot).toBe('root');
    });
});
