import {
  Camera,
  Component,
  ComponentType,
  Geometry,
  Material,
  Transform,
  Light,
  Environment,
  RigidBody,
  Collider,
  Animator,
  PostProcessing,
  ParticleSystem,
  AudioListener,
  AudioSource,
  Skin,
} from '../components';
import { Animation } from '../components/Animation';
import { Interactive } from '../components/Interactive';
import { Node } from '../nodes/Node';
import { Scene } from '../scene/Scene';
import { typedArrayReplacer, typedArrayReviver } from './typedArrays';

// A serializable representation of the scene graph
interface SerializableComponent {
  type: ComponentType;
  [key: string]: unknown;
}

interface SerializableNode {
  id: string;
  name: string;
  cssClass?: string;
  cssId?: string;
  components: SerializableComponent[];
  children: SerializableNode[];
}

interface SerializableScene {
  root: SerializableNode;
}

// Only JSON data and the supported typed arrays belong to definitions. Reject
// class instances before JSON can invoke backend toJSON() methods.
function snapshot(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' || typeof value === 'symbol' ? undefined : value;
  }
  if (value instanceof Float32Array || value instanceof Uint8Array ||
      value instanceof Uint16Array || value instanceof Uint32Array) return value;
  if (ancestors.has(value)) return undefined;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null) return undefined;
  ancestors.add(value);
  const result = Array.isArray(value)
    ? value.map((item) => snapshot(item, ancestors))
    : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item, ancestors)]));
  ancestors.delete(value);
  return result;
}

// Explicit adapters persist declarative data, never component runtime fields.
function serializeComponent(component: Component): SerializableComponent | undefined {
  if (component instanceof Transform) {
    return { type: component.type,
      position: { x: component.position.x, y: component.position.y, z: component.position.z },
      rotation: { x: component.rotation.x, y: component.rotation.y, z: component.rotation.z, w: component.rotation.w },
      scale: { x: component.scale.x, y: component.scale.y, z: component.scale.z } };
  }
  if (component instanceof Animation) {
    return { type: component.type, animations: snapshot(component.animations) };
  }
  if (component instanceof Camera ||
      component instanceof Geometry ||
      component instanceof Material ||
      component instanceof Light ||
      component instanceof Environment ||
      component instanceof RigidBody ||
      component instanceof Collider ||
      component instanceof Animator ||
      component instanceof PostProcessing ||
      component instanceof ParticleSystem ||
      component instanceof AudioListener ||
      component instanceof AudioSource ||
      component instanceof Skin ||
      component instanceof Interactive) {
    return { type: component.type, definition: snapshot(component.definition) };
  }
  return undefined;
}

// JSON is the external boundary. The constructor supplies the definition type;
// legacy component fields are deliberately ignored rather than assigned.
function reviveDefinition<D, C extends Component>(ctor: new (definition: D) => C,
    data: SerializableComponent): C {
  return new ctor(data.definition as D);
}

function serializeNode(node: Node): SerializableNode {
  const components: SerializableComponent[] = [];
  for (const [, component] of node.components.entries()) {
    const data = serializeComponent(component);
    if (data) components.push(data);
  }

  return {
    id: node.id,
    name: node.name,
    ...(node.cssClass ? { cssClass: node.cssClass } : {}),
    ...(node.cssId ? { cssId: node.cssId } : {}),
    components: components,
    children: node.children.map(serializeNode),
  };
}

/** @public */
export function serialize(scene: Scene): string {
  const serializableScene: SerializableScene = {
    root: serializeNode(scene.root),
  };
  return JSON.stringify(serializableScene, typedArrayReplacer, 2);
}

function deserializeNode(sNode: SerializableNode): Node {
  const node = new Node(sNode.name, sNode.id);
  if (sNode.cssClass) node.cssClass = sNode.cssClass;
  if (sNode.cssId) node.cssId = sNode.cssId;

  // Keep the default Transform when legacy JSON omits it.

  for (const sComp of sNode.components) {
    const component = reviveComponent(sComp);
    if (component) {
      node.addComponent(component);
    }
  }

  for (const sChild of sNode.children) {
    node.add(deserializeNode(sChild));
  }

  return node;
}

/**
 * Hydrate a single serialized component back into its class instance.
 * Centralizing this keeps the switch exhaustive — adding a new component
 * type is a one-line change here.
 */
function reviveComponent(sComp: SerializableComponent): Component | undefined {
  // All `*Def` payloads land on `sComp.definition`. Animation is the
  // historical outlier and uses `sComp.animations`.
  switch (sComp.type) {
    case ComponentType.Transform: {
      const t = new Transform();
      if (sComp.position) t.setPosition(sComp.position as Transform['position']);
      if (sComp.rotation) t.setRotation(sComp.rotation as Transform['rotation']);
      if (sComp.scale) t.setScale(sComp.scale as Transform['scale']);
      return t;
    }
    case ComponentType.Geometry:
      return reviveDefinition(Geometry, sComp);
    case ComponentType.Material:
      return reviveDefinition(Material, sComp);
    case ComponentType.Interactive:
      return reviveDefinition(Interactive, sComp);
    case ComponentType.Camera:
      return reviveDefinition(Camera, sComp);
    case ComponentType.Animation: {
      // Animation predates the def-on-`definition` convention and stores its
      // payload on `.animations`. The Animation constructor validates the
      // shape at runtime.
      const anims = (sComp.animations as ConstructorParameters<typeof Animation>[0]) ?? [];
      return new Animation(anims);
    }
    case ComponentType.Light:
      return reviveDefinition(Light, sComp);
    case ComponentType.Environment:
      return reviveDefinition(Environment, sComp);
    case ComponentType.RigidBody:
      return reviveDefinition(RigidBody, sComp);
    case ComponentType.Collider:
      return reviveDefinition(Collider, sComp);
    case ComponentType.Animator:
      return reviveDefinition(Animator, sComp);
    case ComponentType.PostProcessing:
      return reviveDefinition(PostProcessing, sComp);
    case ComponentType.ParticleSystem:
      return reviveDefinition(ParticleSystem, sComp);
    case ComponentType.AudioListener:
      return reviveDefinition(AudioListener, sComp);
    case ComponentType.AudioSource:
      return reviveDefinition(AudioSource, sComp);
    case ComponentType.Skin:
      return reviveDefinition(Skin, sComp);
    // InstancedMesh and Script are intentionally not deserialized here:
    //   - InstancedMesh holds runtime GPU buffers driven by user code.
    //   - Script holds a JS closure that can't survive JSON.
    // Persisting these requires application-level adapters.
    default:
      return undefined;
  }
}

/** @public */
export function deserialize(jsonString: string): Scene {
  const sScene: SerializableScene = JSON.parse(jsonString, typedArrayReviver);
  return new Scene(deserializeNode(sScene.root));
}

export { typedArrayReplacer, typedArrayReviver } from './typedArrays';
