import {
    Scene,
    Node,
    Camera,
    CameraType,
    Light,
    LightType,
    createBox,
    Material,
    Animator,
} from "@joroya/core";

export function createAnimationScene() {
    const scene = new Scene();
    const root = scene.root;

    // Camera
    const cameraNode = new Node("camera");
    cameraNode.transform.position = { x: 0, y: 5, z: 10 };
    cameraNode.transform.lookAt({ x: 0, y: 0, z: 0 });
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

    // Lights
    const light = new Node("light");
    light.addComponent(new Light({ type: LightType.Directional, intensity: 1 }));
    light.transform.position = { x: 5, y: 10, z: 5 };
    root.add(light);

    const ambient = new Node("ambient");
    ambient.addComponent(new Light({ type: LightType.Ambient, intensity: 0.5 }));
    root.add(ambient);

    // Object with Animator
    const box = new Node("animated-box");
    box.addComponent(createBox(1, 1, 1));
    box.addComponent(new Material({ color: { r: 1, g: 0.5, b: 0 } }));

    // Add Animator component
    // Even if it doesn't play anything yet, it verifies the system doesn't crash
    box.addComponent(new Animator({
        playing: true,
        currentAnimation: 'idle'
    }));

    root.add(box);

    // Manual animation loop for now since we don't have clip parsing
    function animate(time: number) {
        box.transform.rotation.y = time;
        box.transform.position.y = Math.sin(time) * 2;
        box.transform.updateLocalMatrix();
    }

    return { scene, animate, cameraNode };
}
