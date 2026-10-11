import { Gen,SvJs } from "@joroya/renderer-svg";

export function createPortoPareto() {
  const svgSize = 1000;

  // Initialize SvJs
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  // Background
  const skyGradientId = 'sky-gradient';
  svg.createGradient(skyGradientId, 'linear', ['#f58b10', '#d21263', '#940c5e', '#23103a'], 90);
  svg.rect(1000, 600, 0, 0).fill(`url(#${skyGradientId})`);

  const waterGradientId = 'water-gradient';
  svg.createGradient(waterGradientId, 'linear', ['#80e5ff10', '#70b566'], 90);
  svg.rect(1000, 400, 0, 600).fill(`url(#${waterGradientId})`);

  // City Group
  const city = svg.g();

  // Default params
  const count = 60;
  const minH = 20;
  const spacing = 1000 / count;

  for (let i = 0; i < count; i++) {
    const paretoVal = Gen.pareto(minH);
    const maxHeight = Gen.random(300, 500);
    const height = Gen.constrain(paretoVal, minH, maxHeight);

    const x = i * spacing;
    const y = 600 - height; // Horizon at 600

    city.rect(spacing - 2, height, x, y)
      .fill('#1a1a2e')
      .stroke('#000', 1);

    city.rect(spacing - 2, height * 0.3, x, 600)
      .fill('#1a1a2e', 0.3);
  }

  // Sun
  svg.circle(60, 800, 150)
    .fill('#ffcc33', 0.8)
    .set({ filter: 'blur(4px)' });

  return {
    scene: svg,
    animate: () => { }
  };
}
