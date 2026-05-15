import {
    Scene,
    Node,
    ComponentType,
    RigidBody,
    Collider,
    RigidBodyType,
    ColliderShape,
    Transform
} from '@joroya/core';
import * as CANNON from 'cannon-es';

export class PhysicsSystem {
    world: CANNON.World;
    private bodyMap = new Map<string, CANNON.Body>();
    private nodeMap = new Map<string, Node>();

    // Materials
    private defaultMaterial: CANNON.Material;

    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Default gravity
        this.defaultMaterial = new CANNON.Material('default');

        // Default contact material
        const contactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            { friction: 0.3, restitution: 0.3 }
        );
        this.world.addContactMaterial(contactMaterial);
    }

    /**
     * Steps the physics simulation and synchronizes node transforms.
     * @param dt Time step in seconds.
     * @param scene The scene to simulate.
     */
    update(dt: number, scene: Scene) {
        // 1. Sync bodies (create/update)
        this.syncScene(scene);

        // 2. Step simulation
        // Fixed time step is better for stability
        this.world.step(1 / 60, dt, 3);

        // 3. Sync back to nodes
        for (const [nodeId, body] of this.bodyMap) {
            const node = this.nodeMap.get(nodeId);
            if (node) {
                if (body.type !== CANNON.Body.STATIC) {
                    node.transform.position = {
                        x: body.position.x,
                        y: body.position.y,
                        z: body.position.z
                    };
                    node.transform.rotation = {
                        x: body.quaternion.x,
                        y: body.quaternion.y,
                        z: body.quaternion.z,
                        w: body.quaternion.w
                    };
                    // Mark transform as dirty is handled by setter usually, but let's be sure
                    node.transform.updateLocalMatrix();
                }
            }
        }
    }

    private syncScene(scene: Scene) {
        scene.root.traverse(node => {
            if (node.hasComponent(ComponentType.RigidBody)) {
                if (!this.bodyMap.has(node.id)) {
                    this.createBody(node);
                }
                // TODO: Handle updates to body properties if they change at runtime
            }
        });
    }

    private createBody(node: Node) {
        const rb = node.getComponent<RigidBody>(ComponentType.RigidBody)!;
        const collider = node.getComponent<Collider>(ComponentType.Collider);

        const type = rb.definition.type === RigidBodyType.Static ? CANNON.Body.STATIC :
            rb.definition.type === RigidBodyType.Kinematic ? CANNON.Body.KINEMATIC :
                CANNON.Body.DYNAMIC;

        const body = new CANNON.Body({
            mass: rb.definition.mass,
            type: type,
            material: this.defaultMaterial,
            fixedRotation: rb.definition.fixedRotation,
            linearDamping: rb.definition.linearDamping,
            angularDamping: rb.definition.angularDamping
        });

        // Set initial position/rotation
        // We need absolute world position/rotation
        // Ideally we use node.transform.worldMatrix to extract world pos/rot
        // But node.transform.position is local.
        // For simple scenes without deep hierarchy it might be fine, but correct way is world.
        // Let's assume for now simulation happens in world space and user sets initial node transform relative to parent?
        // If parent has transform, physics system needs to handle it.
        // Simplification: Physics only works well on root children or we assume local=world for physics nodes for now.

        body.position.set(
            node.transform.position.x,
            node.transform.position.y,
            node.transform.position.z
        );
        body.quaternion.set(
            node.transform.rotation.x,
            node.transform.rotation.y,
            node.transform.rotation.z,
            node.transform.rotation.w
        );

        if (collider) {
            const shape = this.createShape(collider);
            if (shape) {
                const offset = collider.definition.center;
                const offsetVec = new CANNON.Vec3(offset?.x ?? 0, offset?.y ?? 0, offset?.z ?? 0);
                body.addShape(shape, offsetVec);
            }
        }

        this.world.addBody(body);
        this.bodyMap.set(node.id, body);
        this.nodeMap.set(node.id, node);
    }

    private createShape(collider: Collider): CANNON.Shape | null {
        const def = collider.definition;
        switch (def.shape) {
            case ColliderShape.Box:
                const half = def.halfExtents || { x: 0.5, y: 0.5, z: 0.5 };
                return new CANNON.Box(new CANNON.Vec3(half.x, half.y, half.z));
            case ColliderShape.Sphere:
                return new CANNON.Sphere(def.radius || 0.5);
            case ColliderShape.Plane:
                return new CANNON.Plane();
            case ColliderShape.Cylinder:
                // Cannon cylinder is (radiusTop, radiusBottom, height, segments)
                // We only have radius and height.
                return new CANNON.Cylinder(
                    def.radius || 0.5,
                    def.radius || 0.5,
                    def.height || 1,
                    16
                );
            default:
                return null;
        }
    }
}
