import { Gen,SvJs } from "@joroya/renderer-svg";

export function createGaussianDist() {
  const svgSize = 1000;
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  svg.rect(svgSize, svgSize).fill('#111');

  const particles = svg.g();
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const count = 2000;
  const sd = 120;

  for (let i = 0; i < count; i++) {
    const x = Gen.gaussian(centerX, sd);
    const y = Gen.gaussian(centerY, sd);

    const d = Gen.dist(x, y, centerX, centerY);
    const hue = Gen.map(d, 0, 400, 220, 340); // Blue to Pink

    particles.circle(Gen.random(1, 4), x, y)
      .fill(`hsl(${hue}, 80%, 70%)`, 0.6);
  }

  const graphGroup = svg.g();
  graphGroup.line(0, centerY, 1000, centerY).stroke('#fff', 1, 0.2);

  return {
    scene: svg,
    animate: () => { }
  };
}
