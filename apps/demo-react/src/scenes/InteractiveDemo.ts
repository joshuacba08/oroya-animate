import {
    Scene, Node, createBox, createSphere, Material, Camera, CameraType,
    Interactive,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

export const interactiveDemoControls: ControlDef[] = [
    { type: 'slider', key: 'speed', label: 'Velocidad', min: 0, max: 2, step: 0.1, defaultValue: 0.5 },
];

export function createInteractiveDemoScene(_params: ParamValues) {
    const scene = new Scene();

    // ── Camera ───────────────────────────────────────────────
    const cameraNode = new Node('camera');
    cameraNode.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 60,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100,
    }));
    cameraNode.transform.position = { x: 0, y: 2, z: 8 };
    scene.add(cameraNode);

    // ── Interactive objects ───────────────────────────────────

    const colors = [
        { r: 0.95, g: 0.26, b: 0.21 }, // Red
        { r: 0.30, g: 0.69, b: 0.31 }, // Green
        { r: 0.13, g: 0.59, b: 0.95 }, // Blue
        { r: 1.00, g: 0.76, b: 0.03 }, // Yellow
        { r: 0.61, g: 0.15, b: 0.69 }, // Purple
    ];

    const highlightColors = [
        { r: 1.00, g: 0.54, b: 0.50 },
        { r: 0.56, g: 0.83, b: 0.56 },
        { r: 0.42, g: 0.74, b: 0.98 },
        { r: 1.00, g: 0.88, b: 0.38 },
        { r: 0.78, g: 0.44, b: 0.84 },
    ];

    interface InteractiveNode {
        node: Node;
        material: Material;
        baseColor: { r: number; g: number; b: number };
        highlightColor: { r: number; g: number; b: number };
        isHovered: boolean;
        baseY: number;
    }

    const interactiveNodes: InteractiveNode[] = [];

    for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 2.2;
        const isBox = i % 2 === 0;

        const node = new Node(`object-${i}`);
        if (isBox) {
            node.addComponent(createBox(1.2, 1.2, 1.2));
        } else {
            node.addComponent(createSphere(0.7, 24, 24));
        }

        const material = new Material({ color: colors[i] });
        node.addComponent(material);
        node.addComponent(new Interactive({ cursor: 'pointer' }));

        node.transform.position = { x, y: 0, z: 0 };
        node.transform.updateLocalMatrix();
        scene.add(node);

        const entry: InteractiveNode = {
            node,
            material,
            baseColor: colors[i],
            highlightColor: highlightColors[i],
            isHovered: false,
            baseY: 0,
        };

        interactiveNodes.push(entry);

        // ── Event handlers ─────────────────────────────────────

        node.on('click', (e) => {
            console.log(`[Click] "${e.target.name}" at screen (${e.screenPosition.x}, ${e.screenPosition.y})`);
        });

        node.on('pointerenter', () => {
            entry.isHovered = true;
            material.definition.color = entry.highlightColor;
        });

        node.on('pointerleave', () => {
            entry.isHovered = false;
            material.definition.color = entry.baseColor;
        });
    }

    // ── Floor (non-interactive) ──────────────────────────────
    const floor = new Node('floor');
    floor.addComponent(createBox(12, 0.1, 4));
    floor.addComponent(new Material({ color: { r: 0.18, g: 0.18, b: 0.22 } }));
    floor.transform.position = { x: 0, y: -1, z: 0 };
    floor.transform.updateLocalMatrix();
    scene.add(floor);

    // ── Animation ────────────────────────────────────────────
    function animate(time: number, p: ParamValues) {
        const speed = p.speed as number;

        for (let i = 0; i < interactiveNodes.length; i++) {
            const entry = interactiveNodes[i];
            const { node } = entry;

            // Gentle hover float
            const targetY = entry.isHovered ? 0.4 : 0;
            entry.baseY += (targetY - entry.baseY) * 0.1;

            // Idle bob
            const bob = Math.sin(time * speed + i * 1.2) * 0.15;

            node.transform.position = {
                x: (i - 2) * 2.2,
                y: entry.baseY + bob,
                z: 0,
            };

            // Spin when hovered
            if (entry.isHovered) {
                const angle = time * 2;
                node.transform.rotation = {
                    x: 0,
                    y: Math.sin(angle / 2),
                    z: 0,
                    w: Math.cos(angle / 2),
                };
            } else {
                node.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
            }

            node.transform.updateLocalMatrix();
        }
    }

    return { scene, animate };
}
