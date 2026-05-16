import type { Node as OroyaNode, Vec3 } from '@joroya/core';

/**
 * Right-side panel: shows the selected node's transform with editable
 * number inputs for every axis. Edits dispatch through `onChange` —
 * the parent applies them to `node.transform` and bumps a revision so
 * the panels re-render with the new values.
 *
 * Rotation is displayed as a quaternion (x, y, z, w) for fidelity with
 * what the engine actually stores. A future iteration will offer
 * Euler-angle editing as a UI mode toggle.
 */
export function TransformInspector(props: {
    node: OroyaNode | null;
    onChange: (axis: 'position' | 'rotation' | 'scale', component: keyof Vec3 | 'w', value: number) => void;
    onDelete: () => void;
}) {
    if (!props.node) {
        return (
            <div style={{ padding: '12px', color: '#666' }}>
                <div style={headerStyle}>Inspector</div>
                <div style={{ fontSize: '12px', padding: '8px 0' }}>
                    Select a node from the hierarchy to edit its transform.
                </div>
            </div>
        );
    }

    const t = props.node.transform;

    return (
        <div style={{ padding: '0' }}>
            <div style={headerStyle}>Inspector</div>
            <div style={subheaderStyle}>{props.node.name}</div>

            <Section title="Position">
                <AxisRow label="X" value={t.position.x} onChange={(v) => props.onChange('position', 'x', v)} />
                <AxisRow label="Y" value={t.position.y} onChange={(v) => props.onChange('position', 'y', v)} />
                <AxisRow label="Z" value={t.position.z} onChange={(v) => props.onChange('position', 'z', v)} />
            </Section>

            <Section title="Rotation (quaternion)">
                <AxisRow label="X" value={t.rotation.x} step={0.01} onChange={(v) => props.onChange('rotation', 'x', v)} />
                <AxisRow label="Y" value={t.rotation.y} step={0.01} onChange={(v) => props.onChange('rotation', 'y', v)} />
                <AxisRow label="Z" value={t.rotation.z} step={0.01} onChange={(v) => props.onChange('rotation', 'z', v)} />
                <AxisRow label="W" value={t.rotation.w} step={0.01} onChange={(v) => props.onChange('rotation', 'w', v)} />
            </Section>

            <Section title="Scale">
                <AxisRow label="X" value={t.scale.x} onChange={(v) => props.onChange('scale', 'x', v)} />
                <AxisRow label="Y" value={t.scale.y} onChange={(v) => props.onChange('scale', 'y', v)} />
                <AxisRow label="Z" value={t.scale.z} onChange={(v) => props.onChange('scale', 'z', v)} />
            </Section>

            <Section title="Components">
                <div style={{ fontSize: '12px', fontFamily: 'monospace', padding: '4px 0', color: '#bbb' }}>
                    {Array.from(props.node.components.keys()).join(', ')}
                </div>
            </Section>

            <button onClick={props.onDelete} style={deleteButtonStyle}>
                Delete node
            </button>
        </div>
    );
}

function Section(props: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: '6px 12px', borderBottom: '1px solid #2a2a2a' }}>
            <div style={sectionTitleStyle}>{props.title}</div>
            {props.children}
        </div>
    );
}

function AxisRow(props: { label: string; value: number; step?: number; onChange: (v: number) => void }) {
    return (
        <label style={axisRowStyle}>
            <span style={{ width: '14px', color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>{props.label}</span>
            <input
                type="number"
                value={Number(props.value.toFixed(4))}
                step={props.step ?? 0.1}
                onChange={(e) => {
                    const v = Number(e.currentTarget.value);
                    if (!Number.isNaN(v)) props.onChange(v);
                }}
                style={inputStyle}
            />
        </label>
    );
}

const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#888',
    borderBottom: '1px solid #2a2a2a',
};

const subheaderStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#ddd',
    borderBottom: '1px solid #2a2a2a',
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#666',
    marginBottom: '4px',
};

const axisRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '2px 0',
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    background: '#1a1a1a',
    border: '1px solid #333',
    color: '#ddd',
    padding: '3px 6px',
    fontFamily: 'monospace',
    fontSize: '12px',
    borderRadius: '2px',
};

const deleteButtonStyle: React.CSSProperties = {
    margin: '12px',
    padding: '6px 12px',
    background: '#5a1a1a',
    border: '1px solid #722',
    color: '#fee',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '3px',
};
