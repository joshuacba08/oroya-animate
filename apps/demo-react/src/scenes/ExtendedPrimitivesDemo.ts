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

export const ExtendedPrimitivesDemo: DemoSceneDef = {
    id: 'extended-primitives',
    label: 'Extended Primitives',
    description: 'Showcase of all new geometry primitives: Cylinder, Plane, Cone, Torus, Circle',
    renderer: 'three',
    controls: [
        {
            type: 'select',
            key: 'primitive',
            label: 'Primitive Type',
            defaultValue: 'Cylinder',
            options: [
                { value: 'Cylinder', label: 'Cylinder' },
                { value: 'Plane', label: 'Plane' },
                { value: 'Cone', label: 'Cone' },
                { value: 'Torus', label: 'Torus' },
                { value: 'Circle', label: 'Circle' },
                { value: 'All', label: 'All Primitives' },
            ],
        },
        {
            type: 'slider',
            key: 'rotationSpeed',
            label: 'Rotation Speed',
            min: 0,
            max: 2,
            step: 0.1,
            defaultValue: 0.5,
        },
        {
            type: 'color',
            key: 'color',
            label: 'Material Color',
            defaultValue: '#4488ff',
        },
    ],
    factory: (params: ParamValues) => {
        const scene = new Scene();

        // Camera
        const camera = new Node('camera');
        camera.addComponent(
            new Camera({
                type: CameraType.Perspective,
                fov: 75,
                aspect: window.innerWidth / window.innerHeight,
                near: 0.1,
                far: 1000,
            })
        );
        camera.transform.position = { x: 0, y: 2, z: 10 };
        scene.add(camera);

        // Lights
        const ambientLight = new Node('ambient-light');
        ambientLight.addComponent(
            new Light({
                type: LightType.Ambient,
                color: { r: 0.4, g: 0.4, b: 0.4 },
                intensity: 1,
            })
        );
        scene.add(ambientLight);

        const directionalLight = new Node('directional-light');
        directionalLight.addComponent(
            new Light({
                type: LightType.Directional,
                color: { r: 1, g: 1, b: 1 },
                intensity: 1.2,
                castShadow: false,
            })
        );
        directionalLight.transform.position = { x: 5, y: 5, z: 5 };
        scene.add(directionalLight);

        // Dynamic primitive nodes
        const primitiveNodes: Node[] = [];

        function updatePrimitives(p: ParamValues) {
            // Clear existing primitives
            primitiveNodes.forEach(node => scene.root.remove(node));
            primitiveNodes.length = 0;

            const primitiveType = p.primitive as string;
            const colorHex = p.color as string;
            const r = parseInt(colorHex.slice(1, 3), 16) / 255;
            const g = parseInt(colorHex.slice(3, 5), 16) / 255;
            const b = parseInt(colorHex.slice(5, 7), 16) / 255;

            const material = new Material({
                color: { r, g, b },
                roughness: 0.4,
                metalness: 0.6,
            });

            if (primitiveType === 'All') {
                // Display all primitives in a grid
                const primitives = [
                    { type: 'Cylinder', x: -6, z: 0 },
                    { type: 'Plane', x: -3, z: 0 },
                    { type: 'Cone', x: 0, z: 0 },
                    { type: 'Torus', x: 3, z: 0 },
                    { type: 'Circle', x: 6, z: 0 },
                ];

                primitives.forEach(prim => {
                    const node = createPrimitive(prim.type, material);
                    node.transform.position = { x: prim.x, y: 0, z: prim.z };
                    scene.add(node);
                    primitiveNodes.push(node);
                });
            } else {
                // Display single primitive at center
                const node = createPrimitive(primitiveType, material);
                node.transform.position = { x: 0, y: 0, z: 0 };
                scene.add(node);
                primitiveNodes.push(node);
            }
        }

        function createPrimitive(type: string, material: Material): Node {
            const node = new Node(type.toLowerCase());

            switch (type) {
                case 'Cylinder':
                    node.addComponent(
                        new Geometry({
                            type: GeometryPrimitive.Cylinder,
                            radiusTop: 1,
                            radiusBottom: 1,
                            height: 2,
                            radialSegments: 32,
                        })
                    );
                    break;

                case 'Plane':
                    node.addComponent(
                        new Geometry({
                            type: GeometryPrimitive.Plane,
                            width: 2.5,
                            height: 2.5,
                            widthSegments: 1,
                            heightSegments: 1,
                        })
                    );
                    break;

                case 'Cone':
                    node.addComponent(
                        new Geometry({
                            type: GeometryPrimitive.Cone,
                            radius: 1.2,
                            height: 2.5,
                            radialSegments: 32,
                        })
                    );
                    break;

                case 'Torus':
                    node.addComponent(
                        new Geometry({
                            type: GeometryPrimitive.Torus,
                            radius: 1,
                            tube: 0.4,
                            radialSegments: 16,
                            tubularSegments: 100,
                        })
                    );
                    break;

                case 'Circle':
                    node.addComponent(
                        new Geometry({
                            type: GeometryPrimitive.Circle,
                            radius: 1.5,
                            segments: 32,
                        })
                    );
                    break;
            }

            node.addComponent(material);
            return node;
        }

        // Initialize primitives
        updatePrimitives(params);

        return {
            scene,
            animate: (time: number, p: ParamValues) => {
                // Update primitives if selection changed
                updatePrimitives(p);

                // Rotate primitives
                const rotationSpeed = p.rotationSpeed as number;
                primitiveNodes.forEach(node => {
                    node.transform.rotation = {
                        x: Math.sin(time * rotationSpeed * 0.5) * 0.3,
                        y: time * rotationSpeed,
                        z: 0,
                        w: 1,
                    };
                    node.transform.updateLocalMatrix();
                });
            },
        };
    },
};
