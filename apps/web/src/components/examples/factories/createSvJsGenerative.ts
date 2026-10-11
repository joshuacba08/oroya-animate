import { SvJs } from "@joroya/renderer-svg";

export function createSvJsGenerative() {
  const svgSize = 1000;
  const iterations = 50;
  const baseHue = 180;
  const baseRotation = 45;

  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });
  svg.rect(svgSize, svgSize, 0, 0).fill("#181818");

  for (let i = 0; i < iterations; i++) {
    const center = 500;
    const radiusX = 100 + i * 3;
    const radiusY = 300 + i * 2;
    const rotation = baseRotation + i * 2;
    let hue = baseHue < 180 ? baseHue + i * 3 : baseHue - i * 3;
    hue = hue % 360;
    svg.ellipse(radiusX, radiusY, center, center)
      .fill("none")
      .stroke(`hsl(${hue} 80% 80% / 0.6)`)
      .rotate(rotation, center, center);
  }

  return { scene: svg, animate: () => { } };
}
