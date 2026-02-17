import { Component, ComponentType } from './Component';

/**
 * An enumeration of available light types.
 */
export enum LightType {
    Ambient = 'Ambient',
    Directional = 'Directional',
    Point = 'Point',
    Spot = 'Spot',
}

/**
 * Definition for an ambient light.
 * Provides uniform illumination from all directions.
 */
export interface AmbientLightDef {
    type: LightType.Ambient;
    /** Light color (RGB). Default: white */
    color?: { r: number; g: number; b: number };
    /** Light intensity. Default: 1 */
    intensity?: number;
}

/**
 * Definition for a directional light.
 * Emits parallel rays in a single direction (like sunlight).
 */
export interface DirectionalLightDef {
    type: LightType.Directional;
    /** Light color (RGB). Default: white */
    color?: { r: number; g: number; b: number };
    /** Light intensity. Default: 1 */
    intensity?: number;
    /** Whether this light casts shadows. Default: false */
    castShadow?: boolean;
    /** Target position the light points at. Default: origin */
    target?: { x: number; y: number; z: number };
}

/**
 * Definition for a point light.
 * Emits light in all directions from a single point (like a light bulb).
 */
export interface PointLightDef {
    type: LightType.Point;
    /** Light color (RGB). Default: white */
    color?: { r: number; g: number; b: number };
    /** Light intensity. Default: 1 */
    intensity?: number;
    /** Maximum range of the light. Default: 0 (infinite) */
    distance?: number;
    /** Light decay rate. Default: 2 (physically correct) */
    decay?: number;
    /** Whether this light casts shadows. Default: false */
    castShadow?: boolean;
}

/**
 * Definition for a spot light.
 * Emits light in a cone from a point (like a flashlight).
 */
export interface SpotLightDef {
    type: LightType.Spot;
    /** Light color (RGB). Default: white */
    color?: { r: number; g: number; b: number };
    /** Light intensity. Default: 1 */
    intensity?: number;
    /** Maximum range of the light. Default: 0 (infinite) */
    distance?: number;
    /** Cone angle in radians. Default: Math.PI / 3 */
    angle?: number;
    /** Penumbra (soft edge) percentage. Default: 0 */
    penumbra?: number;
    /** Light decay rate. Default: 2 */
    decay?: number;
    /** Whether this light casts shadows. Default: false */
    castShadow?: boolean;
    /** Target position the light points at. Default: origin */
    target?: { x: number; y: number; z: number };
}

/**
 * A union of all light definitions.
 */
export type LightDef = AmbientLightDef | DirectionalLightDef | PointLightDef | SpotLightDef;

/**
 * A component that defines a light source in the scene.
 */
export class Light extends Component {
    readonly type = ComponentType.Light;

    /**
     * The definition of the light.
     */
    definition: LightDef;

    constructor(definition: LightDef) {
        super();
        this.definition = definition;
    }
}
