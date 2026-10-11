import { describe, expect, it } from 'vitest';
import { Scene, Node, Animator, ComponentType, Geometry, GeometryPrimitive, serialize, deserialize, Transform, Animation } from '../src';

describe('persistence and transforms', () => {
  it.each(['bound', 'playing', 'paused'])('serializes a %s Animator without runtime references', (state) => {
    const scene = new Scene();
    const node = new Node('target');
    scene.add(node);
    const animator = new Animator({ animations: { idle: { name: 'idle', duration: 1, tracks: [] } } });
    scene.root.addComponent(animator);
    animator.bindToScene(scene);
    if (state !== 'bound') animator.play('idle');
    if (state === 'paused') animator.pause();
    const json = serialize(scene);
    expect(json).not.toContain('mixer');
    expect(json).not.toContain('pendingAutoplay');
    const recovered = deserialize(json).root.getComponent<Animator>(ComponentType.Animator)!;
    expect(recovered.definition.animations.idle.name).toBe('idle');
    expect(recovered.currentMixer).toBeNull();
  });


  it('excludes node references, callbacks, backend instances and cycles in event data', () => {
    const scene = new Scene();
    class Backend { toJSON() { throw new Error('Backend must not be visited'); } }
    const data: Record<string, unknown> = { label: 'kept', node: scene.root, callback: () => {}, backend: new Backend() };
    data.cycle = data;
    const animator = new Animator({ animations: { idle: { name: 'idle', duration: 1, tracks: [], events: [{ time: 0, name: 'event', data }] } } });
    scene.root.addComponent(animator); animator.bindToScene(scene);
    const json = serialize(scene);
    expect(json).toContain('kept'); expect(json).not.toContain('backend');
    expect(json).not.toContain('callback'); expect(json).not.toContain('cycle');
  });

  it('preserves complete root identity, metadata, components and typed buffers', () => {
    const root = new Node('custom', 'fixed-id');
    root.cssClass = 'root-class'; root.cssId = 'root-css';
    root.transform.setPosition({ x: 10, y: 0, z: 0 });
    root.addComponent(new Geometry({ type: GeometryPrimitive.Buffer, positions: new Float32Array([1, 2, 3]), indices: new Uint32Array([0]) }));
    root.addComponent(new Animation([]));
    root.add(new Node('child'));
    const copy = deserialize(serialize(new Scene(root)));
    expect(copy.root.id).toBe(root.id);
    expect(copy.root.name).toBe(root.name);
    expect(copy.root.cssClass).toBe(root.cssClass);
    expect(copy.root.cssId).toBe(root.cssId);
    copy.updateWorldMatrices();
    expect(copy.root.children[0].transform.worldMatrix[12]).toBe(10);
    const def = copy.root.getComponent<Geometry>(ComponentType.Geometry)!.definition;
    expect(def.type).toBe(GeometryPrimitive.Buffer);
    if (def.type === GeometryPrimitive.Buffer) {
      expect(def.positions).toBeInstanceOf(Float32Array);
      expect(def.indices).toBeInstanceOf(Uint32Array);
    }
  });

  it('ignores legacy cached fields and supplies an omitted Transform', () => {
    const copy = deserialize(JSON.stringify({ root: { id: 'old', name: 'old', children: [
      { id: 'child', name: 'child', children: [], components: [] }
    ], components: [{ type: ComponentType.Transform, position: { x: 4, y: 0, z: 0 }, isDirty: false, worldMatrix: [], node: { old: true } }] } }));
    copy.updateWorldMatrices();
    expect(copy.root.children[0].transform.worldMatrix[12]).toBe(4);
    expect(copy.root.transform.node).toBe(copy.root);
  });

  it('rejects a root with a parent', () => {
    const child = new Node(); new Node().add(child);
    expect(() => new Scene(child)).toThrow('parent');
  });

  it('copies setter values and invalidates each transform channel', () => {
    const node = new Node();
    node.updateWorldMatrix();
    const position = { x: 7, y: 2, z: 3 };
    expect(node.transform.setPosition(position)).toBeUndefined();
    position.x = 99;
    node.transform.setRotation({ x: 0, y: 0, z: 0, w: 1 });
    node.transform.setScale({ x: 2, y: 3, z: 4 });
    node.updateWorldMatrix();
    expect(node.transform.worldMatrix[12]).toBe(7);
    expect(node.transform.worldMatrix[0]).toBe(2);
    expect(node.transform.worldMatrix[5]).toBe(3);
    expect(node.transform.worldMatrix[10]).toBe(4);
    expect(node.transform).toBeInstanceOf(Transform);
  });

  it('retains explicit refresh semantics of direct property writes', () => {
    const node = new Node(); node.updateWorldMatrix();
    node.transform.position.x = 7; node.updateWorldMatrix();
    expect(node.transform.worldMatrix[12]).toBe(0);
    node.transform.updateLocalMatrix(); node.updateWorldMatrix();
    expect(node.transform.worldMatrix[12]).toBe(7);
  });
});
