import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { OroyaCanvas } from './OroyaCanvas';
import { ControlPanel } from './components/ControlPanel';
import { DEMO_SCENES } from './scenes';
import { getDefaultParams } from './types';
import type { ParamValues } from './types';

/* ── Styles ───────────────────────────────────────────────────────────── */

const containerStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#0d0d12',
  color: 'white',
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
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
  padding: '14px 20px',
  background: 'linear-gradient(to bottom, rgba(13,13,18,0.95) 0%, rgba(13,13,18,0) 100%)',
  pointerEvents: 'none',
};

const logoStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
  pointerEvents: 'auto',
};

const logoAccentStyles: React.CSSProperties = {
  color: '#6c8aff',
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  gap: '4px',
  pointerEvents: 'auto',
};

const navBtnBase: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: '8px',
  border: '1px solid transparent',
  cursor: 'pointer',
  fontSize: '12.5px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};

const infoBoxStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  left: '20px',
  zIndex: 10,
  maxWidth: '380px',
  padding: '14px 18px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const infoTitleStyles: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  marginBottom: '4px',
};

const infoDescStyles: React.CSSProperties = {
  fontSize: '12.5px',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.55)',
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

  // Reset params when switching demos
  useEffect(() => {
    const defaults = getDefaultParams(activeDemo.controls);
    setParams(defaults);
    paramsRef.current = defaults;
    setBuildKey((k) => k + 1);
  }, [activeDemo]);

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
          <span style={logoAccentStyles}>Oroya</span> Animate
        </div>

        <nav style={navStyles}>
          {DEMO_SCENES.map((demo) => {
            const isActive = demo.id === activeId;
            return (
              <button
                key={demo.id}
                onClick={() => setActiveId(demo.id)}
                style={{
                  ...navBtnBase,
                  background: isActive
                    ? 'rgba(108,138,255,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  borderColor: isActive
                    ? 'rgba(108,138,255,0.4)'
                    : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#a0b8ff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {demo.label}
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
      <div style={infoBoxStyles}>
        <div style={infoTitleStyles}>{activeDemo.label}</div>
        <div style={infoDescStyles}>{activeDemo.description}</div>
      </div>
    </div>
  );
}

export default App;
