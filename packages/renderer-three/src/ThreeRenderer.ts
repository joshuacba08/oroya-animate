import * as THREE from 'three';
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
  PerspectiveCameraDef,
  Interactive,
  InteractionEventType,
  createInteractionEvent,
} from '@oroya/core';

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
  private nodeMap: Map<string, THREE.Object3D> = new Map();

  // ── Interaction state ─────────────────────────────────────
  private readonly reverseNodeMap: Map<THREE.Object3D, OroyaNode> = new Map();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private hoveredNode: OroyaNode | null = null;
  private interactionEnabled = false;
  private readonly canvas: HTMLCanvasElement;
  private abortController: AbortController | null = null;

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

  render() {
    if (!this.oroyaScene || !this.activeCamera) return;

    this.oroyaScene.updateWorldMatrices();

    this.oroyaScene.root.traverse((oroyaNode) => {
      const threeObject = this.nodeMap.get(oroyaNode.id);
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

  dispose() {
    this.disableInteraction();
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

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 3);
    this.scene.add(dirLight);

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
    } else {
      threeObject = new THREE.Group();
    }

    return threeObject;
  }

  private createThreeGeometry(oroyaGeo: OroyaGeometry): THREE.BufferGeometry | null {
    const { definition } = oroyaGeo;
    switch (definition.type) {
      case GeometryPrimitive.Box:
        const { width, height, depth } = definition as BoxGeometryDef;
        return new THREE.BoxGeometry(width, height, depth);
      case GeometryPrimitive.Sphere:
        const { radius, widthSegments, heightSegments } = definition as SphereGeometryDef;
        return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
      default:
        return null;
    }
  }

  private createThreeMaterial(oroyaMat?: OroyaMaterial): THREE.Material {
    if (!oroyaMat) {
      return new THREE.MeshStandardMaterial({ color: 0xcccccc });
    }

    const { definition } = oroyaMat;
    const props: THREE.MeshStandardMaterialParameters = {};
    if (definition.color) {
      props.color = new THREE.Color(definition.color.r, definition.color.g, definition.color.b);
    }
    if (definition.opacity !== undefined) {
      props.opacity = definition.opacity;
      props.transparent = definition.opacity < 1.0;
    }

    return new THREE.MeshStandardMaterial(props);
  }

  private createThreeCamera(oroyaCam: OroyaCamera): THREE.Camera | null {
    const { definition } = oroyaCam;
    switch (definition.type) {
      case 'Perspective':
        const { fov, aspect, near, far } = definition as PerspectiveCameraDef;
        return new THREE.PerspectiveCamera(fov, aspect, near, far);
      default:
        return null;
    }
  }
}
