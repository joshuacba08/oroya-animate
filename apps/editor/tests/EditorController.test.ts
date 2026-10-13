import { describe, expect, it } from 'vitest';
import { Node, Scene, Material, ComponentType, serialize } from '@joroya/core';
import { EditorController, captureTransform } from '../src/EditorController';

describe('complete reversible editor workflow', () => {
  it('creates, edits, undoes/redoes and saves/loads the current scene', () => {
    const model = new EditorController(new Scene());
    const node = model.add('box'); model.rename(node, 'saved-box');
    const transform = captureTransform(node); transform.position.x = 4; model.setTransform(node, transform);
    model.setMaterial(node, { color: { r: 0.2, g: 0.3, b: 0.4 }, opacity: 0.5 });
    model.undo(); expect(node.getComponent<Material>(ComponentType.Material)!.definition.opacity).toBeUndefined();
    model.redo(); model.markSaved(); expect(model.dirty).toBe(false);
    const saved = model.save().json; model.add('sphere'); model.load(saved);
    expect(model.scene.findNodeByName('saved-box')!.transform.position.x).toBe(4);
    expect(model.scene.root.children).toHaveLength(1); expect(model.canUndo).toBe(false); expect(model.selected).toBeNull();
  });
  it('retains authored data and history after invalid load or reparent', () => {
    const model = new EditorController(new Scene()); const parent = model.add('group'); const child = model.add('box');
    const previous = model.scene; const json = serialize(previous);
    expect(() => model.load('{')).toThrow(); expect(model.scene).toBe(previous); expect(serialize(previous)).toBe(json);
    expect(() => model.reparent(parent, child)).toThrow('cycle'); expect(parent.parent).toBe(previous.root);
    model.reparent(child, previous.root); model.undo(); expect(child.parent).toBe(parent);
  });
  it('duplicates with fresh IDs and treats an entire drag as one command', () => {
    const model = new EditorController(new Scene()); const node = model.add('box');
    const before = captureTransform(node);
    for (let i = 1; i <= 10; i++) { const next = captureTransform(node); next.position.x = i; model.previewTransform(node, next); }
    model.recordTransform(node, before, captureTransform(node)); model.undo(); expect(node.transform.position.x).toBe(0);
    model.redo(); expect(node.transform.position.x).toBe(10);
    const copy = model.duplicate(node)!; expect(copy.id).not.toBe(node.id); expect(copy.transform.position.x).toBe(10);
    expect(model.scene.root.children).toHaveLength(2);
  });
  it('invalidates the saved history position after branching', () => {
    const model = new EditorController(new Scene()); const node = model.add('group'); model.rename(node, 'a'); model.markSaved();
    model.undo(); model.rename(node, 'b'); expect(model.dirty).toBe(true);
  });
});
