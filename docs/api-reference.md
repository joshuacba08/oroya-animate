# API Reference — `@oroya/core`

Complete reference of the classes, interfaces, and functions exported by the core package.

---

## Classes

### `Scene`

The top-level container for the entire scene graph.

```typescript
import { Scene } from '@oroya/core';
const scene = new Scene();
```

| Property | Type   | Description                           |
|----------|--------|---------------------------------------|
| `root`   | `Node` | The root node of the scene hierarchy. |

| Method                  | Returns          | Description                                      |
|-------------------------|------------------|--------------------------------------------------|
| `add(node, parent?)`    | `void`           | Adds a node. Defaults to root as parent.         |
| `remove(node)`          | `void`           | Removes a node from its parent.                  |
| `findNodeById(id)`      | `Node \| undefined` | Searches recursively by unique ID.           |
| `findNodeByName(name)`  | `Node \| undefined` | Searches recursively by name.                |
| `traverse(callback)`    | `void`           | Iterates over every node in the tree.            |
| `updateWorldMatrices()` | `void`           | Recalculates all world-space transformation matrices. |

---

### `Node`

A single element in the scene graph. Supports parent-child hierarchy and an ECS-style component system.

```typescript
import { Node } from '@oroya/core';
const player = new Node('player');
```

| Property     | Type                            | Description                             |
|--------------|---------------------------------|-----------------------------------------|
| `id`         | `string` (readonly)             | Unique identifier (UUID v4 by default). |
| `name`       | `string`                        | Human-readable label.                   |
| `parent`     | `Node \| null`                  | Reference to the parent node.           |
| `children`   | `Node[]` (readonly)             | Array of child nodes.                   |
| `components` | `Map<ComponentType, Component>` | Attached components.                    |
| `transform`  | `Transform`                     | Shortcut to the Transform component.    |

| Method                        | Returns              | Description                                   |
|-------------------------------|----------------------|-----------------------------------------------|
| `addComponent(component)`     | `void`               | Attaches a component to this node.            |
| `getComponent<T>(type)`       | `T \| undefined`     | Retrieves a component by its `ComponentType`. |
| `hasComponent(type)`          | `boolean`            | Checks if a component of that type exists.    |
| `add(node)`                   | `void`               | Adds a child node.                            |
| `remove(node)`                | `void`               | Removes a child node.                         |
| `traverse(callback)`          | `void`               | Iterates over this node and all descendants.  |
| `findNodeById(id)`            | `Node \| undefined`  | Recursive search by ID.                       |
| `findNodeByName(name)`        | `Node \| undefined`  | Recursive search by name.                     |
| `updateWorldMatrix(parent?)`  | `void`               | Recalculates world matrix from local + parent.|

---

### `Transform` (Component)

Defines the spatial properties of a node. **Automatically added** to every `Node`.

| Property      | Type      | Default               | Description                              |
|---------------|-----------|-----------------------|------------------------------------------|
| `position`    | `Vec3`    | `{ x: 0, y: 0, z: 0 }` | Translation in local space.            |
| `rotation`    | `Quat`    | `{ x: 0, y: 0, z: 0, w: 1 }` | Rotation as a quaternion.       |
| `scale`       | `Vec3`    | `{ x: 1, y: 1, z: 1 }` | Scale in local space.                  |
| `localMatrix` | `Matrix4` | Identity               | The local transformation matrix.        |
| `worldMatrix` | `Matrix4` | Identity               | The computed world transformation matrix.|
| `isDirty`     | `boolean` | `true`                 | Flag for matrix recalculation.          |

| Method               | Description                                  |
|----------------------|----------------------------------------------|
| `updateLocalMatrix()`| Recomputes `localMatrix` from position/rotation/scale. |

---

### `Geometry` (Component)

Defines the shape of a node.

```typescript
import { createBox, createSphere, createPath2D } from '@oroya/core';

node.addComponent(createBox(2, 2, 2));
node.addComponent(createSphere(1, 32, 32));
```

| Property     | Type          | Description                                     |
|--------------|---------------|-------------------------------------------------|
| `definition` | `GeometryDef` | The definition object describing the geometry.  |

---

### `Material` (Component)

Defines the visual appearance of a node.

```typescript
import { Material } from '@oroya/core';

node.addComponent(new Material({
  color: { r: 0.5, g: 0.8, b: 1.0 },
  opacity: 0.9,
}));
```

| Property     | Type          | Description                                  |
|--------------|---------------|----------------------------------------------|
| `definition` | `MaterialDef` | The definition object for visual properties. |

---

### `Camera` (Component)

Defines the viewpoint from which the scene is rendered. The `ThreeRenderer` automatically picks up the first `Camera` node.

```typescript
import { Camera, CameraType } from '@oroya/core';

const cameraNode = new Node('main-cam');
cameraNode.addComponent(new Camera({
  type: CameraType.Perspective,
  fov: 75,
  aspect: 16 / 9,
  near: 0.1,
  far: 1000,
}));
cameraNode.transform.position.z = 5;
scene.add(cameraNode);
```

| Property     | Type        | Description                               |
|--------------|-------------|-------------------------------------------|
| `definition` | `CameraDef` | The definition object for camera settings.|

---

## Interfaces & Types

### `Vec3`
```typescript
interface Vec3 { x: number; y: number; z: number; }
```

### `Quat`
```typescript
interface Quat { x: number; y: number; z: number; w: number; }
```

### `ColorRGB`
```typescript
interface ColorRGB { r: number; g: number; b: number; }
```

### `MaterialDef`
```typescript
interface MaterialDef {
  color?: ColorRGB;
  opacity?: number;
  fill?: ColorRGB;       // Used by SVG renderer
  stroke?: ColorRGB;     // Used by SVG renderer
  strokeWidth?: number;  // Used by SVG renderer
}
```

### `GeometryDef` (Union Type)
```typescript
type GeometryDef = BoxGeometryDef | SphereGeometryDef | Path2DGeometryDef;
```

| Variant             | Properties                                        |
|---------------------|---------------------------------------------------|
| `BoxGeometryDef`    | `type: 'Box'`, `width`, `height`, `depth`         |
| `SphereGeometryDef` | `type: 'Sphere'`, `radius`, `widthSegments`, `heightSegments` |
| `Path2DGeometryDef` | `type: 'Path2D'`, `path: Path2DCommand[]`         |

### `ComponentType` (Enum)
```typescript
enum ComponentType {
  Transform = 'Transform',
  Geometry  = 'Geometry',
  Material  = 'Material',
  Camera    = 'Camera',
}
```

### `CameraType` (Enum)
```typescript
enum CameraType {
  Perspective  = 'Perspective',
  Orthographic = 'Orthographic',  // Planned
}
```

### `CameraDef` (Union Type)
```typescript
type CameraDef = PerspectiveCameraDef; // | OrthographicCameraDef (planned)
```

### `PerspectiveCameraDef`
```typescript
interface PerspectiveCameraDef {
  type: CameraType.Perspective;
  fov: number;     // Field of view in degrees
  aspect: number;  // Aspect ratio (width / height)
  near: number;    // Near clipping plane
  far: number;     // Far clipping plane
}
```

### `Matrix4`
```typescript
// A 4x4 transformation matrix as a 16-element tuple
type Matrix4 = [number, number, number, number,
                number, number, number, number,
                number, number, number, number,
                number, number, number, number];
```

| Export              | Type         | Description                                   |
|---------------------|--------------|-----------------------------------------------|
| `Matrix4Identity`   | `Matrix4`    | The identity matrix constant.                 |
| `composeMatrix()`   | `Matrix4`    | Builds a matrix from position, rotation, scale.|
| `multiplyMatrices()`| `Matrix4`    | Multiplies two 4x4 matrices.                  |

---

## Factory Functions

| Function                              | Returns    | Description                      |
|---------------------------------------|------------|----------------------------------|
| `createBox(width, height, depth)`     | `Geometry` | Creates a box geometry component.|
| `createSphere(radius, wSeg, hSeg)`   | `Geometry` | Creates a sphere geometry.       |
| `createPath2D(path)`                  | `Geometry` | Creates a 2D path (for SVG).    |
