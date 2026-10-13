import { describe, expect, it } from 'vitest';
import { Node, Scene, Material, ComponentType, validateSceneJSON, serialize, deserialize, Geometry, GeometryPrimitive, type Diagnostic } from '../src';

describe('stable scene ownership and external data', () => {
  it('rejects cycles and duplicate identities before changing either tree', () => {
    const parent = new Node('parent', 'parent'); const child = new Node('child', 'child');
    parent.add(child);
    expect(() => child.add(parent)).toThrow('cycle');
    expect(() => parent.add(parent)).toThrow('cycle');
    expect(() => parent.add(new Node('copy', 'child'))).toThrow('Duplicate');
    expect(child.parent).toBe(parent);
    expect(parent.children).toEqual([child]);
    parent.add(child); expect(parent.children).toHaveLength(1);
  });
  it('detaches replaced components and prevents shared ownership or removing Transform', () => {
    const a = new Node(); const b = new Node(); const material = new Material({});
    a.addComponent(material);
    expect(() => b.addComponent(material)).toThrow('more than one');
    a.addComponent(new Material({ opacity: 0.2 }));
    expect(material.node).toBeNull(); b.addComponent(material);
    expect(b.removeComponent(ComponentType.Material)).toBe(true);
    expect(material.node).toBeNull();
    expect(() => a.removeComponent(ComponentType.Transform)).toThrow('Transform');
  });
  it('rejects malformed scenes and buffer encodings with precise paths', () => {
    expect(validateSceneJSON('{').valid).toBe(false);
    expect(() => deserialize('{"root":null}')).toThrow('Expected a node');
    const scene = new Scene(); scene.root.addComponent(new Geometry({ type: GeometryPrimitive.Buffer, positions: new Float32Array([0, 0, 0]), indices: new Uint16Array([0, 0, 2]) }));
    const result = validateSceneJSON(serialize(scene));
    expect(result.valid).toBe(false); expect(result.diagnostics[0].path).toContain('indices');
    expect(validateSceneJSON(serialize(scene).replace('AAAAAA', '%%%%%%')).valid).toBe(false);
  });
  it('accepts legacy omitted transforms and reports omitted components', () => {
    const diagnostics: Diagnostic[] = [];
    const scene = deserialize(JSON.stringify({ root: { id: 'root', name: 'root', children: [], components: [{ type: 'Script' }] } }), { onDiagnostic: (item) => diagnostics.push(item) });
    expect(scene.root.transform.node).toBe(scene.root);
    expect(diagnostics.some((item) => item.code === 'OMITTED_COMPONENT')).toBe(true);
  });
  it('validates numeric values and duplicate components/IDs', () => {
    const scene = JSON.parse(serialize(new Scene()));
    scene.root.components.push(scene.root.components[0]);
    expect(validateSceneJSON(scene).valid).toBe(false);
    scene.root.components.pop(); scene.root.components[0].position.x = Infinity;
    expect(validateSceneJSON(scene).valid).toBe(false);
    scene.root.components[0].position.x = 0;
    scene.root.children.push({ ...scene.root, children: [] });
    expect(validateSceneJSON(scene).valid).toBe(false);
  });
});
