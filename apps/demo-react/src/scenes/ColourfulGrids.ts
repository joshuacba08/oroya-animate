import { Scene } from '@oroya/core';
import { SvJs, Gen } from '@oroya/renderer-svg';

export const colourfulGridsControls = {
    gridSize: { value: 600, min: 400, max: 800, step: 50, label: 'Grid Size' },
    rows: { value: 10, min: 2, max: 20, step: 1, label: 'Rows' },
    chance: { value: 60, min: 0, max: 100, step: 5, label: 'Fill Chance %' }
};

export function createColourfulGridsScene(
    container: HTMLElement,
    config: typeof colourfulGridsControls
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
    svg.rect(svgSize, svgSize).fill('#f0f0f0');

    const gSize = config.gridSize.value;
    const rows = config.rows.value;
    const spacing = 10;

    const increment = gSize / rows;
    const cellSize = Math.abs(increment - spacing);
    const offset = (svgSize - gSize) / 2; // Center grid

    const grid = svg.g();
    grid.moveTo(offset, offset);

    // Palettes
    const palettes = [
        ['#5465FF', '#788BFF', '#9BB1FF', '#BFD7FF', '#E2FDFF'],
        ['#22577A', '#38A3A5', '#57CC99', '#80ED99', '#C7f9CC'],
        ['#4C5760', '#93A8AC', '#D7CEB2', '#A59E8C', '#66635B']
    ];
    const palette = Gen.random(palettes);

    for (let y = 0; y < gSize; y += increment) {
        for (let x = 0; x < gSize; x += increment) {

            // Chance to skip cell
            if (!Gen.chance(config.chance.value)) continue;

            const cellId = `cell-${x}-${y}`;

            // Clip Path
            const clip = svg.create('clipPath').set({ id: clipId(cellId) });
            clip.rect(cellSize, cellSize, x, y);

            // Group for clipped content
            const cellContent = grid.g();
            cellContent.set({ clip_path: `url(#${clipId(cellId)})` });

            // Random pattern inside cell
            const type = Gen.random(['circles', 'lines']);

            if (type === 'circles') {
                const cx = Gen.random([x, x + cellSize]);
                const cy = Gen.random([y, y + cellSize]);
                for (let i = 0; i < 5; i++) {
                    cellContent.circle(cellSize - (i * cellSize / 5), cx, cy)
                        .fill(palette[i % palette.length]);
                }
            } else {
                for (let i = 0; i < 10; i++) {
                    cellContent.line(
                        Gen.random(x, x + cellSize), Gen.random(y, y + cellSize),
                        Gen.random(x, x + cellSize), Gen.random(y, y + cellSize)
                    ).stroke(palette[Gen.random(0, palette.length - 1)], 2);
                }
            }

            // Frame
            grid.rect(cellSize, cellSize, x, y)
                .fill('none')
                .stroke('#ddd', 1);
        }
    }

    function clipId(base: string) { return `clip-${base}-${Math.floor(Math.random() * 10000)}`; }

    return {
        scene,
        update: () => { },
        dispose: () => { wrapper.remove(); }
    };
}
