import { Component, ComponentType } from './Component';
import { composeMatrix, Matrix4, Matrix4Identity } from '../math/Matrix4';

/**
 * An interface for representing a 3D vector.
 */
export interface Vec3 { x: number; y: number; z: number; }

/**
 * An interface for representing a quaternion for rotations.
 */
export interface Quat { x: number; y: number; z: number; w: number; }

/**
 * A component that defines the position, rotation, and scale of a node in 3D space.
 */
export class Transform extends Component {
  readonly type = ComponentType.Transform;

  /**
   * The position of the node.
   */
  position: Vec3 = { x: 0, y: 0, z: 0 };

  /**
   * The rotation of the node, represented as a quaternion.
   */
  rotation: Quat = { x: 0, y: 0, z: 0, w: 1 };

  /**
   * The scale of the node.
   */
  scale: Vec3 = { x: 1, y: 1, z: 1 };

  /**
   * The local transformation matrix of the node.
   */
  localMatrix: Matrix4 = [...Matrix4Identity] as Matrix4;

  /**
   * The world transformation matrix of the node.
   * This is calculated by multiplying the local matrix with the parent's world matrix.
   */
  worldMatrix: Matrix4 = [...Matrix4Identity] as Matrix4;

  /**
   * A flag indicating whether the transform needs to be recalculated.
   */
  isDirty: boolean = true;

  /**
   * Updates the local matrix from the current position, rotation, and scale.
   * Also sets the `isDirty` flag to true.
   */
  updateLocalMatrix(): void {
    this.localMatrix = composeMatrix(this.position, this.rotation, this.scale);
    this.isDirty = true;
  }
}


