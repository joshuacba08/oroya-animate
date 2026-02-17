import {
    Scene,
    Node,
    createSphere,
    createCone,
    createPlane,
    Material,
    Camera,
    CameraType,
    Light,
    LightType,
    Environment,
    type Vec3
} from '@joroya/core';

export function createLookAtScene(aspect: number = 16 / 9) {
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
    cameraNode.transform.position = { x: 0, y: 12, z: 8 };
    cameraNode.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.root.add(cameraNode);

    // Environment
    const envNode = new Node('environment');
    envNode.addComponent(
        new Environment({
            background: { r: 0.9, g: 0.9, b: 0.95 }, // Bright day
            ambientLight: {
                color: { r: 0.6, g: 0.6, b: 0.7 },
                intensity: 1,
            },
        })
    );
    scene.root.add(envNode);

    // Light
    const light = new Node('dir-light');
    light.addComponent(
        new Light({
            type: LightType.Directional,
            color: { r: 1, g: 1, b: 1 },
            intensity: 1.0,
        })
    );
    light.transform.position = { x: 10, y: 15, z: 10 };
    light.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.root.add(light);

    // Target object
    const targetNode = new Node('target');
    targetNode.addComponent(createSphere(0.4, 32, 32));
    targetNode.addComponent(
        new Material({
            color: { r: 1, g: 0.2, b: 0.2 }, // Red
        })
    );
    scene.root.add(targetNode);

    // Watchers
    const watchers: Node[] = [];
    const watcherCount = 12;
    const radius = 6;

    for (let i = 0; i < watcherCount; i++) {
        const angle = (i / watcherCount) * Math.PI * 2;
        const watcher = new Node(`watcher-${i}`);

        // Create visual cone pointing "forward" (-Z)
        // Original ConeY points up (+Y). Rotate -90 X to point -Z? 
        // Or actually, let's just make it point towards +Z and see.
        // If we want the cone tip to point at target.
        // Cone tip is at +Y/2? No, usually center is 0. 
        // Let's assume standard cone points +Y.

        const visual = new Node('visual');
        visual.addComponent(createCone(0.3, 1.0, 16));
        visual.addComponent(new Material({ color: { r: 0.2, g: 0.5, b: 1.0 } }));

        // Rotate visual so +Y (tip) aligns with -Z (forward)
        // Rotate -90 degrees around X.
        visual.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };

        watcher.add(visual);

        watcher.transform.position = {
            x: Math.cos(angle) * radius,
            y: 0.5, // slightly hovering
            z: Math.sin(angle) * radius
        };
        watchers.push(watcher);
        scene.root.add(watcher);
    }

    // Grid Floor
    const floor = new Node('floor');
    floor.addComponent(createPlane(20, 20));
    floor.addComponent(new Material({
        color: { r: 0.8, g: 0.8, b: 0.8 },
        roughness: 0.5
    }));
    floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };
    floor.transform.position = { x: 0, y: -0.5, z: 0 };
    scene.root.add(floor);

    function animate(time: number) {
        // Move target
        const t = time * 1.5;
        targetNode.transform.position = {
            x: Math.sin(t) * 4,
            y: 0,
            z: Math.sin(t * 2) * 2 // Figure 8
        };

        // Update watchers
        watchers.forEach(watcher => {
            watcher.transform.lookAt(targetNode.transform.position);
        });
    }

    return { scene, animate, cameraNode };
}
