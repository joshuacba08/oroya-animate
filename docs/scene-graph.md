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
-   **Rotation:** A Quaternion `{ x, y, z, w }` (expressed via the Euler angles helper in the API soon).
-   **Scale:** `{ x, y, z }`

### Local vs World Space

-   **Local Space:** The coordinates relative to the node's parent.
-   **World Space:** The final coordinates in the 3D world after combining all parent transformations.

Oroya handles the matrix calculations for you when you call `scene.updateWorldMatrices()` (or it's handled automatically by the renderers).

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
-   `Geometry`
-   `Material`
-   `Camera` (Coming soon)
-   `Light` (Coming soon)
