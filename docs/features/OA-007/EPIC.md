# OA-007: Physics & Animation

**Status**: Shipped
**Feature Tag**: `OA-007`
**Target Version**: v0.9.0
**Related Packages**: `@joroya/core`, `@joroya/physics`, `@joroya/renderer-three`

## Abstract

Bring the scene graph to life: real-time rigid-body physics with joints,
collision events, sensors, and raycasting; and a complete animation pipeline
with clip libraries, crossfade blending, keyframe events, and procedural
easing/spring helpers. Everything stays scene-graph-native — physics and
animation are *components* the renderer reads, never things the renderer
owns.

## Context

The v0.9.0 plan as drafted left three structural issues that this EPIC
formally resolves:

1. **Two physics backends in one package.** `@joroya/physics/PhysicsSystem.ts`
   used `cannon-es` while `PhysicsWorld.ts` and `src/components/{RigidBody,
   Collider}.ts` used `@dimforge/rapier3d-compat` (undeclared in `package.json`).
   `pnpm typecheck` failed across the workspace as a result.
2. **`Animator` was a stub.** The component existed but had no methods, no
   mixer hookup, and `animations: Record<string, any>` violated
   [§3.2 of the programming principles](../../programming-principles.md).
   `ThreeRenderer` instantiated a `THREE.AnimationMixer` for every node with
   an `Animator`, even when there was no skeleton — and updated them with a
   hard-coded `dt = 0.016`.
3. **No reach toward the v1.0 roadmap.** The plan promised "a simply moving
   object" as the verification target — barely above the v0.4.0 capability.

This EPIC closes those three gaps **and** layers on capabilities that the
v1.0 roadmap will need: joints, triggers, raycast queries, animation
blending, keyframe events, procedural motion helpers.

## Features

### 1. Physics System (cannon-es, single-backend)

- `PhysicsSystem` owns a `cannon.World`, syncs initial pose from each rigid
  body's `worldMatrix`, and writes simulated transforms back on every step.
- Configurable via `PhysicsSystemOptions` (gravity, fixed timestep, max
  sub-steps, default friction/restitution).
- Fixed-timestep integration with bounded sub-steps keeps simulation stable
  on slow frames.

### 2. Joints / Constraints

| Method | Use case |
|---|---|
| `addHingeConstraint(a, b, { pivotA, pivotB, axisA?, axisB? })` | Doors, wheels, pendulums |
| `addPointToPointConstraint(a, b, { pivotA, pivotB, maxForce? })` | Ball joints, chains, attachment points |
| `addDistanceConstraint(a, b, distance, maxForce?)` | Ropes, rigid links |
| `removeConstraint(c)` | Cleanup |

### 3. Collision Events

`Node.events` (already typed via `InteractionEventMap`) now extends with
`PhysicsEventMap`:

| Event | Fired |
|---|---|
| `collide-begin` | First frame two solid bodies touch |
| `collide` | Every subsequent frame the contact persists |
| `collide-end` | First frame after they separate |
| `trigger-enter` | First frame a sensor and another body overlap |
| `trigger-stay` | Every subsequent frame the overlap persists |
| `trigger-exit` | First frame after they separate |

Payload includes `other: Node`, `contactPoint`, `contactNormal`, and
`impulse` (impact velocity along the normal) for solid contacts. Sensors
omit `impulse` (no contact response is generated).

### 4. Trigger / Sensor Colliders + Collision Filtering

- `Collider.isTrigger: boolean` — produces events without contact response.
- `Collider.collisionGroup: number` (default `1`) and `collisionMask: number`
  (default `-1`) — bitmask layered simulations.

### 5. Physics Raycast

```ts
const hit = sys.raycast(from, to);
//   → { node, point, normal, distance } | null
const allHits = sys.raycastAll(from, to);
```

Closes the loop with the renderer-level raycast (which targets visual
meshes) — apps that need click-to-pick on physics bodies use this directly.

### 6. Animator Component (complete)

```ts
const player = new Animator({ animations: { walk, run, idle }, autoplay: 'idle' });
player.play('walk');
player.crossFade('run', 0.3);
player.on('keyframe-event', (e) => audio.play(`fx/${e.event.name}`));
player.on('finished', () => player.play('idle'));
```

Internally drives a `@joroya/core` `AnimationMixer` per Animator instance,
which mutates target `node.transform` on each `onUpdate(dt)`. The renderer
calls `scene.update(dt)` before drawing, so every Animator advances
automatically without renderer-specific glue.

### 7. Animation Blending

`AnimationMixer.crossFade(clip, duration)` ramps the new clip's weight from
0→1 and existing clips' weights to 0 over `duration` seconds. Sampling at any
moment is a weighted blend across all active clips:

- Position / scale: weighted sum.
- Rotation: nlerp with hemisphere correction (sign-flip-safe) and final
  renormalization.

### 8. Keyframe Events

`AnimationClip.events: KeyframeEvent[]` — named events fired as the play-head
crosses each event's time. De-duplicated per loop iteration so a single large
`dt` doesn't fire the same event twice. Listeners register via
`Animator.on('keyframe-event', handler)`.

### 9. Easing + Spring Helpers

Engine-agnostic procedural motion primitives in `@joroya/core/math/Interpolation`:

- Eases: `linear`, `easeInQuad`/`easeOutQuad`/`easeInOutQuad`, cubic
  variants, sine variants, `easeOutElastic`.
- `spring(current, target, velocity, stiffness, damping, dt)` — implicit
  Euler integrator for critically-dampable target-seeking motion. Use for
  camera follow, UI snap, IK bone settle.

### 10. Dual-Track Animation (Renderer)

`ThreeRenderer` no longer creates a `THREE.AnimationMixer` for every node
with an `Animator`. It now does so only when the node's underlying Three.js
object tree contains an actual `THREE.SkinnedMesh` — keeping the engine-
agnostic property-animation path (core mixer → `node.transform`) cleanly
separate from the engine-specific skeletal animation path
(`THREE.AnimationMixer` → bone transforms). `render(dt?)` propagates real
frame time to both.

## User Stories

- As a **game prototyper**, I want a stack of boxes that I can knock over
  with mouse clicks — joints, triggers and raycast make this possible.
- As a **motion designer**, I want camera follow that feels physical
  without writing a control loop — `spring()` is two lines of code.
- As a **game animator**, I want `crossFade('walk', 0.3)` and footstep
  events at heel-strike — both ship in this release.
- As a **systems engineer**, I want one physics backend (not two stale
  alternatives) and clean tests for it.

## Implementation Tasks

### Phase 1 — Physics ✅
- [x] Delete `@joroya/physics` rapier orphans (`PhysicsWorld.ts`,
      `src/components/{RigidBody,Collider}.ts`).
- [x] Make `packages/physics/tsconfig.json` extend `tsconfig.base.json`.
- [x] World-space initial pose via `worldMatrix` decomposition.
- [x] Joints: hinge, point-to-point, distance.
- [x] Collision events (begin/persist/end) + trigger events (enter/stay/exit).
- [x] Sensor colliders + collision group/mask filtering.
- [x] Raycast and raycastAll against bodies.
- [x] `removeNode()` for runtime body cleanup.
- [x] Vitest coverage: gravity, stacking, triggers, joints, raycast (9 tests).

### Phase 2 — Animation ✅
- [x] `Animator.play(name)`, `stop()`, `crossFade(name, duration)`, `addClip(clip)`, `autoplay`.
- [x] `Animator.bindToScene(scene)` — renderer calls this after mount.
- [x] `AnimationMixer` multi-clip weighted blending with quaternion nlerp.
- [x] `AnimationClip.events: KeyframeEvent[]` + mixer event emitter.
- [x] `Animator.definition.animations: Record<string, AnimationClip>` (zero `any`).
- [x] `Scene.update(dt)` runs in `ThreeRenderer.render(dt)` — onUpdate is first-class.
- [x] Easing functions (linear, quad, cubic, sine, elastic).
- [x] `spring()` critically-dampable integrator.
- [x] Vitest coverage: Animator (7), Easing (8).

### Phase 3 — Renderer ✅
- [x] `ThreeRenderer.render(dt?: number)` — real frame time, default `1/60`.
- [x] `THREE.AnimationMixer` created only when a `SkinnedMesh` is present.
- [x] Animator nodes get `bindToScene` on object creation.
- [x] Removed `dt = 0.016` constant and its "FIX:" comment swarm.

### Phase 4 — Metadata ✅
- [x] Bump `0.8.0 → 0.9.0` on all 6 packages + root.
- [x] CHANGELOG entries for en / es / ja.
- [x] EPIC OA-007 (this file).

## Acceptance Criteria

1. `pnpm typecheck` succeeds on **all 9 workspace packages**, including
   `@joroya/physics` (was previously blocked).
2. `pnpm exec vitest run` passes 113/113 tests, including 7 Animator, 8
   easing/spring, 9 PhysicsSystem.
3. `pnpm build` produces CJS + ESM + DTS for every package at `0.9.0`.
4. Zero `: any` and zero `// @ts-ignore` in the modified files.
5. `Animator.play('walk')` on a clip that animates `position.y` from 0→1
   over 1 s places the target at y=0.5 after a 0.5 s update — verified by
   `tests/Animator.test.ts`.
6. A dynamic box dropped on a static floor settles at y≈1 within 2 simulated
   seconds — verified by `tests/PhysicsSystem.test.ts`.

## Out of Scope (deferred to OA-008+)

- **Skinned mesh demo content**: the renderer wires `THREE.AnimationMixer`
  conditionally on `SkinnedMesh`, but a glTF skinned demo (Blender export
  with skeleton + skinning weights) is OA-008 territory.
- **Vehicle / wheel constraint sugar**: cannon-es supports it but it's a
  large surface (hinge with motors + suspension) and merits its own EPIC.
- **Continuous collision detection (CCD) toggles** beyond cannon-es
  defaults.
- **Inverse kinematics**: the `spring()` integrator is the building block,
  but a 2-bone IK helper is its own scope.

## Dependencies

- `cannon-es@^0.20.0` (single physics backend, already declared in
  `@joroya/physics/package.json`).
- `three@^0.165.0` for `THREE.AnimationMixer` skinned-mesh path
  (already a peer of `@joroya/renderer-three`).

## References

- [`docs/programming-principles.md`](../../programming-principles.md) §1.1
  (core engine-agnostic) and §3.2 (no `any` escape).
- [`docs/features/OA-006/EPIC.md`](../OA-006/EPIC.md) — preceding visual
  polish release.
- [`CHANGELOG.md`](../../../CHANGELOG.md) — v0.9.0 entry.
