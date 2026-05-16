---
title: "Física: rigid bodies, joints y eventos de colisión"
description: "Cae un stack de cubos sobre un piso, enlázalos con joints y reacciona a colisiones — todo desde el scene graph."
order: 15
level: "intermediate"
duration: "20 min"
---

# Tutorial 15: Física — rigid bodies, joints y eventos de colisión

> **Nivel:** Intermedio
> **Tiempo:** 20 minutos
> **Aprenderás:** cómo `@joroya/physics` opera un mundo `cannon-es` sobre cualquier `Scene` de Oroya, cómo cablear eventos de colisión a nodos, y cómo restringir cuerpos con joints.

---

## Instalación

```bash
npm install @joroya/core @joroya/renderer-three @joroya/physics three
```

`@joroya/physics` incluye su propia dependencia de `cannon-es`, no hace falta instalarla aparte.

---

## Paso 1 — Escena con piso y cubo cayendo

`RigidBody` + `Collider` son *componentes* que adjuntás a nodos normales de Oroya. El `PhysicsSystem` recorre la escena cada frame, materializa un body de cannon para cada nodo que tenga ambos componentes, y escribe la pose simulada de vuelta a `node.transform`.

```ts
import {
    Scene, Node, Camera, CameraType, Light, LightType,
    createBox, createPlane, Material,
    RigidBody, RigidBodyType,
    Collider, ColliderShape,
} from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";
import { PhysicsSystem } from "@joroya/physics";

const scene = new Scene();

// Piso estático
const floor = new Node("floor");
floor.addComponent(createPlane(20, 20, 1, 1, { receiveShadow: true }));
floor.addComponent(new Material({ color: { r: 0.25, g: 0.27, b: 0.32 } }));
floor.transform.rotation = { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
floor.addComponent(new RigidBody({ type: RigidBodyType.Static }));
floor.addComponent(new Collider({
    shape: ColliderShape.Box,
    halfExtents: { x: 10, y: 0.1, z: 10 },
}));
scene.add(floor);

// Cubo dinámico — cae por gravedad
const cube = new Node("cube");
cube.addComponent(createBox(1, 1, 1, { castShadow: true }));
cube.addComponent(new Material({ color: { r: 1, g: 0.55, b: 0.2 } }));
cube.transform.position = { x: 0, y: 5, z: 0 };
cube.transform.updateLocalMatrix();
cube.addComponent(new RigidBody({ type: RigidBodyType.Dynamic, mass: 1 }));
cube.addComponent(new Collider({
    shape: ColliderShape.Box,
    halfExtents: { x: 0.5, y: 0.5, z: 0.5 },
    restitution: 0.4,
}));
scene.add(cube);
```

---

## Paso 2 — Ejecutar la física en el render loop

```ts
const physics = new PhysicsSystem({ gravity: { x: 0, y: -9.82, z: 0 } });

let last = performance.now();
function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    physics.update(dt, scene);   // step + sync transforms
    renderer.render(dt);
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

---

## Paso 3 — Reaccionar a colisiones

El `PhysicsSystem` emite eventos en el `EventEmitter` del nodo (el mismo canal que los eventos de click/hover):

```ts
cube.events.on("collide-begin", (e) => {
    console.log(`cube golpeó ${e.other.name} con impulso ${e.impulse?.toFixed(2)}`);
});
```

Existen seis nombres de eventos:
- `collide-begin` / `collide` / `collide-end` para contactos sólidos
- `trigger-enter` / `trigger-stay` / `trigger-exit` para colliders sensor (`isTrigger: true`)

---

## Paso 4 — Agregar un joint

```ts
physics.update(1 / 60, scene); // materializa bodies antes del constraint

physics.addHingeConstraint(anchor, pendulum, {
    pivotA: { x: 0, y: 0, z: 0 },
    pivotB: { x: 0, y: 1, z: 0 },
    axisA: { x: 0, y: 0, z: 1 },
});
```

Otros joints disponibles: `addPointToPointConstraint`, `addDistanceConstraint`.

---

## Paso 5 — Raycast físico

```ts
const hit = physics.raycast({ x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
if (hit) console.log(`hit ${hit.node.name} a distancia ${hit.distance}`);
```

`raycast` devuelve el hit más cercano; `raycastAll(from, to)` devuelve todos los hits.

---

## Próximos pasos

- **Sensores**: agregá `isTrigger: true` a un Collider — los bodies lo atraviesan pero disparan `trigger-enter` / `trigger-exit`.
- **Filtros de colisión**: `collisionGroup` y `collisionMask` (bitmasks) para capas.
- **Vehículos**: el wrapper `Vehicle` cubre `RaycastVehicle` de cannon-es para autos manejables.
