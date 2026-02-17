import {
    Scene,
    Node,
    createSphere,
    createPlane,
    createBox,
    Material,
    Camera,
    CameraType,
    Light,
    LightType,
    Environment,
    FogType,
    type Vec3,
    type Quat
} from '@joroya/core';

export function createShadowsScene(aspect: number = 16 / 9) {
    const scene = new Scene();

    // Camera
    const cameraNode = new Node('camera');
    cameraNode.addComponent(
        new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect,
            near: 0.1,
            far: 100,
        })
    );
    cameraNode.transform.position = { x: 5, y: 5, z: 10 };
    cameraNode.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.root.add(cameraNode);

    // Environment
    const envNode = new Node('environment');
    envNode.addComponent(
        new Environment({
            background: { r: 0.8, g: 0.8, b: 0.9 }, // Sky blue-ish gray
            ambientLight: {
                color: { r: 0.3, g: 0.3, b: 0.4 },
                intensity: 0.5,
            },
        })
    );
    scene.root.add(envNode);

    // Main Light (Directional, Casting Shadows)
    const mainLight = new Node('sun-light');
    mainLight.addComponent(
        new Light({
            type: LightType.Directional,
            color: { r: 1, g: 0.95, b: 0.9 },
            intensity: 1.5,
            castShadow: true,
            shadowMapSize: 2048,
            shadowBias: -0.001,
        })
    );
    mainLight.transform.position = { x: 10, y: 20, z: 10 };
    mainLight.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.root.add(mainLight);

    // Floor (Receives Shadows)
    const floor = new Node('floor');
    floor.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
    floor.addComponent(
        new Material({
            color: { r: 0.8, g: 0.8, b: 0.8 },
            roughness: 1.0,
            metalness: 0.0,
        })
    );
    floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 }; // Rotate -90 deg X
    scene.root.add(floor);

    // Floating Cube (Casts Shadows)
    const cube = new Node('shadow-caster-cube');
    cube.addComponent(createBox(2, 2, 2, { castShadow: true, receiveShadow: true }));
    cube.addComponent(
        new Material({
            color: { r: 0.2, g: 0.6, b: 1.0 },
            roughness: 0.2,
            metalness: 0.5,
        })
    );
    cube.transform.position = { x: -2, y: 2, z: 0 };
    scene.root.add(cube);

    // Floating Sphere (Casts Shadows)
    const sphere = new Node('shadow-caster-sphere');
    sphere.addComponent(createSphere(1.5, 32, 32, { castShadow: true, receiveShadow: true }));
    sphere.addComponent(
        new Material({
            color: { r: 1.0, g: 0.4, b: 0.2 },
            roughness: 0.4,
            metalness: 0.1,
        })
    );
    sphere.transform.position = { x: 2, y: 3, z: 2 };
    scene.root.add(sphere);

    function animate(time: number) {
        // Rotate cube
        cube.transform.rotation = {
            x: time * 0.5,
            y: time * 0.3,
            z: 0,
            w: 1 // Simplified, logic should normalize if using Quat directly, but renderer handles it usually with Euler underneath or just set from Quat.
            // Actually transform system expects a valid quat.
            // Let's use basic rotation logic if we had a helper, but here let's valid quat.
        };
        // Proper Quat rotation for spinning
        const s = Math.sin(time * 0.5);
        const c = Math.cos(time * 0.5);
        cube.transform.rotation = { x: 0, y: s, z: 0, w: c };

        // Bob sphere
        sphere.transform.position.y = 3 + Math.sin(time * 2) * 1.0;
    }

    return { scene, animate, cameraNode };
}
