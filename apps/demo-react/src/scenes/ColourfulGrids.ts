import { SvJs, Gen } from '@oroya/renderer-svg';
import type { ControlDef, ParamValues } from '../types';

export const colourfulGridsControls: ControlDef[] = [
    { type: 'slider', key: 'gridSize', label: 'Grid Size', min: 400, max: 800, step: 50, defaultValue: 600, rebuild: true },
    { type: 'slider', key: 'rows', label: 'Rows', min: 2, max: 20, step: 1, defaultValue: 10, rebuild: true },
    { type: 'slider', key: 'chance', label: 'Fill Chance %', min: 0, max: 100, step: 5, defaultValue: 60, rebuild: true }
];

export function createColourfulGridsScene(params: ParamValues) {
    const svgSize = 1000;
    const svg = new SvJs();
    svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

    // Background
    svg.rect(svgSize, svgSize).fill('#f0f0f0');

    const gSize = Number(params.gridSize);
    const rows = Number(params.rows);
    const chance = Number(params.chance);
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
            if (!Gen.chance(chance)) continue;

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
        scene: svg as any,
        animate: () => { }
    };
}
