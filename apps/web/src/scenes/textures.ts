import {
    Scene,
    Node,
    createSphere,
    createPlane,
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

export function createTexturesScene(aspect: number = 16 / 9) {
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
    cameraNode.transform.position = { x: 0, y: 2, z: 5 };
    cameraNode.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.root.add(cameraNode);

    // Environment
    const envNode = new Node('environment');
    envNode.addComponent(
        new Environment({
            background: { r: 0.1, g: 0.1, b: 0.15 },
            fog: {
                type: FogType.Exponential,
                color: { r: 0.1, g: 0.1, b: 0.15 },
                density: 0.05,
            },
            ambientLight: {
                color: { r: 0.2, g: 0.2, b: 0.2 },
                intensity: 1,
            },
        })
    );
    scene.root.add(envNode);

    // Lights
    const mainLight = new Node('main-light');
    mainLight.addComponent(
        new Light({
            type: LightType.Directional,
            color: { r: 1, g: 0.95, b: 0.9 },
            intensity: 2.0,
        })
    );
    mainLight.transform.position = { x: 5, y: 10, z: 5 };
    mainLight.transform.lookAt({ x: 0, y: 0, z: 0 });
    scene.root.add(mainLight);

    const blueLight = new Node('blue-light');
    blueLight.addComponent(
        new Light({
            type: LightType.Point,
            color: { r: 0.2, g: 0.5, b: 1.0 },
            intensity: 1.0,
            distance: 10,
        })
    );
    blueLight.transform.position = { x: -4, y: 2, z: 0 };
    scene.root.add(blueLight);

    // Textured Sphere
    const sphere = new Node('textured-sphere');
    sphere.addComponent(createSphere(1.2, 64, 64)); // Increased segments for better lighting

    // Using a grid texture for demonstration if available, or just properties
    // For the web demo, we might not have the placeholder texture handy.
    // We'll focus on PBR properties.
    sphere.addComponent(
        new Material({
            color: { r: 1, g: 1, b: 1 },
            roughness: 0.2, // Shiny
            metalness: 0.8, // Metallic
            // map: '/assets/textures/grid.png', // Assuming we might have assets or just rely on color
        })
    );
    sphere.transform.position = { x: 0, y: 1.2, z: 0 };
    scene.root.add(sphere);

    // Floor
    const floor = new Node('floor');
    floor.addComponent(createPlane(20, 20));
    floor.addComponent(
        new Material({
            color: { r: 0.2, g: 0.2, b: 0.2 },
            roughness: 0.8,
            metalness: 0.2,
        })
    );
    // Rotate -90 degrees around X to be horizontal
    floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };
    floor.transform.position = { x: 0, y: 0, z: 0 };
    scene.root.add(floor);

    // Orbiting satelites to show reflections
    const satellites: Node[] = [];
    const colors = [
        { r: 1, g: 0.2, b: 0.2 },
        { r: 0.2, g: 1, b: 0.2 },
        { r: 0.2, g: 0.2, b: 1 },
    ];

    for (let i = 0; i < 3; i++) {
        const sat = new Node(`sat-${i}`);
        sat.addComponent(createSphere(0.3, 32, 32));
        sat.addComponent(new Material({
            color: colors[i],
            emissive: colors[i],
            emissiveIntensity: 2.0
        }));
        scene.root.add(sat);
        satellites.push(sat);
    }

    function animate(time: number) {
        // Rotate sphere
        const rotY = time * 0.5;
        sphere.transform.rotation = {
            x: 0,
            y: Math.sin(rotY / 2),
            z: 0,
            w: Math.cos(rotY / 2)
        };
        // sphere.transform.updateLocalMatrix(); // Not strictly needed as renderer handles it, but good practice if checking matrix manually

        // Animate satellites
        satellites.forEach((sat, i) => {
            const angle = time + (i * (Math.PI * 2 / 3));
            const r = 2.5;
            sat.transform.position = {
                x: Math.cos(angle) * r,
                y: 1.2 + Math.sin(time * 2 + i) * 0.5,
                z: Math.sin(angle) * r
            };
        });

        // Dynamic fog breathing
        // const fog = envNode.getComponent<Environment>(ComponentType.Environment)?.fog;
        // if (fog && fog.type === FogType.Exponential) {
        //     fog.density = 0.05 + Math.sin(time * 0.5) * 0.02;
        // }
        // Note: Component getters might be complex to type here without imports. 
        // Keeping it simple.
    }

    return { scene, animate, cameraNode };
}
