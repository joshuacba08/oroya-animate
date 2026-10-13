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
  Skin as OroyaSkin,
  type SkinDef,
  type MaterialDef,
  type Diagnostic,
} from '@joroya/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

/** Cancellation and recoverable translation diagnostics. @public */
export interface GLTFLoadOptions {
  signal?: AbortSignal;
  resourcePath?: string;
  onDiagnostic?: (diagnostic: Diagnostic) => void;
}

function diagnostic(options: GLTFLoadOptions, message: string, nodeId?: string): void {
  options.onDiagnostic?.({ code: 'UNSUPPORTED_GLTF_FEATURE', message, nodeId, severity: 'warning' });
}

function translateResult(gltf: Awaited<ReturnType<GLTFLoader['parseAsync']>>, options: GLTFLoadOptions): GLTFLoadResult {
  const oroyaScene = new OroyaScene();
  const names = new Set<string>(['root']);
  const aliases = new Map<string, string>();
  gltf.scene.traverse((node) => {
    const previous = node.name;
    const base = previous || 'gltf-node'; let name = base; let suffix = 1;
    while (names.has(name)) name = base + '_' + ++suffix;
    if (previous && name !== previous) diagnostic(options, 'Renamed duplicate node to keep animation/skeleton targets unique: ' + previous + ' -> ' + name);
    aliases.set(node.uuid, name); if (previous && !aliases.has(previous)) aliases.set(previous, name);
    node.name = name; names.add(name);
  });
  try {
    if (options.signal?.aborted) throw new DOMException('glTF load cancelled.', 'AbortError');
    const source = gltf.parser.json as { animations?: Array<{ channels?: Array<{ target?: { path?: string } }> }> };
    for (const animation of source.animations ?? []) for (const channel of animation.channels ?? []) {
      if (channel.target?.path === 'weights') diagnostic(options, 'Morph-weight animation is not translated.');
    }
    for (const child of gltf.scene.children) oroyaScene.root.add(translateNode(child, options));
    const animations = gltf.animations.map((animation) => translateAnimation(animation, options, aliases));
    return { scene: oroyaScene, animations };
  } finally {
    const textures = new Set<THREE.Texture>(); const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
      if (node instanceof THREE.SkinnedMesh) node.skeleton.dispose();
    });
    const bitmaps = new Set<ImageBitmap>();
    textures.forEach((texture) => { if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) bitmaps.add(texture.image); texture.dispose(); });
    bitmaps.forEach((bitmap) => bitmap.close()); geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
  }
}

/** Parse local glTF JSON or a GLB buffer without an initial network fetch. @public */
export async function parseGLTF(data: string | ArrayBuffer, options: GLTFLoadOptions = {}): Promise<GLTFLoadResult> {
  if (options.signal?.aborted) throw new DOMException('glTF load cancelled.', 'AbortError');
  const gltf = await new GLTFLoader().parseAsync(data, options.resourcePath ?? '');
  return translateResult(gltf, options);
}

/**
 * Result of loading a glTF/GLB file.
 * @public
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
 * @public
 */
export async function loadGLTF(url: string, options: GLTFLoadOptions = {}): Promise<GLTFLoadResult> {
  const response = await fetch(url, { signal: options.signal });
  if (!response.ok) throw new Error('glTF request failed: HTTP ' + response.status);
  const data = await response.arrayBuffer();
  const base = typeof document !== 'undefined' ? document.baseURI : 'http://localhost/';
  return parseGLTF(data, { ...options, resourcePath: options.resourcePath ?? new URL('.', new URL(url, base)).href });
}

/**
 * Translate a Three.js Object3D to an Oroya Node.
 */
function translateNode(threeNode: THREE.Object3D, options: GLTFLoadOptions): OroyaNode {
  const oroyaNode = new OroyaNode(threeNode.name || 'gltf-node');
  if (threeNode instanceof THREE.Line || threeNode instanceof THREE.Points || threeNode instanceof THREE.Camera || threeNode instanceof THREE.Light) diagnostic(options, 'Non-mesh glTF drawing nodes require an application translator.', oroyaNode.id);

  // 1. Translate Transform
  oroyaNode.transform.setPosition(threeNode.position);
  oroyaNode.transform.setRotation(threeNode.quaternion);
  oroyaNode.transform.setScale(threeNode.scale);

  // 2. Translate Geometry & Material. SkinnedMesh is a Mesh subclass so the
  //    same path covers static and skinned meshes; the skin component is
  //    attached only when there's actual skinning data.
  if (threeNode instanceof THREE.Mesh) {
    const isSkinned = threeNode instanceof THREE.SkinnedMesh;
    const geometry = translateGeometry(threeNode.geometry, isSkinned);
    if (geometry) {
      oroyaNode.addComponent(geometry);
    }

    const material = translateMaterial(threeNode.material, options, oroyaNode.id);
    if (Object.keys(threeNode.geometry.morphAttributes).length) diagnostic(options, 'Morph targets are not translated.', oroyaNode.id);
    if (material) {
      oroyaNode.addComponent(material);
    }

    if (isSkinned && threeNode.skeleton) {
      const skin = translateSkin(threeNode);
      if (skin) {
        oroyaNode.addComponent(skin);
      }
    }
  }

  // 3. Recursively translate children
  threeNode.children.forEach(child => {
    oroyaNode.add(translateNode(child, options));
  });

  return oroyaNode;
}

/**
 * Translate a Three.js BufferGeometry to an Oroya Geometry component.
 *
 * @param isSkinned When `true`, also extract `skinIndex` and `skinWeight`
 *                  attributes (`SKIN_INDEX_0` / `WEIGHTS_0` in glTF). These
 *                  are per-vertex bone refs needed by the renderer to build
 *                  a `THREE.SkinnedMesh`.
 */
function translateGeometry(threeGeo: THREE.BufferGeometry, isSkinned = false): OroyaGeometry | null {
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
    positions: copyAttribute(positions, 3),
    normals: normals ? copyAttribute(normals, 3) : undefined,
    uvs: uvs ? copyAttribute(uvs, 2) : undefined,
    indices: indices
      ? (indices.array instanceof Uint16Array
          ? new Uint16Array(indices.array)
          : new Uint32Array(indices.array))
      : undefined,
  };

  if (isSkinned) {
    const skinIdx = threeGeo.getAttribute('skinIndex');
    const skinWeight = threeGeo.getAttribute('skinWeight');
    if (skinIdx) def.skinIndices = new Uint16Array(copyAttribute(skinIdx, 4));
    if (skinWeight) def.skinWeights = copyAttribute(skinWeight, 4);
  }

  return new OroyaGeometry(def);
}

function copyAttribute(attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, width: number): Float32Array {
  const result = new Float32Array(attribute.count * width);
  for (let index = 0; index < attribute.count; index++) {
    result[index * width] = attribute.getX(index);
    if (width > 1) result[index * width + 1] = attribute.getY(index);
    if (width > 2) result[index * width + 2] = attribute.getZ(index);
    if (width > 3) result[index * width + 3] = attribute.getW(index);
  }
  return result;
}

/**
 * Translate a Three.js SkinnedMesh's skeleton into an Oroya `Skin` component.
 *
 * Bones are referenced by name — assumes bone names are unique within the
 * scene, which is the glTF convention. `inverseBindMatrices` is flattened
 * into a single `Float32Array` of length `boneCount * 16`.
 */
function translateSkin(mesh: THREE.SkinnedMesh): OroyaSkin | null {
  const skeleton = mesh.skeleton;
  if (!skeleton || skeleton.bones.length === 0) return null;

  const boneNames = skeleton.bones.map((b) => b.name);
  const ibmFlat = new Float32Array(skeleton.bones.length * 16);
  for (let i = 0; i < skeleton.bones.length; i++) {
    const m = skeleton.boneInverses[i];
    if (m) ibmFlat.set(m.elements, i * 16);
  }

  const def: SkinDef = {
    boneNames,
    inverseBindMatrices: ibmFlat,
    bindMatrix: new Float32Array(mesh.bindMatrix.elements),
  };
  return new OroyaSkin(def);
}

/**
 * Translate a Three.js Material to an Oroya Material component.
 */
function translateMaterial(threeMat: THREE.Material | THREE.Material[], options: GLTFLoadOptions, nodeId: string): OroyaMaterial | null {
  // Handle material arrays (use first material)
  if (Array.isArray(threeMat) && threeMat.length > 1) {
    diagnostic(options, 'Multi-material meshes currently use only the first material.', nodeId);
  }
  const mat = Array.isArray(threeMat) ? threeMat[0] : threeMat;

  if (!mat) {
    return null;
  }

  // Built incrementally from Three's heterogeneous material types.
  // Each `if` block narrows once a Three subclass is detected.
  const def: MaterialDef = {};
  if (Object.values(mat).some((value) => value instanceof THREE.Texture)) diagnostic(options, 'Texture images require an application asset adapter; texture maps are not persisted by this translator.', nodeId);

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
function translateAnimation(threeClip: THREE.AnimationClip, options: GLTFLoadOptions, aliases: Map<string, string>): AnimationClip {
  const tracks: KeyframeTrack[] = [];

  for (const threeTrack of threeClip.tracks) {
    const track = translateTrack(threeTrack, options, aliases);
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
function translateTrack(threeTrack: THREE.KeyframeTrack, options: GLTFLoadOptions, aliases: Map<string, string>): KeyframeTrack | null {
  // Parse the track name to extract node name and property
  // Format: "nodeName.property" (e.g., "Cube.position", "Armature|Bone.quaternion")
  const separator = threeTrack.name.lastIndexOf('.');
  if (separator < 0) {
    diagnostic(options, 'Could not parse track name: ' + threeTrack.name);
    return null;
  }

  const target = threeTrack.name.slice(0, separator);
  const targetNodeName = aliases.get(target) ?? target;
  const propertyName = threeTrack.name.slice(separator + 1);

  // Map Three.js property names to Oroya property names
  let property: 'position' | 'rotation' | 'scale';
  if (propertyName === 'position') {
    property = 'position';
  } else if (propertyName === 'quaternion') {
    property = 'rotation';
  } else if (propertyName === 'scale') {
    property = 'scale';
  } else {
    diagnostic(options, 'Unsupported animation track: ' + threeTrack.name);
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
