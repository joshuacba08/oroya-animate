import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
// @ts-ignore
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// @ts-ignore
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
// @ts-ignore
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
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
  ToneMapping,
  ParticleSystem,
  AudioListener as OroyaAudioListener,
  AudioSource as OroyaAudioSource,
} from '@joroya/core';
import { OrbitControlsWrapper } from './OrbitControlsWrapper';

interface ThreeRendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr?: number;
}

export class ThreeRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private activeCamera: THREE.Camera | null = null;
  private oroyaScene: OroyaScene | null = null;
  private orbitControls: OrbitControlsWrapper | null = null;
  private nodeMap: Map<string, THREE.Object3D> = new Map();

  // Post-Processing
  private composer: any | null = null;

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

  render() {
    if (!this.oroyaScene || !this.activeCamera) return;

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

    // Check for PostProcessing component on active camera or scene environment
    // For now, let's check the active camera node
    let ppDef: any = null;
    if (this.activeCamera) {
      const camNode = this.findOroyaNode(this.activeCamera);
      if (camNode && camNode.hasComponent(ComponentType.PostProcessing)) {
        ppDef = camNode.getComponent<PostProcessing>(ComponentType.PostProcessing)!.definition;
      }
    }

    if (ppDef && this.composer) {
      this.renderPostFX(ppDef);
    } else {
      this.renderer.render(this.scene, this.activeCamera);
    }
  }

  private renderPostFX(def: any) {
    if (!this.composer || !this.activeCamera) return;

    // Check if we need to rebuild passes
    // For simplicity in this iteration, we reconstruct if needed or update parameters
    // A robust system would track dirty state.
    // Let's implement a simple rebuild strategy for now or just update.

    // Check if passes match current config. 
    // Optimization: Only rebuild if structure changes.
    // For MVP: Rebuild specific passes if missing, update if present.

    // Ensure RenderPass is first
    if (this.composer.passes.length === 0 || !(this.composer.passes[0] instanceof RenderPass)) {
      this.composer.passes = [];
      const renderPass = new RenderPass(this.scene, this.activeCamera);
      this.composer.addPass(renderPass);
    } else {
      (this.composer.passes[0] as RenderPass).scene = this.scene;
      (this.composer.passes[0] as RenderPass).camera = this.activeCamera;
    }

    // Bloom
    let bloomPass = this.composer.passes.find((p: any) => p instanceof UnrealBloomPass) as UnrealBloomPass;
    if (def.bloom?.enabled) {
      if (!bloomPass) {
        // Create Bloom Pass
        const size = new THREE.Vector2();
        this.renderer.getSize(size);
        bloomPass = new UnrealBloomPass(size, def.bloom.strength, def.bloom.radius, def.bloom.threshold);
        // Insert before OutputPass or at end
        const outputIndex = this.composer.passes.findIndex((p: any) => p instanceof OutputPass);
        if (outputIndex >= 0) {
          this.composer.insertPass(bloomPass, outputIndex);
        } else {
          this.composer.addPass(bloomPass);
        }
      }

      bloomPass.strength = def.bloom.strength;
      bloomPass.radius = def.bloom.radius;
      bloomPass.threshold = def.bloom.threshold;
      bloomPass.enabled = true;
    } else if (bloomPass) {
      bloomPass.enabled = false;
    }

    // Output Pass (Tone Mapping / Color Space)
    let outputPass = this.composer.passes.find((p: any) => p instanceof OutputPass);
    if (!outputPass) {
      outputPass = new OutputPass();
      this.composer.addPass(outputPass);
    }

    // Tone Mapping settings are global on renderer usually, but OutputPass handles some.
    // Actually OutputPass handles ToneMapping in recent Three.js versions.
    // Validating Tone Mapping
    if (def.toneMapping) {
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

    this.scene.clear();
    this.nodeMap.clear();
    this.reverseNodeMap.clear();
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

    if (!this.activeCamera) {
      const defaultCamera = new THREE.PerspectiveCamera(75, this.renderer.domElement.width / this.renderer.domElement.height, 0.1, 1000);
      defaultCamera.position.z = 5;
      this.scene.add(defaultCamera);
      this.activeCamera = defaultCamera;
    }
  }

  private createThreeObject(oroyaNode: OroyaNode): THREE.Object3D | null {
    let threeObject: THREE.Object3D | null = null;

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
        threeObject = new THREE.Mesh(threeGeometry, threeMaterial);

        if (geoComponent.definition.castShadow) threeObject.castShadow = true;
        if (geoComponent.definition.receiveShadow) threeObject.receiveShadow = true;
      }
    } else if (oroyaNode.hasComponent(ComponentType.Camera)) {
      const camComponent = oroyaNode.getComponent<OroyaCamera>(ComponentType.Camera)!;
      threeObject = this.createThreeCamera(camComponent);

      // If we already have a listener that wasn't attached, attach it now
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
      threeObject = new THREE.Group();
    }

    return threeObject;
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
      case GeometryPrimitive.Buffer:
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
        return geometry;
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
