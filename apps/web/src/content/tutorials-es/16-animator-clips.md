---
title: "Animator: biblioteca de clips, crossfade y eventos de keyframe"
description: "Operá clips nombrados con play() / crossFade() y reaccioná a eventos tipo footstep desde keyframes."
order: 16
level: "intermediate"
duration: "20 min"
---

# Tutorial 16: Animator — biblioteca de clips, crossfade y eventos de keyframe

> **Nivel:** Intermedio
> **Tiempo:** 20 minutos
> **Aprenderás:** cómo el componente `Animator` opera una biblioteca de clips, cómo `crossFade` mezcla transiciones, y cómo disparar eventos de footstep / hit desde keyframes.

El componente `Animator` se monta en un nodo y posee un `AnimationMixer` que muta `node.transform` de los nodos *target* (por nombre). Como el mixer opera al nivel del scene-graph, la animación funciona en **los tres backends** — Three.js, SVG y Canvas2D — sin glue específico.

---

## Paso 1 — Biblioteca de clips

Un clip es data engine-agnostic: keyframe tracks (`times` + `values` como `Float32Array`) más eventos nombrados opcionales.

```ts
const walk: AnimationClip = {
    name: "walk",
    duration: 2.0,
    tracks: [{
        targetNodeName: "hero",
        property: "position",
        times: new Float32Array([0, 0.5, 1.0, 1.5, 2.0]),
        values: new Float32Array([
            -2, 1.0, 0,
             0, 1.2, 0,
             2, 1.0, 0,
             0, 1.2, 0,
            -2, 1.0, 0,
        ]),
        interpolation: "linear",
    }],
    events: [
        { time: 0.5, name: "footstep", data: { foot: "right" } },
        { time: 1.5, name: "footstep", data: { foot: "left" } },
    ],
};
```

---

## Paso 2 — Adjuntar el Animator

```ts
const animator = new Animator({
    animations: { idle, walk, spin },
    autoplay: "idle",
});
hero.addComponent(animator);
animator.bindToScene(scene);   // necesario para que el mixer resuelva "hero" por nombre
```

---

## Paso 3 — Tick automático

`ThreeRenderer.render(dt)` llama `scene.update(dt)` primero, lo que ejecuta `onUpdate(dt)` en cada componente — incluyendo el del Animator. No hay que llamar nada manualmente.

---

## Paso 4 — Cambiar clips con crossFade

```ts
animator.crossFade("walk", 0.4);
animator.crossFade("spin", 0.4);
```

La mezcla de cuaterniones usa nlerp normalizado con corrección de hemisferio, así que las rotaciones no saltan por el camino largo.

---

## Paso 5 — Eventos de keyframe

```ts
animator.on("keyframe-event", (e) => {
    if (e.event.name === "footstep") {
        const foot = (e.event.data as { foot: string }).foot;
        console.log(`paso (${foot})`);
    }
});

animator.on("finished", (e) => {
    console.log(`${e.clip.name} terminó`);
});
```

Los eventos se de-duplican por iteración del loop — disparan una sola vez aunque el `dt` salte más allá.

---

## Próximos pasos

- **Interpolación cubicspline**: glTF la usa. `interpolation: "cubicspline"` con valores en formato `[in-tangent, value, out-tangent]`.
- **Clips concurrentes**: llamá `crossFade("walk")` mientras otra fade está en curso — el mixer mezcla N clips activos.
- **Cargar animaciones de glTF**: `@joroya/loader-gltf` devuelve `AnimationClip[]` junto a la escena.
