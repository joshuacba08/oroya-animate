import { Scene, Node, createSphere, Material, Camera, CameraType, createBox } from '@joroya/core';
import type { ControlDef, ParamValues } from '../types';

export const canvasParticlesControls: ControlDef[] = [
    { type: 'slider', key: 'count', label: 'Partículas', min: 100, max: 2000, step: 100, defaultValue: 500, rebuild: true },
    { type: 'slider', key: 'speed', label: 'Velocidad', min: 0.1, max: 5, step: 0.1, defaultValue: 1 },
    { type: 'color', key: 'color', label: 'Color Base', defaultValue: '#4a7aff', rebuild: true },
];

/**
 * High-performance particle demo for Canvas2D renderer.
 */
export function createCanvasParticlesScene(params: ParamValues) {
    const scene = new Scene();
    const count = params.count as number;

    // Camera
    const cameraNode = new Node('camera');
    cameraNode.addComponent(new Camera({
        type: CameraType.Orthographic,
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight,
        near: 0.1,
        far: 100,
    }));
    // Center camera on screen
    cameraNode.transform.position = { x: 0, y: 0, z: 10 };
    scene.add(cameraNode);

    // Background
    const bgNode = new Node('bg');
    bgNode.addComponent(createBox(window.innerWidth, window.innerHeight, 1));
    bgNode.addComponent(new Material({ fill: { r: 0.05, g: 0.05, b: 0.1 } }));
    bgNode.transform.position = { x: window.innerWidth / 2, y: window.innerHeight / 2, z: -1 };
    scene.add(bgNode);

    // Particles
    const particles: { node: Node, vx: number, vy: number, size: number }[] = [];
    const sphereGeo = createSphere(1, 8, 8); // Shared geometry

    for (let i = 0; i < count; i++) {
        const node = new Node(`p-${i}`);
        const size = 2 + Math.random() * 8;

        // Position
        node.transform.position = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            z: 0
        };

        // Color variation
        const r = Math.random();
        const g = Math.random() * 0.5;
        const b = 0.5 + Math.random() * 0.5;

        node.addComponent(sphereGeo);
        node.addComponent(new Material({
            fill: { r, g, b },
            opacity: 0.6 + Math.random() * 0.4
        }));

        // Initial velocity
        const angle = Math.random() * Math.PI * 2;
        const vel = 0.5 + Math.random() * 1.5;

        particles.push({
            node,
            vx: Math.cos(angle) * vel,
            vy: Math.sin(angle) * vel,
            size
        });

        // Apply size via scale
        node.transform.scale = { x: size, y: size, z: 1 };

        scene.add(node);
    }

    // Animation loop
    function animate(_time: number, p: ParamValues) {
        const s = p.speed as number;
        const w = window.innerWidth;
        const h = window.innerHeight;

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            let pos = p.node.transform.position;

            // Update position
            pos.x += p.vx * s;
            pos.y += p.vy * s;

            // Bounce off walls
            if (pos.x < 0) { pos.x = 0; p.vx *= -1; }
            if (pos.x > w) { pos.x = w; p.vx *= -1; }
            if (pos.y < 0) { pos.y = 0; p.vy *= -1; }
            if (pos.y > h) { pos.y = h; p.vy *= -1; }

            p.node.transform.updateLocalMatrix();
        }
    }

    return { scene, animate };
}
