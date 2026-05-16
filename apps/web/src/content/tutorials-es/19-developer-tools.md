---
title: "Herramientas de desarrollo: Inspector, Input y Assets"
description: "Overlay de debug, input con action mapping y cache de assets con progreso — los tres paquetes que convierten una demo en una app."
order: 19
level: "intermediate"
duration: "25 min"
---

# Tutorial 19: Herramientas de desarrollo — Inspector, Input y Assets

> **Nivel:** Intermedio
> **Tiempo:** 25 minutos
> **Aprenderás:** cómo adjuntar un overlay de debug, cómo mapear entrada de teclado y gamepad a acciones lógicas, y cómo precargar assets con eventos de progreso.

---

## `@joroya/inspector` — overlay de debug

```bash
npm install @joroya/inspector @joroya/core
```

```ts
import { Inspector } from "@joroya/inspector";

const inspector = new Inspector(scene, { position: "top-right" });
inspector.attach();

function frame(now: number) {
    const dt = computeDt(now);
    inspector.update(dt);
    renderer.render(dt);
}
```

Click en una fila de la jerarquía para seleccionar el nodo. El panel debajo muestra los valores de transform y los componentes adjuntos. Click en el header para colapsar.

Para métricas sin DOM: `FrameMetrics` (rolling FPS / avg / max-hitch) y `collectSceneStats(scene)` también se exportan.

---

## `@joroya/input` — input con action mapping

```bash
npm install @joroya/input @joroya/core
```

```ts
import { InputManager } from "@joroya/input";

const input = new InputManager();
input.attach();

input.bindAction("jump",         [{ key: "Space" },   { gamepad: "A" }]);
input.bindAction("move-forward", [{ key: "KeyW" },    { key: "ArrowUp" }]);
input.bindAction("fire",         [{ mouseButton: 0 }, { gamepad: "RT" }]);
```

### Tres tipos de eventos

```ts
input.on("action-down", (e) => { /* transición a activo */ });
input.on("action",      (e) => { /* continuo mientras se sostiene */ });
input.on("action-up",   (e) => { /* transición a inactivo */ });
```

### Poll por frame (necesario para gamepad)

```ts
function frame(dt) {
    input.update(dt);   // re-poll de gamepads, emite `action` para holds
    // …
}
```

### Queries directas para ejes analógicos

```ts
const leftStickX = input.getGamepadAxis(0, 0);  // -1..1
const leftStickY = input.getGamepadAxis(0, 1);
```

### Blur-safe

Al perder foco la ventana, el manager limpia el estado de teclado / mouse — las teclas no "se pegan".

---

## `@joroya/assets` — preloader con progreso

```bash
npm install @joroya/assets @joroya/core
```

```ts
import { AssetManager } from "@joroya/assets";

const assets = new AssetManager();
assets.on("progress", (e) => progressBar.set(e.loaded / e.total));
assets.on("error", (e) => console.error(`Falló ${e.url}`, e.error));

await assets.preload([
    { url: "/tex/grass.png",  type: "image" },
    { url: "/audio/loop.mp3", type: "audio" },
    { url: "/data/level.json", type: "json" },
]);

const tex = assets.get<HTMLImageElement>("/tex/grass.png");
// Cuando termines:
assets.release("/tex/grass.png");
```

- **Deduplicación**: dos `load("/x")` concurrentes hacen un solo fetch.
- **Ref-counting**: `load()` incrementa, `release()` decrementa, evict en 0.
- **Resiliente**: errores por item no rechazan la promesa global.
- **Pluggable**: `registerLoader('gltf', myGltfLoader)` para tipos custom.

---

## Próximos pasos

- **Conectar input con física**: bindeá una action `"throw"` que llame `physics.world.bodies[i].applyImpulse(...)`.
- **Loading screen**: overlay HTML que escuche `assets.on("progress")` y se desvanezca cuando `loaded === total`.
- **Multi-gamepad**: `getGamepadAxis(index, axis)` acepta índice — wireá dos jugadores a `index: 0` y `index: 1`.
