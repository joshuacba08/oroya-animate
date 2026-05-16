import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import {
  EffectComposer,
  OutputPass,
  Pass,
  RenderPass,
  SMAAPass,
  UnrealBloomPass,
} from 'three/addons';
import {
  Scene as OroyaScene,
  Node as OroyaNode,
  ComponentType,
  Geometry as OroyaGeometry,
  Material as OroyaMaterial,
  Camera as OroyaCamera,
  GeometryPrimitive,
  BoxGeometryDef,
  SphereGeometryDef,
  CylinderGeometryDef,
  PlaneGeometryDef,
  ConeGeometryDef,
  TorusGeometryDef,
  CircleGeometryDef,
  BufferGeometryDef,
  PerspectiveCameraDef,
  OrthographicCameraDef,
  Interactive,
  InteractionEventType,
  createInteractionEvent,
  CSGGeometryDef,
  CSGOperation,
  GeometryDef,
  Light as OroyaLight,
  LightType,
  Environment as OroyaEnvironment,
  FogType,
  InstancedMeshComponent,
  InstancedMesh,
  PostProcessing,
  PostProcessingDef,
  ToneMapping,
  ParticleSystem,
  Animator as OroyaAnimator,
  AudioListener as OroyaAudioListener,
  AudioSource as OroyaAudioSource,
  Skin as OroyaSkin,
  PluginRegistry,
  type Plugin,
} from '@joroya/core';
import { OrbitControlsWrapper } from './OrbitControlsWrapper';

interface ThreeRendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr?: number;
}

/**
 * Three.js WebGL renderer for Oroya scene graphs.
 *
 * @public
 */
export class ThreeRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private activeCamera: THREE.Camera | null = null;
  private oroyaScene: OroyaScene | null = null;
  private orbitControls: OrbitControlsWrapper | null = null;
  private nodeMap: Map<string, THREE.Object3D> = new Map();

  // Post-Processing
  private composer: EffectComposer | null = null;

  // ── Interaction state ─────────────────────────────────────
  private readonly reverseNodeMap: Map<THREE.Object3D, OroyaNode> = new Map();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private hoveredNode: OroyaNode | null = null;
  private interactionEnabled = false;
  private readonly canvas: HTMLCanvasElement;
  private abortController: AbortController | null = null;

  // Texture loading system
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly textureCache = new Map<string, THREE.Texture>();

  // Audio system
  private readonly audioLoader = new THREE.AudioLoader();
  private readonly audioCache = new Map<string, AudioBuffer>();
  private audioListener: THREE.AudioListener | null = null;
  private mixers: THREE.AnimationMixer[] = [];

  // Skinned-mesh bindings queued during the create-objects pass, resolved
  // after every Oroya node has a corresponding `THREE.Object3D` so the
  // skeleton's bone lookups can find them.
  private pendingSkinBindings: Array<{ mesh: THREE.SkinnedMesh; skin: OroyaSkin }> = [];

  // ── Plugin system ──────────────────────────────────────────
  // Plugins extend the renderer with custom component handlers. Lookup is
  // O(1); per-frame iteration is O(plugin-count) which is always small.
  private readonly plugins = new PluginRegistry();
  // Plugin-managed backend objects keyed by node id so we can call
  // `handler.update(node, obj, dt)` per frame and `dispose` on rebuild.
  private readonly pluginObjects = new Map<string, { handler: import('@joroya/core').ComponentHandler<THREE.Object3D>; obj: THREE.Object3D }>();

  constructor(options: ThreeRendererOptions) {
    this.canvas = options.canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(options.dpr ?? window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;



    this.scene = new THREE.Scene();
    this.composer = new EffectComposer(this.renderer);
  }

  // ── Public API ────────────────────────────────────────────

  mount(oroyaScene: OroyaScene) {
    this.oroyaScene = oroyaScene;
    this.rebuildScene();
  }

  /**
   * Install a plugin that extends the renderer with custom component
   * handlers and / or per-frame hooks. Plugins are queried *before* the
   * built-in component branches in `createThreeObject` — a plugin handler
   * for `ComponentType.Geometry` takes precedence over the default mesh
   * builder.
   *
   * If the plugin is installed after `mount()`, call `rebuildScene()` to
   * make existing nodes pick it up.
   */
  usePlugin(plugin: Plugin): void {
    this.plugins.register(plugin);
  }

  /** Remove a previously installed plugin. */
  removePlugin(plugin: Plugin): void {
    this.plugins.unregister(plugin);
  }

  /**
   * Apply environment settings (background, fog, ambient light) from the scene.
   */
  private applyEnvironment(oroyaScene: OroyaScene): void {
    // Find Environment component in scene
    let envNode: OroyaNode | null = null;
    oroyaScene.traverse((node) => {
      if (node.hasComponent(ComponentType.Environment)) {
        envNode = node;
      }
    });

    if (!envNode) {
      // Clear environment if none found
      this.scene.background = null;
      this.scene.fog = null;
      return;
    }

    const env = (envNode as OroyaNode).getComponent<OroyaEnvironment>(ComponentType.Environment)!;
    const def = env.definition;

    // Background
    if (def.background) {
      if (typeof def.background === 'string') {
        const tex = this.loadTexture(def.background);
        if (tex) this.scene.background = tex;
      } else {
        this.scene.background = new THREE.Color(
          def.background.r,
          def.background.g,
          def.background.b
        );
      }
    }

    // Fog
    if (def.fog) {
      if (def.fog.type === FogType.Linear) {
        this.scene.fog = new THREE.Fog(
          new THREE.Color(def.fog.color.r, def.fog.color.g, def.fog.color.b),
          def.fog.near,
          def.fog.far
        );
      } else {
        this.scene.fog = new THREE.FogExp2(
          new THREE.Color(def.fog.color.r, def.fog.color.g, def.fog.color.b),
          def.fog.density
        );
      }
    }
  }

  /**
   * Render one frame.
   *
   * @param dt Time elapsed since the last `render()` call, in seconds.
   *           Used to drive `scene.update(dt)` (which steps Animators,
   *           particle systems, and any user `onUpdate`), Three.js skeletal
   *           mixers, and orbit controls. Defaults to `1/60` if omitted
   *           (back-compat for synchronous "draw a still" callers).
   */
  render(dt: number = 1 / 60) {
    if (!this.oroyaScene || !this.activeCamera) return;

    // Tick scene logic FIRST. This advances Animator components (which mutate
    // node.transform via the core AnimationMixer) and any user-attached
    // onUpdate hooks, so the world-matrix pass below sees up-to-date locals.
    this.oroyaScene.update(dt);

    this.applyEnvironment(this.oroyaScene);
    this.oroyaScene.updateWorldMatrices();

    this.oroyaScene.root.traverse((oroyaNode) => {
      let threeObject = this.nodeMap.get(oroyaNode.id);

      // Dynamically create Three.js objects for nodes added after mount()
      if (!threeObject) {
        const newObj = this.createThreeObject(oroyaNode);
        if (newObj) {
          threeObject = newObj;
          this.nodeMap.set(oroyaNode.id, threeObject);
          this.reverseNodeMap.set(threeObject, oroyaNode);

          const parentThreeObject = oroyaNode.parent
            ? this.nodeMap.get(oroyaNode.parent.id)
            : this.scene;
          (parentThreeObject ?? this.scene).add(threeObject);
        }
      }

      if (threeObject) {
        threeObject.matrix.fromArray(oroyaNode.transform.worldMatrix);
        threeObject.matrix.decompose(threeObject.position, threeObject.quaternion, threeObject.scale);

        // Sync material properties (color, opacity) every frame
        if (threeObject instanceof THREE.Mesh && oroyaNode.hasComponent(ComponentType.Material)) {
          const oroyaMat = oroyaNode.getComponent<OroyaMaterial>(ComponentType.Material)!;
          const threeMat = threeObject.material as THREE.MeshStandardMaterial;
          if (oroyaMat.definition.color) {
            threeMat.color.setRGB(
              oroyaMat.definition.color.r,
              oroyaMat.definition.color.g,
              oroyaMat.definition.color.b,
            );
          }
          if (oroyaMat.definition.opacity !== undefined) {
            threeMat.opacity = oroyaMat.definition.opacity;
            threeMat.transparent = oroyaMat.definition.opacity < 1.0;
          }
        }

        // Sync InstancedMesh data
        if (threeObject instanceof THREE.InstancedMesh && oroyaNode.hasComponent(ComponentType.InstancedMesh)) {
          const instanced = oroyaNode.getComponent<InstancedMeshComponent>(ComponentType.InstancedMesh)!;
          if (instanced.matricesDirty) {
            threeObject.instanceMatrix.set(instanced.instanceMatrix);
            threeObject.instanceMatrix.needsUpdate = true;

            // Update Bounding Sphere for Culling
            if (oroyaNode instanceof InstancedMesh) {
              const sphere = oroyaNode.computeBoundingSphere();
              if (!threeObject.geometry.boundingSphere) {
                threeObject.geometry.boundingSphere = new THREE.Sphere();
              }
              threeObject.geometry.boundingSphere.set(
                new THREE.Vector3(sphere.center.x, sphere.center.y, sphere.center.z),
                sphere.radius
              );
            }

            instanced.matricesDirty = false;
          }
          if (instanced.colorsDirty && instanced.instanceColor && threeObject.instanceColor) {
            threeObject.instanceColor.set(instanced.instanceColor);
            threeObject.instanceColor.needsUpdate = true;
            instanced.colorsDirty = false;
          }
          threeObject.count = instanced.count;
        }
      }
    });

    // Update orbit controls if enabled
    if (this.orbitControls) {
      this.orbitControls.update();
    }

    this.updateParticleSystems();

    // THREE.AnimationMixer is reserved for skeletal / morph-target animation
    // on SkinnedMesh objects (glTF skeletons). Property animation on plain
    // node transforms is driven by the core `Animator` component via
    // `scene.update(dt)` above — that path needs no Three.js-specific glue.
    this.mixers.forEach((mixer) => mixer.update(dt));

    // Plugin per-frame hooks: registry-level (general) and per-object
    // (handler-bound). Plugin objects are also driven by the standard
    // world-matrix sync pass above — this is for plugin-internal logic.
    this.plugins.update(dt, this.oroyaScene);
    for (const [nodeId, entry] of this.pluginObjects) {
      if (!entry.handler.update) continue;
      const node = this.oroyaScene.findNodeById(nodeId);
      if (node) entry.handler.update(node, entry.obj, dt);
    }

    // PostProcessing is attached to the active Camera node by convention
    // (see PostProcessing component JSDoc). Each camera carries its own chain
    // so split-screen / picture-in-picture setups can declare independent FX.
    const ppDef = this.findActivePostProcessingDef();

    if (ppDef && this.composer) {
      this.renderPostFX(ppDef);
    } else {
      this.renderer.render(this.scene, this.activeCamera);
    }
  }

  private findActivePostProcessingDef(): PostProcessingDef | null {
    if (!this.activeCamera) return null;
    const camNode = this.findOroyaNode(this.activeCamera);
    if (!camNode || !camNode.hasComponent(ComponentType.PostProcessing)) return null;
    return camNode.getComponent<PostProcessing>(ComponentType.PostProcessing)!.definition;
  }

  private renderPostFX(def: PostProcessingDef) {
    if (!this.composer || !this.activeCamera) return;

    // Pass assembly is idempotent: each pass is created lazily the first time
    // it is needed and toggled via `.enabled` on subsequent frames. This keeps
    // the chain stable across renders and avoids reallocating GPU resources.
    //
    // Order matters — final composition is:
    //   RenderPass → UnrealBloomPass → SMAAPass → OutputPass

    // RenderPass (always first; rebind scene/camera in case they changed)
    const firstPass = this.composer.passes[0];
    if (!(firstPass instanceof RenderPass)) {
      this.composer.passes = [];
      this.composer.addPass(new RenderPass(this.scene, this.activeCamera));
    } else {
      firstPass.scene = this.scene;
      firstPass.camera = this.activeCamera;
    }

    // Bloom
    let bloomPass = this.composer.passes.find((p): p is UnrealBloomPass => p instanceof UnrealBloomPass);
    if (def.bloom?.enabled) {
      if (!bloomPass) {
        const size = new THREE.Vector2();
        this.renderer.getSize(size);
        bloomPass = new UnrealBloomPass(size, def.bloom.strength, def.bloom.radius, def.bloom.threshold);
        this.insertBeforeOutput(bloomPass);
      }
      bloomPass.strength = def.bloom.strength;
      bloomPass.radius = def.bloom.radius;
      bloomPass.threshold = def.bloom.threshold;
      bloomPass.enabled = true;
    } else if (bloomPass) {
      bloomPass.enabled = false;
    }

    // SMAA (anti-aliasing)
    let smaaPass = this.composer.passes.find((p): p is SMAAPass => p instanceof SMAAPass);
    if (def.antialiasing) {
      if (!smaaPass) {
        const size = new THREE.Vector2();
        this.renderer.getSize(size);
        const pixelRatio = this.renderer.getPixelRatio();
        smaaPass = new SMAAPass(size.x * pixelRatio, size.y * pixelRatio);
        this.insertBeforeOutput(smaaPass);
      }
      smaaPass.enabled = true;
    } else if (smaaPass) {
      smaaPass.enabled = false;
    }

    // OutputPass (always last; handles tone-mapping → sRGB conversion)
    if (!this.composer.passes.some((p) => p instanceof OutputPass)) {
      this.composer.addPass(new OutputPass());
    }

    // Tone-mapping is configured on the WebGLRenderer; OutputPass reads it.
    if (def.toneMapping !== undefined) {
      switch (def.toneMapping) {
        case ToneMapping.Reinhard: this.renderer.toneMapping = THREE.ReinhardToneMapping; break;
        case ToneMapping.Cineon: this.renderer.toneMapping = THREE.CineonToneMapping; break;
        case ToneMapping.ACESFilmic: this.renderer.toneMapping = THREE.ACESFilmicToneMapping; break;
        default: this.renderer.toneMapping = THREE.NoToneMapping; break;
      }
    }
    if (def.exposure !== undefined) {
      this.renderer.toneMappingExposure = def.exposure;
    }

    this.composer.render();
  }

  /** Insert a pass immediately before the OutputPass, or append if none yet. */
  private insertBeforeOutput(pass: Pass) {
    if (!this.composer) return;
    const outputIndex = this.composer.passes.findIndex((p) => p instanceof OutputPass);
    if (outputIndex >= 0) {
      this.composer.insertPass(pass, outputIndex);
    } else {
      this.composer.addPass(pass);
    }
  }

  private updateParticleSystems() {
    // Iterate all objects to find particle systems
    // Optimization: Maintain a list instead of traversing or using nodeMap values
    for (const obj of this.nodeMap.values()) {
      if (obj.userData?.isParticleSystem) {
        const points = obj as THREE.Points;
        const ps = obj.userData.component as ParticleSystem;

        // Update Geometry from PS state
        const positions = points.geometry.attributes.position.array as Float32Array;
        const colors = points.geometry.attributes.color.array as Float32Array;
        // const sizes = points.geometry.attributes.size.array as Float32Array; 

        let activeCount = 0;
        for (let i = 0; i < ps.particles.length; i++) {
          const p = ps.particles[i];

          positions[i * 3] = p.position.x;
          positions[i * 3 + 1] = p.position.y;
          positions[i * 3 + 2] = p.position.z;

          colors[i * 3] = p.color.r;
          colors[i * 3 + 1] = p.color.g;
          colors[i * 3 + 2] = p.color.b;

          // sizes[i] = p.size; // PointsMaterial doesn't support attribute size out of box

          activeCount++;
        }

        // Hide remaining
        // A better way is to set drawRange
        points.geometry.setDrawRange(0, activeCount);

        points.geometry.attributes.position.needsUpdate = true;
        points.geometry.attributes.color.needsUpdate = true;
      }
    }
  }

  setSize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.composer?.setSize(width, height);
  }

  /**
   * Enable interaction system: raycasting, pointer events, hover tracking, CSS cursor.
   * Call after `mount()`.
   */
  enableInteraction(): void {
    if (this.interactionEnabled) return;
    this.interactionEnabled = true;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.canvas.addEventListener('pointermove', this.handlePointerMove, { signal });
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { signal });
    this.canvas.addEventListener('pointerup', this.handlePointerUp, { signal });
    this.canvas.addEventListener('click', this.handleClick, { signal });
    this.canvas.addEventListener('pointerleave', this.handlePointerLeave, { signal });
    this.canvas.addEventListener('wheel', this.handleWheel, { signal, passive: true });
  }

  /**
   * Disable interaction system and remove all event listeners.
   */
  disableInteraction(): void {
    if (!this.interactionEnabled) return;
    this.interactionEnabled = false;

    this.abortController?.abort();
    this.abortController = null;
    this.hoveredNode = null;
    this.canvas.style.cursor = '';
  }

  /**
   * Enable orbit controls for camera manipulation.
   * Call after `mount()` to allow mouse/touch camera control.
   */
  enableOrbitControls(): void {
    if (this.orbitControls || !this.activeCamera) return;
    this.orbitControls = new OrbitControlsWrapper(this.activeCamera, this.canvas);
  }

  /**
   * Disable orbit controls and remove event listeners.
   */
  disableOrbitControls(): void {
    if (!this.orbitControls) return;
    this.orbitControls.dispose();
    this.orbitControls = null;
  }

  dispose() {
    this.disableInteraction();
    this.disableOrbitControls();

    // Stop all audio
    if (this.audioListener && this.audioListener.context.state !== 'closed') {
      try {
        this.audioListener.context.suspend();
      } catch { }
    }

    this.renderer.dispose();
  }

  // ── Raycasting ────────────────────────────────────────────

  /**
   * Perform a raycast and return the first interactive Oroya node under the pointer.
   */
  private raycast(event: PointerEvent | MouseEvent): { node: OroyaNode; point: THREE.Vector3 } | null {
    if (!this.activeCamera) return null;

    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.activeCamera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of hits) {
      const oroyaNode = this.findOroyaNode(hit.object);
      if (!oroyaNode) continue;

      if (oroyaNode.hasComponent(ComponentType.Interactive)) {
        const interactive = oroyaNode.getComponent<Interactive>(ComponentType.Interactive)!;
        if (interactive.definition.enabled) {
          return { node: oroyaNode, point: hit.point };
        }
      }
    }
    return null;
  }

  /**
   * Walk up the Three.js object hierarchy to find the corresponding Oroya node.
   * Three.js meshes may be nested under Groups that map to Oroya nodes.
   */
  private findOroyaNode(threeObject: THREE.Object3D): OroyaNode | null {
    let current: THREE.Object3D | null = threeObject;
    while (current) {
      const oroyaNode = this.reverseNodeMap.get(current);
      if (oroyaNode) return oroyaNode;
      current = current.parent;
    }
    return null;
  }

  // ── Event Dispatching ─────────────────────────────────────

  private dispatchToNode(
    type: InteractionEventType,
    node: OroyaNode,
    nativeEvent: PointerEvent | MouseEvent | WheelEvent,
    point?: THREE.Vector3,
  ): void {
    const interactionEvent = createInteractionEvent(
      type,
      node,
      nativeEvent,
      { x: nativeEvent.clientX, y: nativeEvent.clientY },
      {
        point: point ? { x: point.x, y: point.y, z: point.z } : undefined,
      },
    );
    node.dispatchInteraction(interactionEvent);
  }

  // ── DOM Event Handlers (arrow functions for stable `this`) ──

  private handlePointerMove = (event: PointerEvent): void => {
    const hit = this.raycast(event);
    const hitNode = hit?.node ?? null;

    // Hover tracking: enter / leave
    if (hitNode !== this.hoveredNode) {
      if (this.hoveredNode) {
        this.dispatchToNode(InteractionEventType.PointerLeave, this.hoveredNode, event);
      }
      if (hitNode) {
        this.dispatchToNode(InteractionEventType.PointerEnter, hitNode, event, hit!.point);
      }
      this.hoveredNode = hitNode;

      // CSS cursor
      if (hitNode) {
        const interactive = hitNode.getComponent<Interactive>(ComponentType.Interactive);
        this.canvas.style.cursor = interactive?.definition.cursor ?? '';
      } else {
        this.canvas.style.cursor = '';
      }
    }

    // Always dispatch pointermove if over an interactive node
    if (hitNode) {
      this.dispatchToNode(InteractionEventType.PointerMove, hitNode, event, hit!.point);
    }
  };

  private handlePointerDown = (event: PointerEvent): void => {
    const hit = this.raycast(event);
    if (hit) {
      this.dispatchToNode(InteractionEventType.PointerDown, hit.node, event, hit.point);
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const hit = this.raycast(event);
    if (hit) {
      this.dispatchToNode(InteractionEventType.PointerUp, hit.node, event, hit.point);
    }
  };

  private handleClick = (event: MouseEvent): void => {
    const hit = this.raycast(event);
    if (hit) {
      this.dispatchToNode(InteractionEventType.Click, hit.node, event, hit.point);
    }
  };

  private handlePointerLeave = (event: PointerEvent): void => {
    if (this.hoveredNode) {
      this.dispatchToNode(InteractionEventType.PointerLeave, this.hoveredNode, event);
      this.hoveredNode = null;
      this.canvas.style.cursor = '';
    }
  };

  private handleWheel = (event: WheelEvent): void => {
    const hit = this.raycast(event as unknown as MouseEvent);
    if (hit) {
      this.dispatchToNode(InteractionEventType.Wheel, hit.node, event);
    }
  };

  // ── Scene Building ────────────────────────────────────────

  private rebuildScene() {
    if (!this.oroyaScene) return;

    // Tear down any plugin-managed objects from a previous mount before
    // we wipe the scene tree — plugins may own GPU resources that need
    // explicit disposal.
    for (const [nodeId, entry] of this.pluginObjects) {
      const node = this.oroyaScene?.findNodeById(nodeId);
      if (node && entry.handler.dispose) entry.handler.dispose(node, entry.obj);
    }
    this.pluginObjects.clear();

    this.scene.clear();
    this.nodeMap.clear();
    this.reverseNodeMap.clear();
    this.mixers = [];
    this.pendingSkinBindings = [];
    this.activeCamera = null;

    this.oroyaScene.root.traverse((oroyaNode) => {
      const threeObject = this.createThreeObject(oroyaNode);
      if (threeObject) {
        this.nodeMap.set(oroyaNode.id, threeObject);
        this.reverseNodeMap.set(threeObject, oroyaNode);

        const parentThreeObject = oroyaNode.parent ? this.nodeMap.get(oroyaNode.parent.id) : this.scene;
        parentThreeObject?.add(threeObject);

        if (threeObject instanceof THREE.Camera && !this.activeCamera) {
          this.activeCamera = threeObject;
        }
      }
    });

    // Skinned meshes can only bind once every bone Object3D exists in
    // `nodeMap` — defer the bind here so forward references work.
    this.resolveSkinBindings();

    if (!this.activeCamera) {
      const defaultCamera = new THREE.PerspectiveCamera(75, this.renderer.domElement.width / this.renderer.domElement.height, 0.1, 1000);
      defaultCamera.position.z = 5;
      this.scene.add(defaultCamera);
      this.activeCamera = defaultCamera;
    }
  }

  private createThreeObject(oroyaNode: OroyaNode): THREE.Object3D | null {
    let threeObject: THREE.Object3D | null = null;

    // Plugin-supplied handlers take precedence over built-in branches.
    // A handler that returns `null` falls through to the default chain,
    // which lets plugins augment rather than fully replace.
    for (const type of oroyaNode.components.keys()) {
      const handler = this.plugins.getHandler(type) as
        | import('@joroya/core').ComponentHandler<THREE.Object3D>
        | null;
      if (handler) {
        const obj = handler.create(oroyaNode);
        if (obj) {
          this.pluginObjects.set(oroyaNode.id, { handler, obj });
          return obj;
        }
      }
    }

    if (oroyaNode.hasComponent(ComponentType.InstancedMesh)) {
      const instancedComponent = oroyaNode.getComponent<InstancedMeshComponent>(ComponentType.InstancedMesh)!;
      const geoComponent = oroyaNode.getComponent<OroyaGeometry>(ComponentType.Geometry);
      const matComponent = oroyaNode.getComponent<OroyaMaterial>(ComponentType.Material);

      if (geoComponent && matComponent) {
        threeObject = this.createThreeInstancedMesh(instancedComponent, geoComponent, matComponent);
      }
    } else if (oroyaNode.hasComponent(ComponentType.Geometry)) {
      const geoComponent = oroyaNode.getComponent<OroyaGeometry>(ComponentType.Geometry)!;
      const matComponent = oroyaNode.getComponent<OroyaMaterial>(ComponentType.Material);
      const threeGeometry = this.createThreeGeometry(geoComponent);
      const threeMaterial = this.createThreeMaterial(matComponent);
      if (threeGeometry && threeMaterial) {
        // SkinnedMesh path: when a Skin component is present and the geometry
        // carries skin attributes, build a `THREE.SkinnedMesh` instead of a
        // plain mesh. The skeleton is bound in a separate post-pass after all
        // nodes (and therefore all bones) exist in nodeMap.
        const skin = oroyaNode.getComponent<OroyaSkin>(ComponentType.Skin);
        if (skin) {
          threeObject = new THREE.SkinnedMesh(threeGeometry, threeMaterial);
          this.pendingSkinBindings.push({ mesh: threeObject as THREE.SkinnedMesh, skin });
        } else {
          threeObject = new THREE.Mesh(threeGeometry, threeMaterial);
        }

        if (geoComponent.definition.castShadow) threeObject.castShadow = true;
        if (geoComponent.definition.receiveShadow) threeObject.receiveShadow = true;
      }
    } else if (oroyaNode.hasComponent(ComponentType.Camera)) {
      const camComponent = oroyaNode.getComponent<OroyaCamera>(ComponentType.Camera)!;
      threeObject = this.createThreeCamera(camComponent);

      if (threeObject && this.audioListener && !this.audioListener.parent) {
        threeObject.add(this.audioListener);
      }
    } else if (oroyaNode.hasComponent(ComponentType.Light)) {
      const lightComponent = oroyaNode.getComponent<OroyaLight>(ComponentType.Light)!;
      threeObject = this.createThreeLight(lightComponent);
    } else if (oroyaNode.hasComponent(ComponentType.ParticleSystem)) {
      const psComponent = oroyaNode.getComponent<ParticleSystem>(ComponentType.ParticleSystem)!;
      threeObject = this.createThreeParticleSystem(psComponent);
    } else if (oroyaNode.hasComponent(ComponentType.AudioListener)) {
      const alComponent = oroyaNode.getComponent<OroyaAudioListener>(ComponentType.AudioListener)!;
      threeObject = this.createThreeAudioListener(alComponent);
    } else if (oroyaNode.hasComponent(ComponentType.AudioSource)) {
      const asComponent = oroyaNode.getComponent<OroyaAudioSource>(ComponentType.AudioSource)!;
      threeObject = this.createThreeAudioSource(asComponent);
    } else {
      // Animator-only nodes (no geometry, no mesh, no audio) get an empty
      // group — the Animator drives transforms on OTHER nodes by name.
      threeObject = new THREE.Group();
    }

    // Animator post-wiring (dual-track):
    //   - Property tracks (position/rotation/scale) → core AnimationMixer.
    //     Driven by `scene.update(dt)` automatically; nothing to wire here.
    //   - Skeleton / morph tracks → THREE.AnimationMixer on the underlying
    //     SkinnedMesh. Created only when an actual SkinnedMesh is present so
    //     non-skinned scenes don't pay for an unused mixer.
    if (threeObject && oroyaNode.hasComponent(ComponentType.Animator)) {
      const skinned = this.findSkinnedDescendant(threeObject);
      if (skinned) {
        this.mixers.push(new THREE.AnimationMixer(skinned));
      }
      // Bind the core Animator to the scene so it can resolve target nodes.
      if (this.oroyaScene) {
        oroyaNode
          .getComponent<OroyaAnimator>(ComponentType.Animator)!
          .bindToScene(this.oroyaScene);
      }
    }

    return threeObject;
  }

  private findSkinnedDescendant(obj: THREE.Object3D): THREE.SkinnedMesh | null {
    let found: THREE.SkinnedMesh | null = null;
    obj.traverse((child) => {
      if (!found && child instanceof THREE.SkinnedMesh) {
        found = child;
      }
    });
    return found;
  }

  /**
   * Resolve queued skin bindings — look up each bone Object3D by name in
   * `nodeMap` and build a `THREE.Skeleton`, then call `mesh.bind` so the
   * mesh follows the bones every frame.
   *
   * Bones are matched by their **Oroya node name** (which the glTF loader
   * preserves from `gltf.scene` bone names). A missing bone is logged and
   * skipped; we'd rather render a slightly-broken skin than crash.
   */
  private resolveSkinBindings(): void {
    if (this.pendingSkinBindings.length === 0 || !this.oroyaScene) return;

    // Build name → Three.Object3D index for fast bone lookup.
    const nodesByName = new Map<string, THREE.Object3D>();
    this.oroyaScene.root.traverse((oroyaNode) => {
      const obj = this.nodeMap.get(oroyaNode.id);
      if (obj) nodesByName.set(oroyaNode.name, obj);
    });

    for (const { mesh, skin } of this.pendingSkinBindings) {
      const bones: THREE.Bone[] = [];
      const boneInverses: THREE.Matrix4[] = [];
      for (let i = 0; i < skin.definition.boneNames.length; i++) {
        const name = skin.definition.boneNames[i];
        const obj = nodesByName.get(name);
        if (!obj) {
          console.warn(`[oroya-three] Skin references unknown bone "${name}", skipping.`);
          continue;
        }
        // Three's Bone is an Object3D subclass — but plain Object3Ds work
        // for skinning purposes (we only need world matrices). Re-typing as
        // Bone keeps the Skeleton constructor happy.
        bones.push(obj as THREE.Bone);
        const im = new THREE.Matrix4();
        im.fromArray(skin.definition.inverseBindMatrices, i * 16);
        boneInverses.push(im);
      }
      const skeleton = new THREE.Skeleton(bones, boneInverses);
      mesh.bind(skeleton);
    }

    this.pendingSkinBindings = [];
  }

  private createThreeAudioListener(comp: OroyaAudioListener): THREE.AudioListener {
    if (!this.audioListener) {
      this.audioListener = new THREE.AudioListener();
    }
    this.audioListener.setMasterVolume(comp.definition.masterVolume);
    return this.audioListener;
  }

  private createThreeAudioSource(comp: OroyaAudioSource): THREE.PositionalAudio {
    if (!this.audioListener) {
      // If no listener exists yet, create one but don't attach it to scene yet (wait for camera)
      // Ideally AudioListener component should exist. If not, default fallback?
      this.audioListener = new THREE.AudioListener();
      // We need to attach it to the camera later if not done so.
      if (this.activeCamera) this.activeCamera.add(this.audioListener);
      else this.scene.add(this.audioListener);
    }

    const audio = new THREE.PositionalAudio(this.audioListener);

    const def = comp.definition;
    audio.setRefDistance(def.refDistance);
    audio.setRolloffFactor(def.rolloffFactor);
    audio.setDistanceModel(def.distanceModel);
    audio.setMaxDistance(def.maxDistance);
    audio.setDirectionalCone(def.coneInnerAngle, def.coneOuterAngle, def.coneOuterGain);
    audio.setVolume(def.volume);
    audio.setLoop(def.loop);

    // Load buffer
    this.loadAudioBuffer(def.url).then(buffer => {
      if (buffer) {
        audio.setBuffer(buffer);
        if (def.autoplay) {
          audio.play();
        }
      }
    });

    return audio;
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.audioCache.has(url)) return this.audioCache.get(url)!;

    try {
      const buffer = await this.audioLoader.loadAsync(url);
      this.audioCache.set(url, buffer);
      return buffer;
    } catch (e) {
      console.error(`Failed to load audio: ${url}`, e);
      return null;
    }
  }

  private createThreeParticleSystem(ps: ParticleSystem): THREE.Points {
    // Create initial geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(ps.definition.maxParticles * 3);
    const colors = new Float32Array(ps.definition.maxParticles * 3);
    const sizes = new Float32Array(ps.definition.maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material
    // Using PointsMaterial
    const texture = ps.definition.texture ? this.loadTexture(ps.definition.texture) : null;

    const material = new THREE.PointsMaterial({
      size: 1, // Base size, attribute will scale if shader supports it, but standard material doesn't support attribute size easily without custom shader.
      // Actually standard PointsMaterial uses 'size' uniform. 
      // To support per-particle size, we might need ShaderMaterial, but for MVP let's use fixed size or vertex colors.
      // THREE.PointsMaterial DOES support vertexColors: true.
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 1,
      depthWrite: false, // For transparency
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // Always render

    // Store reference to update later
    // We can attach it to userData to retrieve it during update loop
    points.userData = { isParticleSystem: true, component: ps };

    return points;
  }

  private createThreeInstancedMesh(
    instanced: InstancedMeshComponent,
    geo: OroyaGeometry,
    mat: OroyaMaterial
  ): THREE.InstancedMesh | null {
    const threeGeo = this.createThreeGeometry(geo);
    const threeMat = this.createThreeMaterial(mat);

    if (!threeGeo || !threeMat) return null;

    const mesh = new THREE.InstancedMesh(threeGeo, threeMat, instanced.capacity);
    mesh.count = instanced.count;

    if (geo.definition.castShadow) mesh.castShadow = true;
    if (geo.definition.receiveShadow) mesh.receiveShadow = true;

    mesh.instanceMatrix.set(instanced.instanceMatrix);
    mesh.instanceMatrix.needsUpdate = true;

    if (instanced.instanceColor) {
      // THREE.InstancedMesh doesn't create instanceColor attribute by default
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(instanced.capacity * 3), 3);
      mesh.instanceColor.set(instanced.instanceColor);
      mesh.instanceColor.needsUpdate = true;
    }

    return mesh;
  }

  private createThreeGeometry(oroyaGeo: OroyaGeometry): THREE.BufferGeometry | null {
    return this.buildGeometryFromDef(oroyaGeo.definition);
  }

  private buildGeometryFromDef(definition: GeometryDef): THREE.BufferGeometry {
    switch (definition.type) {
      case GeometryPrimitive.Box:
        const box = definition as BoxGeometryDef;
        return new THREE.BoxGeometry(box.width, box.height, box.depth);
      case GeometryPrimitive.Sphere: {
        const { radius, widthSegments, heightSegments } = definition as SphereGeometryDef;
        return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
      }

      case GeometryPrimitive.Cylinder: {
        const def = definition as CylinderGeometryDef;
        return new THREE.CylinderGeometry(
          def.radiusTop ?? 1,
          def.radiusBottom ?? 1,
          def.height,
          def.radialSegments ?? 32,
          def.heightSegments ?? 1,
          def.openEnded ?? false
        );
      }

      case GeometryPrimitive.Plane: {
        const def = definition as PlaneGeometryDef;
        return new THREE.PlaneGeometry(
          def.width,
          def.height,
          def.widthSegments ?? 1,
          def.heightSegments ?? 1
        );
      }

      case GeometryPrimitive.Cone: {
        const def = definition as ConeGeometryDef;
        return new THREE.ConeGeometry(
          def.radius,
          def.height,
          def.radialSegments ?? 32,
          def.heightSegments ?? 1,
          def.openEnded ?? false
        );
      }

      case GeometryPrimitive.Torus: {
        const def = definition as TorusGeometryDef;
        return new THREE.TorusGeometry(
          def.radius,
          def.tube,
          def.radialSegments ?? 16,
          def.tubularSegments ?? 100,
          def.arc ?? Math.PI * 2
        );
      }

      case GeometryPrimitive.Circle: {
        const def = definition as CircleGeometryDef;
        return new THREE.CircleGeometry(
          def.radius,
          def.segments ?? 32,
          def.thetaStart ?? 0,
          def.thetaLength ?? Math.PI * 2
        );
      }
      case GeometryPrimitive.Buffer: {
        const bufferDef = definition as BufferGeometryDef;
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(bufferDef.positions, 3));
        if (bufferDef.normals) {
          geometry.setAttribute('normal', new THREE.BufferAttribute(bufferDef.normals, 3));
        }
        if (bufferDef.uvs) {
          geometry.setAttribute('uv', new THREE.BufferAttribute(bufferDef.uvs, 2));
        }
        if (bufferDef.indices) {
          geometry.setIndex(new THREE.BufferAttribute(bufferDef.indices, 1));
        }
        // glTF skinning attributes: `skinIndex` is 4 uint16 per vertex
        // (which bones influence this vertex), `skinWeight` is 4 floats
        // (how much each bone contributes — should sum to 1).
        if (bufferDef.skinIndices) {
          geometry.setAttribute('skinIndex', new THREE.BufferAttribute(bufferDef.skinIndices, 4));
        }
        if (bufferDef.skinWeights) {
          geometry.setAttribute('skinWeight', new THREE.BufferAttribute(bufferDef.skinWeights, 4));
        }
        return geometry;
      }
      case GeometryPrimitive.CSG:
        return this.buildCSGGeometry(definition as CSGGeometryDef);
      default:
        return new THREE.BufferGeometry();
    }
  }

  private buildCSGGeometry(def: CSGGeometryDef): THREE.BufferGeometry {
    // 1. Build base geometry
    const baseGeo = this.buildGeometryFromDef(def.base);
    const baseMesh = new THREE.Mesh(baseGeo);
    baseMesh.updateMatrix();

    // 2. Build modifier geometry
    const modGeo = this.buildGeometryFromDef(def.modifier);
    const modMesh = new THREE.Mesh(modGeo);

    // 3. Apply modifier transform if present
    if (def.modifierTransform) {
      modMesh.matrix.fromArray(def.modifierTransform);
      modMesh.matrix.decompose(modMesh.position, modMesh.quaternion, modMesh.scale);
      modMesh.updateMatrix();
    }

    // 4. Perform CSG operation
    let resultMesh: THREE.Mesh;
    switch (def.operation) {
      case CSGOperation.Union:
        resultMesh = CSG.union(baseMesh, modMesh);
        break;
      case CSGOperation.Subtract:
        resultMesh = CSG.subtract(baseMesh, modMesh);
        break;
      case CSGOperation.Intersect:
        resultMesh = CSG.intersect(baseMesh, modMesh);
        break;
      default:
        return baseGeo;
    }

    return resultMesh.geometry;
  }

  /**
   * Load a texture from a URI with caching.
   */
  private loadTexture(url: string): THREE.Texture | null {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    try {
      const texture = this.textureLoader.load(url);
      this.textureCache.set(url, texture);
      return texture;
    } catch (e) {
      console.warn(`Failed to load texture: ${url}`, e);
      return null;
    }
  }

  private createThreeMaterial(oroyaMat?: OroyaMaterial): THREE.Material {
    const definition = oroyaMat?.definition ?? {};

    const props: THREE.MeshStandardMaterialParameters = {
      transparent: definition.opacity !== undefined && definition.opacity < 1,
      opacity: definition.opacity ?? 1,
    };

    if (definition.color) {
      props.color = new THREE.Color(definition.color.r, definition.color.g, definition.color.b);
    }
    if (definition.metalness !== undefined) {
      props.metalness = definition.metalness;
    }
    if (definition.roughness !== undefined) {
      props.roughness = definition.roughness;
    }
    if (definition.emissive) {
      props.emissive = new THREE.Color(definition.emissive.r, definition.emissive.g, definition.emissive.b);
    }

    const mat = new THREE.MeshStandardMaterial(props);

    // Load texture maps
    if (definition.map) {
      const tex = this.loadTexture(definition.map);
      if (tex) mat.map = tex;
    }
    if (definition.normalMap) {
      const tex = this.loadTexture(definition.normalMap);
      if (tex) {
        mat.normalMap = tex;
        const scale = definition.normalScale ?? 1;
        mat.normalScale = new THREE.Vector2(scale, scale);
      }
    }
    if (definition.roughnessMap) {
      const tex = this.loadTexture(definition.roughnessMap);
      if (tex) mat.roughnessMap = tex;
    }
    if (definition.metalnessMap) {
      const tex = this.loadTexture(definition.metalnessMap);
      if (tex) mat.metalnessMap = tex;
    }
    if (definition.emissiveMap) {
      const tex = this.loadTexture(definition.emissiveMap);
      if (tex) {
        mat.emissiveMap = tex;
        mat.emissiveIntensity = definition.emissiveIntensity ?? 1;
      }
    }
    if (definition.aoMap) {
      const tex = this.loadTexture(definition.aoMap);
      if (tex) {
        mat.aoMap = tex;
        mat.aoMapIntensity = definition.aoMapIntensity ?? 1;
      }
    }
    if (definition.envMap) {
      const tex = this.loadTexture(definition.envMap);
      if (tex) {
        mat.envMap = tex;
        mat.envMapIntensity = definition.envMapIntensity ?? 1;
      }
    }

    return mat;
  }

  private createThreeCamera(oroyaCam: OroyaCamera): THREE.Camera | null {
    const { definition } = oroyaCam;
    switch (definition.type) {
      case 'Perspective':
        const { fov, aspect, near, far } = definition as PerspectiveCameraDef;
        return new THREE.PerspectiveCamera(fov, aspect, near, far);
      case 'Orthographic':
        const ortho = definition as OrthographicCameraDef;
        return new THREE.OrthographicCamera(ortho.left, ortho.right, ortho.top, ortho.bottom, ortho.near, ortho.far);
      default:
        return null;
    }
  }

  private createThreeLight(oroyaLight: OroyaLight): THREE.Light | null {
    const { definition } = oroyaLight;
    const color = definition.color ? new THREE.Color(definition.color.r, definition.color.g, definition.color.b) : new THREE.Color(0xffffff);
    const intensity = definition.intensity ?? 1;

    switch (definition.type) {
      case LightType.Ambient:
        return new THREE.AmbientLight(color, intensity);

      case LightType.Directional: {
        const dirLight = new THREE.DirectionalLight(color, intensity);
        if (definition.castShadow) {
          dirLight.castShadow = true;
        }
        if (definition.target) {
          dirLight.target.position.set(definition.target.x, definition.target.y, definition.target.z);
        }
        if (definition.shadowBias !== undefined) dirLight.shadow.bias = definition.shadowBias;
        if (definition.shadowMapSize !== undefined) {
          dirLight.shadow.mapSize.width = definition.shadowMapSize;
          dirLight.shadow.mapSize.height = definition.shadowMapSize;
        }
        return dirLight;
      }

      case LightType.Point: {
        const pointLight = new THREE.PointLight(color, intensity, definition.distance ?? 0, definition.decay ?? 2);
        if (definition.castShadow) {
          pointLight.castShadow = true;
          if (definition.shadowBias !== undefined) pointLight.shadow.bias = definition.shadowBias;
          if (definition.shadowMapSize !== undefined) {
            pointLight.shadow.mapSize.width = definition.shadowMapSize;
            pointLight.shadow.mapSize.height = definition.shadowMapSize;
          }
        }
        return pointLight;
      }

      case LightType.Spot: {
        const spotLight = new THREE.SpotLight(
          color,
          intensity,
          definition.distance ?? 0,
          definition.angle ?? Math.PI / 3,
          definition.penumbra ?? 0,
          definition.decay ?? 2
        );
        if (definition.castShadow) {
          spotLight.castShadow = true;
          if (definition.shadowBias !== undefined) spotLight.shadow.bias = definition.shadowBias;
          if (definition.shadowMapSize !== undefined) {
            spotLight.shadow.mapSize.width = definition.shadowMapSize;
            spotLight.shadow.mapSize.height = definition.shadowMapSize;
          }
        }
        if (definition.target) {
          spotLight.target.position.set(definition.target.x, definition.target.y, definition.target.z);
        }
        return spotLight;
      }

      default:
        return null;
    }
  }
}
