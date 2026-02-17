import { Component, ComponentType } from './Component';

export interface AudioSourceDef {
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

    // Runtime control methods (to be hooked up by renderer or script)
    // Ideally renderer syncs state, but for imperative 'play()' we might need an event or flag.
    // For now, let's stick to declarative state (autoplay) or expose methods that renderer checks?
    // A common pattern is having an 'action' queue or flags.
    // Or simply:
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
