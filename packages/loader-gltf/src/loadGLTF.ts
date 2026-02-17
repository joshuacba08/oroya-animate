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
    console.warn('[oroya-gltf] Geometry has no position attribute, skipping.');
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
  if (Array.isArray(threeMat) && threeMat.length > 1) {
    console.warn(`[oroya-gltf] Multi-material mesh detected (${threeMat.length} materials). Only the first material will be used.`);
  }
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
      // Scale emissive by intensity for accurate representation
      const intensity = mat.emissiveIntensity ?? 1;
      def.emissive = {
        r: mat.emissive.r * intensity,
        g: mat.emissive.g * intensity,
        b: mat.emissive.b * intensity,
      };
    }
  }

  // Extract opacity and transparency
  if (mat.opacity !== undefined && mat.opacity < 1.0) {
    def.opacity = mat.opacity;
  }

  // Extract double-sided rendering
  if (mat.side === THREE.DoubleSide) {
    def.doubleSided = true;
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
 *
 * Detects CUBICSPLINE interpolation by comparing the values array length
 * against the expected per-keyframe component count. glTF CUBICSPLINE stores
 * 3 values per keyframe (in-tangent, value, out-tangent), so the total
 * values count is `keyframes * components * 3`.
 */
function translateTrack(threeTrack: THREE.KeyframeTrack): KeyframeTrack | null {
  // Parse the track name to extract node name and property
  // Format: "nodeName.property" (e.g., "Cube.position", "Armature|Bone.quaternion")
  const parts = threeTrack.name.split('.');
  if (parts.length < 2) {
    console.warn(`[oroya-gltf] Could not parse track name: "${threeTrack.name}", skipping.`);
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
    console.warn(`[oroya-gltf] Unsupported track property: "${propertyName}" in "${threeTrack.name}", skipping.`);
    return null;
  }

  // Detect interpolation mode.
  // glTF CUBICSPLINE stores 3 values per keyframe (in-tangent, value, out-tangent).
  // We detect this by checking if the values array is 3x larger than expected
  // for the number of keyframes and components.
  const numKeyframes = threeTrack.times.length;
  const expectedComponents = property === 'rotation' ? 4 : 3;
  const valuesPerKeyframe = numKeyframes > 0
    ? threeTrack.values.length / numKeyframes
    : expectedComponents;

  let interpolation: InterpolationMode = 'linear';
  if (valuesPerKeyframe === expectedComponents * 3) {
    // 3x components → CUBICSPLINE (in-tangent + value + out-tangent)
    interpolation = 'cubicspline';
  } else if (threeTrack.getInterpolation() === THREE.InterpolateDiscrete) {
    interpolation = 'step';
  } else {
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
