import { Component, ComponentType } from './Component';

export interface AudioListenerDef {
    masterVolume?: number;
}

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
