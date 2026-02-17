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
    Environment,
    FogType,
} from '@joroya/core';
import type { DemoSceneDef, ParamValues } from '../types';

export const TexturesDemo: DemoSceneDef = {
    id: 'textures-environment',
    label: 'Textures & Environment',
    description: 'Showcase of texture mapping (diffuse, normal, PBR) and environment settings',
    renderer: 'three',
    controls: [
        {
            type: 'slider',
            key: 'roughness',
            label: 'Roughness',
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.2,
        },
        {
            type: 'slider',
            key: 'metalness',
            label: 'Metalness',
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.8,
        },
        {
            type: 'slider',
            key: 'envIntensity',
            label: 'Env Intensity',
            min: 0,
            max: 5,
            step: 0.1,
            defaultValue: 1,
        },
        {
            type: 'select',
            key: 'showFog',
            label: 'Enable Fog',
            options: [
                { value: 'true', label: 'On' },
                { value: 'false', label: 'Off' },
            ],
            defaultValue: 'false',
        },
        {
            type: 'slider',
            key: 'fogDensity',
            label: 'Fog Density',
            min: 0,
            max: 0.1,
            step: 0.001,
            defaultValue: 0.02,
        },
    ],
    factory: (params: ParamValues) => {
        const scene = new Scene();

        // Environment
        const env = new Node('environment');
        env.addComponent(
            new Environment({
                background: { r: 0.1, g: 0.1, b: 0.2 }, // Dark blueish background
                fog: params.showFog === 'true'
                    ? {
                        type: FogType.Exponential,
                        color: { r: 0.1, g: 0.1, b: 0.2 },
                        density: params.fogDensity as number,
                    }
                    : undefined,
                ambientLight: {
                    color: { r: 1, g: 1, b: 1 },
                    intensity: 0.5,
                },
            })
        );
        scene.root.add(env);

        // Camera
        const cameraNode = new Node('camera');
        cameraNode.addComponent(
            new Camera({
                type: CameraType.Perspective,
                fov: 60,
                aspect: 1, // Will be updated by renderer
                near: 0.1,
                far: 100,
            })
        );
        cameraNode.transform.position = { x: 0, y: 2, z: 5 };
        // Manual rotation (Quat) to look roughly at center from (0,2,5)
        // Approximate lookAt(0,0,0) from (0,2,5)
        // For now, identity is fine as OrbitControls will take over
        scene.root.add(cameraNode);

        // Lights
        const dirLight = new Node('dir-light');
        dirLight.addComponent(
            new Light({
                type: LightType.Directional,
                color: { r: 1, g: 0.9, b: 0.8 },
                intensity: 2,
                castShadow: true,
            })
        );
        dirLight.transform.position = { x: 5, y: 10, z: 5 };
        // Directional light direction is usually derived from rotation in engines,
        // but here light logic might need update. For now position implies direction for shadowmap in Three.js
        scene.root.add(dirLight);

        // Textured Sphere (Simulating Earth-like object)
        // Note: Using placeholder textures from a reliable source or data URIs would be ideal.
        // For this demo, we assume these URLs handle caching or fail gracefully.
        // Using a simple grid texture for diffuse/normal/roughness to demonstrate mapping.
        const textureBase = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/uv_grid_opengl.jpg';

        const sphere = new Node('textured-sphere');
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
                color: { r: 1, g: 1, b: 1 },
                map: textureBase,
                roughness: params.roughness as number,
                metalness: params.metalness as number,
                envMap: textureBase, // Using grid as env map for reflection check
                envMapIntensity: params.envIntensity as number,
            })
        );
        sphere.transform.position = { x: 0, y: 0, z: 0 };
        scene.root.add(sphere);

        // Floor
        const floor = new Node('floor');
        floor.addComponent(
            new Geometry({
                type: GeometryPrimitive.Plane,
                width: 10,
                height: 10,
                widthSegments: 1,
                heightSegments: 1,
            })
        );
        floor.addComponent(
            new Material({
                color: { r: 0.2, g: 0.2, b: 0.2 },
                roughness: 0.8,
                metalness: 0.1,
            })
        );
        // Rotation -90 deg around X axis
        // Quaternion for -90 deg X: x = -0.707, y = 0, z = 0, w = 0.707
        floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };
        floor.transform.position = { x: 0, y: -1.5, z: 0 };
        scene.root.add(floor);

        // Simple animation
        const animate = (t: number) => {
            // Rotate sphere around Y axis
            // Half angle formula: q = [0, sin(theta/2), 0, cos(theta/2)]
            const angle = t * 0.5;
            sphere.transform.rotation = {
                x: 0,
                y: Math.sin(angle / 2),
                z: 0,
                w: Math.cos(angle / 2)
            };
        };

        return { scene, animate };
    },
};
