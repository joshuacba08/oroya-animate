import { describe, expect, it } from 'vitest';
import { Scene } from '../src/scene/Scene';
import { Node } from '../src/nodes/Node';
import { serialize, deserialize } from '../src/serialization/json';
import { typedArrayReplacer, typedArrayReviver } from '../src/serialization/typedArrays';
import {
    Animator,
    AudioListener,
    AudioSource,
    Collider,
    ColliderShape,
    Environment,
    FogType,
    Geometry,
    GeometryPrimitive,
    Light,
    LightType,
    Material,
    ParticleSystem,
    PostProcessing,
    RigidBody,
    RigidBodyType,
    ToneMapping,
    ComponentType,
    type BufferGeometryDef,
    type AnimationClip,
} from '../src/components';

describe('TypedArray replacer/reviver', () => {
    it('round-trips Float32Array through JSON', () => {
        const f = new Float32Array([0.1, 1.5, -3.25, 100.0]);
        const json = JSON.stringify({ f }, typedArrayReplacer);
        const parsed = JSON.parse(json, typedArrayReviver);
        expect(parsed.f).toBeInstanceOf(Float32Array);
        expect(Array.from(parsed.f)).toEqual([
            // Float32 rounds 0.1 — the round-trip is bit-stable, not decimal-stable.
            Math.fround(0.1),
            1.5,
            -3.25,
            100.0,
        ]);
    });

    it('round-trips Uint16Array (used for triangle indices)', () => {
        const u = new Uint16Array([0, 1, 2, 3, 65535]);
        const parsed = JSON.parse(JSON.stringify({ u }, typedArrayReplacer), typedArrayReviver);
        expect(parsed.u).toBeInstanceOf(Uint16Array);
        expect(Array.from(parsed.u)).toEqual([0, 1, 2, 3, 65535]);
    });

    it('round-trips Uint8Array and Uint32Array', () => {
        const u8 = new Uint8Array([0, 127, 255]);
        const u32 = new Uint32Array([0, 1 << 20, 0xffffffff]);
        const parsed = JSON.parse(
            JSON.stringify({ u8, u32 }, typedArrayReplacer),
            typedArrayReviver,
        );
        expect(parsed.u8).toBeInstanceOf(Uint8Array);
        expect(Array.from(parsed.u8)).toEqual([0, 127, 255]);
        expect(parsed.u32).toBeInstanceOf(Uint32Array);
        expect(Array.from(parsed.u32)).toEqual([0, 1 << 20, 0xffffffff]);
    });

    it('leaves regular arrays and objects unchanged', () => {
        const obj = { a: [1, 2, 3], b: { c: 'hello' } };
        const parsed = JSON.parse(JSON.stringify(obj, typedArrayReplacer), typedArrayReviver);
        expect(parsed).toEqual(obj);
    });
});

describe('Scene serialization — newly covered components', () => {
    it('round-trips RigidBody + Collider', () => {
        const scene = new Scene();
        const node = new Node('cube');
        node.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 2.5, linearDamping: 0.05 }));
        node.addComponent(new Collider({
            shape: ColliderShape.Box,
            halfExtents: { x: 1, y: 0.5, z: 1 },
            friction: 0.4,
            restitution: 0.6,
            isTrigger: true,
            collisionGroup: 2,
            collisionMask: 7,
        }));
        scene.add(node);

        const round = deserialize(serialize(scene));
        const recovered = round.findNodeByName('cube')!;
        const rb = recovered.getComponent<RigidBody>(ComponentType.RigidBody)!;
        const col = recovered.getComponent<Collider>(ComponentType.Collider)!;
        expect(rb.definition.type).toBe(RigidBodyType.Dynamic);
        expect(rb.definition.mass).toBe(2.5);
        expect(rb.definition.linearDamping).toBe(0.05);
        expect(col.definition.shape).toBe(ColliderShape.Box);
        expect(col.definition.halfExtents).toEqual({ x: 1, y: 0.5, z: 1 });
        expect(col.definition.isTrigger).toBe(true);
        expect(col.definition.collisionGroup).toBe(2);
    });

    it('round-trips Light, Environment, PostProcessing, ParticleSystem', () => {
        const scene = new Scene();
        const lightNode = new Node('sun');
        lightNode.addComponent(new Light({
            type: LightType.Directional,
            color: { r: 1, g: 0.9, b: 0.8 },
            intensity: 1.5,
            castShadow: true,
            shadowMapSize: 2048,
        }));
        scene.add(lightNode);

        const envNode = new Node('env');
        envNode.addComponent(new Environment({
            background: { r: 0.05, g: 0.05, b: 0.1 },
            fog: { type: FogType.Linear, color: { r: 0.1, g: 0.1, b: 0.2 }, near: 10, far: 100 },
        }));
        scene.add(envNode);

        const camNode = new Node('camera');
        camNode.addComponent(new PostProcessing({
            bloom: { enabled: true, threshold: 0.7, strength: 1.2, radius: 0.5 },
            toneMapping: ToneMapping.ACESFilmic,
            exposure: 1.1,
            antialiasing: true,
        }));
        scene.add(camNode);

        const emitterNode = new Node('emitter');
        emitterNode.addComponent(new ParticleSystem({
            maxParticles: 500,
            emissionRate: 30,
            gravity: { x: 0, y: -2, z: 0 },
            startColor: { r: 1, g: 0.5, b: 0 },
            endColor: { r: 1, g: 0, b: 0 },
        }));
        scene.add(emitterNode);

        const round = deserialize(serialize(scene));
        const light = round.findNodeByName('sun')!.getComponent<Light>(ComponentType.Light)!;
        const env = round.findNodeByName('env')!.getComponent<Environment>(ComponentType.Environment)!;
        const pp = round.findNodeByName('camera')!.getComponent<PostProcessing>(ComponentType.PostProcessing)!;
        const ps = round.findNodeByName('emitter')!.getComponent<ParticleSystem>(ComponentType.ParticleSystem)!;

        expect(light.definition.type).toBe(LightType.Directional);
        expect((light.definition as { shadowMapSize?: number }).shadowMapSize).toBe(2048);
        expect((env.definition.fog as { near: number }).near).toBe(10);
        expect(pp.definition.toneMapping).toBe(ToneMapping.ACESFilmic);
        expect(pp.definition.antialiasing).toBe(true);
        expect(ps.definition.maxParticles).toBe(500);
        expect(ps.definition.gravity).toEqual({ x: 0, y: -2, z: 0 });
    });

    it('round-trips Audio components', () => {
        const scene = new Scene();
        const camNode = new Node('camera');
        camNode.addComponent(new AudioListener({ masterVolume: 0.75 }));
        scene.add(camNode);

        const sourceNode = new Node('speaker');
        sourceNode.addComponent(new AudioSource({
            url: '/sfx/loop.mp3',
            loop: true,
            volume: 0.5,
            refDistance: 3,
            distanceModel: 'inverse',
        }));
        scene.add(sourceNode);

        const round = deserialize(serialize(scene));
        const listener = round.findNodeByName('camera')!.getComponent<AudioListener>(ComponentType.AudioListener)!;
        const source = round.findNodeByName('speaker')!.getComponent<AudioSource>(ComponentType.AudioSource)!;
        expect(listener.definition.masterVolume).toBe(0.75);
        expect(source.definition.url).toBe('/sfx/loop.mp3');
        expect(source.definition.loop).toBe(true);
        expect(source.definition.refDistance).toBe(3);
    });

    it('round-trips Animator including its clip library with Float32Array tracks', () => {
        const scene = new Scene();
        const clip: AnimationClip = {
            name: 'walk',
            duration: 1.0,
            tracks: [{
                targetNodeName: 'hero',
                property: 'position',
                times: new Float32Array([0, 0.5, 1.0]),
                values: new Float32Array([0, 0, 0,  0, 1, 0,  0, 0, 0]),
                interpolation: 'linear',
            }],
            events: [{ time: 0.25, name: 'footstep' }],
        };
        const host = new Node('host');
        host.addComponent(new Animator({ animations: { walk: clip }, autoplay: 'walk' }));
        scene.add(host);

        const round = deserialize(serialize(scene));
        const animator = round.findNodeByName('host')!.getComponent<Animator>(ComponentType.Animator)!;
        const recoveredClip = animator.definition.animations.walk;
        expect(recoveredClip.duration).toBe(1.0);
        expect(recoveredClip.tracks).toHaveLength(1);
        expect(recoveredClip.tracks[0].times).toBeInstanceOf(Float32Array);
        expect(Array.from(recoveredClip.tracks[0].times)).toEqual([0, 0.5, 1.0]);
        expect(Array.from(recoveredClip.tracks[0].values)).toEqual([0, 0, 0, 0, 1, 0, 0, 0, 0]);
        expect(recoveredClip.events).toEqual([{ time: 0.25, name: 'footstep' }]);
    });

    it('round-trips a BufferGeometry mesh through Float32Array + Uint16Array', () => {
        const scene = new Scene();
        const meshDef: BufferGeometryDef = {
            type: GeometryPrimitive.Buffer,
            positions: new Float32Array([0, 0, 0,  1, 0, 0,  0, 1, 0]),
            normals: new Float32Array([0, 0, 1,  0, 0, 1,  0, 0, 1]),
            uvs: new Float32Array([0, 0,  1, 0,  0, 1]),
            indices: new Uint16Array([0, 1, 2]),
            castShadow: true,
        };
        const node = new Node('mesh');
        node.addComponent(new Geometry(meshDef));
        node.addComponent(new Material({ color: { r: 0.5, g: 0.5, b: 0.5 } }));
        scene.add(node);

        const round = deserialize(serialize(scene));
        const def = round.findNodeByName('mesh')!.getComponent<Geometry>(ComponentType.Geometry)!.definition as BufferGeometryDef;
        expect(def.type).toBe(GeometryPrimitive.Buffer);
        expect(def.positions).toBeInstanceOf(Float32Array);
        expect(Array.from(def.positions)).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(def.indices).toBeInstanceOf(Uint16Array);
        expect(Array.from(def.indices!)).toEqual([0, 1, 2]);
    });
});
