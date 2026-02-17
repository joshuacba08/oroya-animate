import {
    Scene,
    Node,
    GeometryPrimitive,
    Geometry,
    Material,
    Camera,
    CameraType,
    Light,
    LightType,
} from '@joroya/core';
import type { DemoSceneDef, ParamValues } from '../types';

export const LookAtDemo: DemoSceneDef = {
    id: 'look-at',
    label: 'Transform: LookAt',
    description: 'Demonstrates the lookAt() method. Watcher objects track a moving target in real-time.',
    renderer: 'three',
    controls: [
        {
            type: 'slider',
            key: 'speed',
            label: 'Speed',
            min: 0,
            max: 5,
            step: 0.1,
            defaultValue: 1,
        },
        {
            type: 'slider',
            key: 'radius',
            label: 'Radius',
            min: 1,
            max: 10,
            step: 0.5,
            defaultValue: 4,
        },
    ],
    factory: (params: ParamValues) => {
        const scene = new Scene();

        // Camera
        const cameraNode = new Node('camera');
        cameraNode.addComponent(
            new Camera({
                type: CameraType.Perspective,
                fov: 60,
                aspect: 1,
                near: 0.1,
                far: 100,
            })
        );
        cameraNode.transform.position = { x: 0, y: 10, z: 10 };
        cameraNode.transform.lookAt({ x: 0, y: 0, z: 0 });
        scene.root.add(cameraNode);

        // Lights
        const light = new Node('light');
        light.addComponent(
            new Light({
                type: LightType.Directional,
                color: { r: 1, g: 1, b: 1 },
                intensity: 1.5,
            })
        );
        light.transform.position = { x: 5, y: 10, z: 5 };
        light.transform.lookAt({ x: 0, y: 0, z: 0 });
        scene.root.add(light);

        // Target object (The "Prey")
        const targetNode = new Node('target');
        targetNode.addComponent(
            new Geometry({
                type: GeometryPrimitive.Sphere,
                radius: 0.3,
                widthSegments: 16,
                heightSegments: 16,
            })
        );
        targetNode.addComponent(
            new Material({
                color: { r: 1, g: 0.2, b: 0.2 }, // Red
                emissive: { r: 0.5, g: 0, b: 0 },
            })
        );
        scene.root.add(targetNode);

        // Watcher objects (The "Predators")
        const watchers: Node[] = [];
        const watcherCount = 8;

        for (let i = 0; i < watcherCount; i++) {
            const angle = (i / watcherCount) * Math.PI * 2;
            const radius = 6;

            const watcher = new Node(`watcher-${i}`);

            // Using Cone to clearly show direction (pointy end is +Y usually, we might need adjustments)
            // By default Cone points up (+Y). To look at something, we usually expect -Z (forward) to point at it.
            // We'll rotate the geometry node locally or adjust lookAt logic?
            // Actually, let's use a composite node.

            // Container for positioning

            // Visual geometry: A cone pointing along +Z or something? 
            // Standard LookAt aligns +Z (or -Z depending on engine conventions) to target.
            // In Oroya/Three, lookAt aligns -Z to target usually.
            // Let's create a visual that "points" along -Z.
            // A Cone geometry is usually upright on Y.
            // So we rotate the geometry child -90 deg X to point -Z (or +Z).

            const visual = new Node('visual');
            visual.addComponent(new Geometry({
                type: GeometryPrimitive.Cone,
                radius: 0.3,
                height: 1.0,
                radialSegments: 16
            }));
            visual.addComponent(new Material({
                color: { r: 0.2, g: 0.5, b: 1.0 }, // Blue
            }));

            // Rotate visual so the tip (originally +Y) points to -Z (forward)
            // Rotate -90 deg (-PI/2) around X axis.
            visual.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };

            watcher.add(visual);

            watcher.transform.position = {
                x: Math.cos(angle) * radius,
                y: 0,
                z: Math.sin(angle) * radius
            };

            watchers.push(watcher);
            scene.root.add(watcher);
        }

        // Grid floor for reference
        const floor = new Node('floor');
        floor.addComponent(new Geometry({ type: GeometryPrimitive.Plane, width: 20, height: 20 }));
        floor.addComponent(new Material({ color: { r: 0.2, g: 0.2, b: 0.2 }, roughness: 0.8 }));
        floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };
        floor.transform.position = { x: 0, y: -2, z: 0 };
        scene.root.add(floor);

        const animate = (t: number) => {
            const speed = params.speed as number;
            const r = params.radius as number;

            // Move target in a figure-8 pattern
            const x = Math.sin(t * speed) * r;
            const z = Math.sin(t * speed * 2) * (r * 0.5);

            targetNode.transform.position = { x, y: 0, z };

            // Update watchers to look at target
            watchers.forEach(watcher => {
                watcher.transform.lookAt(targetNode.transform.position);
            });

            // Make camera look at target slightly too (smooth follow logic could be added here)
            // cameraNode.transform.lookAt(targetNode.transform.position); 
            // Keeping camera static for better overview
        };

        return { scene, animate };
    },
};
