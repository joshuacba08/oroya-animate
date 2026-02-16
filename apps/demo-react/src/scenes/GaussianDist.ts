import { Scene } from '@oroya/core';
import { SvJs, Gen } from '@oroya/renderer-svg';

export const gaussianDistControls = {
    count: { value: 2000, min: 100, max: 10000, step: 100, label: 'Particles' },
    spread: { value: 120, min: 20, max: 300, step: 10, label: 'Spread (SD)' },
};

export function createGaussianDistScene(
    container: HTMLElement,
    config: typeof gaussianDistControls
) {
    const scene = new Scene();
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    container.appendChild(wrapper);

    const svgSize = 1000;
    const svg = new SvJs();
    svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });
    svg.addTo(wrapper);

    // Background
    svg.rect(svgSize, svgSize).fill('#111');

    const particles = svg.g();
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;
    const count = config.count.value;
    const sd = config.spread.value;

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
        scene,
        update: () => { },
        dispose: () => {
            wrapper.remove();
        }
    };
}
