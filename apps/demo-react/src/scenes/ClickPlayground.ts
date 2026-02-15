import {
    Scene, Node, createBox, createSphere, Material, Camera, CameraType,
    Interactive,
} from '@oroya/core';
import type { ControlDef, ParamValues } from '../types';

/**
 * Click Playground – demuestra click, pointerdown, pointerup con efectos
 * visuales que responden al estado del puntero.
 *
 * Objetos:
 *   1. Click Counter    – click incrementa un contador visual (escala)
 *   2. Toggle On/Off    – click alterna entre dos estados (color + posición)
 *   3. Press Effect     – pointerdown/up muestra efecto de presión (escala)
 *   4. Color Cycler     – click cicla entre colores
 *   5. Explode/Collect  – click dispersa/reagrupa esferas hijas
 */

export const clickPlaygroundControls: ControlDef[] = [
    { type: 'slider', key: 'animSpeed', label: 'Velocidad animación', min: 0.2, max: 3, step: 0.1, defaultValue: 1.0 },
];

// ── Color palettes ──────────────────────────────────

const CYCLE_COLORS = [
    { r: 0.95, g: 0.26, b: 0.21 },
    { r: 0.13, g: 0.59, b: 0.95 },
    { r: 0.18, g: 0.80, b: 0.44 },
    { r: 0.93, g: 0.69, b: 0.13 },
    { r: 0.69, g: 0.24, b: 0.85 },
    { r: 1.00, g: 0.42, b: 0.70 },
];

export function createClickPlaygroundScene(_params: ParamValues) {
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
    cameraNode.transform.position = { x: 0, y: 2, z: 12 };
    scene.add(cameraNode);

    // ══════════════════════════════════════════════════
    // 1. Click Counter – crece con cada click
    // ══════════════════════════════════════════════════
    const counterState = { clicks: 0, targetScale: 1 };
    const counterNode = new Node('click-counter');
    counterNode.addComponent(createBox(1, 1, 1));
    const counterMat = new Material({ color: { r: 0.18, g: 0.53, b: 0.87 } });
    counterNode.addComponent(counterMat);
    counterNode.addComponent(new Interactive({ cursor: 'pointer' }));
    counterNode.transform.position = { x: -5, y: 0, z: 0 };
    counterNode.transform.updateLocalMatrix();
    scene.add(counterNode);

    counterNode.on('click', (e) => {
        counterState.clicks++;
        counterState.targetScale = 1 + counterState.clicks * 0.15;
        console.log(`[Counter] ${counterState.clicks} clicks (scale -> ${counterState.targetScale.toFixed(2)})`);
        console.log(`   Screen pos: (${e.screenPosition.x}, ${e.screenPosition.y})`);
    });

    // ══════════════════════════════════════════════════
    // 2. Toggle On/Off – alterna estado
    // ══════════════════════════════════════════════════
    const toggleState = { on: false, targetY: 0 };
    const toggleNode = new Node('toggle');
    toggleNode.addComponent(createSphere(0.7, 24, 24));
    const toggleMat = new Material({ color: { r: 0.4, g: 0.4, b: 0.4 } });
    toggleNode.addComponent(toggleMat);
    toggleNode.addComponent(new Interactive({ cursor: 'pointer' }));
    toggleNode.transform.position = { x: -2.5, y: 0, z: 0 };
    toggleNode.transform.updateLocalMatrix();
    scene.add(toggleNode);

    const toggleOnColor = { r: 0.18, g: 0.87, b: 0.44 };
    const toggleOffColor = { r: 0.4, g: 0.4, b: 0.4 };

    toggleNode.on('click', () => {
        toggleState.on = !toggleState.on;
        toggleState.targetY = toggleState.on ? 1.5 : 0;
        console.log(`[Toggle] ${toggleState.on ? 'ON' : 'OFF'}`);
    });

    // ══════════════════════════════════════════════════
    // 3. Press Effect – pointerdown/up muestra presión
    // ══════════════════════════════════════════════════
    const pressState = { pressed: false, currentScale: 1 };
    const pressNode = new Node('press-effect');
    pressNode.addComponent(createBox(1.4, 1.4, 1.4));
    const pressMat = new Material({ color: { r: 0.87, g: 0.36, b: 0.18 } });
    pressNode.addComponent(pressMat);
    pressNode.addComponent(new Interactive({ cursor: 'pointer' }));
    pressNode.transform.position = { x: 0, y: 0, z: 0 };
    pressNode.transform.updateLocalMatrix();
    scene.add(pressNode);

    pressNode.on('pointerdown', () => {
        pressState.pressed = true;
        console.log('[PointerDown] pressing...');
    });

    pressNode.on('pointerup', () => {
        pressState.pressed = false;
        console.log('[PointerUp] released');
    });

    pressNode.on('pointerleave', () => {
        pressState.pressed = false;
    });

    // ══════════════════════════════════════════════════
    // 4. Color Cycler – click cicla entre colores
    // ══════════════════════════════════════════════════
    const cyclerState = { colorIndex: 0, targetColor: { ...CYCLE_COLORS[0] }, currentColor: { ...CYCLE_COLORS[0] } };
    const cyclerNode = new Node('color-cycler');
    cyclerNode.addComponent(createSphere(0.8, 32, 32));
    const cyclerMat = new Material({ color: { ...CYCLE_COLORS[0] } });
    cyclerNode.addComponent(cyclerMat);
    cyclerNode.addComponent(new Interactive({ cursor: 'pointer' }));
    cyclerNode.transform.position = { x: 2.5, y: 0, z: 0 };
    cyclerNode.transform.updateLocalMatrix();
    scene.add(cyclerNode);

    cyclerNode.on('click', () => {
        cyclerState.colorIndex = (cyclerState.colorIndex + 1) % CYCLE_COLORS.length;
        cyclerState.targetColor = { ...CYCLE_COLORS[cyclerState.colorIndex] };
        console.log(`[ColorCycler] index ${cyclerState.colorIndex}`);
    });

    // ══════════════════════════════════════════════════
    // 5. Explode/Collect – dispersa/reagrupa esferas
    // ══════════════════════════════════════════════════
    const explodeState = { exploded: false, t: 0 };
    const explodeParent = new Node('explode-group');
    explodeParent.addComponent(new Interactive({ cursor: 'pointer' }));
    explodeParent.transform.position = { x: 5, y: 0, z: 0 };
    explodeParent.transform.updateLocalMatrix();
    scene.add(explodeParent);

    // Central hub
    const hub = new Node('hub');
    hub.addComponent(createBox(0.5, 0.5, 0.5));
    hub.addComponent(new Material({ color: { r: 0.69, g: 0.24, b: 0.85 } }));
    hub.addComponent(new Interactive({ cursor: 'pointer' }));
    hub.transform.position = { x: 0, y: 0, z: 0 };
    hub.transform.updateLocalMatrix();
    explodeParent.add(hub);
    scene.add(hub);
    // Fix: hub needs to be child of explodeParent in scene graph
    // Actually Node.add handles parent-child. Let me adjust.

    const orbitNodes: Array<{ node: Node; angle: number; material: Material }> = [];
    const orbitCount = 6;
    for (let j = 0; j < orbitCount; j++) {
        const angle = (j / orbitCount) * Math.PI * 2;
        const orbiter = new Node(`orbiter-${j}`);
        orbiter.addComponent(createSphere(0.25, 16, 16));
        const orbMat = new Material({
            color: {
                r: 0.5 + 0.5 * Math.cos(angle),
                g: 0.5 + 0.5 * Math.cos(angle + 2.094),
                b: 0.5 + 0.5 * Math.cos(angle + 4.189),
            },
        });
        orbiter.addComponent(orbMat);
        orbiter.transform.position = { x: 0, y: 0, z: 0 };
        orbiter.transform.updateLocalMatrix();
        scene.add(orbiter);
        orbitNodes.push({ node: orbiter, angle, material: orbMat });
    }

    hub.on('click', () => {
        explodeState.exploded = !explodeState.exploded;
        console.log(`[Explode] ${explodeState.exploded ? 'DISPERSAR' : 'REAGRUPAR'}`);
    });

    // ── Floor ─────────────────────────────────────────
    const floor = new Node('floor');
    floor.addComponent(createBox(14, 0.08, 4));
    floor.addComponent(new Material({ color: { r: 0.12, g: 0.12, b: 0.16 } }));
    floor.transform.position = { x: 0, y: -1.5, z: 0 };
    floor.transform.updateLocalMatrix();
    scene.add(floor);

    // ── Animation ─────────────────────────────────────
    function animate(time: number, p: ParamValues) {
        const speed = p.animSpeed as number;

        // 1. Counter – smooth scale
        {
            const s = counterNode.transform.scale?.x ?? 1;
            const target = counterState.targetScale;
            const newS = s + (target - s) * 0.1 * speed;
            counterNode.transform.scale = { x: newS, y: newS, z: newS };

            // Gentle idle rotation
            const a = time * 0.5 * speed;
            counterNode.transform.rotation = {
                x: Math.sin(a * 0.3) * 0.1,
                y: Math.sin(a / 2),
                z: 0,
                w: Math.cos(a / 2),
            };
            counterNode.transform.updateLocalMatrix();
        }

        // 2. Toggle – smooth position + color
        {
            const currentY = toggleNode.transform.position?.y ?? 0;
            const targetY = toggleState.targetY;
            const newY = currentY + (targetY - currentY) * 0.08 * speed;
            toggleNode.transform.position = { x: -2.5, y: newY, z: 0 };

            const t = Math.abs(newY) / 1.5; // 0..1
            toggleMat.definition.color = {
                r: toggleOffColor.r + (toggleOnColor.r - toggleOffColor.r) * t,
                g: toggleOffColor.g + (toggleOnColor.g - toggleOffColor.g) * t,
                b: toggleOffColor.b + (toggleOnColor.b - toggleOffColor.b) * t,
            };

            // Spin when ON
            if (toggleState.on) {
                const a = time * 2 * speed;
                toggleNode.transform.rotation = {
                    x: 0,
                    y: Math.sin(a / 2),
                    z: 0,
                    w: Math.cos(a / 2),
                };
            } else {
                toggleNode.transform.rotation = { x: 0, y: 0, z: 0, w: 1 };
            }
            toggleNode.transform.updateLocalMatrix();
        }

        // 3. Press – scale spring
        {
            const targetScale = pressState.pressed ? 0.7 : 1.0;
            pressState.currentScale += (targetScale - pressState.currentScale) * 0.15 * speed;
            const s = pressState.currentScale;
            pressNode.transform.scale = { x: s, y: s, z: s };

            // Color feedback
            const pressT = 1 - (s - 0.7) / 0.3; // 0 when not pressed, 1 when fully pressed
            pressMat.definition.color = {
                r: 0.87 + (1.0 - 0.87) * Math.max(0, pressT),
                g: 0.36 + (0.6 - 0.36) * Math.max(0, pressT),
                b: 0.18 + (0.1 - 0.18) * Math.max(0, pressT),
            };

            pressNode.transform.updateLocalMatrix();
        }

        // 4. Color Cycler – smooth color lerp
        {
            const c = cyclerState.currentColor;
            const t = cyclerState.targetColor;
            const lerpSpeed = 0.06 * speed;
            cyclerState.currentColor = {
                r: c.r + (t.r - c.r) * lerpSpeed,
                g: c.g + (t.g - c.g) * lerpSpeed,
                b: c.b + (t.b - c.b) * lerpSpeed,
            };
            cyclerMat.definition.color = { ...cyclerState.currentColor };

            // Gentle bob
            const bob = Math.sin(time * 1.5 * speed) * 0.15;
            cyclerNode.transform.position = { x: 2.5, y: bob, z: 0 };
            cyclerNode.transform.updateLocalMatrix();
        }

        // 5. Explode/Collect – orbit positions
        {
            const targetT = explodeState.exploded ? 1 : 0;
            explodeState.t += (targetT - explodeState.t) * 0.06 * speed;
            const et = explodeState.t;

            const hubX = 5;

            // Hub rotation
            const hubAngle = time * speed;
            hub.transform.position = { x: hubX, y: 0, z: 0 };
            hub.transform.rotation = {
                x: Math.sin(hubAngle * 0.3) * 0.2,
                y: Math.sin(hubAngle / 2),
                z: 0,
                w: Math.cos(hubAngle / 2),
            };
            hub.transform.updateLocalMatrix();

            for (let j = 0; j < orbitNodes.length; j++) {
                const { node, angle } = orbitNodes[j];
                const radius = et * 1.5;
                const spin = time * 1.5 * speed;
                const ox = hubX + Math.cos(angle + spin) * radius;
                const oy = Math.sin(angle + spin) * radius;
                const oz = Math.sin(angle * 2 + spin * 0.5) * radius * 0.3;
                node.transform.position = { x: ox, y: oy, z: oz };
                node.transform.updateLocalMatrix();
            }
        }
    }

    return { scene, animate };
}
