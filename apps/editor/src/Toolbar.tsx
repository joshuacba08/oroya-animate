import { useRef } from 'react';

export function Toolbar(props: {
  onAdd: (kind: 'group' | 'box' | 'sphere' | 'plane') => void;
  onSave: () => void; onLoad: (file: File) => Promise<void>;
  onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean; dirty: boolean; busy: boolean;
  mode: 'translate' | 'rotate' | 'scale'; onMode: (mode: 'translate' | 'rotate' | 'scale') => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  return <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: 10, borderBottom: '1px solid #383c46' }}>
    <strong>Oroya Editor</strong><span aria-label="Save status">{props.dirty ? 'Unsaved changes' : 'Saved'}</span>
    <select aria-label="Add object" defaultValue="" onChange={(event) => {
      const kind = event.currentTarget.value;
      if (kind === 'group' || kind === 'box' || kind === 'sphere' || kind === 'plane') props.onAdd(kind);
      event.currentTarget.value = '';
    }}><option value="" disabled>Add object…</option><option value="group">Group</option><option value="box">Box</option><option value="sphere">Sphere</option><option value="plane">Plane</option></select>
    <button onClick={props.onUndo} disabled={!props.canUndo}>Undo</button>
    <button onClick={props.onRedo} disabled={!props.canRedo}>Redo</button>
    <select aria-label="Gizmo mode" value={props.mode} onChange={(event) => {
      const value = event.currentTarget.value; if (value === 'translate' || value === 'rotate' || value === 'scale') props.onMode(value);
    }}><option value="translate">Move (W)</option><option value="rotate">Rotate (E)</option><option value="scale">Scale (R)</option></select>
    <span style={{ flex: 1 }} />
    <button onClick={props.onSave} disabled={props.busy}>Save</button>
    <button onClick={() => file.current?.click()} disabled={props.busy}>{props.busy ? 'Loading…' : 'Load'}</button>
    <input ref={file} aria-label="Load scene file" type="file" accept=".json,application/json" hidden onChange={(event) => {
      const selected = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (selected) void props.onLoad(selected);
    }} />
  </div>;
}
