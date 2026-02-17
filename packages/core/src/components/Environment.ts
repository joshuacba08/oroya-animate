import { Component, ComponentType } from './Component';
import type { ColorRGB } from './Material';

/**
 * Fog type enumeration.
 */
export enum FogType {
    Linear = 'Linear',
    Exponential = 'Exponential',
}

/**
 * Linear fog definition with near/far distances.
 */
export interface LinearFogDef {
    type: FogType.Linear;
    color: ColorRGB;
    /** Distance where fog starts. */
    near: number;
    /** Distance where fog is fully opaque. */
    far: number;
}

/**
 * Exponential fog definition with density.
 */
export interface ExponentialFogDef {
    type: FogType.Exponential;
    color: ColorRGB;
    /** Fog density factor. */
    density: number;
}

/**
 * Union of fog definitions.
 */
export type FogDef = LinearFogDef | ExponentialFogDef;

/**
 * Environment definition for scene-wide atmospheric settings.
 */
export interface EnvironmentDef {
    /**
     * Scene background - can be a color or texture URI.
     */
    background?: ColorRGB | string;

    /**
     * Fog configuration for atmospheric depth.
     */
    fog?: FogDef;

    /**
     * Global ambient light fallback.
     */
    ambientLight?: {
        color: ColorRGB;
        intensity: number;
    };
}

/**
 * Environment component for scene-wide settings like background, fog, and ambient light.
 * Typically attached to a single node in the scene (e.g., scene root or dedicated environment node).
 */
export class Environment extends Component {
    readonly type = ComponentType.Environment;

    /**
     * The environment definition.
     */
    definition: EnvironmentDef;

    constructor(definition: EnvironmentDef = {}) {
        super();
        this.definition = definition;
    }
}
