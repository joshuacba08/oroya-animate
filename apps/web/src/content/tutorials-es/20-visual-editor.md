---
title: "Editor visual (alpha)"
description: "Tour de apps/editor — la herramienta de autoría de escenas en React que ships con v1.0."
order: 20
level: "beginner"
duration: "10 min"
---

# Tutorial 20: Editor visual (alpha)

> **Nivel:** Principiante
> **Tiempo:** 10 minutos
> **Aprenderás:** qué hace `apps/editor`, cómo usa la capa de serialización de v0.10, y cómo extenderlo para tu propio workflow.

> **Estado:** alpha. Layout y features evolucionan durante 1.x. El formato de archivo que escribe (`.json` vía `serialize()`) es `@public` y estable en la serie 1.x.

---

## Correr local

```bash
git clone https://github.com/joshuacba08/oroya-animate.git
cd oroya-animate
pnpm install
pnpm build
pnpm --filter editor dev   # http://localhost:5173
```

Carga la escena starter: cubo hero, esfera, piso iluminado, cámara perspectiva.

---

## Los tres paneles

| Región | Propósito |
|---|---|
| **Izquierda** — Jerarquía | Lista de cada nodo del árbol. Click para seleccionar. |
| **Centro** — Canvas | Vista live del `ThreeRenderer`. Tickea a requestAnimationFrame. |
| **Derecha** — Inspector | Transform editable del nodo seleccionado (position / rotation quaternion / scale) + lista read-only de componentes. |

Toolbar: **+ Cube** (spawn random), **Save** (descarga `scene.json`), **Load** (file picker → `deserialize()` → mount), **Delete**.

---

## Cómo está construido

1. **`OroyaCanvas`** *no* se usa aquí — el editor monta `ThreeRenderer` directo porque el layout 3-pane quiere control total.
2. **Las mutaciones de escena bumpean un `revision` counter** para forzar re-renders.
3. **Save / Load usa `serialize()` / `deserialize()`** de `@joroya/core` — la capa v0.10 maneja `Float32Array` vía base64.
4. **Edits de transform** escriben directo a `node.transform` y llaman `updateLocalMatrix()`.

Código fuente en [`apps/editor/src/`](https://github.com/joshuacba08/oroya-animate/tree/main/apps/editor/src).

---

## Qué no puede hacer todavía

- **Gizmos**: sin handles 3D translate/rotate/scale. Editás escribiendo números.
- **Rotación Euler**: solo cuaternión raw.
- **Undo/redo**: ninguno. Guardá seguido.
- **Material editor**: sin color picker.

Todo eso es trabajo post-1.0.

---

## Extenderlo para tu proyecto

Como el editor es una app Vite + React normal en `apps/editor/`, podés forkearla:

- Agregar panel para tus componentes custom.
- Conectar el formato de archivo a un backend (S3 en vez de descarga).
- Layers de visualizaciones plugin-aware sobre el paquete `Inspector`.

El core editor no ships como paquete npm — es app de referencia.

---

## Contrato formal Save / Load

El JSON producido es el mismo de `serialize(scene)`. Propiedades:

- **Estable**: el formato no cambia de shape en la serie 1.x.
- **Engine-agnostic**: sin referencias a Three.js. Una scene guardada acá carga en SVG / Canvas2D también.
- **Skips runtime-only**: `InstancedMesh` GPU state y `Script` closures no se deserializan.

---

## Próximos pasos

- **Build de producción**: `pnpm --filter editor build` genera bundle estático en `apps/editor/dist/`.
- **Combinar con Inspector overlay**: el panel jerarquía del editor es React custom; `@joroya/inspector` standalone es DOM overlay. Comparten `collectSceneStats` / `FrameMetrics`.
- **Cargar glTF como starter**: dropeá un `loadGLTF()` en `buildStarterScene()`.
