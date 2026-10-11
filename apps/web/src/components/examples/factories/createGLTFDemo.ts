import {
AnimationMixer,
Camera,
CameraType,
Node,
Scene,
type AnimationClip
} from "@joroya/core";
import { addDefaultLighting } from "./shared";

export function createGLTFDemo() {
  const scene = new Scene();
  const mixer = new AnimationMixer(scene);

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 60,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 1.5, z: 4 };
  scene.add(cam);
  addDefaultLighting(scene);

  let disposed = false;
  // Load the model asynchronously
  // Note: The factory function is synchronous, but we can load async content into the scene.
  void import('@joroya/loader-gltf').then(({ loadGLTF }) => loadGLTF('/models/BoxAnimated.glb')).then(({ scene: gltfScene, animations }: { scene: Scene, animations: AnimationClip[] }) => {
    if (disposed) return;
    // Add the glTF scene root to our main scene
    scene.root.add(gltfScene.root);

    // Play the first animation if available
    if (animations.length > 0) {
      mixer.play(animations[0]);
    }
  }).catch((err: unknown) => {
    if (!disposed) console.error("Failed to load glTF model:", err);
  });

  let lastTime = -1;

  return {
    scene,
    dispose: () => { disposed = true; mixer.stop(); },
    animate: (time: number) => {
      // time is in seconds
      if (lastTime === -1) {
        lastTime = time;
      }
      const delta = time - lastTime;
      lastTime = time;
      mixer.update(delta);
    }
  };
}
