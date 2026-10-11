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
    AudioListener,
    AudioSource,
    Environment,
    ComponentType,
} from "@joroya/core";

const SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3";
// Mixkit free sample (GSM ringtone type beep).

export function createAudioScene() {
    const scene = new Scene();
    const root = scene.root;

    // 1. Camera with Listener
    const cameraNode = new Node("camera");
    cameraNode.transform.position = { x: 0, y: 2, z: 5 };

    // Attach AudioListener to Camera
    cameraNode.addComponent(
        new AudioListener({
            masterVolume: 0.5,
        })
    );

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

    // 2. Environment
    const envNode = new Node("environment");
    envNode.addComponent(
        new Environment({
            background: { r: 0.1, g: 0.1, b: 0.1 },
        })
    );
    root.add(envNode);

    // 3. Ground with Grid
    const floor = new Node("floor");
    floor.addComponent(createPlane(20, 20, 20, 20));
    floor.addComponent(
        new Material({
            // `wireframe` is not part of MaterialDef — the v1 material is
            // PBR-only. For a wireframe look, use line geometry or a
            // dedicated wireframe overlay mesh.
            color: { r: 0.3, g: 0.3, b: 0.3 },
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
            color: { r: 1, g: 1, b: 1 },
            intensity: 1.0,
            distance: 20,
        })
    );
    lightNode.transform.position = { x: 0, y: 5, z: 2 };
    root.add(lightNode);

    // 5. Sound Source (Rotating Cube)
    const cubeNode = new Node("singing-cube");
    cubeNode.addComponent(createBox(1, 1, 1));
    cubeNode.addComponent(
        new Material({
            color: { r: 0.2, g: 0.8, b: 0.2 },
            roughness: 0.2,
            metalness: 0.5,
        })
    );

    // Audio Source
    cubeNode.addComponent(
        new AudioSource({
            url: SOUND_URL,
            loop: true,
            autoplay: true,
            refDistance: 1,
            rolloffFactor: 1,
            volume: 1.0,
        })
    );

    root.add(cubeNode);

    // Animation: Rotate cube around center
    function animate(time: number) {
        const radius = 3;
        const speed = 1.0;

        const x = Math.sin(time * speed) * radius;
        const z = Math.cos(time * speed) * radius;

        cubeNode.transform.position = { x, y: 1, z };
        // Rotate cube itself
        const rotSpeed = 2;
        // Simple Y rotation approx
        cubeNode.transform.rotation = {
            x: 0,
            y: Math.sin(time * rotSpeed),
            z: 0,
            w: Math.cos(time * rotSpeed)
        };

        // Update visual indicator color pulsing
        const mat = cubeNode.getComponent<Material>(ComponentType.Material);
        if (mat) {
            const intensity = (Math.sin(time * 10) + 1) * 0.5; // 0 to 1
            mat.definition.emissive = { r: 0, g: intensity * 0.5, b: 0 };
        }
    }

    return { scene, animate, cameraNode };
}
