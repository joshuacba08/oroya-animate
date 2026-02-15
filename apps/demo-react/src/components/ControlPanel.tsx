import type { ControlDef, ParamValues } from '../types';

/* ── Styles ───────────────────────────────────────────────────────────── */

const panelStyles: React.CSSProperties = {
  position: 'absolute',
  top: '68px',
  right: '20px',
  zIndex: 10,
  width: '270px',
  padding: '18px',
  borderRadius: '16px',
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const titleStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(255,255,255,0.3)',
  fontFamily: "'Zalando Sans Expanded', sans-serif",
  paddingBottom: '4px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const rowStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.6)',
  letterSpacing: '0.02em',
  fontFamily: "'JetBrains Mono', monospace",
};

const sliderRowStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const sliderStyles: React.CSSProperties = {
  flex: 1,
  height: '4px',
  cursor: 'pointer',
};

const valueStyles: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: "'JetBrains Mono', monospace",
  color: 'rgba(108,138,255,0.7)',
  minWidth: '40px',
  textAlign: 'right',
  fontWeight: 500,
  background: 'rgba(108,138,255,0.08)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const colorInputStyles: React.CSSProperties = {
  width: '100%',
  height: '34px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.03)',
  cursor: 'pointer',
  padding: '3px',
  transition: 'border-color 0.2s ease',
};

const selectStyles: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.8)',
  fontSize: '12px',
  fontFamily: "'JetBrains Mono', monospace",
  cursor: 'pointer',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  colorScheme: 'dark',
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
    <div style={panelStyles} className="glass-panel">
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
          className="demo-select"
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
