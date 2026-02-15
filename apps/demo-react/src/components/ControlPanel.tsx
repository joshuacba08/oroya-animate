import type { ControlDef, ParamValues } from '../types';

/* ── Styles ───────────────────────────────────────────────────────────── */

const panelStyles: React.CSSProperties = {
  position: 'absolute',
  top: '64px',
  right: '16px',
  zIndex: 10,
  width: '260px',
  padding: '16px',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(14px)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.4)',
};

const rowStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.75)',
};

const sliderRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const sliderStyles: React.CSSProperties = {
  flex: 1,
  height: '4px',
  accentColor: '#6c8aff',
  cursor: 'pointer',
};

const valueStyles: React.CSSProperties = {
  fontSize: '12px',
  fontFamily: 'monospace',
  color: 'rgba(255,255,255,0.5)',
  minWidth: '36px',
  textAlign: 'right',
};

const colorInputStyles: React.CSSProperties = {
  width: '100%',
  height: '32px',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  background: 'transparent',
  cursor: 'pointer',
  padding: '2px',
};

const selectStyles: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: '13px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  outline: 'none',
};

/* ── Component ────────────────────────────────────────────────────────── */

interface ControlPanelProps {
  controls: ControlDef[];
  params: ParamValues;
  onChange: (key: string, value: number | string, rebuild: boolean) => void;
}

export function ControlPanel({ controls, params, onChange }: ControlPanelProps) {
  if (controls.length === 0) return null;

  return (
    <div style={panelStyles}>
      <div style={titleStyles}>Controles</div>
      {controls.map((ctrl) => (
        <div key={ctrl.key} style={rowStyles}>
          <label style={labelStyles}>{ctrl.label}</label>
          {renderControl(ctrl, params, onChange)}
        </div>
      ))}
    </div>
  );
}

function renderControl(
  ctrl: ControlDef,
  params: ParamValues,
  onChange: ControlPanelProps['onChange'],
) {
  switch (ctrl.type) {
    case 'slider':
      return (
        <div style={sliderRowStyles}>
          <input
            type="range"
            min={ctrl.min}
            max={ctrl.max}
            step={ctrl.step}
            value={params[ctrl.key] as number}
            onChange={(e) => onChange(ctrl.key, parseFloat(e.target.value), !!ctrl.rebuild)}
            style={sliderStyles}
          />
          <span style={valueStyles}>
            {Number(params[ctrl.key]).toFixed(ctrl.step < 1 ? 1 : 0)}
          </span>
        </div>
      );

    case 'color':
      return (
        <input
          type="color"
          value={params[ctrl.key] as string}
          onChange={(e) => onChange(ctrl.key, e.target.value, !!ctrl.rebuild)}
          style={colorInputStyles}
        />
      );

    case 'select':
      return (
        <select
          value={params[ctrl.key] as string}
          onChange={(e) => onChange(ctrl.key, e.target.value, !!ctrl.rebuild)}
          style={selectStyles}
        >
          {ctrl.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
  }
}
