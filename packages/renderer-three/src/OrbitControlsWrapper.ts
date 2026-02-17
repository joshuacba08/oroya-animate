import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

/**
 * Wrapper around Three.js OrbitControls for camera manipulation.
 * Provides mouse/touch controls for orbiting, panning, and zooming the camera.
 */
export class OrbitControlsWrapper {
    private controls: OrbitControls;

    /**
     * Create orbit controls for a camera.
     * @param camera The Three.js camera to control.
     * @param domElement The DOM element to attach event listeners to (usually the canvas).
     */
    constructor(camera: THREE.Camera, domElement: HTMLElement) {
        this.controls = new OrbitControls(camera, domElement);

        // Default settings for smooth interaction
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = Math.PI;
    }

    /**
     * Update the controls. Call this in your render loop.
     */
    update(): void {
        this.controls.update();
    }

    /**
     * Dispose of the controls and remove event listeners.
     */
    dispose(): void {
        this.controls.dispose();
    }

    /**
     * Get the underlying Three.js OrbitControls instance for advanced configuration.
     */
    get nativeControls(): OrbitControls {
        return this.controls;
    }
}
