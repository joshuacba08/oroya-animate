import {
    Scene, Node, createBox, createSphere, Material, Camera, CameraType,
    Interactive,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/**
 * Wheel & Bubbling Demo – demuestra dos conceptos:
 *
 * A) WHEEL EVENTS: Objetos que cambian de tamaño con la rueda del mouse.
 *    Cada columna es una "torre" de cubos apilados – wheel agrega/quita niveles.
 *
 * B) EVENT BUBBLING: Grupo padre con hijos anidados. Los eventos
 *    se propagan del hijo al padre. Demuestra `stopPropagation()`.
 *
 * También demuestra pointermove con tracking visual.
 */

export const wheelAndBubblingControls: ControlDef[] = [
    { type: 'slider', key: 'sensitivity', label: 'Sensibilidad wheel', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 },
];

export function createWheelAndBubblingScene(_params: ParamValues) {
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
    cameraNode.transform.position = { x: 0, y: 3, z: 14 };
    scene.add(cameraNode);

    // ══════════════════════════════════════════════════
    // SECTION A: WHEEL-CONTROLLED OBJECTS
    // ══════════════════════════════════════════════════

    interface WheelObject {
        node: Node;
        material: Material;
        baseScale: number;
        targetScale: number;
        currentScale: number;
        baseColor: { r: number; g: number; b: number };
    }

    const wheelObjects: WheelObject[] = [];

    const wheelConfigs = [
        { x: -4, color: { r: 0.18, g: 0.60, b: 0.95 }, shape: 'box' as const },
        { x: -2, color: { r: 0.95, g: 0.44, b: 0.18 }, shape: 'sphere' as const },
        { x:  0, color: { r: 0.18, g: 0.85, b: 0.55 }, shape: 'box' as const },
    ];

    for (const cfg of wheelConfigs) {
        const node = new Node(`wheel-obj-${cfg.x}`);
        if (cfg.shape === 'box') {
            node.addComponent(createBox(1.2, 1.2, 1.2));
        } else {
            node.addComponent(createSphere(0.7, 24, 24));
        }
        const material = new Material({ color: { ...cfg.color } });
        node.addComponent(material);
        node.addComponent(new Interactive({ cursor: 'ns-resize' }));
        node.transform.position = { x: cfg.x, y: 0, z: 0 };
        node.transform.updateLocalMatrix();
        scene.add(node);

        const entry: WheelObject = {
            node,
            material,
            baseScale: 1,
            targetScale: 1,
            currentScale: 1,
            baseColor: cfg.color,
        };
        wheelObjects.push(entry);

        // Wheel → scale
        node.on('wheel', (e) => {
            const nativeEvent = e.nativeEvent as WheelEvent;
            const delta = -nativeEvent.deltaY * 0.003;
            entry.targetScale = Math.max(0.3, Math.min(3, entry.targetScale + delta));
            console.log(`🔄 Wheel en "${node.name}": escala → ${entry.targetScale.toFixed(2)}`);
        });

        // Hover highlight
        node.on('pointerenter', () => {
            material.definition.color = {
                r: Math.min(1, cfg.color.r + 0.2),
                g: Math.min(1, cfg.color.g + 0.2),
                b: Math.min(1, cfg.color.b + 0.2),
            };
        });
        node.on('pointerleave', () => {
            material.definition.color = { ...cfg.color };
        });
    }

    // "Wheel" label indicator
    const wheelLabel = new Node('wheel-section-indicator');
    wheelLabel.addComponent(createBox(8, 0.04, 0.04));
    wheelLabel.addComponent(new Material({ color: { r: 0.3, g: 0.3, b: 0.5 } }));
    wheelLabel.transform.position = { x: -2, y: -1.8, z: 0 };
    wheelLabel.transform.updateLocalMatrix();
    scene.add(wheelLabel);

    // ══════════════════════════════════════════════════
    // SECTION B: EVENT BUBBLING
    // ══════════════════════════════════════════════════

    // Parent container (large semi-transparent box)
    const parentNode = new Node('bubbling-parent');
    parentNode.addComponent(createBox(3.5, 3.5, 0.3));
    const parentMat = new Material({ color: { r: 0.3, g: 0.3, b: 0.3 }, opacity: 0.4 });
    parentNode.addComponent(parentMat);
    parentNode.addComponent(new Interactive({ cursor: 'default' }));
    parentNode.transform.position = { x: 4, y: 0.5, z: 0 };
    parentNode.transform.updateLocalMatrix();
    scene.add(parentNode);

    const parentState = { flashTimer: 0, color: { r: 0.3, g: 0.3, b: 0.3 } };

    parentNode.on('click', (e) => {
        parentState.flashTimer = 1;
        parentState.color = { r: 0.2, g: 0.6, b: 1.0 };
        console.log(`📦 PARENT recibió click (target: "${e.target.name}", currentTarget: "${e.currentTarget.name}")`);
        console.log(`   → El evento hizo BUBBLING desde "${e.target.name}" hasta "bubbling-parent"`);
    });

    // Child A – click bubbles up to parent
    const childA = new Node('child-A-bubbles');
    childA.addComponent(createSphere(0.45, 20, 20));
    const childAMat = new Material({ color: { r: 0.95, g: 0.55, b: 0.18 } });
    childA.addComponent(childAMat);
    childA.addComponent(new Interactive({ cursor: 'pointer' }));
    childA.transform.position = { x: 3.2, y: 1.2, z: 0.3 };
    childA.transform.updateLocalMatrix();
    scene.add(childA);

    const childAState = { flashTimer: 0 };

    childA.on('click', (e) => {
        childAState.flashTimer = 1;
        console.log(`🟠 Child A clicked – evento BURBUJEA al padre`);
        console.log(`   target: "${e.target.name}", currentTarget: "${e.currentTarget.name}"`);
    });

    // Child B – click does NOT bubble (stopPropagation)
    const childB = new Node('child-B-stops');
    childB.addComponent(createBox(0.8, 0.8, 0.8));
    const childBMat = new Material({ color: { r: 0.60, g: 0.18, b: 0.95 } });
    childB.addComponent(childBMat);
    childB.addComponent(new Interactive({ cursor: 'not-allowed' }));
    childB.transform.position = { x: 4.8, y: 1.2, z: 0.3 };
    childB.transform.updateLocalMatrix();
    scene.add(childB);

    const childBState = { flashTimer: 0 };

    childB.on('click', (e) => {
        e.stopPropagation();
        childBState.flashTimer = 1;
        console.log(`🟣 Child B clicked – stopPropagation() llamado, NO burbujea`);
    });

    // Child C – lower, also bubbles
    const childC = new Node('child-C-bubbles');
    childC.addComponent(createBox(0.6, 0.6, 0.6));
    const childCMat = new Material({ color: { r: 0.18, g: 0.87, b: 0.70 } });
    childC.addComponent(childCMat);
    childC.addComponent(new Interactive({ cursor: 'pointer' }));
    childC.transform.position = { x: 4, y: -0.2, z: 0.3 };
    childC.transform.updateLocalMatrix();
    scene.add(childC);

    const childCState = { flashTimer: 0 };

    childC.on('click', (e) => {
        childCState.flashTimer = 1;
        console.log(`🟢 Child C clicked – evento BURBUJEA al padre`);
        console.log(`   target: "${e.target.name}", currentTarget: "${e.currentTarget.name}"`);
    });

    // ══════════════════════════════════════════════════
    // SECTION C: POINTERMOVE TRACKER
    // ══════════════════════════════════════════════════

    const trackerNode = new Node('pointer-tracker');
    trackerNode.addComponent(createBox(5, 3, 0.1));
    const trackerMat = new Material({ color: { r: 0.15, g: 0.15, b: 0.20 }, opacity: 0.6 });
    trackerNode.addComponent(trackerMat);
    trackerNode.addComponent(new Interactive({ cursor: 'crosshair' }));
    trackerNode.transform.position = { x: -2, y: -3.5, z: 0 };
    trackerNode.transform.updateLocalMatrix();
    scene.add(trackerNode);

    // Small indicator sphere that follows pointer on the tracker
    const trackerDot = new Node('tracker-dot');
    trackerDot.addComponent(createSphere(0.15, 16, 16));
    const trackerDotMat = new Material({ color: { r: 1, g: 0.3, b: 0.5 } });
    trackerDot.addComponent(trackerDotMat);
    trackerDot.transform.position = { x: -2, y: -3.5, z: 0.15 };
    trackerDot.transform.updateLocalMatrix();
    scene.add(trackerDot);

    const trackerState = { targetX: -2, targetY: -3.5 };

    trackerNode.on('pointermove', (e) => {
        if (e.point) {
            trackerState.targetX = e.point.x;
            trackerState.targetY = e.point.y;
        }
    });

    trackerNode.on('pointerenter', () => {
        trackerDotMat.definition.color = { r: 1, g: 0.8, b: 0.2 };
    });

    trackerNode.on('pointerleave', () => {
        trackerDotMat.definition.color = { r: 1, g: 0.3, b: 0.5 };
    });

    // ── Floor ─────────────────────────────────────────
    const floor = new Node('floor');
    floor.addComponent(createBox(16, 0.08, 4));
    floor.addComponent(new Material({ color: { r: 0.10, g: 0.10, b: 0.14 } }));
    floor.transform.position = { x: 0, y: -5.5, z: 0 };
    floor.transform.updateLocalMatrix();
    scene.add(floor);

    // ── Animation ─────────────────────────────────────
    function animate(time: number, p: ParamValues) {
        const sensitivity = p.sensitivity as number;

        // A) Wheel objects – smooth scale
        for (const wo of wheelObjects) {
            wo.currentScale += (wo.targetScale * sensitivity + (1 - sensitivity) * wo.targetScale - wo.currentScale) * 0.1;
            const s = wo.currentScale;
            wo.node.transform.scale = { x: s, y: s, z: s };

            // Idle rotation
            const a = time * 0.3;
            wo.node.transform.rotation = {
                x: 0,
                y: Math.sin(a / 2),
                z: 0,
                w: Math.cos(a / 2),
            };
            wo.node.transform.updateLocalMatrix();
        }

        // B) Bubbling – flash timers
        const dt = 0.016; // ~60fps
        {
            parentState.flashTimer = Math.max(0, parentState.flashTimer - dt * 2);
            const t = parentState.flashTimer;
            parentMat.definition.color = {
                r: 0.3 + (parentState.color.r - 0.3) * t,
                g: 0.3 + (parentState.color.g - 0.3) * t,
                b: 0.3 + (parentState.color.b - 0.3) * t,
            };

            // Gentle float
            parentNode.transform.position = {
                x: 4,
                y: 0.5 + Math.sin(time * 0.5) * 0.1,
                z: 0,
            };
            parentNode.transform.updateLocalMatrix();
        }

        // Flash effects for children
        {
            childAState.flashTimer = Math.max(0, childAState.flashTimer - dt * 3);
            const s = 1 + childAState.flashTimer * 0.4;
            childA.transform.scale = { x: s, y: s, z: s };
            childA.transform.position = {
                x: 3.2,
                y: 1.2 + Math.sin(time * 0.5) * 0.1,
                z: 0.3,
            };
            childA.transform.updateLocalMatrix();
        }
        {
            childBState.flashTimer = Math.max(0, childBState.flashTimer - dt * 3);
            const a = childBState.flashTimer * Math.PI * 4;
            childB.transform.rotation = {
                x: 0,
                y: 0,
                z: Math.sin(a / 2) * 0.3,
                w: Math.cos(a / 2 * 0.3),
            };
            childB.transform.position = {
                x: 4.8,
                y: 1.2 + Math.sin(time * 0.5) * 0.1,
                z: 0.3,
            };
            childB.transform.updateLocalMatrix();
        }
        {
            childCState.flashTimer = Math.max(0, childCState.flashTimer - dt * 3);
            const s = 1 + childCState.flashTimer * 0.3;
            childC.transform.scale = { x: s, y: s, z: s };
            childC.transform.position = {
                x: 4,
                y: -0.2 + Math.sin(time * 0.5) * 0.1,
                z: 0.3,
            };
            childC.transform.updateLocalMatrix();
        }

        // C) Pointer tracker – smooth follow
        {
            const currentX = trackerDot.transform.position?.x ?? -2;
            const currentY = trackerDot.transform.position?.y ?? -3.5;
            trackerDot.transform.position = {
                x: currentX + (trackerState.targetX - currentX) * 0.15,
                y: currentY + (trackerState.targetY - currentY) * 0.15,
                z: 0.15,
            };
            // Pulse the dot
            const pulse = 0.15 + Math.sin(time * 4) * 0.03;
            const dotS = pulse / 0.15;
            trackerDot.transform.scale = { x: dotS, y: dotS, z: dotS };
            trackerDot.transform.updateLocalMatrix();
        }
    }

    return { scene, animate };
}
