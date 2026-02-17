import RAPIER from '@dimforge/rapier3d-compat';
import { Vec3 } from '@joroya/core';

/**
 * Manages the Rapier physics world and simulation loop.
 */
export class PhysicsWorld {
    private static instance: PhysicsWorld;
    public raw: RAPIER.World | null = null;
    private _gravity: Vec3 = { x: 0, y: -9.81, z: 0 };
    private initialized = false;

    private constructor() { }

    /**
     * Gets the singleton instance of the PhysicsWorld.
     */
    public static getInstance(): PhysicsWorld {
        if (!PhysicsWorld.instance) {
            PhysicsWorld.instance = new PhysicsWorld();
        }
        return PhysicsWorld.instance;
    }

    /**
     * Initializes the Rapier WASM module and creates the world.
     * Must be called before using any physics features.
     */
    public async init(): Promise<void> {
        if (this.initialized) return;

        await RAPIER.init();

        // RAPIER.Vector3 expects x, y, z arguments
        const g = this._gravity;
        const gravity = new RAPIER.Vector3(g.x, g.y, g.z);
        this.raw = new RAPIER.World(gravity);

        this.initialized = true;
        console.log('Rapier Physics World Initialized');
    }

    /**
     * Steps the physics simulation forward.
     * @param delta Time elapsed since last frame (currently Rapier uses fixed timestep internally, 
     * so we might just call step() or configure timestep)
     */
    public step(delta: number): void {
        if (!this.raw) return;
        // Rapier usage: world.step() advances by the configured timestep (default 1/60)
        this.raw.step();
    }

    /**
     * Sets the gravity vector.
     */
    public set gravity(value: Vec3) {
        this._gravity = value;
        if (this.raw) {
            this.raw.gravity = new RAPIER.Vector3(value.x, value.y, value.z);
        }
    }

    public get gravity(): Vec3 {
        return this._gravity;
    }
}
