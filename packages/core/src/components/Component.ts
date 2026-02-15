import type { Node } from '../nodes/Node';

/**
 * An enumeration of the available component types.
 */
export enum ComponentType {
  Transform = 'Transform',
  Geometry = 'Geometry',
  Material = 'Material',
  Camera = 'Camera',
}

/**
 * The base class for all components that can be attached to a Node.
 */
export abstract class Component {
  /**
   * The type of the component.
   */
  abstract readonly type: ComponentType;

  /**
   * A reference to the node that this component is attached to.
   * This is set automatically when the component is added to a node.
   */
  node: Node | null = null;
}


