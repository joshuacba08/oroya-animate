declare module 'three/examples/jsm/postprocessing/EffectComposer' {
    export class EffectComposer {
        constructor(renderer: any);
        passes: any[];
        addPass(pass: any): void;
        insertPass(pass: any, index: number): void;
        render(): void;
        setSize(width: number, height: number): void;
    }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
    export class RenderPass {
        constructor(scene: any, camera: any);
        scene: any;
        camera: any;
    }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
    export class UnrealBloomPass {
        constructor(resolution: any, strength: number, radius: number, threshold: number);
        strength: number;
        radius: number;
        threshold: number;
        enabled: boolean;
    }
}

declare module 'three/examples/jsm/postprocessing/OutputPass' {
    export class OutputPass { }
}
