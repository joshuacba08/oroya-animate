import { Node } from '../nodes/Node';

/**
 * Represents the scene, which contains a hierarchy of nodes.
 */
export class Scene {
  readonly root: Node;

  constructor() {
    this.root = new Node('root');
  }

  /**
   * Adds a node to the scene.
   * @param node The node to add.
   * @param parent The parent node. Defaults to the scene's root.
   */
  add(node: Node, parent: Node = this.root): void {
    parent.add(node);
  }

  /**
   * Removes a node from the scene.
   * @param node The node to remove.
   */
  remove(node: Node): void {
    const parent = node.parent;
    if (parent) {
      parent.remove(node);
    }
  }

  /**
   * Finds a node by its ID.
   * @param id The ID of the node to find.
   * @returns The node if found, otherwise undefined.
   */
  findNodeById(id: string): Node | undefined {
    return this.root.findNodeById(id);
  }

  /**
   * Finds a node by its name.
   * @param name The name of the node to find.
   * @returns The node if found, otherwise undefined.
   */
  findNodeByName(name: string): Node | undefined {
    return this.root.findNodeByName(name);
  }

  /**
   * Traverses the scene graph.
   * @param callback The callback to execute for each node.
   */
  traverse(callback: (node: Node) => void): void {
    this.root.traverse(callback);
  }

  /**
   * Updates the world matrices of all nodes in the scene.
   */
  updateWorldMatrices(): void {
    this.root.updateWorldMatrix();
  }
}

