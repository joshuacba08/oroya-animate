import * as THREE from 'three';
import {
  Scene as OroyaScene,
  Node as OroyaNode,
  ComponentType,
  Geometry as OroyaGeometry,
  Material as OroyaMaterial,
  GeometryPrimitive,
  BoxGeometryDef,
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
  private readonly camera: THREE.PerspectiveCamera;
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
    this.camera = new THREE.PerspectiveCamera(
      75,
      options.width / options.height,
      0.1,
      1000
    );
    this.camera.position.z = 5;
  }

  mount(oroyaScene: OroyaScene) {
    this.oroyaScene = oroyaScene;
    this.rebuildScene();
  }

  render() {
    if (!this.oroyaScene) return;

    // This is the "compiler" step, run on each frame for dynamic updates
    this.oroyaScene.root.traverse((oroyaNode) => {
      const threeObject = this.nodeMap.get(oroyaNode.id);
      if (threeObject) {
        // Apply transform updates
        const { position, rotation, scale } = oroyaNode.transform;
        threeObject.position.set(position.x, position.y, position.z);
        threeObject.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        threeObject.scale.set(scale.x, scale.y, scale.z);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
  
  private rebuildScene() {
    if (!this.oroyaScene) return;

    // Clear previous objects
    this.scene.clear();
    this.nodeMap.clear();

    // Add some ambient light
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 3);
    this.scene.add(dirLight);

    this.oroyaScene.root.traverse((oroyaNode) => {
      const threeObject = this.createThreeObject(oroyaNode);
      if (threeObject) {
        this.nodeMap.set(oroyaNode.id, threeObject);
        
        // Find parent in the map and attach
        const parentThreeObject = oroyaNode.parent ? this.nodeMap.get(oroyaNode.parent.id) : this.scene;
        parentThreeObject?.add(threeObject);
      }
    });
  }

  private createThreeObject(oroyaNode: OroyaNode): THREE.Object3D | null {
    const geoComponent = oroyaNode.getComponent<OroyaGeometry>(ComponentType.Geometry);
    if (!geoComponent) {
      // Create a group for nodes without geometry, so they can have children
      return new THREE.Group();
    }

    const matComponent = oroyaNode.getComponent<OroyaMaterial>(ComponentType.Material);

    const threeGeometry = this.createThreeGeometry(geoComponent);
    const threeMaterial = this.createThreeMaterial(matComponent);
    
    if (threeGeometry && threeMaterial) {
      return new THREE.Mesh(threeGeometry, threeMaterial);
    }
    
    return null;
  }

  private createThreeGeometry(oroyaGeo: OroyaGeometry): THREE.BufferGeometry | null {
    const { definition } = oroyaGeo;
    switch (definition.type) {
      case GeometryPrimitive.Box:
        const { width, height, depth } = definition as BoxGeometryDef;
        return new THREE.BoxGeometry(width, height, depth);
      // Other cases would go here
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

  dispose() {
    this.renderer.dispose();
  }
}
