# Scene Graph & Transformations

The Scene Graph is a hierarchical tree structure that manages the spatial relationships between objects in your scene.

## 🌳 The Hierarchy

Every `Scene` has a `root` node. All other nodes are children or descendants of this root.

```typescript
const parent = new Node('parent');
const child = new Node('child');

parent.add(child); // 'child' is now a child of 'parent'
scene.add(parent); // 'parent' is added to the scene root
```

When a parent node moves, its children move with it. This is because transformations are relative to the parent.

## 📐 Transformations

Every node has a `Transform` component, which includes:

-   **Position:** `{ x, y, z }`
-   **Rotation:** A Quaternion `{ x, y, z, w }`.
-   **Scale:** `{ x, y, z }`

### Updating Transforms

After modifying `position`, `rotation`, or `scale`, you must call `updateLocalMatrix()` to recompute the node's local transformation matrix:

```typescript
node.transform.position.x = 3;
node.transform.rotation.y = 0.5;
node.transform.updateLocalMatrix(); // Recalculates the 4x4 local matrix
```

The renderer then calls `scene.updateWorldMatrices()` to propagate local matrices through the hierarchy, computing the final `worldMatrix` for each node.

### Local vs World Space

-   **Local Space:** The coordinates relative to the node's parent.
-   **World Space:** The final coordinates in the 3D world after combining all parent transformations.

Oroya computes `worldMatrix = parentWorldMatrix * localMatrix` for each node in the tree. The `ThreeRenderer` calls this automatically on every `render()` frame.

You can also call it manually:
```typescript
scene.updateWorldMatrices();
```

## 🧩 Components

Nodes are technically empty until you add components to them. This follows an **Entity-Component System (ECS)** light pattern.

```typescript
const node = new Node('player');

// Geometry defines the "bones/surface"
node.addComponent(new Geometry(boxDef));

// Material defines the "skin/paint"
node.addComponent(new Material(materialDef));

// You can find components later:
const geo = node.getComponent<Geometry>(ComponentType.Geometry);
```

### Component Types
Currently supported component types:
-   `Transform` (Mandatory, added automatically)
-   `Geometry` — Defines shape (Box, Sphere, Path2D)
-   `Material` — Defines appearance (color, opacity)
-   `Camera` — Defines a viewpoint (Perspective; Orthographic planned)
-   `Light` (Coming soon)
