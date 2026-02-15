import { Scene } from '../scene/Scene';
import { Node } from '../nodes/Node';
import { Component, ComponentType, Geometry, Material, Transform } from '../components';
import { Interactive } from '../components/Interactive';

// A serializable representation of the scene graph
interface SerializableComponent {
  type: ComponentType;
  [key: string]: any;
}

interface SerializableNode {
  id: string;
  name: string;
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
