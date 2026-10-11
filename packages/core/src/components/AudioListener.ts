import { Component, ComponentType } from './Component';

/** @public */
export interface AudioListenerDef {
    masterVolume?: number;
}

/** @public */
export class AudioListener extends Component {
    readonly type = ComponentType.AudioListener;

    definition: Required<AudioListenerDef>;

    constructor(definition: AudioListenerDef = {}) {
        super();
        this.definition = {
            masterVolume: 1.0,
            ...definition,
        };
    }
}
