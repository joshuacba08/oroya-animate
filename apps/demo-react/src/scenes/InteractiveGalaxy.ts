import { Scene } from '@oroya/core';
import { SvJs, Gen } from '@oroya/renderer-svg';

export const interactiveGalaxyControls = {
    particleCount: { value: 100, min: 20, max: 200, step: 10, label: 'Star Count' },
};

export function createInteractiveGalaxyScene(
    container: HTMLElement,
    config: typeof interactiveGalaxyControls
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

    // Dark space background
    svg.rect(svgSize, svgSize).fill('#050510');

    // Stars group
    const stars = svg.g();
    const starElements: { el: SvJs, x: number, y: number, z: number }[] = [];

    for (let i = 0; i < config.particleCount.value; i++) {
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

    // Update loop for interactivity
    let animationId: number;

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

        animationId = requestAnimationFrame(animate);
    }

    animate();

    return {
        scene,
        update: () => { },
        dispose: () => {
            cancelAnimationFrame(animationId);
            wrapper.remove();
        }
    };
}
