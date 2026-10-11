import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { Scene, Node, Geometry, GeometryPrimitive, Material, Camera, CameraType, ComponentType, Interactive, AudioSource, Skin, Animator, Environment, type Plugin } from '@joroya/core';
import { ThreeRenderer } from '../src/ThreeRenderer';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return { ...actual, WebGLRenderer: class {
    domElement = { width: 640, height: 480 };
    shadowMap = {};
    setSize() {} setPixelRatio() {} render() {} dispose = vi.fn();
    getSize(target: THREE.Vector2) { return target.set(640, 480); }
    getPixelRatio() { return 1; }
  } };
});
vi.mock('three/addons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three/addons')>();
  return { ...actual, EffectComposer: class {
    passes: THREE.Object3D[] = [];
    dispose = vi.fn(); setSize() {}
  } };
});

interface Harness {
  scene: THREE.Scene;
  nodeMap: Map<string, THREE.Object3D>;
  reverseNodeMap: Map<THREE.Object3D, Node>;
  activeCamera: THREE.Camera;
  hoveredNode: Node | null;
  renderer: { dispose: ReturnType<typeof vi.fn> };
  composer: { dispose: ReturnType<typeof vi.fn> } | null;
  textureCache: Map<string, THREE.Texture>;
}
function setup() {
  vi.stubGlobal('window', { devicePixelRatio: 1 });
  const canvas = Object.assign(new EventTarget(), { style: { cursor: '' }, width: 640, height: 480 }) as unknown as HTMLCanvasElement;
  const renderer = new ThreeRenderer({ canvas, width: 640, height: 480 });
  return { renderer, state: renderer as unknown as Harness, canvas };
}
function mesh(name = 'mesh') {
  const node = new Node(name);
  node.addComponent(new Geometry({ type: GeometryPrimitive.Box, width: 1, height: 1, depth: 1 }));
  node.addComponent(new Material({ color: { r: 1, g: 0, b: 0 } }));
  return node;
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Three.js scene reconciliation and ownership', () => {
  it('matches core world matrices across nested translation, rotation and nonuniform scale', () => {
    const { renderer, state } = setup();
    const scene = new Scene(); const a = new Node(); const b = new Node(); const c = mesh();
    scene.root.transform.setPosition({ x: 3, y: -1, z: 2 });
    a.transform.setPosition({ x: 10, y: 2, z: 1 });
    a.transform.setRotation({ x: 0, y: Math.sin(0.4), z: 0, w: Math.cos(0.4) });
    a.transform.setScale({ x: 2, y: 3, z: 4 });
    b.transform.setRotation({ x: Math.sin(0.2), y: 0, z: 0, w: Math.cos(0.2) });
    b.transform.setScale({ x: 1, y: 2, z: 0.5 });
    c.transform.setPosition({ x: 2, y: 4, z: -1 });
    scene.add(a); a.add(b); b.add(c); renderer.mount(scene); renderer.render(0);
    for (const node of [scene.root, a, b, c]) {
      state.nodeMap.get(node.id)!.matrixWorld.elements.forEach((value, i) => expect(value).toBeCloseTo(node.transform.worldMatrix[i], 10));
    }
    renderer.dispose();
  });

  it('adds, reparents and removes objects, maps, camera and hover state', () => {
    const { renderer, state, canvas } = setup();
    const scene = new Scene(); const parent = new Node(); const child = mesh();
    const camera = new Node('camera');
    camera.addComponent(new Camera({ type: CameraType.Perspective, fov: 60, aspect: 1, near: 0.1, far: 100 }));
    scene.add(parent); scene.add(camera); renderer.mount(scene);
    child.addComponent(new Interactive()); scene.add(child); renderer.render(0);
    const object = state.nodeMap.get(child.id)!;
    parent.add(child); renderer.render(0);
    expect(object.parent).toBe(state.nodeMap.get(parent.id));
    state.hoveredNode = child; canvas.style.cursor = 'pointer';
    scene.remove(child); scene.remove(camera); renderer.render(0);
    expect(state.nodeMap.has(child.id)).toBe(false);
    expect(state.reverseNodeMap.has(object)).toBe(false);
    expect(object.parent).toBeNull();
    expect(state.hoveredNode).toBeNull(); expect(canvas.style.cursor).toBe('');
    expect(state.activeCamera).toBeInstanceOf(THREE.PerspectiveCamera);
    expect(state.reverseNodeMap.has(state.activeCamera)).toBe(false);
    renderer.dispose();
  });

  it('disposes shared resources once, after their final owner, and is idempotent', () => {
    const { renderer, state } = setup(); const scene = new Scene(); const a = mesh('a'), b = mesh('b');
    scene.add(a); scene.add(b); renderer.mount(scene);
    const first = state.nodeMap.get(a.id) as THREE.Mesh, second = state.nodeMap.get(b.id) as THREE.Mesh;
    second.geometry.dispose(); (second.material as THREE.Material).dispose();
    second.geometry = first.geometry; second.material = first.material;
    const geometry = vi.spyOn(first.geometry, 'dispose'), material = vi.spyOn(first.material as THREE.Material, 'dispose');
    scene.remove(a); renderer.render(0); expect(geometry).not.toHaveBeenCalled();
    scene.remove(b); renderer.render(0); expect(geometry).toHaveBeenCalledTimes(1); expect(material).toHaveBeenCalledTimes(1);
    const composer = state.composer!;
    renderer.dispose(); renderer.dispose();
    expect(state.renderer.dispose).toHaveBeenCalledTimes(1); expect(composer.dispose).toHaveBeenCalledTimes(1);
    expect(geometry).toHaveBeenCalledTimes(1);
  });

  it('calls plugin object hooks with the original node on removal/remount and plugin hook once', () => {
    const { renderer } = setup(); const dispose = vi.fn(), pluginDispose = vi.fn();
    const plugin: Plugin = { name: 'test', handlers: [{ componentType: ComponentType.Geometry, create: () => new THREE.Group(), dispose }], dispose: pluginDispose };
    renderer.usePlugin(plugin);
    const scene = new Scene(); const node = mesh(); scene.add(node); renderer.mount(scene);
    renderer.mount(new Scene()); expect(dispose).toHaveBeenCalledTimes(1); expect(dispose.mock.calls[0][0]).toBe(node);
    renderer.dispose(); renderer.dispose(); expect(pluginDispose).toHaveBeenCalledTimes(1);
  });



  it('keeps cached textures until the last material releases them', () => {
    const texture = new THREE.Texture();
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockReturnValue(texture);
    const released = vi.spyOn(texture, 'dispose');
    const { renderer, state } = setup(); const scene = new Scene(); const a = mesh('a'), b = mesh('b');
    for (const node of [a, b]) { node.getComponent<Material>(ComponentType.Material)!.definition.map = 'shared.png'; scene.add(node); }
    renderer.mount(scene); scene.remove(a); renderer.render(0);
    expect(released).not.toHaveBeenCalled(); expect(state.textureCache.size).toBe(1);
    scene.remove(b); renderer.render(0);
    expect(released).toHaveBeenCalledTimes(1); expect(state.textureCache.size).toBe(0);
    renderer.dispose(); expect(released).toHaveBeenCalledTimes(1);
  });

  it('copies orbit-control camera changes back into core without resetting the next frame', () => {
    const { renderer, state } = setup(); const scene = new Scene(); const camera = new Node('camera');
    camera.addComponent(new Camera({ type: CameraType.Perspective, fov: 60, aspect: 1, near: 0.1, far: 100 }));
    camera.transform.setPosition({ x: 0, y: 0, z: 5 }); scene.add(camera); renderer.mount(scene);
    const harness = renderer as unknown as { orbitControls: { update(): void; dispose(): void } | null };
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.6);
    const update = vi.fn(() => { state.activeCamera.position.x += 1; state.activeCamera.quaternion.copy(rotation); });
    harness.orbitControls = { update, dispose: vi.fn() };
    renderer.render(0); expect(camera.transform.position.x).toBe(1);
    renderer.render(0); expect(camera.transform.position.x).toBe(2);
    expect(camera.transform.rotation).toEqual({ x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w });
    expect(state.activeCamera.matrixWorld.elements.every(Number.isFinite)).toBe(true);
    renderer.dispose();
  });

  it('releases skeletons, mixers, passes and composer targets during remount', () => {
    const { renderer, state } = setup();
    const scene = new Scene(); const node = mesh('skin'), bone = new Node('bone');
    node.addComponent(new Skin({ boneNames: ['bone'], inverseBindMatrices: new Float32Array(new THREE.Matrix4().elements) }));
    node.addComponent(new Animator());
    scene.add(node); scene.add(bone); renderer.mount(scene);
    const object = state.nodeMap.get(node.id) as THREE.SkinnedMesh;
    const skeleton = vi.spyOn(object.skeleton, 'dispose');
    const animator = node.getComponent<Animator>(ComponentType.Animator)!;
    expect(animator.currentMixer).not.toBeNull();
    const composer = state.composer!;
    const pass = { dispose: vi.fn() };
    (composer as unknown as { passes: unknown[] }).passes.push(pass);
    renderer.mount(new Scene());
    expect(skeleton).toHaveBeenCalledTimes(1);
    expect(pass.dispose).toHaveBeenCalledTimes(1);
    expect(composer.dispose).toHaveBeenCalledTimes(1);
    expect(animator.currentMixer).toBeNull();
    expect(state.composer).not.toBe(composer);
    renderer.dispose();
  });

  it('disconnects retired audio and ignores its pending load', async () => {
    const createAudioNode = () => ({
      connect: vi.fn(), disconnect: vi.fn(),
      gain: { value: 1, setTargetAtTime: vi.fn() },
      setPosition: vi.fn(), setOrientation: vi.fn()
    });
    const context = { createGain: createAudioNode, createPanner: createAudioNode,
      destination: {}, listener: { setPosition: vi.fn(), setOrientation: vi.fn() }, currentTime: 0 };
    vi.spyOn(THREE.AudioContext, 'getContext').mockReturnValue(context as unknown as AudioContext);
    let resolveLoad!: (buffer: AudioBuffer) => void;
    vi.spyOn(THREE.AudioLoader.prototype, 'loadAsync').mockReturnValue(new Promise((resolve) => { resolveLoad = resolve; }));
    const { renderer, state } = setup();
    const scene = new Scene(); const node = new Node('audio');
    node.addComponent(new AudioSource({ url: 'pending.wav', autoplay: true }));
    scene.add(node); renderer.mount(scene);
    const audio = state.nodeMap.get(node.id) as THREE.PositionalAudio;
    const setBuffer = vi.spyOn(audio, 'setBuffer');
    const disconnect = vi.spyOn(audio.gain, 'disconnect');
    scene.remove(node); renderer.render(0);
    resolveLoad({} as AudioBuffer); await Promise.resolve(); await Promise.resolve();
    expect(setBuffer).not.toHaveBeenCalled(); expect(audio.isPlaying).toBe(false);
    expect(disconnect).toHaveBeenCalledTimes(1); renderer.dispose(); renderer.dispose();
  });

  it('tears down plugin objects before unregistering a plugin exactly once', () => {
    const { renderer } = setup(); const objectDispose = vi.fn(), pluginDispose = vi.fn();
    const plugin: Plugin = { name: 'once', handlers: [{ componentType: ComponentType.Geometry, create: () => new THREE.Group(), dispose: objectDispose }], dispose: pluginDispose };
    renderer.usePlugin(plugin); renderer.usePlugin(plugin);
    const scene = new Scene(); scene.add(mesh()); renderer.mount(scene);
    renderer.removePlugin(plugin); renderer.removePlugin(plugin); renderer.dispose();
    expect(objectDispose).toHaveBeenCalledTimes(1); expect(pluginDispose).toHaveBeenCalledTimes(1);
  });

  it('releases removed environment textures after their last material owner', () => {
    const texture = new THREE.Texture(), dispose = vi.spyOn(texture, 'dispose');
    const loneTexture = new THREE.Texture(), loneDispose = vi.spyOn(loneTexture, 'dispose');
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation((url) => url === 'lone.png' ? loneTexture : texture);
    const { renderer, state } = setup(); const scene = new Scene();
    const environment = new Node('environment'); environment.addComponent(new Environment({ background: 'shared.png' }));
    const node = mesh(); node.getComponent<Material>(ComponentType.Material)!.definition.map = 'shared.png';
    scene.add(environment); scene.add(node); renderer.mount(scene); renderer.render(0);
    expect(state.scene.background).toBe(texture);
    scene.remove(environment); renderer.render(0);
    expect(state.scene.background).toBeNull(); expect(dispose).not.toHaveBeenCalled();
    scene.remove(node); renderer.render(0);
    expect(dispose).toHaveBeenCalledTimes(1); expect(state.textureCache.size).toBe(0);
    const lone = new Node('environment-only'); lone.addComponent(new Environment({ background: 'lone.png' }));
    scene.add(lone); renderer.render(0); scene.remove(lone); renderer.render(0);
    expect(state.textureCache.size).toBe(0); expect(loneDispose).toHaveBeenCalledTimes(1);
    renderer.dispose(); expect(dispose).toHaveBeenCalledTimes(1); expect(loneDispose).toHaveBeenCalledTimes(1);
  });

  it('prevents a retired texture load from repopulating a remounted scene', () => {
    let done: ((texture: THREE.Texture) => void) | undefined;
    const texture = new THREE.Texture(), dispose = vi.spyOn(texture, 'dispose');
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation((_url, onLoad) => { done = onLoad; return texture; });
    const { renderer, state } = setup(); const scene = new Scene(); const node = mesh();
    node.getComponent<Material>(ComponentType.Material)!.definition.map = 'pending.png';
    scene.add(node); renderer.mount(scene); renderer.mount(new Scene());
    done!(texture);
    expect(dispose).toHaveBeenCalledTimes(1); expect(state.textureCache.size).toBe(0);
    expect(texture.image).toBeNull(); renderer.dispose();
  });
});
