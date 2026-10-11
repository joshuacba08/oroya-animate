import {
createText,
Light,
LightType,
Material,
Node,
Scene,
type Path2DCommand
} from "@joroya/core";
export function rotateY(angle: number) {
  return { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) };
}

export function composeYX(yAngle: number, xAngle: number) {
  const sy = Math.sin(yAngle / 2);
  const cy = Math.cos(yAngle / 2);
  const sx = Math.sin(xAngle / 2);
  const cx = Math.cos(xAngle / 2);
  return { x: cy * sx, y: sy * cx, z: -sy * sx, w: cy * cx };
}

export function addDefaultLighting(scene: Scene) {
  const ambient = new Node("default-ambient");
  ambient.addComponent(new Light({
    type: LightType.Ambient,
    color: { r: 0.4, g: 0.4, b: 0.5 },
    intensity: 0.6,
  }));
  scene.add(ambient);

  const sun = new Node("default-sun");
  sun.addComponent(new Light({
    type: LightType.Directional,
    color: { r: 1.0, g: 0.95, b: 0.9 },
    intensity: 1.0,
  }));
  sun.transform.position = { x: 5, y: 8, z: 4 };
  scene.add(sun);
}

export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const WEB_SAFE_COLOURS = [
  { r: 1, g: 0, b: 0 }, { r: 1, g: 0.5, b: 0 }, { r: 1, g: 1, b: 0 },
  { r: 0.5, g: 1, b: 0 }, { r: 0, g: 1, b: 0 }, { r: 0, g: 1, b: 0.5 },
  { r: 0, g: 1, b: 1 }, { r: 0, g: 0.5, b: 1 }, { r: 0, g: 0, b: 1 },
  { r: 0.5, g: 0, b: 1 }, { r: 1, g: 0, b: 1 }, { r: 1, g: 0, b: 0.5 },
  { r: 1, g: 0.6, b: 0.6 }, { r: 1, g: 0.8, b: 0.5 }, { r: 1, g: 1, b: 0.6 },
  { r: 0.6, g: 1, b: 0.6 }, { r: 0.6, g: 1, b: 0.8 }, { r: 0.6, g: 1, b: 1 },
  { r: 0.6, g: 0.8, b: 1 }, { r: 0.6, g: 0.6, b: 1 }, { r: 0.8, g: 0.6, b: 1 },
  { r: 1, g: 0.6, b: 1 }, { r: 1, g: 0.6, b: 0.8 }, { r: 0.8, g: 0.8, b: 0.5 },
];

export function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function svgShowcaseStarPath(cx: number, cy: number, points: number, outerR: number, innerR: number): Path2DCommand[] {
  const cmds: Path2DCommand[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    cmds.push({ command: i === 0 ? "M" : "L", args: [Math.round((cx + Math.cos(angle) * r) * 10) / 10, Math.round((cy + Math.sin(angle) * r) * 10) / 10] });
  }
  cmds.push({ command: "Z", args: [] });
  return cmds;
}

export function svgAnimStarPath(cx: number, cy: number, points: number, outerR: number, innerR: number): Path2DCommand[] {
  const cmds: Path2DCommand[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    cmds.push({ command: i === 0 ? "M" : "L", args: [Math.round((cx + Math.cos(angle) * r) * 10) / 10, Math.round((cy + Math.sin(angle) * r) * 10) / 10] });
  }
  cmds.push({ command: "Z", args: [] });
  return cmds;
}

export function svgAnimLabel(scene: Scene, text: string, x: number, y: number) {
  const label = new Node(`lbl - ${x} -${y} `);
  label.addComponent(createText(text, { fontSize: 13, fontFamily: "system-ui, sans-serif", textAnchor: "middle" }));
  label.addComponent(new Material({ fill: { r: 0.55, g: 0.55, b: 0.65 } }));
  label.transform.position = { x, y, z: 0 };
  label.transform.updateLocalMatrix();
  scene.add(label);
}
