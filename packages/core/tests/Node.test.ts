import { describe, it, expect } from 'vitest';
import { Node } from '../src/nodes/Node';
import { Scene } from '../src/scene/Scene';
import { serialize, deserialize } from '../src/serialization/json';

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
});
