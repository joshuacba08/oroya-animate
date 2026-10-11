# Serialización

Oroya Animate incluye un sistema de serialización JSON que permite guardar y cargar definiciones de escena. Es la base para editores visuales, colaboración y versionado de escenas.

---

## Tabla de contenidos

- [Serializar una escena](#serializar-una-escena)
- [Deserializar una escena](#deserializar-una-escena)
- [Formato del JSON](#formato-del-json)
- [Componentes soportados](#componentes-soportados)
- [Casos de uso](#casos-de-uso)
- [Limitaciones](#limitaciones)

---

## Serializar una escena

La función `serialize` convierte todo el scene graph a un string JSON formateado:

```typescript
import { Scene, Node, createBox, Material, serialize } from '@joroya/core';

const scene = new Scene();

const cube = new Node('hero-cube');
cube.addComponent(createBox(2, 2, 2));
cube.addComponent(new Material({ color: { r: 1, g: 0.5, b: 0 } }));
cube.transform.position = { x: 3, y: 0, z: -1 };
scene.add(cube);

const json = serialize(scene);
console.log(json);
```

### Flujo de serialización

```mermaid
flowchart LR
    S["Scene"] -->|"serialize()"| SR["serializeNode(root)"]
    SR -->|"recursivo"| SN["Para cada nodo:\nid, name, components, children"]
    SN -->|"spread"| SC["Cada component:\n{ type, ...data }"]
    SC --> JSON["JSON.stringify()\ncon indent 2"]
    JSON --> STR["string"]
```

---

## Deserializar una escena

La función `deserialize` reconstruye una `Scene` funcional desde un string JSON:

```typescript
import { deserialize } from '@joroya/core';

const restoredScene = deserialize(json);

const found = restoredScene.findNodeByName('hero-cube');
console.log(found?.transform.position); // { x: 3, y: 0, z: -1 }
```

La escena restaurada es completamente funcional — puede montarse en cualquier renderer:

```typescript
import { ThreeRenderer } from '@joroya/renderer-three';

const renderer = new ThreeRenderer({ canvas, width, height });
renderer.mount(restoredScene);
renderer.render();
```

### Flujo de deserialización

```mermaid
flowchart LR
    STR["string JSON"] -->|"JSON.parse()"| OBJ["SerializableScene"]
    OBJ -->|"deserializeNode()"| RN["Reconstruir nodos\nrecursivamente"]
    RN -->|"switch(type)"| COMP["Recrear componentes:\nTransform, Geometry, Material,\nCamera, Animation"]
    COMP --> SCENE["new Scene()"]
    RN -->|"children"| SCENE
```

---

## Formato del JSON

### Estructura general

```mermaid
graph TD
    SS["SerializableScene"] -->|"root"| SN["SerializableNode"]
    SN -->|"id"| ID["string (UUID)"]
    SN -->|"name"| NAME["string"]
    SN -->|"components"| COMPS["SerializableComponent[]"]
    SN -->|"children"| CHILDREN["SerializableNode[]"]
    CHILDREN -->|"recursivo"| SN
    COMPS --> SC["{ type: ComponentType, ...data }"]
```

### Ejemplo completo de output

```json
{
  "root": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "root",
    "components": [
      {
        "type": "Transform",
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
        "scale": { "x": 1, "y": 1, "z": 1 },
        "localMatrix": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        "worldMatrix": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        "isDirty": true
      }
    ],
    "children": [
      {
        "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "name": "hero-cube",
        "components": [
          {
            "type": "Transform",
            "position": { "x": 3, "y": 0, "z": -1 },
            "rotation": { "x": 0, "y": 0, "z": 0, "w": 1 },
            "scale": { "x": 1, "y": 1, "z": 1 },
            "localMatrix": [1,0,0,0, 0,1,0,0, 0,0,1,0, 3,0,-1,1],
            "worldMatrix": [1,0,0,0, 0,1,0,0, 0,0,1,0, 3,0,-1,1],
            "isDirty": false
          },
          {
            "type": "Geometry",
            "definition": {
              "type": "Box",
              "width": 2,
              "height": 2,
              "depth": 2
            }
          },
          {
            "type": "Material",
            "definition": {
              "color": { "r": 1, "g": 0.5, "b": 0 }
            }
          }
        ],
        "children": []
      }
    ]
  }
}
```

### Interfaces internas

| Interface | Campos | Descripción |
|-----------|--------|-------------|
| `SerializableScene` | `root: SerializableNode` | Contenedor de nivel superior |
| `SerializableNode` | `id`, `name`, `cssClass?`, `cssId?`, `components[]`, `children[]` | Representación plana de un nodo |
| `SerializableComponent` | `type: ComponentType`, `+ ...data` | Cada componente con su tipo y datos |

---

## Componentes soportados

La serialización conserva solo los datos declarativos soportados. Se excluyen campos del runtime, callbacks, referencias a nodos y objetos del backend, también en datos de eventos. Un Animator enlazado se puede guardar con seguridad.

| Componente | Deserialización |
| --- | --- |
| `Transform` | Restaura los campos en un `Transform` nuevo |
| `Geometry`, `Material`, `Camera`, `Interactive`, `Light`, `Environment` | Reconstruye desde `definition` |
| `RigidBody`, `Collider`, `PostProcessing`, `ParticleSystem` | Reconstruye definiciones; el runtime del backend se crea por separado |
| `Animator`, `AudioListener`, `AudioSource`, `Skin` | Reconstruye definiciones; no guarda una sesión de reproducción ni recursos cargados |
| `Animation` | Reconstruye desde `animations` |
| `InstancedMesh`, `Script`, tipos desconocidos | Se omiten; necesitan adaptadores de la aplicación |

### Typed arrays

`Float32Array`, `Uint8Array`, `Uint16Array` y `Uint32Array` se codifican como `{ __typedArray, base64 }` y recuperan su tipo original. Esto permite guardar tracks de animación y geometrías buffer, pero no restaura el componente `InstancedMesh`. Otras clases de typed array no están soportadas por esta codificación.

```ts
import { typedArrayReplacer, typedArrayReviver } from '@joroya/core';

const encoded = JSON.stringify({ values: new Float32Array([0, 1, 2]) }, typedArrayReplacer);
const decoded = JSON.parse(encoded, typedArrayReviver);
console.log(decoded.values instanceof Float32Array); // true
```

### Datos conservados

Se conservan IDs, nombres, relaciones padre-hijo, transforms, `cssClass`, `cssId` y definiciones soportadas de todos los nodos, incluida la raíz. `addComponent()` reconstruye `component.node`. Las matrices de mundo se recalculan al renderizar.

La raíz guardada conserva ID, nombre, metadatos CSS, transform y componentes soportados. Scene(root?: Node) acepta una raíz sin padre y mantiene el constructor sin argumentos. El JSON antiguo sin Transform recibe uno por defecto.

---

## Casos de uso

### Persistencia en localStorage

```typescript
function saveScene(scene: Scene): void {
  const json = serialize(scene);
  localStorage.setItem('oroya-scene', json);
}

function loadScene(): Scene | null {
  const json = localStorage.getItem('oroya-scene');
  if (!json) return null;
  return deserialize(json);
}
```

### Exportar como archivo descargable

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

### Importar desde archivo

```typescript
async function importScene(file: File): Promise<Scene> {
  const text = await file.text();
  return deserialize(text);
}

// Con input[type=file]
input.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    const scene = await importScene(file);
    renderer.mount(scene);
  }
});
```

### Server-side rendering

```typescript
// Recibir la escena serializada, renderizar a SVG en el servidor
import { deserialize } from '@joroya/core';
import { renderToSVG } from '@joroya/renderer-svg';

function handleRequest(jsonBody: string): string {
  const scene = deserialize(jsonBody);
  return renderToSVG(scene, { width: 800, height: 600, dt: 0 });
}
```

### Versionado en Git

Guardar escenas como `.json` permite:

```
scenes/
├── level-01.json    → Versionado con git
├── level-02.json
└── hub-world.json
```

Los diffs de Git muestran exactamente qué cambió:

```diff
 "name": "hero-cube",
 "components": [
   {
     "type": "Transform",
-    "position": { "x": 3, "y": 0, "z": -1 },
+    "position": { "x": 5, "y": 2, "z": -1 },
```

---

## Limitaciones

| Limitación | Impacto y alternativa |
| --- | --- |
| Callbacks del runtime | `onUpdate` y los listeners no se guardan; regístralos de nuevo después de cargar |
| Instancing y componentes personalizados | El reviver omite `InstancedMesh`, `Script` y tipos desconocidos; usa un adaptador |
| IDs conservados en toda la escena | Importar dos veces puede duplicarlos; crea nodos nuevos para copias independientes (`id` es readonly) |
| Sin validación de esquema | JSON o estructuras inválidas pueden lanzar errores; valida las entradas en la aplicación |
| Recursos externos | El JSON guarda URIs y definiciones, no archivos de texturas, audio, modelos ni el estado físico en ejecución |

Los adaptadores internos guardan transforms, definiciones y animaciones SVG. Se puede serializar un Animator enlazado, reproduciendo o pausado; se excluyen mixers, callbacks, referencias a nodos y recursos del backend. Se restauran las definiciones de clips, sin garantizar el instante exacto de reproducción.
