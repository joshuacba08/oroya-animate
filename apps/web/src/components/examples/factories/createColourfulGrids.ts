import { Gen,SvJs } from "@joroya/renderer-svg";

export function createColourfulGrids() {
  const svgSize = 1000;
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  svg.rect(svgSize, svgSize).fill('#f0f0f0');

  const gSize = 600;
  const rows = 10;
  const chance = 60;
  const spacing = 10;

  const increment = gSize / rows;
  const cellSize = Math.abs(increment - spacing);
  const offset = (svgSize - gSize) / 2;

  const grid = svg.g();
  grid.moveTo(offset, offset);

  const palettes = [
    ['#5465FF', '#788BFF', '#9BB1FF', '#BFD7FF', '#E2FDFF'],
    ['#22577A', '#38A3A5', '#57CC99', '#80ED99', '#C7f9CC'],
    ['#4C5760', '#93A8AC', '#D7CEB2', '#A59E8C', '#66635B']
  ];
  const palette = Gen.random(palettes);

  function clipId(base: string) { return `clip-${base}-${Math.floor(Math.random() * 10000)}`; }

  for (let y = 0; y < gSize; y += increment) {
    for (let x = 0; x < gSize; x += increment) {
      if (!Gen.chance(chance)) continue;

      const cellId = `cell-${x}-${y}`;
      const clip = svg.create('clipPath').set({ id: clipId(cellId) });
      clip.rect(cellSize, cellSize, x, y);

      const cellContent = grid.g();
      cellContent.set({ 'clip-path': `url(#${clipId(cellId)})` });

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

      grid.rect(cellSize, cellSize, x, y)
        .fill('none')
        .stroke('#ddd', 1);
    }
  }

  return {
    scene: svg,
    animate: () => { }
  };
}
