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

  constructor(options: ThreeRendererOptions) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(options.width, options.height);
    this.renderer.setPixelRatio(options.dpr ?? window.devicePixelRatio);

    this.scene = new THREE.Scene();
  }

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
      }
    });

    this.renderer.render(this.scene, this.activeCamera);
  }
  
  private rebuildScene() {
    if (!this.oroyaScene) return;

    this.scene.clear();
    this.nodeMap.clear();
    this.activeCamera = null;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 3);
    this.scene.add(dirLight);

    this.oroyaScene.root.traverse((oroyaNode) => {
      const threeObject = this.createThreeObject(oroyaNode);
      if (threeObject) {
        this.nodeMap.set(oroyaNode.id, threeObject);
        
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
    switch(definition.type) {
      case 'Perspective':
        const { fov, aspect, near, far } = definition as PerspectiveCameraDef;
        return new THREE.PerspectiveCamera(fov, aspect, near, far);
      default:
        return null;
    }
  }

  dispose() {
    this.renderer.dispose();
  }
}

