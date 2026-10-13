import { CameraType, ComponentType, GeometryPrimitive, LightType, RigidBodyType, ColliderShape } from '../components';
import type { Diagnostic } from '../rendering';
import { typedArrayReviver } from './typedArrays';

/** Diagnostics are reported before any scene is constructed. @public */
export interface SceneValidationResult {
  valid: boolean;
  diagnostics: Diagnostic[];
}

/** Optional reporting for omitted data and invalid external input. @public */
export interface PersistenceOptions {
  onDiagnostic?: (diagnostic: Diagnostic) => void;
}

/** Invalid scene data, with precise paths for an application's error UI. @public */
export class SceneValidationError extends Error {
  constructor(public readonly diagnostics: Diagnostic[]) {
    super(diagnostics.map((item) => (item.path ?? '$') + ': ' + item.message).join('\n'));
    this.name = 'SceneValidationError';
  }
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !ArrayBuffer.isView(value);

/** Validate a JSON string or its decoded data without creating runtime objects. @public */
export function validateSceneJSON(input: unknown): SceneValidationResult {
  const diagnostics: Diagnostic[] = [];
  const error = (path: string, message: string, nodeId?: string) =>
    diagnostics.push({ code: 'INVALID_SCENE', path, message, nodeId, severity: 'error' });
  let data: unknown = input;
  if (typeof input === 'string') {
    try { data = JSON.parse(input, typedArrayReviver); }
    catch (cause) { error('$', cause instanceof Error ? cause.message : 'Invalid JSON.'); }
  }
  const seen = new Set<object>();
  const finite = (value: unknown, path: string, depth = 0): void => {
    if (typeof value === 'number' && !Number.isFinite(value)) error(path, 'Numbers must be finite.');
    if (!value || typeof value !== 'object') return;
    if (depth > 128) { error(path, 'Maximum data depth is 128.'); return; }
    if (seen.has(value)) { error(path, 'Circular data is not serializable.'); return; }
    seen.add(value);
    if (ArrayBuffer.isView(value)) {
      if (!(value instanceof Float32Array || value instanceof Uint8Array || value instanceof Uint16Array || value instanceof Uint32Array)) {
        error(path, 'Unsupported typed array.');
      } else for (const entry of value) if (!Number.isFinite(entry)) { error(path, 'Buffer values must be finite.'); break; }
    } else for (const [key, entry] of Object.entries(value)) finite(entry, path + '.' + key, depth + 1);
    seen.delete(value);
  };
  finite(data, '$');
  const vector = (value: unknown, fields: string[], path: string, optional = false) => {
    if (optional && value === undefined) return;
    if (!record(value) || fields.some((key) => typeof value[key] !== 'number')) error(path, 'Expected numeric ' + fields.join(', ') + '.');
  };
  const clips = (value: unknown, path: string) => {
    if (!record(value)) { error(path, 'Expected an animation clip.'); return; }
    if (typeof value.name !== 'string' || typeof value.duration !== 'number' || value.duration < 0 || !Array.isArray(value.tracks)) {
      error(path, 'Invalid animation name, duration or tracks.'); return;
    }
    for (const [index, track] of value.tracks.entries()) {
      const p = path + '.tracks.' + index;
      if (!record(track) || typeof track.targetNodeName !== 'string' ||
        !['position', 'rotation', 'scale'].includes(String(track.property)) ||
        !['linear', 'step', 'cubicspline'].includes(String(track.interpolation)) ||
        !(track.times instanceof Float32Array) || !(track.values instanceof Float32Array)) {
        error(p, 'Invalid animation track.'); continue;
      }
      const stride = track.property === 'rotation' ? 4 : 3;
      const factor = track.interpolation === 'cubicspline' ? 3 : 1;
      if (!track.times.length || track.values.length !== track.times.length * stride * factor) error(p, 'Inconsistent keyframe buffer lengths.');
      for (let i = 0; i < track.times.length; i++) {
        if (track.times[i] < 0 || track.times[i] > value.duration || (i > 0 && track.times[i] <= track.times[i - 1])) {
          error(p + '.times', 'Keyframe times must increase within the clip duration.'); break;
        }
      }
    }
  };
  const ids = new Set<string>();
  const names = new Set<string>();
  const skins: Array<{ definition: Record<string, unknown>; path: string }> = [];
  const visit = (value: unknown, path: string, depth = 0): void => {
    if (depth > 128) { error(path, 'Maximum scene depth is 128.'); return; }
    if (!record(value)) { error(path, 'Expected a node.'); return; }
    const id = typeof value.id === 'string' ? value.id : undefined;
    if (!id || ids.has(id)) error(path + '.id', 'Node IDs must be nonempty and unique.', id);
    if (id) ids.add(id);
    if (typeof value.name !== 'string') error(path + '.name', 'Expected a node name.', id);
    else names.add(value.name);
    if (!Array.isArray(value.components) || !Array.isArray(value.children)) { error(path, 'Expected components and children arrays.', id); return; }
    const types = new Set<string>();
    let buffer: Record<string, unknown> | undefined;
    let skin: Record<string, unknown> | undefined;
    for (const [index, component] of value.components.entries()) {
      const p = path + '.components.' + index;
      if (!record(component) || typeof component.type !== 'string') { error(p, 'Expected a component type.', id); continue; }
      if (types.has(component.type)) error(p, 'Only one component per type is allowed.', id);
      types.add(component.type);
      if (!Object.values(ComponentType).includes(component.type as ComponentType) ||
          component.type === ComponentType.Script || component.type === ComponentType.InstancedMesh) {
        diagnostics.push({ code: 'OMITTED_COMPONENT', path: p, nodeId: id, severity: 'warning', message: component.type + ' requires an application adapter.' });
        continue;
      }
      if (component.type === ComponentType.Transform) {
        vector(component.position, ['x', 'y', 'z'], p + '.position', true);
        vector(component.rotation, ['x', 'y', 'z', 'w'], p + '.rotation', true);
        vector(component.scale, ['x', 'y', 'z'], p + '.scale', true);
        continue;
      }
      if (component.type === ComponentType.Animation) {
        if (component.animations !== undefined && !Array.isArray(component.animations)) error(p, 'Expected animations array.');
        continue;
      }
      if (!record(component.definition)) { error(p + '.definition', 'Expected a component definition.', id); continue; }
      const def = component.definition;
      if (component.type === ComponentType.Camera && !Object.values(CameraType).includes(def.type as CameraType)) error(p, 'Unknown camera type.', id);
      if (component.type === ComponentType.Camera) {
        const fields = def.type === CameraType.Perspective ? ['fov', 'aspect', 'near', 'far'] : ['left', 'right', 'top', 'bottom', 'near', 'far'];
        if (fields.some((key) => typeof def[key] !== 'number')) error(p, 'Incomplete camera projection.', id);
        if (typeof def.near === 'number' && typeof def.far === 'number' && def.far <= def.near) error(p, 'Camera far must exceed near.', id);
      }
      if (component.type === ComponentType.Material || component.type === ComponentType.Light) {
        for (const key of ['color', 'fill', 'stroke', 'emissive']) vector(def[key], ['r', 'g', 'b'], p + '.definition.' + key, true);
        if (def.opacity !== undefined && (typeof def.opacity !== 'number' || def.opacity < 0 || def.opacity > 1)) error(p, 'Opacity must be between zero and one.', id);
      }
      if (component.type === ComponentType.Light && !Object.values(LightType).includes(def.type as LightType)) error(p, 'Unknown light type.', id);
      if (component.type === ComponentType.RigidBody && !Object.values(RigidBodyType).includes(def.type as RigidBodyType)) error(p, 'Unknown rigid body type.', id);
      if (component.type === ComponentType.Collider && !Object.values(ColliderShape).includes(def.shape as ColliderShape)) error(p, 'Unknown collider shape.', id);
      if (component.type === ComponentType.ParticleSystem && def.maxParticles !== undefined && (typeof def.maxParticles !== 'number' || !Number.isInteger(def.maxParticles) || def.maxParticles < 1)) error(p, 'Particle count must be a positive integer.', id);
      if (component.type === ComponentType.AudioSource && typeof def.url !== 'string') error(p, 'Audio source requires a URL.', id);
      if (component.type === ComponentType.Geometry) {
        if (!Object.values(GeometryPrimitive).includes(def.type as GeometryPrimitive)) error(p, 'Unknown geometry type.', id);
        const dimensions: Record<string, string[]> = { Box: ['width', 'height', 'depth'], Sphere: ['radius', 'widthSegments', 'heightSegments'], Plane: ['width', 'height'], Cylinder: ['height'], Cone: ['radius', 'height'], Torus: ['radius', 'tube'], Circle: ['radius'] };
        if ((dimensions[String(def.type)] ?? []).some((key) => typeof def[key] !== 'number' || Number(def[key]) < 0)) error(p, 'Geometry dimensions must be non-negative numbers.', id);
        if (def.type === GeometryPrimitive.Text && typeof def.text !== 'string') error(p, 'Text geometry requires text.', id);
        if (def.type === GeometryPrimitive.Path2D) {
          const arity: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
          if (!Array.isArray(def.path) || def.path.some((command) => !record(command) || typeof command.command !== 'string' || !(command.command in arity) || !Array.isArray(command.args) || command.args.length !== arity[command.command] || command.args.some((value) => typeof value !== 'number'))) error(p, 'Invalid path commands.', id);
        }
        if (def.type === GeometryPrimitive.Buffer) {
          buffer = def;
          const count = def.positions instanceof Float32Array ? def.positions.length / 3 : NaN;
          if (!Number.isInteger(count) || count < 1) error(p, 'Expected xyz Float32Array positions.', id);
          for (const [key, stride] of [['normals', 3], ['uvs', 2], ['skinIndices', 4], ['skinWeights', 4]] as const) {
            const array = def[key];
            if (array !== undefined && (!(array instanceof Float32Array || (key === 'skinIndices' && array instanceof Uint16Array)) || array.length !== count * stride)) error(p + '.' + key, 'Inconsistent attribute type or length.', id);
          }
          if (def.indices !== undefined && (!(def.indices instanceof Uint16Array || def.indices instanceof Uint32Array) ||
            [...def.indices].some((item) => item >= count))) error(p + '.indices', 'Invalid vertex indices.', id);
          if ((def.indices instanceof Uint16Array || def.indices instanceof Uint32Array) && def.indices.length % 3 !== 0) diagnostics.push({ code: 'INCOMPLETE_TRIANGLE', path: p, nodeId: id, severity: 'warning', message: 'Index count is not a multiple of three; the final triangle is incomplete.' });
        }
      }
      if (component.type === ComponentType.Animator && def.animations !== undefined) {
        if (!record(def.animations)) error(p, 'Expected animation library.');
        else for (const [key, clip] of Object.entries(def.animations)) clips(clip, p + '.definition.animations.' + key);
      }
      if (component.type === ComponentType.Skin) {
        if (def.bindMatrix !== undefined && (!(def.bindMatrix instanceof Float32Array) || def.bindMatrix.length !== 16)) error(p, 'Bind matrix must contain 16 Float32 values.', id);
        skin = def;
        skins.push({ definition: def, path: p });
        if (!Array.isArray(def.boneNames) || !def.boneNames.every((name) => typeof name === 'string') ||
          !(def.inverseBindMatrices instanceof Float32Array) || def.inverseBindMatrices.length !== def.boneNames.length * 16) error(p, 'Invalid skeleton names or inverse bind matrices.', id);
      }
    }
    if (skin && buffer && Array.isArray(skin.boneNames)) {
      if (!(buffer.skinIndices instanceof Uint16Array) || !(buffer.skinWeights instanceof Float32Array)) error(path, 'Skinned geometry requires bone indices and weights.', id);
      else {
        const boneCount = skin.boneNames.length;
        if ([...buffer.skinIndices].some((index) => index >= boneCount)) error(path, 'Bone index outside skeleton.', id);
      }
    }
    for (const [index, child] of value.children.entries()) visit(child, path + '.children.' + index, depth + 1);
  };
  if (!record(data) || !('root' in data)) error('$', 'Expected a scene root.');
  else visit(data.root, '$.root');
  for (const { definition, path } of skins) if (Array.isArray(definition.boneNames)) {
    for (const name of definition.boneNames) if (!names.has(name)) diagnostics.push({ code: 'MISSING_BONE', path, severity: 'warning', message: 'Bone must be supplied before rendering: ' + name });
  }
  return { valid: !diagnostics.some((item) => item.severity === 'error'), diagnostics };
}
