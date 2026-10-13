import { describe, expect, it } from 'vitest';
import { Scene, Node, RigidBody, RigidBodyType, Collider, ColliderShape, type Diagnostic } from '@joroya/core';
import { PhysicsSystem } from '../src';

describe('physics lifecycle and supported hierarchy', () => {
  it('keeps body world poses under translated and rotated scene roots', () => {
    const scene = new Scene(); scene.root.transform.setPosition({ x: 10, y: 0, z: 0 });
    scene.root.transform.setRotation({ x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 });
    const node = new Node('body'); node.transform.setPosition({ x: 2, y: 0, z: 0 }); node.addComponent(new RigidBody({})); scene.add(node);
    const system = new PhysicsSystem({ gravity: { x: 0, y: 0, z: 0 } }); system.update(0, scene); scene.updateWorldMatrices();
    expect(node.transform.worldMatrix[12]).toBeCloseTo(10); expect(node.transform.worldMatrix[13]).toBeCloseTo(2);
    expect(node.transform.position.x).toBeCloseTo(2); expect(node.transform.position.y).toBeCloseTo(0); system.dispose();
  });
  it('uses current transforms at spawn and removes retired bodies and constraints', () => {
    const scene = new Scene(); const system = new PhysicsSystem({ gravity: { x: 0, y: 0, z: 0 } });
    const a = new Node('a'); const b = new Node('b');
    for (const node of [a, b]) { node.addComponent(new RigidBody({ type: RigidBodyType.Dynamic })); node.addComponent(new Collider({ shape: ColliderShape.Sphere, radius: 1 })); scene.add(node); }
    a.transform.setPosition({ x: 5, y: 7, z: 0 }); system.update(0, scene);
    expect(system.getBody(a)!.position.x).toBe(5); system.addDistanceConstraint(a, b, 5); expect(system.world.constraints).toHaveLength(1);
    scene.remove(a); system.update(0, scene); expect(system.world.bodies).toHaveLength(1); expect(system.world.constraints).toHaveLength(0); system.dispose();
  });
  it('diagnoses nested bodies and rejects invalid timestep input', () => {
    const diagnostics: Diagnostic[] = []; const system = new PhysicsSystem({ onDiagnostic: (value) => diagnostics.push(value) });
    const scene = new Scene(); const parent = new Node('group'); const nested = new Node('nested');
    nested.addComponent(new RigidBody({})); parent.add(nested); scene.add(parent); system.update(0, scene);
    expect(diagnostics[0].code).toBe('UNSUPPORTED_PHYSICS_PARENT'); expect(system.world.bodies).toHaveLength(0);
    expect(() => system.update(-1, scene)).toThrow('delta'); expect(() => new PhysicsSystem({ fixedTimeStep: 0 })).toThrow('timestep'); system.dispose();
  });
});
