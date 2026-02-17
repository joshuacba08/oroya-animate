import { Scene, Node, ComponentType } from '@joroya/core';
import { PhysicsWorld } from './PhysicsWorld';
import { RigidBody, RigidBodyType } from './components/RigidBody';
import { Collider } from './components/Collider';

/**
 * System to handle physics simulation and synchronization with the Scene Graph.
 */
export class PhysicsSystem {
    private world: PhysicsWorld;
    private scene: Scene;
    private accumulator: number = 0;
    private stepSize: number = 1 / 60;

    constructor(scene: Scene) {
        this.scene = scene;
        this.world = PhysicsWorld.getInstance();
    }

    /**
     * Initializes the physics world (async).
     */
    public async init(): Promise<void> {
        await this.world.init();

        // Initialize all existing physics components in the scene
        this.scene.traverse((node) => {
            this.initNodePhysics(node);
        });
    }

    /**
     * Simulation step. Call this in your animation loop.
     * @param dt Delta time in seconds
     */
    public update(dt: number): void {
        if (!this.world.raw) return;

        // Fixed timestep logic can be implemented here, or just simple step
        this.world.step(dt);

        // Sync Physics -> Scene Graph
        this.scene.traverse((node) => {
            const rb = node.components.find(c => c instanceof RigidBody) as RigidBody | undefined;

            if (rb && rb.raw && (rb.raw.isDynamic() || rb.raw.isKinematic())) {
                const translation = rb.raw.translation();
                const rotation = rb.raw.rotation();

                node.transform.position.x = translation.x;
                node.transform.position.y = translation.y;
                node.transform.position.z = translation.z;

                node.transform.rotation.x = rotation.x;
                node.transform.rotation.y = rotation.y;
                node.transform.rotation.z = rotation.z;
                node.transform.rotation.w = rotation.w;

                node.transform.updateLocalMatrix();
            }
        });
    }

    private initNodePhysics(node: Node): void {
        const rb = node.components.find(c => c instanceof RigidBody) as RigidBody | undefined;
        if (rb && !rb.raw) {
            // Initialize RigidBody with current Transform
            rb.init(node.transform.position, node.transform.rotation);

            // Find and init colliders on this node
            // Note: In complex setups, colliders might be on child nodes, 
            // but Rapier expects colliders to be attached to a RigidBody.
            // For v0.7, we support Colliders on the same node as RigidBody.
            const colliders = node.components.filter(c => c instanceof Collider) as Collider[];
            colliders.forEach(c => {
                if (!c.raw) c.init(rb);
            });
        }
    }
}
