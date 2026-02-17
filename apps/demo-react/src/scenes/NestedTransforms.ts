import { Scene, Node, createBox, createSphere, Material, Camera, CameraType } from '@joroya/core';
import type { ControlDef, ParamValues } from '../types';

export const nestedTransformsControls: ControlDef[] = [
    { type: 'slider', key: 'speed', label: 'Velocidad', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
    { type: 'slider', key: 'depth', label: 'Profundidad', min: 2, max: 5, step: 1, defaultValue: 3, rebuild: true },
];

/**
 * Demo to verify nested transform composition in SVG renderer.
 * 
 * Creates a hierarchy of rotating nodes:
 * - Parent rotates around center
 * - Child rotates relative to parent
 * - Grandchild rotates relative to child
 * - etc.
 * 
 * If transforms compose correctly, each level should rotate independently
 * while maintaining the parent-child relationship.
 */
export function createNestedTransformsScene(params: ParamValues) {
    const scene = new Scene();
    const depth = params.depth as number;

    // ── Camera ──────────────────────────────────────────────────────────
    const cameraNode = new Node('camera');
    cameraNode.addComponent(new Camera({
        type: CameraType.Orthographic,
        left: -10,
        right: 10,
        top: -10,
        bottom: 10,
        near: 0.1,
        far: 100,
    }));
    cameraNode.transform.position = { x: 0, y: 0, z: 5 };
    scene.add(cameraNode);

    // ── Nested hierarchy ────────────────────────────────────────────────
    const colors = [
        { r: 0.9, g: 0.3, b: 0.3 },  // Red
        { r: 0.3, g: 0.7, b: 0.9 },  // Blue
        { r: 0.3, g: 0.9, b: 0.4 },  // Green
        { r: 0.9, g: 0.7, b: 0.2 },  // Yellow
        { r: 0.8, g: 0.3, b: 0.8 },  // Purple
    ];

    let currentParent: Node = scene.root;
    const nodes: Node[] = [];

    for (let i = 0; i < depth; i++) {
        const size = 2 - (i * 0.3);
        const offset = 3 - (i * 0.5);

        // Create node with box geometry
        const node = new Node(`level-${i}`);
        node.addComponent(createBox(size, size, 0.1));
        node.addComponent(new Material({
            fill: colors[i % colors.length],
            stroke: { r: 0.1, g: 0.1, b: 0.1 },
            strokeWidth: 0.1,
            opacity: 0.8,
        }));

        // Position relative to parent
        node.transform.position = { x: offset, y: 0, z: 0 };

        // Add to parent
        currentParent.add(node);
        nodes.push(node);

        // This node becomes the parent for the next level
        currentParent = node;

        // Add a small sphere at the pivot point to visualize rotation center
        const pivot = new Node(`pivot-${i}`);
        pivot.addComponent(createSphere(0.2, 12, 12));
        pivot.addComponent(new Material({
            fill: { r: 0.2, g: 0.2, b: 0.2 },
            opacity: 0.9,
        }));
        node.add(pivot);
    }

    // ── Animation ───────────────────────────────────────────────────────
    function animate(time: number, p: ParamValues) {
        const speed = p.speed as number;

        // Each level rotates at a different speed
        nodes.forEach((node, i) => {
            const rotationSpeed = speed * (1 + i * 0.3);
            const angle = time * rotationSpeed + (i * Math.PI / 4);

            // Rotation around Z axis (2D rotation in SVG)
            const s = Math.sin(angle / 2);
            const c = Math.cos(angle / 2);
            node.transform.rotation = { x: 0, y: 0, z: s, w: c };

            node.transform.updateLocalMatrix();
        });
    }

    return { scene, animate };
}
