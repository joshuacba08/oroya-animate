import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
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

  constructor(options: ThreeRendererOptions) {
    this.canvas = options.canvas;

    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(options.dpr ?? window.devicePixelRatio);

    this.scene = new THREE.Scene();
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
      }
    });

    // Update orbit controls if enabled
    if (this.orbitControls) {
      this.orbitControls.update();
    }

    this.renderer.render(this.scene, this.activeCamera);
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

    if (oroyaNode.hasComponent(ComponentType.Geometry)) {
      const geoComponent = oroyaNode.getComponent<OroyaGeometry>(ComponentType.Geometry)!;
      const matComponent = oroyaNode.getComponent<OroyaMaterial>(ComponentType.Material);
      const threeGeometry = this.createThreeGeometry(geoComponent);
      const threeMaterial = this.createThreeMaterial(matComponent);
      if (threeGeometry && threeMaterial) {
        threeObject = new THREE.Mesh(threeGeometry, threeMaterial);
      }
    } else if (oroyaNode.hasComponent(ComponentType.Camera)) {
      const camComponent = oroyaNode.getComponent<OroyaCamera>(ComponentType.Camera)!;
      threeObject = this.createThreeCamera(camComponent);
    } else if (oroyaNode.hasComponent(ComponentType.Light)) {
      const lightComponent = oroyaNode.getComponent<OroyaLight>(ComponentType.Light)!;
      threeObject = this.createThreeLight(lightComponent);
    } else {
      threeObject = new THREE.Group();
    }

    return threeObject;
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
        return dirLight;
      }

      case LightType.Point: {
        const pointLight = new THREE.PointLight(color, intensity, definition.distance ?? 0, definition.decay ?? 2);
        if (definition.castShadow) {
          pointLight.castShadow = true;
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
