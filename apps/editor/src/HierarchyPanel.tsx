import type { Node as OroyaNode, Scene } from '@joroya/core';

/**
 * Vertical list of every node in the scene graph, indented by depth.
 * Click a row to select that node in the right-side inspector.
 *
 * `revision` is a bump counter — when it changes, the panel re-renders
 * the tree from scratch. We render from `scene.root.children` directly
 * (React doesn't observe the Oroya tree), so this is how the editor's
 * scene mutations (add cube, delete, load) reach the panel.
 */
export function HierarchyPanel(props: {
    scene: Scene;
    selected: OroyaNode | null;
    onSelect: (node: OroyaNode | null) => void;
    revision: number;
}) {
    const rows: { node: OroyaNode; depth: number }[] = [];
    const collect = (node: OroyaNode, depth: number) => {
        rows.push({ node, depth });
        for (const child of node.children) collect(child, depth + 1);
    };
    for (const child of props.scene.root.children) collect(child, 0);

    return (
        <div style={{ padding: '8px 0' }}>
            <div style={headerStyle}>Hierarchy</div>
            {rows.map(({ node, depth }) => (
                <button
                    key={node.id}
                    onClick={() => props.onSelect(node)}
                    style={{
                        ...rowStyle,
                        paddingLeft: `${8 + depth * 12}px`,
                        background: node === props.selected ? '#2d4a8a' : 'transparent',
                        color: node === props.selected ? '#fff' : '#bbb',
                    }}
                >
                    {node.name}
                </button>
            ))}
            {rows.length === 0 && (
                <div style={{ padding: '8px 12px', color: '#666', fontStyle: 'italic' }}>
                    (empty scene)
                </div>
            )}
            {/* The revision prop is read solely to invalidate React's memo: */}
            <span hidden>{props.revision}</span>
        </div>
    );
}

const headerStyle: React.CSSProperties = {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#888',
};

const rowStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '4px 12px',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '12px',
    cursor: 'pointer',
};
