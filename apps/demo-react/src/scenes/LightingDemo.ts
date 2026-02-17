import {
    Scene,
    Node,
    Light,
    LightType,
    GeometryPrimitive,
    Geometry,
    Material,
    Camera,
    CameraType,
    Transform,
} from '@joroya/core';
import type { DemoSceneDef, ParamValues } from '../types';

export const LightingDemoScene: DemoSceneDef = {
    id: 'lighting-demo',
    label: 'Lighting System',
    description: 'Interactive demonstration of all light types: Ambient, Directional, Point, and Spot',
    renderer: 'three',
    controls: [
        {
            type: 'select',
            key: 'lightType',
            label: 'Light Type',
            defaultValue: 'Directional',
            options: [
                { value: 'Ambient', label: 'Ambient Light' },
                { value: 'Directional', label: 'Directional Light' },
                { value: 'Point', label: 'Point Light' },
                { value: 'Spot', label: 'Spot Light' },
            ],
        },
        {
            type: 'slider',
            key: 'intensity',
            label: 'Intensity',
            min: 0,
            max: 3,
            step: 0.1,
            defaultValue: 1.5,
        },
        {
            type: 'color',
            key: 'lightColor',
            label: 'Light Color',
            defaultValue: '#ffffff',
        },
        {
            type: 'slider',
            key: 'lightX',
            label: 'Light X',
            min: -5,
            max: 5,
            step: 0.5,
            defaultValue: 2,
        },
        {
            type: 'slider',
            key: 'lightY',
            label: 'Light Y',
            min: 0,
            max: 10,
            step: 0.5,
            defaultValue: 5,
        },
        {
            type: 'slider',
            key: 'lightZ',
            label: 'Light Z',
            min: -5,
            max: 5,
            step: 0.5,
            defaultValue: 3,
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
        camera.transform.position = { x: 0, y: 3, z: 8 };
        scene.add(camera);

        // Ground plane
        const ground = new Node('ground');
        ground.addComponent(
            new Geometry({
                type: GeometryPrimitive.Box,
                width: 20,
                height: 0.2,
                depth: 20,
            })
        );
        ground.addComponent(
            new Material({
                color: { r: 0.3, g: 0.3, b: 0.3 },
                roughness: 0.8,
                metalness: 0.2,
            })
        );
        ground.transform.position = { x: 0, y: -1, z: 0 };
        scene.add(ground);

        // Central sphere
        const sphere = new Node('sphere');
        sphere.addComponent(
            new Geometry({
                type: GeometryPrimitive.Sphere,
                radius: 1,
                widthSegments: 32,
                heightSegments: 32,
            })
        );
        sphere.addComponent(
            new Material({
                color: { r: 0.8, g: 0.2, b: 0.2 },
                roughness: 0.3,
                metalness: 0.7,
            })
        );
        sphere.transform.position = { x: 0, y: 0, z: 0 };
        scene.add(sphere);

        // Boxes around the sphere
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const box = new Node(`box-${i}`);
            box.addComponent(
                new Geometry({
                    type: GeometryPrimitive.Box,
                    width: 0.8,
                    height: 1.5,
                    depth: 0.8,
                })
            );
            box.addComponent(
                new Material({
                    color: { r: 0.2, g: 0.5, b: 0.8 },
                    roughness: 0.4,
                    metalness: 0.6,
                })
            );
            box.transform.position = {
                x: Math.cos(angle) * 3,
                y: 0,
                z: Math.sin(angle) * 3,
            };
            scene.add(box);
        }

        // Dynamic light node
        const lightNode = new Node('dynamic-light');
        scene.add(lightNode);

        function updateLight(p: ParamValues) {
            const lightType = p.lightType as string;
            const intensity = p.intensity as number;
            const colorHex = p.lightColor as string;
            const r = parseInt(colorHex.slice(1, 3), 16) / 255;
            const g = parseInt(colorHex.slice(3, 5), 16) / 255;
            const b = parseInt(colorHex.slice(5, 7), 16) / 255;

            const x = p.lightX as number;
            const y = p.lightY as number;
            const z = p.lightZ as number;

            // Remove existing light component
            lightNode.components.clear();
            lightNode.addComponent(new Transform());

            // Add new light based on type
            switch (lightType) {
                case 'Ambient':
                    lightNode.addComponent(
                        new Light({
                            type: LightType.Ambient,
                            color: { r, g, b },
                            intensity,
                        })
                    );
                    break;

                case 'Directional':
                    lightNode.addComponent(
                        new Light({
                            type: LightType.Directional,
                            color: { r, g, b },
                            intensity,
                            castShadow: true,
                            target: { x: 0, y: 0, z: 0 },
                        })
                    );
                    lightNode.transform.position = { x, y, z };
                    break;

                case 'Point':
                    lightNode.addComponent(
                        new Light({
                            type: LightType.Point,
                            color: { r, g, b },
                            intensity,
                            distance: 15,
                            decay: 2,
                            castShadow: false,
                        })
                    );
                    lightNode.transform.position = { x, y, z };
                    break;

                case 'Spot':
                    lightNode.addComponent(
                        new Light({
                            type: LightType.Spot,
                            color: { r, g, b },
                            intensity,
                            distance: 20,
                            angle: Math.PI / 6,
                            penumbra: 0.3,
                            decay: 2,
                            castShadow: true,
                            target: { x: 0, y: 0, z: 0 },
                        })
                    );
                    lightNode.transform.position = { x, y, z };
                    break;
            }
        }

        // Initialize light
        updateLight(params);

        return {
            scene,
            animate: (_time: number, p: ParamValues) => {
                // Update light when parameters change
                updateLight(p);
            },
        };
    },
};
