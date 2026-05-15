import { Component, ComponentType } from './Component';

/**
 * Declarative description of a spatial audio source.
 *
 * Renderers consume this to construct a backend-specific positional audio
 * node (e.g. `THREE.PositionalAudio`). The fields mirror the Web Audio
 * `PannerNode` model so distance/cone attenuation translates 1:1.
 *
 * **Why `url` instead of `buffer`:** keeping audio data as a URL lets the
 * scene graph stay serializable (an `AudioBuffer` is not JSON-friendly) and
 * lets each renderer reuse its own loader/cache (Three.js has `AudioLoader`,
 * a Web-Audio-only backend would `fetch + decodeAudioData`).
 */
export interface AudioSourceDef {
    /** URL of the audio asset. Fetched and decoded by the active renderer. */
    url: string;
    loop?: boolean;
    volume?: number;
    autoplay?: boolean;
    refDistance?: number;
    rolloffFactor?: number;
    distanceModel?: 'linear' | 'inverse' | 'exponential';
    maxDistance?: number;
    coneInnerAngle?: number;
    coneOuterAngle?: number;
    coneOuterGain?: number;
}

export class AudioSource extends Component {
    readonly type = ComponentType.AudioSource;

    definition: Required<Omit<AudioSourceDef, 'url'>> & { url: string };

    constructor(definition: AudioSourceDef) {
        super();
        this.definition = {
            loop: false,
            volume: 1.0,
            autoplay: false,
            refDistance: 1,
            rolloffFactor: 1,
            distanceModel: 'inverse',
            maxDistance: 10000,
            coneInnerAngle: 360,
            coneOuterAngle: 0,
            coneOuterGain: 0,
            ...definition,
        };
    }

    /**
     * Imperative play/stop is expressed as a one-shot flag that the renderer
     * inspects each frame and clears after acting on it.
     *
     * Two flags (instead of a single enum) avoid race conditions when both
     * `play()` and `stop()` are called in the same tick — the most recent
     * call wins because each method clears the other's flag.
     */
    shouldPlay = false;
    shouldStop = false;

    play() {
        this.shouldPlay = true;
        this.shouldStop = false;
    }

    stop() {
        this.shouldStop = true;
        this.shouldPlay = false;
    }
}
