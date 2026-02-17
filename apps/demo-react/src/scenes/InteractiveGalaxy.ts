import { SvJs, Gen } from '@joroya/renderer-svg';
import type { ControlDef, ParamValues } from '../types';

export const interactiveGalaxyControls: ControlDef[] = [
    { type: 'slider', key: 'particleCount', label: 'Star Count', min: 20, max: 200, step: 10, defaultValue: 100, rebuild: true },
];

export function createInteractiveGalaxyScene(params: ParamValues) {
    const svgSize = 1000;
    const svg = new SvJs();
    svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

    // Dark space background
    svg.rect(svgSize, svgSize).fill('#050510');

    // Stars group
    const stars = svg.g();
    const starElements: { el: SvJs, x: number, y: number, z: number }[] = [];

    const count = Number(params.particleCount);

    for (let i = 0; i < count; i++) {
        const x = Gen.random(0, svgSize);
        const y = Gen.random(0, svgSize);
        const z = Gen.random(0.5, 2, true); // Parallax factor

        const star = stars.circle(Gen.random(1, 3), x, y)
            .fill('#fff', Gen.random(0.5, 1, true));

        starElements.push({ el: star, x, y, z });
    }

    // Cursor Tracking
    // We attach a small object to cursor
    const cursorFollower = svg.circle(20, 0, 0)
        .fill('none')
        .stroke('#0ff', 2)
        .set({ filter: 'blur(2px)' });

    // Start tracking
    svg.trackCursor();

    function animate() {
        // Get current cursor position from SvJs instance
        const mx = svg.cursorX ?? svgSize / 2;
        const my = svg.cursorY ?? svgSize / 2;

        // Update follower
        cursorFollower.set({ cx: mx, cy: my });

        // Parallax effect on stars away from cursor
        starElements.forEach(star => {
            const dx = (mx - svgSize / 2) * star.z * 0.1;
            const dy = (my - svgSize / 2) * star.z * 0.1;
            // Apply gentle move
            // SvJs objects are just wrappers, we can set attributes directly
            star.el.set({
                cx: star.x + dx,
                cy: star.y + dy
            });
        });
    }

    return {
        scene: svg as any,
        animate: animate
    };
}
