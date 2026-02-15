# Serialization

Oroya Animate includes a built-in JSON serialization system that allows you to save and load entire scenes. This is the foundation for future features like a visual editor and collaborative workflows.

---

## Serializing a Scene

Convert an entire scene graph into a JSON string:

```typescript
import { Scene, Node, createBox, Material } from '@oroya/core';
import { serialize } from '@oroya/core';

const scene = new Scene();
const cube = new Node('hero-cube');
cube.addComponent(createBox(2, 2, 2));
cube.addComponent(new Material({ color: { r: 1, g: 0.5, b: 0 } }));
cube.transform.position = { x: 3, y: 0, z: -1 };
scene.add(cube);

const json = serialize(scene);
console.log(json);
```

**Output:**
```json
{
  "root": {
    "id": "uuid-root",
    "name": "root",
    "components": [ ... ],
    "children": [
      {
        "id": "uuid-hero-cube",
        "name": "hero-cube",
        "components": [
          { "type": "Transform", "position": { "x": 3, "y": 0, "z": -1 }, ... },
          { "type": "Geometry", "definition": { "type": "Box", "width": 2, ... } },
          { "type": "Material", "definition": { "color": { "r": 1, "g": 0.5, "b": 0 } } }
        ],
        "children": []
      }
    ]
  }
}
```

---

## Deserializing a Scene

Reconstruct a full scene from a JSON string:

```typescript
import { deserialize } from '@oroya/core';

const restoredScene = deserialize(json);

const found = restoredScene.findNodeByName('hero-cube');
console.log(found?.transform.position); // { x: 3, y: 0, z: -1 }
```

The deserialized scene is fully functional — you can mount it on any renderer immediately.

---

## Supported Components

The serializer currently handles:

| Component   | Serialized Data                           |
|-------------|-------------------------------------------|
| `Transform` | `position`, `rotation`, `scale`, matrices |
| `Geometry`  | Full `GeometryDef` (Box, Sphere, Path2D)  |
| `Material`  | Full `MaterialDef` (color, opacity, etc.) |

---

## Use Cases

- **Save/Load Projects:** Persist user-created scenes to localStorage or a database.
- **Server-Side Rendering:** Send a serialized scene to a Node.js backend, deserialize, and render to SVG.
- **Collaboration:** Share scene definitions between users as JSON payloads.
- **Version Control:** Store scene files as `.json` in Git to track changes over time.

---

## Limitations (Current)

- Node UUIDs are preserved during deserialization, which means two scenes deserialized from the same JSON will have nodes with identical IDs.
- Custom components not registered in the deserializer's `switch` block will be silently skipped.
- Large scenes may produce verbose JSON. Binary serialization (e.g., MessagePack) is planned for a future version.
