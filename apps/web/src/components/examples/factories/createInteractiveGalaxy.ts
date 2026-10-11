import { Gen,SvJs } from "@joroya/renderer-svg";

export function createInteractiveGalaxy() {
  const svgSize = 1000;
  const svg = new SvJs();
  svg.set({ viewBox: `0 0 ${svgSize} ${svgSize}` });

  svg.rect(svgSize, svgSize).fill('#050510');

  const stars = svg.g();
  const starElements: { el: SvJs, x: number, y: number, z: number }[] = [];

  const count = 100;

  for (let i = 0; i < count; i++) {
    const x = Gen.random(0, svgSize);
    const y = Gen.random(0, svgSize);
    const z = Gen.random(0.5, 2, true);

    const star = stars.circle(Gen.random(1, 3), x, y)
      .fill('#fff', Gen.random(0.5, 1, true));

    starElements.push({ el: star, x, y, z });
  }

  const cursorFollower = svg.circle(20, 0, 0)
    .fill('none')
    .stroke('#0ff', 2)
    .set({ filter: 'blur(2px)' });

  // Note: trackCursor attaches event listeners to the SVG element.
  // Since we are running in a specific container, we rely on SvJs logic.
  svg.trackCursor();

  function animate() {
    const mx = svg.cursorX ?? svgSize / 2;
    const my = svg.cursorY ?? svgSize / 2;

    cursorFollower.set({ cx: mx, cy: my });

    starElements.forEach(star => {
      const dx = (mx - svgSize / 2) * star.z * 0.1;
      const dy = (my - svgSize / 2) * star.z * 0.1;
      star.el.set({
        cx: star.x + dx,
        cy: star.y + dy
      });
    });
  }

  return {
    scene: svg,
    animate: animate
  };
}
