import {
    Scene,
    Node,
    ComponentType,
    RigidBody,
    Collider,
    RigidBodyType,
    ColliderShape,
    type CollisionEvent,
    type Vec3,
} from '@joroya/core';
import * as CANNON from 'cannon-es';

/**
 * Options for constructing a `PhysicsSystem`.
 */
export interface PhysicsSystemOptions {
    /** World gravity vector. Default `{ x: 0, y: -9.82, z: 0 }`. */
    gravity?: Vec3;
    /** Fixed simulation timestep in seconds. Default `1/60`. */
    fixedTimeStep?: number;
    /** Max sub-steps per frame to keep simulation stable on slow frames. Default `3`. */
    maxSubSteps?: number;
    /** Default contact friction. Default `0.3`. */
    defaultFriction?: number;
    /** Default contact restitution. Default `0.3`. */
    defaultRestitution?: number;
}

/**
 * Result of a single physics raycast hit.
 */
export interface PhysicsRaycastHit {
    /** The node attached to the hit body. */
    node: Node;
    /** World-space hit point. */
    point: Vec3;
    /** World-space surface normal at the hit point. */
    normal: Vec3;
    /** Distance from ray origin to hit point. */
    distance: number;
}

/**
 * Drives a cannon-es world from a `Scene`. Reads `RigidBody` + `Collider`
 * components from each node, owns the resulting `CANNON.Body`, and writes
 * the simulated transforms back to `node.transform` each step.
 *
 * **World-space convention.** Bodies live in world space. `syncScene`
 * decomposes each rigid-body node's `worldMatrix` to set the body's initial
 * pose, and on read-back the system writes world-space pose into
 * `node.transform.position/rotation`. Nodes parented under non-rigid
 * groups therefore drift toward world origin (this is intentional —
 * mixing parent transforms with physics simulation produces nonsense). To
 * preserve hierarchy, parent the rigid-body node directly under the scene
 * root.
 */
export class PhysicsSystem {
    readonly world: CANNON.World;
    private readonly bodyMap = new Map<string, CANNON.Body>();
    private readonly nodeMap = new Map<string, Node>();
    /** Inverse map for resolving collision events to nodes. */
    private readonly bodyToNode = new Map<CANNON.Body, Node>();
    /** Active contact pairs from the previous step — used to dispatch end events. */
    private prevContacts = new Set<string>();

    private readonly defaultMaterial: CANNON.Material;
    private readonly fixedTimeStep: number;
    private readonly maxSubSteps: number;

    constructor(options: PhysicsSystemOptions = {}) {
        const g = options.gravity ?? { x: 0, y: -9.82, z: 0 };
        this.fixedTimeStep = options.fixedTimeStep ?? 1 / 60;
        this.maxSubSteps = options.maxSubSteps ?? 3;

        this.world = new CANNON.World();
        this.world.gravity.set(g.x, g.y, g.z);
        this.defaultMaterial = new CANNON.Material('default');

        const contactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: options.defaultFriction ?? 0.3,
                restitution: options.defaultRestitution ?? 0.3,
            },
        );
        this.world.addContactMaterial(contactMaterial);

        // World-level contact events cover triggers AND solid contacts uniformly;
        // body-level `collide` is reserved for continuous-frame contact info
        // (point/normal/impulse) which sensors do not produce.
        this.world.addEventListener('beginContact', this.onBeginContact);
        this.world.addEventListener('endContact', this.onEndContact);
    }

    get gravity(): Vec3 {
        return { x: this.world.gravity.x, y: this.world.gravity.y, z: this.world.gravity.z };
    }

    set gravity(v: Vec3) {
        this.world.gravity.set(v.x, v.y, v.z);
    }

    /**
     * Advance the simulation by `dt` and synchronize node transforms.
     */
    update(dt: number, scene: Scene): void {
        this.syncScene(scene);
        this.world.step(this.fixedTimeStep, dt, this.maxSubSteps);
        this.dispatchContacts();
        this.writeBack();
    }

    /**
     * Remove the body associated with a node. Call this when removing nodes
     * from the scene at runtime.
     */
    removeNode(node: Node): void {
        const body = this.bodyMap.get(node.id);
        if (!body) return;
        this.world.removeBody(body);
        this.bodyMap.delete(node.id);
        this.nodeMap.delete(node.id);
        this.bodyToNode.delete(body);
    }

    // ── Constraints / Joints ──────────────────────────────────

    /**
     * Hinge constraint — bodies rotate around a shared axis.
     * Use for doors, wheels, pendulums.
     */
    addHingeConstraint(
        a: Node,
        b: Node,
        options: { pivotA: Vec3; pivotB: Vec3; axisA?: Vec3; axisB?: Vec3 },
    ): CANNON.HingeConstraint | null {
        const bodyA = this.bodyMap.get(a.id);
        const bodyB = this.bodyMap.get(b.id);
        if (!bodyA || !bodyB) return null;
        const c = new CANNON.HingeConstraint(bodyA, bodyB, {
            pivotA: new CANNON.Vec3(options.pivotA.x, options.pivotA.y, options.pivotA.z),
            pivotB: new CANNON.Vec3(options.pivotB.x, options.pivotB.y, options.pivotB.z),
            axisA: options.axisA && new CANNON.Vec3(options.axisA.x, options.axisA.y, options.axisA.z),
            axisB: options.axisB && new CANNON.Vec3(options.axisB.x, options.axisB.y, options.axisB.z),
        });
        this.world.addConstraint(c);
        return c;
    }

    /**
     * Point-to-point constraint — bodies share a single world point.
     * Use for ball joints, chains, attachment points.
     */
    addPointToPointConstraint(
        a: Node,
        b: Node,
        options: { pivotA: Vec3; pivotB: Vec3; maxForce?: number },
    ): CANNON.PointToPointConstraint | null {
        const bodyA = this.bodyMap.get(a.id);
        const bodyB = this.bodyMap.get(b.id);
        if (!bodyA || !bodyB) return null;
        const c = new CANNON.PointToPointConstraint(
            bodyA,
            new CANNON.Vec3(options.pivotA.x, options.pivotA.y, options.pivotA.z),
            bodyB,
            new CANNON.Vec3(options.pivotB.x, options.pivotB.y, options.pivotB.z),
            options.maxForce,
        );
        this.world.addConstraint(c);
        return c;
    }

    /**
     * Distance constraint — bodies maintain a fixed separation.
     * Use for ropes, springs (with low maxForce), rigid links.
     */
    addDistanceConstraint(
        a: Node,
        b: Node,
        distance: number,
        maxForce?: number,
    ): CANNON.DistanceConstraint | null {
        const bodyA = this.bodyMap.get(a.id);
        const bodyB = this.bodyMap.get(b.id);
        if (!bodyA || !bodyB) return null;
        const c = new CANNON.DistanceConstraint(bodyA, bodyB, distance, maxForce);
        this.world.addConstraint(c);
        return c;
    }

    removeConstraint(c: CANNON.Constraint): void {
        this.world.removeConstraint(c);
    }

    // ── Raycast ───────────────────────────────────────────────

    /**
     * Cast a ray and return the closest hit, or `null` if nothing was hit.
     */
    raycast(from: Vec3, to: Vec3): PhysicsRaycastHit | null {
        const result = new CANNON.RaycastResult();
        const ray = new CANNON.Ray(
            new CANNON.Vec3(from.x, from.y, from.z),
            new CANNON.Vec3(to.x, to.y, to.z),
        );
        ray.intersectWorld(this.world, {
            mode: CANNON.Ray.CLOSEST,
            result,
            skipBackfaces: true,
        });
        if (!result.hasHit || !result.body) return null;
        const node = this.bodyToNode.get(result.body);
        if (!node) return null;
        return {
            node,
            point: { x: result.hitPointWorld.x, y: result.hitPointWorld.y, z: result.hitPointWorld.z },
            normal: { x: result.hitNormalWorld.x, y: result.hitNormalWorld.y, z: result.hitNormalWorld.z },
            distance: result.distance,
        };
    }

    /**
     * Cast a ray and return every hit along its length.
     */
    raycastAll(from: Vec3, to: Vec3): PhysicsRaycastHit[] {
        const hits: PhysicsRaycastHit[] = [];
        const ray = new CANNON.Ray(
            new CANNON.Vec3(from.x, from.y, from.z),
            new CANNON.Vec3(to.x, to.y, to.z),
        );
        ray.intersectWorld(this.world, {
            mode: CANNON.Ray.ALL,
            skipBackfaces: true,
            callback: (result) => {
                const node = result.body && this.bodyToNode.get(result.body);
                if (!node) return;
                hits.push({
                    node,
                    point: { x: result.hitPointWorld.x, y: result.hitPointWorld.y, z: result.hitPointWorld.z },
                    normal: { x: result.hitNormalWorld.x, y: result.hitNormalWorld.y, z: result.hitNormalWorld.z },
                    distance: result.distance,
                });
            },
        });
        return hits;
    }

    // ── Internals ─────────────────────────────────────────────

    private syncScene(scene: Scene): void {
        scene.root.traverse((node) => {
            if (node.hasComponent(ComponentType.RigidBody) && !this.bodyMap.has(node.id)) {
                this.createBody(node);
            }
        });
    }

    private createBody(node: Node): void {
        const rb = node.getComponent<RigidBody>(ComponentType.RigidBody)!;
        const collider = node.getComponent<Collider>(ComponentType.Collider);

        const type =
            rb.definition.type === RigidBodyType.Static
                ? CANNON.Body.STATIC
                : rb.definition.type === RigidBodyType.Kinematic
                    ? CANNON.Body.KINEMATIC
                    : CANNON.Body.DYNAMIC;

        const body = new CANNON.Body({
            mass: rb.definition.mass,
            type,
            material: this.defaultMaterial,
            fixedRotation: rb.definition.fixedRotation,
            linearDamping: rb.definition.linearDamping,
            angularDamping: rb.definition.angularDamping,
            isTrigger: collider?.definition.isTrigger ?? false,
            collisionFilterGroup: collider?.definition.collisionGroup ?? 1,
            collisionFilterMask: collider?.definition.collisionMask ?? -1,
        });

        // Initial pose is taken from world matrix so the rigid body spawns
        // wherever the user placed the node in scene space.
        const wm = node.transform.worldMatrix;
        body.position.set(wm[12], wm[13], wm[14]);
        body.quaternion.set(
            node.transform.rotation.x,
            node.transform.rotation.y,
            node.transform.rotation.z,
            node.transform.rotation.w,
        );

        if (collider) {
            const shape = this.createShape(collider);
            if (shape) {
                const offset = collider.definition.center;
                body.addShape(shape, new CANNON.Vec3(offset.x, offset.y, offset.z));
            }
        }

        // Per-body `collide` fires only for solid contacts (not triggers) and
        // carries the ContactEquation. Use it to enrich continuous `collide`
        // events with point/normal/impulse data.
        body.addEventListener('collide', (e: { contact: CANNON.ContactEquation; body: CANNON.Body }) => {
            this.onBodyCollide(node, body, e);
        });

        this.world.addBody(body);
        this.bodyMap.set(node.id, body);
        this.nodeMap.set(node.id, node);
        this.bodyToNode.set(body, node);
    }

    private createShape(collider: Collider): CANNON.Shape | null {
        const def = collider.definition;
        switch (def.shape) {
            case ColliderShape.Box:
                return new CANNON.Box(new CANNON.Vec3(def.halfExtents.x, def.halfExtents.y, def.halfExtents.z));
            case ColliderShape.Sphere:
                return new CANNON.Sphere(def.radius);
            case ColliderShape.Plane:
                return new CANNON.Plane();
            case ColliderShape.Cylinder:
                return new CANNON.Cylinder(def.radius, def.radius, def.height, 16);
            default:
                return null;
        }
    }

    private writeBack(): void {
        for (const [nodeId, body] of this.bodyMap) {
            const node = this.nodeMap.get(nodeId);
            if (!node || body.type === CANNON.Body.STATIC) continue;
            node.transform.position = { x: body.position.x, y: body.position.y, z: body.position.z };
            node.transform.rotation = {
                x: body.quaternion.x,
                y: body.quaternion.y,
                z: body.quaternion.z,
                w: body.quaternion.w,
            };
            node.transform.updateLocalMatrix();
        }
    }

    private contactKey(a: CANNON.Body, b: CANNON.Body): string {
        // Order-independent pair key so the same contact reads the same regardless of A/B order.
        return a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    }

    private onBodyCollide(
        node: Node,
        body: CANNON.Body,
        e: { contact: CANNON.ContactEquation; body: CANNON.Body },
    ): void {
        const other = this.bodyToNode.get(e.body);
        if (!other) return;
        if (body.isTrigger || e.body.isTrigger) return; // triggers handled in onBeginContact

        // cannon-es exposes the relative impact velocity along the contact
        // normal — closest analogue to "collision strength" without a
        // dedicated impulse accessor.
        const ce: CollisionEvent = {
            other,
            contactPoint: { x: e.contact.bi.position.x, y: e.contact.bi.position.y, z: e.contact.bi.position.z },
            contactNormal: { x: e.contact.ni.x, y: e.contact.ni.y, z: e.contact.ni.z },
            impulse: Math.abs(e.contact.getImpactVelocityAlongNormal()),
        };
        const key = this.contactKey(body, e.body);
        // `beginContact` already emitted the `collide-begin`; this fires the
        // continuous `collide` for subsequent frames.
        node.events.emit(this.prevContacts.has(key) ? 'collide' : 'collide-begin', ce);
        this.prevContacts.add(key);
    }

    private onBeginContact = (e: { bodyA: CANNON.Body; bodyB: CANNON.Body }): void => {
        const a = this.bodyToNode.get(e.bodyA);
        const b = this.bodyToNode.get(e.bodyB);
        if (!a || !b) return;
        const isTrigger = e.bodyA.isTrigger || e.bodyB.isTrigger;
        const key = this.contactKey(e.bodyA, e.bodyB);
        if (isTrigger) {
            a.events.emit('trigger-enter', { other: b });
            b.events.emit('trigger-enter', { other: a });
            this.prevContacts.add(key);
        }
        // For solid contacts, onBodyCollide does the work — it has the
        // contact equation we need for normal/point/impulse.
    };

    private onEndContact = (e: { bodyA: CANNON.Body; bodyB: CANNON.Body }): void => {
        const a = this.bodyToNode.get(e.bodyA);
        const b = this.bodyToNode.get(e.bodyB);
        if (!a || !b) return;
        const isTrigger = e.bodyA.isTrigger || e.bodyB.isTrigger;
        const key = this.contactKey(e.bodyA, e.bodyB);
        this.prevContacts.delete(key);
        if (isTrigger) {
            a.events.emit('trigger-exit', { other: b });
            b.events.emit('trigger-exit', { other: a });
        } else {
            a.events.emit('collide-end', { other: b });
            b.events.emit('collide-end', { other: a });
        }
    };

    private dispatchContacts(): void {
        // Emit `trigger-stay` for every trigger pair currently active —
        // cannon-es doesn't expose a continuous event for sensors, so we
        // synthesize one from `prevContacts`.
        for (const key of this.prevContacts) {
            const [aId, bId] = key.split('|').map(Number);
            const ba = this.world.bodies.find((b) => b.id === aId);
            const bb = this.world.bodies.find((b) => b.id === bId);
            if (!ba || !bb) {
                this.prevContacts.delete(key);
                continue;
            }
            if (ba.isTrigger || bb.isTrigger) {
                const na = this.bodyToNode.get(ba);
                const nb = this.bodyToNode.get(bb);
                if (na && nb) {
                    na.events.emit('trigger-stay', { other: nb });
                    nb.events.emit('trigger-stay', { other: na });
                }
            }
        }
    }
}
