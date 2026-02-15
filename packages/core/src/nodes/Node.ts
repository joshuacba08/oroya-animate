import { v4 as uuidv4 } from 'uuid';
import { Component, ComponentType, Transform } from '../components';
import { Matrix4, Matrix4Identity, multiplyMatrices } from '../math/Matrix4';

/**
 * A Node represents an element in a scene graph.
 * It can have a parent and children, forming a tree structure.
 * Each node has a Transform component by default.
 */
export class Node {
  readonly id: string;
  name: string;
  parent: Node | null = null;
  readonly children: Node[] = [];
  readonly components: Map<ComponentType, Component> = new Map();

  constructor(name: string, id: string = uuidv4()) {
    this.id = id;
    this.name = name;
    this.addComponent(new Transform()); // Every node has a Transform by default.
  }

  /**
   * The transform component of the node.
   */
  get transform(): Transform {
    return this.getComponent<Transform>(ComponentType.Transform)!;
  }

  /**
   * Adds a component to the node.
   * @param component The component to add.
   */
  addComponent(component: Component): void {
    this.components.set(component.type, component);
    component.node = this;
  }

  /**
   * Retrieves a component from the node by its type.
   * @param type The type of the component to retrieve.
   * @returns The component if found, otherwise undefined.
   */
  getComponent<T extends Component>(type: ComponentType): T | undefined {
    return this.components.get(type) as T;
  }

  /**
   * Checks if the node has a component of a given type.
   * @param type The type of the component to check for.
   * @returns True if the component exists, false otherwise.
   */
  hasComponent(type: ComponentType): boolean {
    return this.components.has(type);
  }

  /**
   * Adds a child node to this node.
   * @param node The node to add as a child.
   */
  add(node: Node): void {
    if (node.parent) {
      node.parent.remove(node);
    }
    node.parent = this;
    this.children.push(node);
  }

  /**
   * Removes a child node from this node.
   * @param node The child node to remove.
   */
  remove(node: Node): void {
    const index = this.children.indexOf(node);
    if (index > -1) {
      node.parent = null;
      this.children.splice(index, 1);
    }
  }

  /**
   * Updates the world matrix of this node and all its children.
   * @param parentMatrix The world matrix of the parent node.
   */
  updateWorldMatrix(parentMatrix?: Matrix4): void {
    if (this.transform.isDirty) {
      this.transform.updateLocalMatrix();
    }

    const parentWorldMatrix = parentMatrix || (this.parent ? this.parent.transform.worldMatrix : undefined);

    if (parentWorldMatrix) {
      this.transform.worldMatrix = multiplyMatrices(parentWorldMatrix, this.transform.localMatrix);
    } else {
      this.transform.worldMatrix = [...this.transform.localMatrix] as Matrix4;
    }

    this.transform.isDirty = false;

    for (const child of this.children) {
      child.updateWorldMatrix(this.transform.worldMatrix);
    }
  }
  
  /**
   * Traverses the node and its children recursively.
   * @param callback The function to execute for each node.
   */
  traverse(callback: (node: Node) => void): void {
    callback(this);
    for (const child of this.children) {
      child.traverse(callback);
    }
  }

  /**
   * Finds a node by its ID in the subtree.
   * @param id The ID of the node to find.
   * @returns The node if found, otherwise undefined.
   */
  findNodeById(id: string): Node | undefined {
    if (this.id === id) {
      return this;
    }
    for (const child of this.children) {
      const found = child.findNodeById(id);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  /**
   * Finds a node by its name in the subtree.
   * @param name The name of the node to find.
   * @returns The node if found, otherwise undefined.
   */
  findNodeByName(name: string): Node | undefined {
    if (this.name === name) {
      return this;
    }
    for (const child of this.children) {
      const found = child.findNodeByName(name);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}

