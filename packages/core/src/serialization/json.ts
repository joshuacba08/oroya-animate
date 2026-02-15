import { Camera, Component, ComponentType, Geometry, Material, Transform } from '../components';
import { Animation } from '../components/Animation';
import { Interactive } from '../components/Interactive';
import { Node } from '../nodes/Node';
import { Scene } from '../scene/Scene';

// A serializable representation of the scene graph
interface SerializableComponent {
  type: ComponentType;
  [key: string]: any;
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
    // Destructure out the `node` back-reference to avoid circular JSON
    const { node: _node, ...data } = component as any;
    components.push(data);
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
  return JSON.stringify(serializableScene, null, 2);
}

function deserializeNode(sNode: SerializableNode): Node {
  const node = new Node(sNode.name, sNode.id);
  if (sNode.cssClass) node.cssClass = sNode.cssClass;
  if (sNode.cssId) node.cssId = sNode.cssId;

  // Clear default transform before adding deserialized ones
  node.components.clear();

  for (const sComp of sNode.components) {
    let component: Component | undefined = undefined;
    switch (sComp.type) {
      case ComponentType.Transform:
        const transform = new Transform();
        Object.assign(transform, sComp);
        component = transform;
        break;
      case ComponentType.Geometry:
        component = new Geometry(sComp.definition);
        break;
      case ComponentType.Material:
        component = new Material(sComp.definition);
        break;
      case ComponentType.Interactive:
        component = new Interactive(sComp.definition);
        break;
      case ComponentType.Camera:
        component = new Camera(sComp.definition);
        break;
      case ComponentType.Animation:
        component = new Animation(sComp.animations ?? []);
        break;
    }
    if (component) {
      node.addComponent(component);
    }
  }

  for (const sChild of sNode.children) {
    node.add(deserializeNode(sChild));
  }

  return node;
}

export function deserialize(jsonString: string): Scene {
  const sScene: SerializableScene = JSON.parse(jsonString);
  const scene = new Scene();
  scene.root.children.length = 0; // Clear default root

  const rootNode = deserializeNode(sScene.root);
  // The scene root itself is not added as a child, but its children are.
  rootNode.children.forEach(child => scene.add(child));

  return scene;
}
