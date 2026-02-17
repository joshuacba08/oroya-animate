import type { Node } from '../nodes/Node';

/**
 * An enumeration of the available component types.
 */
export enum ComponentType {
  Transform = 'Transform',
  Geometry = 'Geometry',
  Material = 'Material',
  Camera = 'Camera',
  Interactive = 'Interactive',
  Animation = 'Animation',
  Light = 'Light',
  Environment = 'Environment',
  RigidBody = 'RigidBody',
  Collider = 'Collider',
  Script = 'Script',
  InstancedMesh = 'InstancedMesh',
  PostProcessing = 'PostProcessing',
  ParticleSystem = 'ParticleSystem',
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

  /**
   * Called once per frame to update the component's state.
   * @param dt The time elapsed since the last frame in seconds.
   */
  onUpdate?(dt: number): void;
}


