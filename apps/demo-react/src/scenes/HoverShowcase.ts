import {
    Scene, Node, createBox, createSphere, Material, Camera, CameraType,
    Interactive,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/**
 * Hover Showcase – demuestra pointerenter / pointerleave con 5 efectos
 * distintos y diferentes cursores CSS.
 *
 * Cada objeto tiene un efecto hover único:
 *   1. Levitar  (cursor: pointer)
 *   2. Girar    (cursor: grab)
 *   3. Crecer   (cursor: zoom-in)
 *   4. Cambiar color (cursor: crosshair)
 *   5. Pulsar   (cursor: cell)
 */

export const hoverShowcaseControls: ControlDef[] = [
    { type: 'slider', key: 'hoverSpeed', label: 'Velocidad efecto', min: 0.1, max: 3, step: 0.1, defaultValue: 1.0 },
];

interface HoverEntry {
    node: Node;
    material: Material;
    isHovered: boolean;
    /** Effect-specific state */
    effectValue: number;
    baseColor: { r: number; g: number; b: number };
    hoverColor: { r: number; g: number; b: number };
    label: string;
}

export function createHoverShowcaseScene(_params: ParamValues) {
    const scene = new Scene();

    // ── Camera ────────────────────────────────────────
    const cameraNode = new Node('camera');
    cameraNode.addComponent(new Camera({
        type: CameraType.Perspective,
        fov: 55,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 100,
    }));
    cameraNode.transform.position = { x: 0, y: 1.5, z: 10 };
    scene.add(cameraNode);

    // ── Config per object ─────────────────────────────
    const configs: Array<{
        shape: 'box' | 'sphere';
        baseColor: { r: number; g: number; b: number };
        hoverColor: { r: number; g: number; b: number };
        cursor: string;
        label: string;
    }> = [
        { shape: 'box',    baseColor: { r: 0.18, g: 0.53, b: 0.87 }, hoverColor: { r: 0.40, g: 0.73, b: 1.00 }, cursor: 'pointer',   label: 'Levitar' },
        { shape: 'sphere', baseColor: { r: 0.87, g: 0.36, b: 0.18 }, hoverColor: { r: 1.00, g: 0.56, b: 0.35 }, cursor: 'grab',       label: 'Girar' },
        { shape: 'box',    baseColor: { r: 0.18, g: 0.80, b: 0.44 }, hoverColor: { r: 0.40, g: 1.00, b: 0.65 }, cursor: 'zoom-in',    label: 'Crecer' },
        { shape: 'sphere', baseColor: { r: 0.93, g: 0.69, b: 0.13 }, hoverColor: { r: 1.00, g: 0.85, b: 0.40 }, cursor: 'crosshair',  label: 'Color' },
        { shape: 'box',    baseColor: { r: 0.69, g: 0.24, b: 0.85 }, hoverColor: { r: 0.85, g: 0.50, b: 1.00 }, cursor: 'cell',        label: 'Pulsar' },
    ];

    const entries: HoverEntry[] = [];

    for (let i = 0; i < configs.length; i++) {
        const cfg = configs[i];
        const x = (i - 2) * 2.5;

        const node = new Node(`hover-${i}-${cfg.label}`);
        if (cfg.shape === 'box') {
            node.addComponent(createBox(1.2, 1.2, 1.2));
        } else {
            node.addComponent(createSphere(0.7, 24, 24));
        }

        const material = new Material({ color: { ...cfg.baseColor } });
        node.addComponent(material);
        node.addComponent(new Interactive({ cursor: cfg.cursor }));

        node.transform.position = { x, y: 0, z: 0 };
        node.transform.updateLocalMatrix();
        scene.add(node);

        const entry: HoverEntry = {
            node,
            material,
            isHovered: false,
            effectValue: 0,
            baseColor: cfg.baseColor,
            hoverColor: cfg.hoverColor,
            label: cfg.label,
        };
        entries.push(entry);

        // ── Events ──────────────────────────────────────
        node.on('pointerenter', () => {
            entry.isHovered = true;
            console.log(`[Hover] ENTER: "${node.name}" (cursor: ${cfg.cursor})`);
        });

        node.on('pointerleave', () => {
            entry.isHovered = false;
            console.log(`[Hover] LEAVE: "${node.name}"`);
        });
    }

    // ── Floor ─────────────────────────────────────────
    const floor = new Node('floor');
    floor.addComponent(createBox(16, 0.08, 4));
    floor.addComponent(new Material({ color: { r: 0.12, g: 0.12, b: 0.16 } }));
    floor.transform.position = { x: 0, y: -1.2, z: 0 };
    floor.transform.updateLocalMatrix();
    scene.add(floor);

    // ── Labels (small cubes as indicators under each object) ──
    for (let i = 0; i < configs.length; i++) {
        const indicator = new Node(`indicator-${i}`);
        indicator.addComponent(createBox(1.8, 0.06, 0.06));
        indicator.addComponent(new Material({ color: configs[i].baseColor }));
        indicator.transform.position = { x: (i - 2) * 2.5, y: -1.1, z: 0.5 };
        indicator.transform.updateLocalMatrix();
        scene.add(indicator);
    }

    // ── Animation ─────────────────────────────────────
    function animate(time: number, p: ParamValues) {
        const speed = p.hoverSpeed as number;

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const { node, material } = entry;
            const target = entry.isHovered ? 1 : 0;

            // Smooth lerp to target
            entry.effectValue += (target - entry.effectValue) * 0.08 * speed;
            const t = entry.effectValue;

            const x = (i - 2) * 2.5;

            // Apply effect based on index
            switch (i) {
                case 0: {
                    // LEVITAR: float upward
                    node.transform.position = { x, y: t * 1.2, z: 0 };
                    node.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
                    node.transform.scale = { x: 1, y: 1, z: 1 };
                    break;
                }
                case 1: {
                    // GIRAR: spin on Y axis
                    const angle = time * 3 * t;
                    node.transform.position = { x, y: 0, z: 0 };
                    node.transform.rotation = {
                        x: 0,
                        y: Math.sin(angle / 2),
                        z: 0,
                        w: Math.cos(angle / 2),
                    };
                    node.transform.scale = { x: 1, y: 1, z: 1 };
                    break;
                }
                case 2: {
                    // CRECER: scale up
                    const s = 1 + t * 0.6;
                    node.transform.position = { x, y: 0, z: 0 };
                    node.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
                    node.transform.scale = { x: s, y: s, z: s };
                    break;
                }
                case 3: {
                    // COLOR: smooth color lerp (also slight bob)
                    const bob = Math.sin(time * 2) * 0.1 * t;
                    node.transform.position = { x, y: bob, z: 0 };
                    node.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
                    node.transform.scale = { x: 1, y: 1, z: 1 };

                    material.definition.color = {
                        r: entry.baseColor.r + (entry.hoverColor.r - entry.baseColor.r) * t,
                        g: entry.baseColor.g + (entry.hoverColor.g - entry.baseColor.g) * t,
                        b: entry.baseColor.b + (entry.hoverColor.b - entry.baseColor.b) * t,
                    };
                    break;
                }
                case 4: {
                    // PULSAR: rhythmic scale pulse
                    const pulse = 1 + Math.sin(time * 6 * speed) * 0.15 * t;
                    node.transform.position = { x, y: 0, z: 0 };
                    node.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
                    node.transform.scale = { x: pulse, y: pulse, z: pulse };
                    break;
                }
            }

            // Color lerp for all non-color-specific effects
            if (i !== 3) {
                material.definition.color = {
                    r: entry.baseColor.r + (entry.hoverColor.r - entry.baseColor.r) * t,
                    g: entry.baseColor.g + (entry.hoverColor.g - entry.baseColor.g) * t,
                    b: entry.baseColor.b + (entry.hoverColor.b - entry.baseColor.b) * t,
                };
            }

            node.transform.updateLocalMatrix();
        }
    }

    return { scene, animate };
}
