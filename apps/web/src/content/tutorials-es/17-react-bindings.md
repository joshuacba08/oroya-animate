---
title: "Bindings de React: <OroyaCanvas> y useFrame"
description: "Construí una escena 3D desde JSX de React — componentes declarativos, hooks y updates por frame."
order: 17
level: "intermediate"
duration: "15 min"
---

# Tutorial 17: Bindings de React — `<OroyaCanvas>` y `useFrame`

> **Nivel:** Intermedio
> **Tiempo:** 15 minutos
> **Aprenderás:** cómo `@joroya/react` monta una escena Oroya desde JSX, cómo usar `useFrame` para updates por frame, y cómo fluye el contexto del scene-graph por tu árbol de componentes.

> **Estabilidad:** `@joroya/react` es `@experimental` en v1.0. Las firmas de hooks y props pueden evolucionar durante 1.x — fijá la versión (`"@joroya/react": "1.0.0"`) si dependés de una forma específica.

---

## Instalación

```bash
npm install @joroya/react @joroya/core @joroya/renderer-three react react-dom three
```

---

## Paso 1 — Montar un canvas con children JSX

`<OroyaCanvas>` posee el `Scene`, el `ThreeRenderer` y el loop de `requestAnimationFrame`. Los children declaran nodos del scene-graph vía JSX — sin `scene.add(node)` manual.

```tsx
import {
    OroyaCanvas, Box, Sphere, AmbientLight, DirectionalLight,
} from "@joroya/react";

export function App() {
    return (
        <OroyaCanvas style={{ height: "100vh" }}>
            <AmbientLight intensity={0.5} />
            <DirectionalLight intensity={1.2} position={{ x: 5, y: 10, z: 5 }} castShadow />
            <Box position={{ x: 0, y: 1, z: 0 }} color={{ r: 1, g: 0.5, b: 0 }} castShadow />
            <Sphere position={{ x: 2, y: 1, z: 0 }} radius={0.6} color={{ r: 0.3, g: 0.7, b: 1 }} castShadow />
        </OroyaCanvas>
    );
}
```

Cada componente crea un `Node` de Oroya, adjunta los componentes relevantes (`Geometry`, `Material`, `Light`, …), y lo registra bajo el padre JSX. La identidad del nodo está `useMemo`'d, así que re-renders del padre no descartan children.

---

## Paso 2 — Animar con `useFrame`

```tsx
import { Box, useFrame, useNodeRef } from "@joroya/react";

function SpinningCube() {
    const ref = useNodeRef();
    useFrame((dt) => {
        if (ref.current) {
            ref.current.transform.rotateOnAxis({ x: 0, y: 1, z: 0 }, dt);
            ref.current.transform.updateLocalMatrix();
        }
    });
    return <Box nodeRef={ref} size={1} color={{ r: 1, g: 0.5, b: 0 }} castShadow />;
}
```

---

## Paso 3 — Acceso al `Scene`

```tsx
import { useScene } from "@joroya/react";
import { serialize } from "@joroya/core";

function SaveButton() {
    const scene = useScene();
    return <button onClick={() => {
        const json = serialize(scene);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        a.download = "scene.json";
        a.click();
    }}>Guardar escena</button>;
}
```

---

## Qué expone `@joroya/react`

**Componentes:** `<OroyaCanvas>`, `<Group>`, `<Box>`, `<Sphere>`, `<Plane>`, `<PerspectiveCamera>`, `<AmbientLight>`, `<DirectionalLight>`.

**Hooks:** `useFrame(cb)`, `useScene()`, `useParentNode()`, `useOroya()`, `useNodeRef()`.

Para todo lo demás (físicas, audio, post-procesado, Animator), usá las APIs core directamente con `useScene()` — bajá a código imperativo cuando JSX no cubra todavía.

---

## Próximos pasos

- **Combinar con `@joroya/physics`**: obtené la scene desde `useScene()`, instanciá un `PhysicsSystem` y steppealo dentro de un `useFrame`.
- **Wrapper de Vue equivalente**: `@joroya/vue` expone `useOroyaCanvas`, `useFrame`, `useNode` con la misma semántica de lifecycle.
