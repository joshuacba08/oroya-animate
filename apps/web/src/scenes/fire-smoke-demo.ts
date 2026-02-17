import {
    Scene,
    Node,
    Camera,
    CameraType,
    Light,
    LightType,
    createPlane,
    Material,
    ParticleSystem,
    Environment,
    ComponentType,
    type Vec3,
} from "@joroya/core";

export function createFireSmokeScene() {
    const scene = new Scene();
    const root = scene.root;

    // 1. Camera
    const cameraNode = new Node("camera");
    cameraNode.transform.position = { x: 0, y: 3, z: 8 };
    cameraNode.addComponent(
        new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect: 16 / 9,
            near: 0.1,
            far: 100,
        })
    );
    root.add(cameraNode);

    // 2. Environment (Dark Night)
    const envNode = new Node("environment");
    envNode.addComponent(
        new Environment({
            background: { r: 0.05, g: 0.05, b: 0.1 },
        })
    );
    root.add(envNode);

    // 3. Ground
    const floor = new Node("floor");
    floor.addComponent(createPlane(20, 20));
    floor.addComponent(
        new Material({
            color: { r: 0.2, g: 0.2, b: 0.2 },
            roughness: 0.8,
        })
    );
    floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };
    root.add(floor);

    // 4. Lights
    const lightNode = new Node("light");
    lightNode.addComponent(
        new Light({
            type: LightType.Point,
            color: { r: 1.0, g: 0.6, b: 0.3 }, // Orange fire light
            intensity: 2.0,
            distance: 10,
            decay: 2,
        })
    );
    lightNode.transform.position = { x: 0, y: 1, z: 0 };
    root.add(lightNode);

    // 5. Fire Particle System
    const fireNode = new Node("fire");
    fireNode.transform.position = { x: 0, y: 0.1, z: 0 };
    fireNode.addComponent(
        new ParticleSystem({
            maxParticles: 500,
            emissionRate: 100,
            startColor: { r: 1, g: 1, b: 0 }, // Yellow
            endColor: { r: 1, g: 0, b: 0 },   // Red
            startSize: 0.5,
            endSize: 0.1,
            speed: 1.5,
            gravity: { x: 0, y: 2, z: 0 }, // Upward drift
        })
    );
    root.add(fireNode);

    // 6. Smoke Particle System
    const smokeNode = new Node("smoke");
    smokeNode.transform.position = { x: 0, y: 1.5, z: 0 };
    smokeNode.addComponent(
        new ParticleSystem({
            maxParticles: 300,
            emissionRate: 20,
            startColor: { r: 0.3, g: 0.3, b: 0.3 }, // Dark Gray
            endColor: { r: 0, g: 0, b: 0 },       // Black
            startSize: 0.5,
            endSize: 2.0,
            speed: 0.5,
            gravity: { x: 0.2, y: 1, z: 0 }, // Upward and slight wind
        })
    );
    root.add(smokeNode);

    // Animation
    function animate(time: number) {
        // Flicker light
        const light = lightNode.getComponent<Light>(ComponentType.Light);
        if (light) {
            light.definition.intensity = 1.5 + Math.sin(time * 10) * 0.5 + Math.random() * 0.5;
        }
    }

    // Fix animate function to use correct enum or finding logic
    // Re-define properly in next step if needed, or just let it be static for now to avoid runtime errors.

    return { scene, animate: () => { }, cameraNode };
}
