import { SvJs, Gen } from '@oroya/renderer-svg';
import type { DemoSceneDef, ParamValues } from '../types';

export const SvJsGenerativeDemo: DemoSceneDef = {
    id: 'svjs-generative',
    label: 'Generative Native',
    description: 'Generative art using the new SvJs native wrapper.',
    renderer: 'svjs',
    controls: [
        { type: 'slider', key: 'iterations', label: 'Iterations', min: 10, max: 200, step: 1, defaultValue: 50, rebuild: true },
        { type: 'slider', key: 'hue', label: 'Base Hue', min: 0, max: 360, step: 1, defaultValue: 180, rebuild: true },
        { type: 'slider', key: 'rotation', label: 'Rotation', min: -180, max: 180, step: 1, defaultValue: 45, rebuild: true },
    ],
    factory: (params: ParamValues) => {
        const svgSize = 1000;
        const bgColor = '#181818';

        // Create our parent SVG
        const svg = new SvJs();
        svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

        // Background
        svg.rect(svgSize, svgSize, 0, 0).fill(bgColor);

        const iterations = Number(params.iterations);
        const baseHue = Number(params.hue);
        const baseRotation = Number(params.rotation);

        // Run a loop to create ellipses
        for (let i = 0; i < iterations; i += 1) {
            let center = 500;
            let radiusX = 100 + (i * 3);
            let radiusY = 300 + (i * 2);
            let rotation = baseRotation + (i * 2);

            let hue;
            if (baseHue < 180) {
                hue = baseHue + (i * 3);
            } else {
                hue = baseHue - (i * 3);
            }

            // Keep hue in 0-360 range
            hue = hue % 360;

            // Create our ellipse
            svg.ellipse(radiusX, radiusY, center, center)
                .fill('none') // Default fill is usually black in SVG, explicit none
                .stroke(`hsl(${hue} 80% 80% / 0.6)`)
                .rotate(rotation, center, center);
        }

        return {
            scene: svg as any, // Cast to any to bypass Scene type check in DemoSceneDef for now
            animate: (time: number) => {
                // We could animate here if we wanted
            },
        };
    },
};
