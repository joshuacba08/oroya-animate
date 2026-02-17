import { Scene, Node, ComponentType } from '@joroya/core';
import { PhysicsWorld } from './PhysicsWorld';
import { RigidBody } from './components/RigidBody';
import { Collider } from './components/Collider';

/**
 * System to handle physics simulation and synchronization with the Scene Graph.
 */
export class PhysicsSystem {
    private world: PhysicsWorld;
    private scene: Scene;

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
            const rb = node.getComponent<RigidBody>(ComponentType.RigidBody);

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
        const rb = node.getComponent<RigidBody>(ComponentType.RigidBody);
        if (rb && !rb.raw) {
            // Initialize RigidBody with current Transform
            rb.init(node.transform.position, node.transform.rotation);

            // Find and init collider on this node
            const collider = node.getComponent<Collider>(ComponentType.Collider);
            if (collider && !collider.raw) {
                collider.init(rb);
            }
        }
    }
}
