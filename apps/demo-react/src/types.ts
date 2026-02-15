import type { Scene } from '@oroya/core';

/* ── Control definitions ─────────────────────────────────────────────── */

export interface SliderControl {
  type: 'slider';
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  rebuild?: boolean;
}

export interface ColorControl {
  type: 'color';
  key: string;
  label: string;
  defaultValue: string; // hex e.g. "#3399ff"
  rebuild?: boolean;
}

export interface SelectControl {
  type: 'select';
  key: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
  rebuild?: boolean;
}

export type ControlDef = SliderControl | ColorControl | SelectControl;

export type ParamValues = Record<string, number | string>;

/* ── Scene definition ────────────────────────────────────────────────── */

export interface DemoSceneDef {
  id: string;
  label: string;
  description: string;
  controls: ControlDef[];
  factory: (params: ParamValues) => {
    scene: Scene;
    animate: (time: number, params: ParamValues) => void;
  };
}

/* ── Utilities ───────────────────────────────────────────────────────── */

export function getDefaultParams(controls: ControlDef[]): ParamValues {
  const params: ParamValues = {};
  for (const c of controls) {
    params[c.key] = c.defaultValue;
  }
  return params;
}

export function hexToRgb(hex: string) {
  if (!hex || typeof hex !== 'string') return { r: 0.5, g: 0.5, b: 0.5 };
  const n = parseInt(hex.slice(1), 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}
