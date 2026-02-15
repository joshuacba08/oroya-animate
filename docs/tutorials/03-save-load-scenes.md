# Tutorial 3: Guardar y Cargar Escenas 🟢

> **Nivel:** Principiante  
> **Tiempo estimado:** 10 minutos  
> **Qué aprenderás:** Serializar una escena a JSON y reconstruirla con `serialize` y `deserialize`.

---

## Objetivo

Crear una escena, exportarla como JSON, y luego importarla para demostrar que la escena se preserva completamente.

---

## Paso 1: Construir una escena

```typescript
import { Scene, Node, createBox, createSphere, Material, serialize, deserialize } from '@oroya/core';

// Crear escena original
const scene = new Scene();

const cube = new Node('hero-cube');
cube.addComponent(createBox(2, 2, 2));
cube.addComponent(new Material({ color: { r: 1, g: 0.3, b: 0.1 } }));
cube.transform.position = { x: -2, y: 0, z: 0 };
scene.add(cube);

const sphere = new Node('companion-sphere');
sphere.addComponent(createSphere(1.5, 32, 32));
sphere.addComponent(new Material({ color: { r: 0.1, g: 0.5, b: 1.0 } }));
sphere.transform.position = { x: 2, y: 1, z: -1 };
scene.add(sphere);
```

---

## Paso 2: Serializar

```typescript
const json = serialize(scene);

console.log(json);
// Puedes guardar esto en localStorage, una base de datos, o un archivo .json
```

La función `serialize` recorre todo el scene graph y convierte cada nodo y sus componentes a un objeto JSON plano.

### ¿Qué se guarda?

| Dato | ¿Se preserva? |
|------|----------------|
| Nombre del nodo | ✅ |
| ID único (UUID) | ✅ |
| Jerarquía padre-hijo | ✅ |
| Transform (position, rotation, scale) | ✅ |
| Geometry (tipo y parámetros) | ✅ |
| Material (color, opacity) | ✅ |

---

## Paso 3: Deserializar

```typescript
const restoredScene = deserialize(json);

// Verificar que la escena se restauró
const foundCube = restoredScene.findNodeByName('hero-cube');
console.log(foundCube?.transform.position);
// → { x: -2, y: 0, z: -0 }

const foundSphere = restoredScene.findNodeByName('companion-sphere');
console.log(foundSphere?.transform.position);
// → { x: 2, y: 1, z: -1 }
```

La escena restaurada es **completamente funcional** — puede montarse directamente en cualquier renderer:

```typescript
import { ThreeRenderer } from '@oroya/renderer-three';

const renderer = new ThreeRenderer({ canvas, width, height });
renderer.mount(restoredScene);   // La escena restaurada funciona igual
renderer.render();
```

---

## Caso de uso: Persistencia en localStorage

```typescript
// Guardar
function saveScene(scene: Scene): void {
  const json = serialize(scene);
  localStorage.setItem('oroya-saved-scene', json);
}

// Cargar
function loadScene(): Scene | null {
  const json = localStorage.getItem('oroya-saved-scene');
  if (!json) return null;
  return deserialize(json);
}
```

---

## Caso de uso: Exportar como archivo descargable

```typescript
function downloadScene(scene: Scene, filename: string): void {
  const json = serialize(scene);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

downloadScene(scene, 'my-scene.json');
```

---

## Resultado

Una escena que puede ser guardada, compartida y restaurada sin perder ningún dato. La serialización es la base para editores visuales, colaboración en tiempo real y versionado de escenas en Git. 💾

---

## Siguiente tutorial

➡️ [Tutorial 4: Sistema Solar](./04-solar-system.md) — transforms jerárquicos y animación.
