export const VERSION = "0.1.0";

export * from './PhysicsWorld';
export * from './PhysicsSystem';
export * from './components/RigidBody';
export * from './components/Collider';

// Re-export Rapier types that might be useful for users
import RAPIER from '@dimforge/rapier3d-compat';
export { RAPIER };
