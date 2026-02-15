import { useState, useMemo, useCallback } from 'react';
import { OroyaCanvas } from './OroyaCanvas';
import { DEMO_SCENES } from './scenes';

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

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
  padding: '16px 24px',
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
  gap: '6px',
  pointerEvents: 'auto',
};

const navButtonBase: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid transparent',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
};

const infoBoxStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: '24px',
  left: '24px',
  zIndex: 10,
  maxWidth: '420px',
  padding: '16px 20px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const infoTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '6px',
};

const infoDescStyles: React.CSSProperties = {
  fontSize: '13px',
  lineHeight: 1.5,
  color: 'rgba(255,255,255,0.6)',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function App() {
  const [activeId, setActiveId] = useState(DEMO_SCENES[0].id);

  const activeDemo = DEMO_SCENES.find((d) => d.id === activeId)!;

  // Recreate the scene only when the active demo changes
  const { scene, animate } = useMemo(() => activeDemo.factory(), [activeDemo]);

  // Stable animate ref so OroyaCanvas doesn't re-mount on every render
  const onAnimate = useCallback(animate, [animate]);

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
                  ...navButtonBase,
                  background: isActive
                    ? 'rgba(108,138,255,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  borderColor: isActive
                    ? 'rgba(108,138,255,0.4)'
                    : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#a0b8ff' : 'rgba(255,255,255,0.55)',
                }}
              >
                {demo.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Canvas */}
      <OroyaCanvas key={activeId} scene={scene} onAnimate={onAnimate} />

      {/* Info panel */}
      <div style={infoBoxStyles}>
        <div style={infoTitleStyles}>{activeDemo.label}</div>
        <div style={infoDescStyles}>{activeDemo.description}</div>
      </div>
    </div>
  );
}

export default App;
