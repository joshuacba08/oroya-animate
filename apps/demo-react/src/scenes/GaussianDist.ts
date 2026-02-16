import { SvJs, Gen } from '@oroya/renderer-svg';
import type { ControlDef, ParamValues } from '../types';

export const gaussianDistControls: ControlDef[] = [
    { type: 'slider', key: 'count', label: 'Particles', min: 100, max: 10000, step: 100, defaultValue: 2000, rebuild: true },
    { type: 'slider', key: 'spread', label: 'Spread (SD)', min: 20, max: 300, step: 10, defaultValue: 120, rebuild: true },
];

export function createGaussianDistScene(params: ParamValues) {
    const svgSize = 1000;
    const svg = new SvJs();
    svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

    // Background
    svg.rect(svgSize, svgSize).fill('#111');

    const particles = svg.g();
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const count = Number(params.count);
    const sd = Number(params.spread);

    for (let i = 0; i < count; i++) {
        // Gaussian distribution centered at 500
        const x = Gen.gaussian(centerX, sd);
        const y = Gen.gaussian(centerY, sd);

        // Color based on distance from center
        const d = Gen.dist(x, y, centerX, centerY);
        const hue = Gen.map(d, 0, 400, 220, 340); // Blue to Pink

        particles.circle(Gen.random(1, 4), x, y)
            .fill(`hsl(${hue}, 80%, 70%)`, 0.6);
    }

    // Overlay line graph to show distribution on X axis
    const graphGroup = svg.g();
    graphGroup.line(0, centerY, 1000, centerY).stroke('#fff', 1, 0.2);

    return {
        scene: svg as any,
        animate: () => { }
    };
}
