import { describe, expect, it } from 'vitest';
import { Node } from '../src/nodes/Node';
import { Scene } from '../src/scene/Scene';
import { deserialize, serialize } from '../src/serialization/json';
import { Camera, CameraType } from '../src/components/Camera';
import { Animation } from '../src/components/Animation';

describe('Node', () => {
  it('should create a node with a name and default transform', () => {
    const node = new Node('test-node');
    expect(node.name).toBe('test-node');
    expect(node.transform).toBeDefined();
    expect(node.transform.position).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should add and remove child nodes', () => {
    const parent = new Node('parent');
    const child = new Node('child');
    parent.add(child);
    expect(parent.children.length).toBe(1);
    expect(child.parent).toBe(parent);

    parent.remove(child);
    expect(parent.children.length).toBe(0);
    expect(child.parent).toBe(null);
  });
});

describe('Scene Serialization', () => {
    it('should serialize and deserialize a simple scene', () => {
        const scene = new Scene();
        const node = new Node('my-node');
        scene.add(node);

        const json = serialize(scene);
        const newScene = deserialize(json);

        const foundNode = newScene.findNodeByName('my-node');
        expect(foundNode).toBeDefined();
        expect(foundNode?.id).toBe(node.id);
        expect(foundNode?.transform.scale).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('should serialize and deserialize Camera component', () => {
        const scene = new Scene();
        const camNode = new Node('cam');
        camNode.addComponent(new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect: 1.5,
            near: 0.1,
            far: 500,
        }));
        scene.add(camNode);

        const json = serialize(scene);
        const newScene = deserialize(json);

        const found = newScene.findNodeByName('cam');
        expect(found).toBeDefined();
        const cam = found!.getComponent<Camera>(
            'Camera' as any
        );
        expect(cam).toBeDefined();
        expect(cam!.definition.type).toBe(CameraType.Perspective);
        expect((cam!.definition as any).fov).toBe(60);
    });

    it('should serialize and deserialize OrthographicCameraDef', () => {
        const scene = new Scene();
        const camNode = new Node('ortho-cam');
        camNode.addComponent(new Camera({
            type: CameraType.Orthographic,
            left: -100, right: 100,
            top: -75, bottom: 75,
            near: 0.1, far: 1000,
        }));
        scene.add(camNode);

        const json = serialize(scene);
        const newScene = deserialize(json);

        const found = newScene.findNodeByName('ortho-cam');
        const cam = found!.getComponent<Camera>('Camera' as any);
        expect(cam).toBeDefined();
        expect(cam!.definition.type).toBe(CameraType.Orthographic);
        expect((cam!.definition as any).left).toBe(-100);
        expect((cam!.definition as any).right).toBe(100);
    });

    it('should serialize and deserialize Animation component', () => {
        const scene = new Scene();
        const node = new Node('animated');
        node.addComponent(new Animation([
            { type: 'animate', attributeName: 'opacity', from: '0', to: '1', dur: '2s' },
        ]));
        scene.add(node);

        const json = serialize(scene);
        const newScene = deserialize(json);

        const found = newScene.findNodeByName('animated');
        const anim = found!.getComponent<Animation>('Animation' as any);
        expect(anim).toBeDefined();
        expect(anim!.animations.length).toBe(1);
        expect(anim!.animations[0].type).toBe('animate');
        expect((anim!.animations[0] as any).attributeName).toBe('opacity');
    });

    it('should serialize and deserialize cssClass and cssId', () => {
        const scene = new Scene();
        const node = new Node('styled');
        node.cssClass = 'highlight active';
        node.cssId = 'main-element';
        scene.add(node);

        const json = serialize(scene);
        const newScene = deserialize(json);

        const found = newScene.findNodeByName('styled');
        expect(found).toBeDefined();
        expect(found!.cssClass).toBe('highlight active');
        expect(found!.cssId).toBe('main-element');
    });
});
