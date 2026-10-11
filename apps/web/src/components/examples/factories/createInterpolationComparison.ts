import {
AnimationMixer,
Camera,
CameraType,
createBox,
createSphere,
Material,
Node,
Scene,
type AnimationClip,
type KeyframeTrack
} from "@joroya/core";
import { addDefaultLighting } from "./shared";

export function createInterpolationComparison() {
  const scene = new Scene();

  const cam = new Node("camera");
  cam.addComponent(
    new Camera({
      type: CameraType.Perspective,
      fov: 50,
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    })
  );
  cam.transform.position = { x: 0, y: 2.5, z: 10 };
  scene.add(cam);
  addDefaultLighting(scene);

  const ground = new Node("ground");
  ground.addComponent(createBox(16, 0.1, 6));
  ground.addComponent(
    new Material({ color: { r: 0.08, g: 0.08, b: 0.12 }, metalness: 0.2, roughness: 0.9 })
  );
  ground.transform.position = { x: 0, y: -1.5, z: 0 };
  scene.add(ground);

  const modes: { name: string; color: { r: number; g: number; b: number }; x: number }[] = [
    { name: "linear", color: { r: 0.3, g: 0.6, b: 1.0 }, x: -3.5 },
    { name: "step", color: { r: 1.0, g: 0.4, b: 0.3 }, x: 0 },
    { name: "cubic", color: { r: 0.3, g: 0.9, b: 0.5 }, x: 3.5 },
  ];

  for (const mode of modes) {
    const pedestal = new Node(`pedestal - ${mode.name} `);
    pedestal.addComponent(createBox(2, 0.15, 2));
    pedestal.addComponent(
      new Material({ color: { r: 0.15, g: 0.15, b: 0.2 }, metalness: 0.3, roughness: 0.7 })
    );
    pedestal.transform.position = { x: mode.x, y: -1.35, z: 0 };
    scene.add(pedestal);

    const pivot = new Node(`pivot - ${mode.name} `);
    pivot.transform.position = { x: mode.x, y: 0, z: 0 };
    scene.add(pivot);

    const sphere = new Node(`sphere - ${mode.name} `);
    sphere.addComponent(createSphere(0.6, 32, 32));
    sphere.addComponent(
      new Material({
        color: mode.color,
        metalness: 0.5,
        roughness: 0.3,
        emissive: { r: mode.color.r * 0.1, g: mode.color.g * 0.1, b: mode.color.b * 0.1 },
      })
    );
    pivot.add(sphere);
  }

  const duration = 2.0;
  const times = new Float32Array([0, 1, 2]);

  const linearTrack: KeyframeTrack = {
    targetNodeName: "sphere-linear",
    property: "position",
    times,
    values: new Float32Array([0, 0, 0, 0, 2.5, 0, 0, 0, 0]),
    interpolation: "linear",
  };

  const stepTrack: KeyframeTrack = {
    targetNodeName: "sphere-step",
    property: "position",
    times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
    values: new Float32Array([
      0, 0, 0,
      0, 1.25, 0,
      0, 2.5, 0,
      0, 1.25, 0,
      0, 0, 0,
    ]),
    interpolation: "step",
  };

  // glTF CUBICSPLINE: [in-tangent, value, out-tangent] per keyframe (stride=3 per Vec3)
  const cubicTrack: KeyframeTrack = {
    targetNodeName: "sphere-cubic",
    property: "position",
    times,
    values: new Float32Array([
      // KF 0: in-tangent, value, out-tangent
      0, 0, 0, 0, 0, 0, 0, 5, 0,
      // KF 1: in-tangent, value, out-tangent
      0, 0, 0, 0, 2.5, 0, 0, 0, 0,
      // KF 2: in-tangent, value, out-tangent
      0, -5, 0, 0, 0, 0, 0, 0, 0,
    ]),
    interpolation: "cubicspline",
  };

  const clip: AnimationClip = {
    name: "interpolation-comparison",
    duration,
    tracks: [linearTrack, stepTrack, cubicTrack],
  };

  const mixer = new AnimationMixer(scene);
  // v0.9 signature: `play(clip, { loop, speed })` — the boolean form is gone.
  mixer.play(clip, { loop: true });

  let lastTime = -1;
  function animate(time: number) {
    if (lastTime === -1) lastTime = time;
    const delta = time - lastTime;
    lastTime = time;
    mixer.update(delta);
  }

  return { scene, animate };
}
