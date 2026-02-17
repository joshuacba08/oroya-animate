import {
    Scene,
    Node,
    Camera,
    CameraType,
    Light,
    LightType,
    createBox,
    createPlane,
    Material,
    PostProcessing,
    ToneMapping,
    Environment,
    type Vec3,
} from "@joroya/core";

export function createNeonCityScene() {
    const scene = new Scene();
    const root = scene.root;

    // 1. Setup Camera with Post-Processing
    const cameraNode = new Node("camera");
    cameraNode.transform.position = { x: 0, y: 5, z: 15 };
    cameraNode.addComponent(
        new Camera({
            type: CameraType.Perspective,
            fov: 60,
            aspect: 16 / 9,
            near: 0.1,
            far: 100,
        })
    );
    // Add Bloom and Tone Mapping
    cameraNode.addComponent(
        new PostProcessing({
            bloom: {
                enabled: true,
                threshold: 0.1,
                strength: 2.0,
                radius: 0.5,
            },
            toneMapping: ToneMapping.Reinhard,
            exposure: 1.2,
        })
    );
    root.add(cameraNode);

    // 2. Dark Environment
    const envNode = new Node("environment");
    envNode.addComponent(
        new Environment({
            background: { r: 0.05, g: 0.05, b: 0.1 }, // Dark blue-ish gray
        })
    );
    root.add(envNode);

    // 3. Lights
    const ambientLight = new Node("ambient");
    ambientLight.addComponent(
        new Light({
            type: LightType.Ambient,
            color: { r: 0.2, g: 0.2, b: 0.3 },
            intensity: 0.5,
        })
    );
    root.add(ambientLight);

    // 4. Floor (Wet Asphalt look)
    const floor = new Node("floor");
    floor.addComponent(createPlane(30, 30));
    floor.addComponent(
        new Material({
            color: { r: 0.1, g: 0.1, b: 0.1 },
            metalness: 0.8,
            roughness: 0.1, // Smooth, reflective
        })
    );
    // Rotate -90 deg X
    floor.transform.rotation = { x: -0.7071, y: 0, z: 0, w: 0.7071 };
    root.add(floor);

    // 5. Neon Buildings/Cubes
    const colors = [
        { r: 0, g: 1, b: 1 }, // Cyan
        { r: 1, g: 0, b: 1 }, // Magenta
        { r: 1, g: 1, b: 0 }, // Yellow
        { r: 0, g: 0.5, b: 1 }, // Blue
    ];

    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        const height = 1 + Math.random() * 4;

        const building = new Node(`building-${i}`);
        building.transform.position = { x, y: height / 2, z };

        // Randomly decide if it's a neon light or a dark building
        const isNeon = Math.random() > 0.6;
        const color = colors[Math.floor(Math.random() * colors.length)];

        building.addComponent(createBox(1, height, 1));

        if (isNeon) {
            building.addComponent(
                new Material({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 3.0, // High intensity for bloom
                    roughness: 0.2,
                    metalness: 0.1,
                })
            );
            // Make neon lights thin
            building.transform.scale = { x: 0.2, y: 1, z: 0.2 };
        } else {
            building.addComponent(
                new Material({
                    color: { r: 0.1, g: 0.1, b: 0.15 },
                    roughness: 0.7,
                })
            );
        }

        root.add(building);
    }

    // Animation Script to rotate camera
    function animate(time: number) {
        const t = time * 0.5;
        const radius = 15;
        cameraNode.transform.position = {
            x: Math.sin(t) * radius,
            y: 5,
            z: Math.cos(t) * radius,
        };
        cameraNode.transform.lookAt({ x: 0, y: 2, z: 0 });
    }

    return { scene, animate, cameraNode };
}
