import { Component, ComponentType } from './Component';
import { composeMatrix, Matrix4, Matrix4Identity } from '../math/Matrix4';
import * as QuaternionUtils from '../math/Quaternion';
import * as VectorUtils from '../math/Vector3';

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

  /**
   * Rotates the transform to look at the target position.
   * @param target The target position to look at.
   * @param up The up vector (defaults to {0, 1, 0}).
   */
  lookAt(target: Vec3, up: Vec3 = { x: 0, y: 1, z: 0 }): void {
    this.rotation = QuaternionUtils.lookAtQuaternion(this.position, target, up);
    this.isDirty = true;
  }

  /**
   * Rotates the transform around a local axis by a given angle.
   * @param axis The axis to rotate around (should be normalized).
   * @param angle The angle in radians.
   */
  rotateOnAxis(axis: Vec3, angle: number): void {
    const q1 = QuaternionUtils.setFromAxisAngle(axis, angle);
    this.rotation = QuaternionUtils.multiplyQuaternions(this.rotation, q1);
    this.isDirty = true;
  }

  /**
   * Sets the transform's position, rotation, and scale from a matrix.
   * Note: Decomposition assumes uniform scale for now.
   * @param matrix The matrix to decompose.
   */
  setFromMatrix(matrix: Matrix4): void {
    // Position
    this.position = { x: matrix[12], y: matrix[13], z: matrix[14] };

    // Scale (assume uniform or at least non-sheared for simple decomposition)
    const sx = VectorUtils.length({ x: matrix[0], y: matrix[1], z: matrix[2] });
    const sy = VectorUtils.length({ x: matrix[4], y: matrix[5], z: matrix[6] });
    const sz = VectorUtils.length({ x: matrix[8], y: matrix[9], z: matrix[10] });
    this.scale = { x: sx, y: sy, z: sz };

    // Rotation
    // Normalize matrix columns to extract rotation
    const m = [...matrix] as Matrix4;
    if (sx !== 0) { m[0] /= sx; m[1] /= sx; m[2] /= sx; }
    if (sy !== 0) { m[4] /= sy; m[5] /= sy; m[6] /= sy; }
    if (sz !== 0) { m[8] /= sz; m[9] /= sz; m[10] /= sz; }

    this.rotation = QuaternionUtils.setFromRotationMatrix(m);
    this.isDirty = true;
  }
}


