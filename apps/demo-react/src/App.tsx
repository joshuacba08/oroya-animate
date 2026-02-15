import { useState, useMemo, useCallback, useRef } from 'react';
import { OroyaCanvas } from './OroyaCanvas';
import { ControlPanel } from './components/ControlPanel';
import { DEMO_SCENES } from './scenes';
import { getDefaultParams, RENDERER_META } from './types';
import type { ParamValues } from './types';

/* ── Styles ───────────────────────────────────────────────────────────── */

const containerStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#0a0a10',
  color: 'white',
  fontFamily: "'JetBrains Mono', monospace",
  position: 'relative',
  overflow: 'hidden',
};

const headerStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  background:
    'linear-gradient(180deg, rgba(10,10,16,0.97) 0%, rgba(10,10,16,0.7) 60%, transparent 100%)',
  pointerEvents: 'none',
};

const logoStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
  pointerEvents: 'auto',
  fontFamily: "'Zalando Sans Expanded', sans-serif",
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
};

const logoAccentStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, #6c8aff 0%, #a78bfa 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const logoDimStyles: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  pointerEvents: 'auto',
};

const navBtnBase: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '10px',
  border: '1px solid transparent',
  cursor: 'pointer',
  fontSize: '11.5px',
  fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '-0.01em',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
};

const infoBoxStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  left: '24px',
  zIndex: 10,
  maxWidth: '400px',
  padding: '18px 22px',
  borderRadius: '16px',
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const infoTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  marginBottom: '6px',
  fontFamily: "'Zalando Sans Expanded', sans-serif",
  letterSpacing: '-0.01em',
};

const infoDescStyles: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.01em',
};

const rendererBadgeBase: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 7px',
  borderRadius: '6px',
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  lineHeight: '16px',
  verticalAlign: 'middle',
  marginLeft: '8px',
  border: '1px solid',
  textTransform: 'uppercase',
  fontFamily: "'JetBrains Mono', monospace",
};

const footerStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  right: '24px',
  zIndex: 10,
  fontSize: '10px',
  fontWeight: 400,
  color: 'rgba(255,255,255,0.2)',
  letterSpacing: '0.04em',
  fontFamily: "'JetBrains Mono', monospace",
};

/* ── Component ────────────────────────────────────────────────────────── */

function App() {
  const [activeId, setActiveId] = useState(DEMO_SCENES[0].id);
  const [params, setParams] = useState<ParamValues>(() =>
    getDefaultParams(DEMO_SCENES[0].controls),
  );
  const [buildKey, setBuildKey] = useState(0);

  const activeDemo = DEMO_SCENES.find((d) => d.id === activeId)!;

  // Keep a mutable ref so the animation loop always reads fresh values
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Switch demo: reset params synchronously so useMemo gets correct values
  const handleSwitchDemo = useCallback((id: string) => {
    const demo = DEMO_SCENES.find((d) => d.id === id)!;
    const defaults = getDefaultParams(demo.controls);
    setActiveId(id);
    setParams(defaults);
    paramsRef.current = defaults;
    setBuildKey((k) => k + 1);
  }, []);

  // Create scene — rebuilds only when buildKey changes
  const { scene, animate } = useMemo(
    () => activeDemo.factory(paramsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeDemo, buildKey],
  );

  const onAnimate = useCallback(
    (time: number) => animate(time, paramsRef.current),
    [animate],
  );

  const handleParamChange = useCallback(
    (key: string, value: number | string, rebuild: boolean) => {
      setParams((prev) => ({ ...prev, [key]: value }));
      if (rebuild) {
        setBuildKey((k) => k + 1);
      }
    },
    [],
  );

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div style={logoStyles}>
          <span style={logoAccentStyles}>Oroya</span>
          <span style={logoDimStyles}>Animate</span>
        </div>

        <nav style={navStyles}>
          {DEMO_SCENES.map((demo) => {
            const isActive = demo.id === activeId;
            const meta = RENDERER_META[demo.renderer];
            return (
              <button
                key={demo.id}
                className="demo-nav-btn"
                onClick={() => handleSwitchDemo(demo.id)}
                style={{
                  ...navBtnBase,
                  background: isActive
                    ? 'rgba(108,138,255,0.14)'
                    : 'rgba(255,255,255,0.03)',
                  borderColor: isActive
                    ? 'rgba(108,138,255,0.35)'
                    : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#a0b8ff' : 'rgba(255,255,255,0.45)',
                  boxShadow: isActive
                    ? '0 0 16px rgba(108,138,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : 'none',
                }}
              >
                {demo.label}
                <span
                  style={{
                    ...rendererBadgeBase,
                    color: meta.color,
                    borderColor: `${meta.color}33`,
                    backgroundColor: `${meta.color}12`,
                  }}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Canvas */}
      <OroyaCanvas
        key={`${activeId}-${buildKey}`}
        scene={scene}
        onAnimate={onAnimate}
      />

      {/* Controls panel */}
      <ControlPanel
        controls={activeDemo.controls}
        params={params}
        onChange={handleParamChange}
      />

      {/* Info panel */}
      <div style={infoBoxStyles} className="glass-panel">
        <div style={infoTitleStyles}>
          {activeDemo.label}
          <span
            style={{
              ...rendererBadgeBase,
              color: RENDERER_META[activeDemo.renderer].color,
              borderColor: `${RENDERER_META[activeDemo.renderer].color}33`,
              backgroundColor: `${RENDERER_META[activeDemo.renderer].color}12`,
            }}
          >
            {RENDERER_META[activeDemo.renderer].label}
          </span>
        </div>
        <div style={infoDescStyles}>{activeDemo.description}</div>
      </div>

      {/* Watermark */}
      <div style={footerStyles}>oroya-animate v0.1</div>
    </div>
  );
}

export default App;
