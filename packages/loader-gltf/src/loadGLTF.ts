import {
  Scene as OroyaScene,
  Node as OroyaNode,
  Geometry as OroyaGeometry,
  GeometryPrimitive,
  BufferGeometryDef,
  Material as OroyaMaterial,
  AnimationClip,
  KeyframeTrack,
  InterpolationMode,
} from '@joroya/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/**
 * Result of loading a glTF/GLB file.
 */
export interface GLTFLoadResult {
  scene: OroyaScene;
  animations: AnimationClip[];
}

/**
 * Load a glTF/GLB file and convert it to an Oroya scene graph.
 * Extracts geometry, materials, and animations.
 * 
 * @param url The URL of the glTF/GLB file to load.
 * @returns A promise that resolves to the Oroya scene and animation clips.
 */
export async function loadGLTF(url: string): Promise<GLTFLoadResult> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);

  const oroyaScene = new OroyaScene();

  // Convert the Three.js scene hierarchy to Oroya nodes
  gltf.scene.children.forEach(child => {
    oroyaScene.root.add(translateNode(child));
  });

  // Convert animations
  const animations = gltf.animations.map(anim => translateAnimation(anim));

  return { scene: oroyaScene, animations };
}

/**
 * Translate a Three.js Object3D to an Oroya Node.
 */
function translateNode(threeNode: THREE.Object3D): OroyaNode {
  const oroyaNode = new OroyaNode(threeNode.name || 'gltf-node');

  // 1. Translate Transform
  oroyaNode.transform.position = { x: threeNode.position.x, y: threeNode.position.y, z: threeNode.position.z };
  oroyaNode.transform.rotation = { x: threeNode.quaternion.x, y: threeNode.quaternion.y, z: threeNode.quaternion.z, w: threeNode.quaternion.w };
  oroyaNode.transform.scale = { x: threeNode.scale.x, y: threeNode.scale.y, z: threeNode.scale.z };

  // 2. Translate Geometry & Material
  if (threeNode instanceof THREE.Mesh) {
    const geometry = translateGeometry(threeNode.geometry);
    if (geometry) {
      oroyaNode.addComponent(geometry);
    }

    const material = translateMaterial(threeNode.material);
    if (material) {
      oroyaNode.addComponent(material);
    }
  }

  // 3. Recursively translate children
  threeNode.children.forEach(child => {
    oroyaNode.add(translateNode(child));
  });

  return oroyaNode;
}

/**
 * Translate a Three.js BufferGeometry to an Oroya Geometry component.
 */
function translateGeometry(threeGeo: THREE.BufferGeometry): OroyaGeometry | null {
  const positions = threeGeo.getAttribute('position');
  if (!positions) {
    return null;
  }

  const normals = threeGeo.getAttribute('normal');
  const uvs = threeGeo.getAttribute('uv');
  const indices = threeGeo.getIndex();

  const def: BufferGeometryDef = {
    type: GeometryPrimitive.Buffer,
    positions: new Float32Array(positions.array),
    normals: normals ? new Float32Array(normals.array) : undefined,
    uvs: uvs ? new Float32Array(uvs.array) : undefined,
    indices: indices ? (indices.array instanceof Uint16Array ? new Uint16Array(indices.array) : new Uint32Array(indices.array)) : undefined,
  };

  return new OroyaGeometry(def);
}

/**
 * Translate a Three.js Material to an Oroya Material component.
 */
function translateMaterial(threeMat: THREE.Material | THREE.Material[]): OroyaMaterial | null {
  // Handle material arrays (use first material)
  const mat = Array.isArray(threeMat) ? threeMat[0] : threeMat;

  if (!mat) {
    return null;
  }

  const def: any = {};

  // Extract color
  if ('color' in mat && mat.color instanceof THREE.Color) {
    def.color = { r: mat.color.r, g: mat.color.g, b: mat.color.b };
  }

  // Extract PBR properties from MeshStandardMaterial
  if (mat instanceof THREE.MeshStandardMaterial) {
    if (mat.metalness !== undefined) {
      def.metalness = mat.metalness;
    }
    if (mat.roughness !== undefined) {
      def.roughness = mat.roughness;
    }
    if (mat.emissive) {
      def.emissive = { r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b };
    }
  }

  // Extract opacity
  if (mat.opacity !== undefined && mat.opacity < 1.0) {
    def.opacity = mat.opacity;
  }

  return new OroyaMaterial(def);
}

/**
 * Translate a Three.js AnimationClip to an Oroya AnimationClip.
 */
function translateAnimation(threeClip: THREE.AnimationClip): AnimationClip {
  const tracks: KeyframeTrack[] = [];

  for (const threeTrack of threeClip.tracks) {
    const track = translateTrack(threeTrack);
    if (track) {
      tracks.push(track);
    }
  }

  return {
    name: threeClip.name,
    duration: threeClip.duration,
    tracks,
  };
}

/**
 * Translate a Three.js KeyframeTrack to an Oroya KeyframeTrack.
 */
function translateTrack(threeTrack: THREE.KeyframeTrack): KeyframeTrack | null {
  // Parse the track name to extract node name and property
  // Format: "nodeName.property" (e.g., "Cube.position", "Armature|Bone.quaternion")
  const parts = threeTrack.name.split('.');
  if (parts.length < 2) {
    return null;
  }

  const targetNodeName = parts[0];
  const propertyName = parts[1];

  // Map Three.js property names to Oroya property names
  let property: 'position' | 'rotation' | 'scale';
  if (propertyName === 'position') {
    property = 'position';
  } else if (propertyName === 'quaternion') {
    property = 'rotation';
  } else if (propertyName === 'scale') {
    property = 'scale';
  } else {
    return null; // Unsupported property
  }

  // Map Three.js interpolation to Oroya interpolation
  let interpolation: InterpolationMode = 'linear';
  if (threeTrack.getInterpolation() === THREE.InterpolateDiscrete) {
    interpolation = 'step';
  } else if (threeTrack.getInterpolation() === THREE.InterpolateLinear) {
    interpolation = 'linear';
  }

  return {
    targetNodeName,
    property,
    times: new Float32Array(threeTrack.times),
    values: new Float32Array(threeTrack.values),
    interpolation,
  };
}
