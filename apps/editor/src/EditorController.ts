import { Scene, Node, ComponentType, Material, serialize, deserialize, createBox, createSphere, createPlane, type Vec3, type Quat, type MaterialDef, type Diagnostic } from '@joroya/core';

export interface TransformSnapshot { position: Vec3; rotation: Quat; scale: Vec3; }
interface Command { label: string; redo(): void; undo(): void; }
interface SavedNode { id: string; name: string; components: unknown[]; children: SavedNode[]; }

export function captureTransform(node: Node): TransformSnapshot {
  return { position: { ...node.transform.position }, rotation: { ...node.transform.rotation }, scale: { ...node.transform.scale } };
}

function applyTransform(node: Node, value: TransformSnapshot): void {
  node.transform.setPosition(value.position); node.transform.setRotation(value.rotation); node.transform.setScale(value.scale);
}

/** Single source of truth for authored data, selection and reversible commands. */
export class EditorController {
  scene: Scene;
  selected: Node | null = null;
  private commands: Command[] = [];
  private cursor = 0;
  private savedCursor = 0;
  private revision = 0;
  private readonly listeners = new Set<() => void>();
  constructor(scene: Scene) { this.scene = scene; }
  get dirty(): boolean { return this.cursor !== this.savedCursor; }
  get canUndo(): boolean { return this.cursor > 0; }
  get canRedo(): boolean { return this.cursor < this.commands.length; }
  getSnapshot = (): number => this.revision;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private notify(): void { this.revision++; for (const listener of this.listeners) listener(); }
  select(node: Node | null): void { this.selected = node; this.notify(); }
  private record(command: Command): void {
    if (this.savedCursor > this.cursor) this.savedCursor = -1;
    this.commands.splice(this.cursor); this.commands.push(command); this.cursor++; this.notify();
  }
  private execute(command: Command): void { command.redo(); this.record(command); }
  undo(): void { if (!this.canUndo) return; this.commands[--this.cursor].undo(); this.selected = null; this.notify(); }
  redo(): void { if (!this.canRedo) return; this.commands[this.cursor++].redo(); this.selected = null; this.notify(); }
  markSaved(): void { this.savedCursor = this.cursor; this.notify(); }
  add(kind: 'group' | 'box' | 'sphere' | 'plane'): Node {
    const parent = this.selected ?? this.scene.root;
    const node = new Node(kind);
    if (kind !== 'group') {
      node.addComponent(kind === 'box' ? createBox() : kind === 'sphere' ? createSphere(0.5, 16, 16) : createPlane(2, 2));
      node.addComponent(new Material({ color: { r: 0.9, g: 0.5, b: 0.2 } }));
      node.transform.setPosition({ x: 0, y: 0.5, z: 0 });
    }
    this.execute({ label: 'Add ' + kind, redo: () => parent.add(node), undo: () => parent.remove(node) });
    this.select(node); return node;
  }
  delete(node = this.selected): void {
    if (!node?.parent || node === this.scene.root) return;
    const parent = node.parent; const index = parent.children.indexOf(node);
    this.execute({ label: 'Delete', redo: () => parent.remove(node), undo: () => { parent.add(node); parent.children.splice(parent.children.indexOf(node), 1); parent.children.splice(index, 0, node); } });
    this.select(null);
  }
  rename(node: Node, name: string): void {
    const previous = node.name; if (name === previous || !name.trim()) return;
    this.execute({ label: 'Rename', redo: () => { node.name = name; }, undo: () => { node.name = previous; } });
  }
  reparent(node: Node, parent: Node): void {
    if (node === this.scene.root || !node.parent || node.parent === parent) return;
    const previous = node.parent; const index = previous.children.indexOf(node);
    this.execute({ label: 'Reparent', redo: () => parent.add(node), undo: () => { previous.add(node); previous.children.splice(previous.children.indexOf(node), 1); previous.children.splice(index, 0, node); } });
  }
  duplicate(node = this.selected): Node | undefined {
    if (!node?.parent) return;
    const data = JSON.parse(serialize(this.scene)) as { root: SavedNode };
    const find = (value: SavedNode): SavedNode | undefined => value.id === node.id ? value : value.children.map(find).find(Boolean);
    const branch = find(data.root)!;
    const renew = (value: SavedNode) => { value.id = new Node(value.name).id; value.children.forEach(renew); };
    renew(branch); branch.name += ' copy';
    const copy = deserialize(JSON.stringify({ root: branch })).root; const parent = node.parent;
    this.execute({ label: 'Duplicate', redo: () => parent.add(copy), undo: () => parent.remove(copy) }); this.select(copy); return copy;
  }
  setTransform(node: Node, next: TransformSnapshot): void {
    this.recordTransform(node, captureTransform(node), next, false);
  }
  previewTransform(node: Node, next: TransformSnapshot): void { applyTransform(node, next); this.notify(); }
  recordTransform(node: Node, before: TransformSnapshot, after: TransformSnapshot, alreadyApplied = true): void {
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    const command = { label: 'Transform', redo: () => applyTransform(node, after), undo: () => applyTransform(node, before) };
    if (alreadyApplied) this.record(command); else this.execute(command);
  }
  setMaterial(node: Node, next: MaterialDef): void {
    const material = node.getComponent<Material>(ComponentType.Material);
    const previous = material ? structuredClone(material.definition) : undefined;
    const apply = (value: MaterialDef | undefined) => {
      const current = node.getComponent<Material>(ComponentType.Material);
      if (!value) node.removeComponent(ComponentType.Material);
      else if (current) current.definition = structuredClone(value);
      else node.addComponent(new Material(structuredClone(value)));
    };
    this.execute({ label: 'Material', redo: () => apply(next), undo: () => apply(previous) });
  }
  save(): { json: string; diagnostics: Diagnostic[] } {
    const diagnostics: Diagnostic[] = [];
    return { json: serialize(this.scene, { onDiagnostic: (value) => diagnostics.push(value) }), diagnostics };
  }
  load(json: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const loaded = deserialize(json, { onDiagnostic: (value) => diagnostics.push(value) });
    this.scene = loaded; this.selected = null; this.commands = []; this.cursor = 0; this.savedCursor = 0; this.notify();
    return diagnostics;
  }
}
