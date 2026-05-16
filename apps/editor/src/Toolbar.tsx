import { useRef } from 'react';

/**
 * Top toolbar — Add Cube, Save, Load.
 *
 * `Save` triggers a browser-side JSON download (no server). `Load` opens
 * a file picker; the chosen `.json` is parsed by `deserialize()` and
 * replaces the current scene.
 */
export function Toolbar(props: {
    onAddCube: () => void;
    onSave: () => void;
    onLoad: (file: File) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <div style={toolbarStyle}>
            <span style={titleStyle}>Oroya Editor <span style={{ color: '#666', fontSize: '10px' }}>(alpha)</span></span>
            <div style={{ flex: 1 }} />
            <button onClick={props.onAddCube} style={buttonStyle}>+ Cube</button>
            <button onClick={props.onSave} style={buttonStyle}>Save</button>
            <button onClick={() => fileRef.current?.click()} style={buttonStyle}>Load</button>
            <input
                ref={fileRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (f) props.onLoad(f);
                    e.currentTarget.value = ''; // allow reselecting the same file
                }}
            />
        </div>
    );
}

const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderBottom: '1px solid #333',
    background: '#1a1a1a',
};

const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ddd',
};

const buttonStyle: React.CSSProperties = {
    padding: '4px 12px',
    background: '#2a2a2a',
    border: '1px solid #444',
    color: '#ddd',
    fontSize: '12px',
    cursor: 'pointer',
    borderRadius: '3px',
};
