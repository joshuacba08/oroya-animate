import { Component, ComponentType } from './Component';

/**
 * Declarative description of a skeleton attached to a mesh.
 *
 * Refers to bones by their **scene-graph names** so the skeleton can be
 * resolved against the same node tree the animation system targets — no
 * extra registry needed. `boneNames` is order-significant: it pairs with
 * the `skinIndices` attribute on the mesh geometry (where each index
 * points into this array).
 *
 * `inverseBindMatrices` is a flat array of 16-float matrices, one per
 * bone, in the same order. These are computed once at rig-bind time and
 * baked into glTF; the renderer uses them to transform vertex positions
 * from mesh space into bone-local space before re-applying each frame's
 * animated bone pose.
 */
export interface SkinDef {
    /**
     * Names of the bone Nodes (in scene-graph order). Resolved by the
     * renderer against the live scene graph at mount time.
     */
    boneNames: string[];

    /**
     * Flat array of inverse bind matrices. Length === boneNames.length * 16.
     * Column-major, same convention as `Transform.worldMatrix` and
     * Three.js's `Matrix4`.
     */
    inverseBindMatrices: Float32Array;

    /**
     * Optional name of the root bone of the armature. Helps renderers
     * locate the skeleton's origin for hierarchical updates; not strictly
     * required when `boneNames` is exhaustive.
     */
    skeletonRoot?: string;
}

/**
 * Scene-graph component that marks a node as a skinned mesh and provides
 * the skeleton binding data.
 *
 * Attach alongside a `Geometry` (with `skinIndices` + `skinWeights` on its
 * `BufferGeometryDef`) and the renderer will produce a skinned mesh that
 * follows the bone Nodes' animated transforms automatically — the
 * `Animator` component animates bone transforms; the skin component
 * tells the renderer those bones drive *this* mesh.
 */
export class Skin extends Component {
    readonly type = ComponentType.Skin;

    definition: SkinDef;

    constructor(definition: SkinDef) {
        super();
        this.definition = definition;
    }
}
