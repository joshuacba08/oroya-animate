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

function serializeNode(node: Node): SerializableNode {
  const components: SerializableComponent[] = [];
  for (const [, component] of node.components.entries()) {
    // Drop the `node` back-reference (would cause a JSON cycle) and any
    // internal runtime state that shouldn't round-trip (e.g. event emitters,
    // cached mixers). Serialize only the public `type` + definition surface.
    const { node: _node, ...data } = component as Component & Record<string, unknown>;
    components.push(data as SerializableComponent);
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

  // Clear default transform before adding deserialized ones
  node.components.clear();

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
  const def = sComp.definition as never;
  switch (sComp.type) {
    case ComponentType.Transform: {
      const t = new Transform();
      Object.assign(t, sComp);
      return t;
    }
    case ComponentType.Geometry:
      return new Geometry(def);
    case ComponentType.Material:
      return new Material(def);
    case ComponentType.Interactive:
      return new Interactive(def);
    case ComponentType.Camera:
      return new Camera(def);
    case ComponentType.Animation: {
      // Animation predates the def-on-`definition` convention and stores its
      // payload on `.animations`. The Animation constructor validates the
      // shape at runtime.
      const anims = (sComp.animations as ConstructorParameters<typeof Animation>[0]) ?? [];
      return new Animation(anims);
    }
    case ComponentType.Light:
      return new Light(def);
    case ComponentType.Environment:
      return new Environment(def);
    case ComponentType.RigidBody:
      return new RigidBody(def);
    case ComponentType.Collider:
      return new Collider(def);
    case ComponentType.Animator:
      return new Animator(def);
    case ComponentType.PostProcessing:
      return new PostProcessing(def);
    case ComponentType.ParticleSystem:
      return new ParticleSystem(def);
    case ComponentType.AudioListener:
      return new AudioListener(def);
    case ComponentType.AudioSource:
      return new AudioSource(def);
    case ComponentType.Skin:
      return new Skin(def);
    // InstancedMesh and Script are intentionally not deserialized here:
    //   - InstancedMesh holds runtime GPU buffers driven by user code.
    //   - Script holds a JS closure that can't survive JSON.
    // Persisting these requires application-level adapters.
    default:
      return undefined;
  }
}

export function deserialize(jsonString: string): Scene {
  const sScene: SerializableScene = JSON.parse(jsonString, typedArrayReviver);
  const scene = new Scene();
  scene.root.children.length = 0; // Clear default root

  const rootNode = deserializeNode(sScene.root);
  // Snapshot the children before re-parenting: `scene.add` calls
  // `parent.remove(child)` on the source, which mutates `rootNode.children`
  // mid-iteration and would skip every other entry.
  const children = [...rootNode.children];
  for (const child of children) {
    scene.add(child);
  }

  return scene;
}

export { typedArrayReplacer, typedArrayReviver } from './typedArrays';
