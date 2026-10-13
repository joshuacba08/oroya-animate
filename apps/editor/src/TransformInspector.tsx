import { useEffect, useState } from 'react';
import { ComponentType, Material, type Vec3 } from '@joroya/core';
import { Euler, Quaternion } from 'three';
import { EditorController, captureTransform } from './EditorController';

function Field(props: { label: string; value: number; onCommit: (value: number) => void; min?: number; max?: number }) {
  const [text, setText] = useState(String(props.value));
  useEffect(() => setText(String(Number(props.value.toFixed(5)))), [props.value]);
  return <label style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>{props.label}
    <input aria-label={props.label} type="number" step="0.1" min={props.min} max={props.max} value={text} style={{ width: 105 }}
      onChange={(event) => setText(event.currentTarget.value)}
      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
      onBlur={() => { const value = Number(text); if (text.trim() && Number.isFinite(value) &&
        (props.min === undefined || value >= props.min) && (props.max === undefined || value <= props.max)) props.onCommit(value); else setText(String(props.value)); }} />
  </label>;
}

export function TransformInspector({ model, onError }: { model: EditorController; onError: (message: string) => void }) {
  const node = model.selected;
  if (!node) return <div style={{ padding: 14 }}>Select an object to edit.</div>;
  const transform = node.transform;
  const euler = new Euler().setFromQuaternion(new Quaternion(transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w), 'XYZ');
  const material = node.getComponent<Material>(ComponentType.Material);
  const possibleParents = [model.scene.root];
  model.scene.traverse((candidate) => {
    if (candidate === model.scene.root) return;
    let parent = candidate;
    while (parent.parent && parent !== node) parent = parent.parent;
    if (parent !== node) possibleParents.push(candidate);
  });
  const guard = (action: () => void) => { try { action(); onError(''); } catch (error) { onError(error instanceof Error ? error.message : String(error)); } };
  const color = material?.definition.color ?? { r: 1, g: 1, b: 1 };
  const hex = '#' + [color.r, color.g, color.b].map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, '0')).join('');
  return <div style={{ padding: 14 }} key={node.id}>
    <h2 style={{ fontSize: 15, marginTop: 0 }}>Inspector</h2>
    <label>Name <input key={node.id + node.name} aria-label="Node name" defaultValue={node.name} onBlur={(event) => model.rename(node, event.currentTarget.value)} /></label>
    <label style={{ display: 'block', marginTop: 10 }}>Parent <select aria-label="Parent node" value={node.parent?.id ?? ''} onChange={(event) => {
      const parent = model.scene.findNodeById(event.currentTarget.value); if (parent) guard(() => model.reparent(node, parent));
    }}>{possibleParents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label>
    {(['position', 'rotation', 'scale'] as const).map((channel) => <fieldset key={channel} style={{ marginTop: 12, border: '1px solid #454b57' }}>
      <legend>{channel === 'rotation' ? 'Rotation (degrees, XYZ)' : channel === 'position' ? 'Position' : 'Scale'}</legend>
      {(['x', 'y', 'z'] as const).map((axis) => <Field key={axis} label={(channel === 'rotation' ? 'Rotation' : channel === 'position' ? 'Position' : 'Scale') + ' ' + axis.toUpperCase()}
        value={channel === 'rotation' ? euler[axis] * 180 / Math.PI : transform[channel][axis]}
        onCommit={(value) => {
          const next = captureTransform(node);
          if (channel === 'rotation') {
            const angles = new Euler(euler.x, euler.y, euler.z, 'XYZ'); angles[axis] = value * Math.PI / 180;
            const q = new Quaternion().setFromEuler(angles); next.rotation = { x: q.x, y: q.y, z: q.z, w: q.w };
          } else (next[channel] as Vec3)[axis] = value;
          model.setTransform(node, next);
        }} />)}
    </fieldset>)}
    {material && <fieldset style={{ marginTop: 12, border: '1px solid #454b57' }}><legend>Material</legend>
      <label>Color <input aria-label="Material color" type="color" value={hex} onChange={(event) => {
        const value = event.currentTarget.value; model.setMaterial(node, { ...material.definition, color: { r: parseInt(value.slice(1, 3), 16) / 255, g: parseInt(value.slice(3, 5), 16) / 255, b: parseInt(value.slice(5, 7), 16) / 255 } });
      }} /></label>
      {(['opacity', 'metalness', 'roughness'] as const).map((key) => <Field key={key} label={'Material ' + key} value={material.definition[key] ?? (key === 'metalness' ? 0 : 1)} min={0} max={1}
        onCommit={(value) => model.setMaterial(node, { ...material.definition, [key]: value })} />)}
      <label><input aria-label="Double sided" type="checkbox" checked={material.definition.doubleSided ?? false} onChange={(event) => model.setMaterial(node, { ...material.definition, doubleSided: event.currentTarget.checked })} /> Double sided</label>
    </fieldset>}
    <p style={{ fontSize: 12 }}>Components: {Array.from(node.components.keys()).join(', ')}</p>
    <div style={{ display: 'flex', gap: 8 }}><button onClick={() => guard(() => { model.duplicate(); })}>Duplicate</button><button onClick={() => model.delete()}>Delete node</button></div>
  </div>;
}
