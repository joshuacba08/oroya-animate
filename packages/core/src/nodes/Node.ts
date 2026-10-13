import { v4 as uuidv4 } from 'uuid';
import { Component, ComponentType, Transform } from '../components';
import { EventEmitter } from '../events/EventEmitter';
import type { InteractionEvent, InteractionEventMap } from '../events/InteractionEvent';
import { Matrix4, multiplyMatrices } from '../math/Matrix4';

/**
 * A Node represents an element in a scene graph.
 * It can have a parent and children, forming a tree structure.
 * Each node has a Transform component by default.
 *
 * @public
 */
export class Node {
  readonly id: string;
  name: string;
  parent: Node | null = null;
  readonly children: Node[] = [];
  readonly components: Map<ComponentType, Component> = new Map();

  /** Optional CSS class(es) for SVG output. */
  cssClass?: string;

  /** Optional semantic id for SVG output (distinct from internal UUID). */
  cssId?: string;

  /** Event emitter for interaction events. */
  readonly events = new EventEmitter<InteractionEventMap>();

  /** 
   * Optional callback to run every frame. 
   * @param dt Time elapsed since last frame in seconds.
   */
  onUpdate?: (dt: number) => void;

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
    if (component.node && component.node !== this) {
      throw new Error('A component cannot belong to more than one node.');
    }
    if (component.type === ComponentType.Transform && !(component instanceof Transform)) {
      throw new Error('The Transform component must be a Transform instance.');
    }
    const previous = this.components.get(component.type);
    if (previous && previous !== component) previous.node = null;
    this.components.set(component.type, component);
    component.node = this;
  }

  /** Remove a component, except the mandatory Transform. */
  removeComponent(type: ComponentType): boolean {
    if (type === ComponentType.Transform) throw new Error('A node must retain its Transform.');
    const component = this.components.get(type);
    if (!component) return false;
    component.node = null;
    return this.components.delete(type);
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
    if (node === this) throw new Error('Adding this node would create a scene graph cycle.');
    for (let ancestor: Node | null = this.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor === node) throw new Error('Adding this node would create a scene graph cycle.');
    }
    if (node.parent === this) return;
    let root: Node = this.parent ?? this;
    while (root.parent) root = root.parent;
    const incoming = new Map<string, Node>();
    node.traverse((child) => {
      if (incoming.has(child.id)) throw new Error('Duplicate node ID: ' + child.id);
      incoming.set(child.id, child);
    });
    root.traverse((child) => {
      const source = incoming.get(child.id);
      if (source && source !== child) throw new Error('Duplicate node ID: ' + child.id);
    });
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
   * Updates the node, its components, and its children.
   * @param dt Time elapsed since last frame in seconds.
   */
  update(dt: number): void {
    // 1. Run node's custom script
    if (this.onUpdate) {
      this.onUpdate(dt);
    }

    // 2. Update components
    for (const component of this.components.values()) {
      if (component.onUpdate) {
        component.onUpdate(dt);
      }
    }

    // 3. Update children
    for (const child of [...this.children]) {
      child.update(dt);
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

  // ── Interaction Shortcuts ─────────────────────────────────

  /**
   * Register a handler for an interaction event type.
   * Shortcut for `node.events.on(type, handler)`.
   */
  on<K extends keyof InteractionEventMap>(type: K, handler: (event: InteractionEventMap[K]) => void): void {
    this.events.on(type, handler);
  }

  /**
   * Remove a handler for an interaction event type.
   * Shortcut for `node.events.off(type, handler)`.
   */
  off<K extends keyof InteractionEventMap>(type: K, handler: (event: InteractionEventMap[K]) => void): void {
    this.events.off(type, handler);
  }

  /**
   * Dispatch an interaction event on this node and propagate (bubble) up
   * the scene graph hierarchy.
   *
   * Bubbling stops when `event.stopPropagation()` is called or the root
   * node is reached.
   */
  dispatchInteraction(event: InteractionEvent): void {
    event.currentTarget = this;
    this.events.emit(event.type, event);

    if (!event.propagationStopped && this.parent) {
      this.parent.dispatchInteraction(event);
    }
  }
}

