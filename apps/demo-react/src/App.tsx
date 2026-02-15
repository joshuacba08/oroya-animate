import { useCallback, useMemo, useRef, useState } from 'react';
import { OroyaCanvas } from './OroyaCanvas';
import { OroyaSvg } from './OroyaSvg';
import { ControlPanel } from './components/ControlPanel';
import { Sidebar, SIDEBAR_WIDTH } from './components/Sidebar';
import { DEMO_SCENES } from './scenes';
import type { ParamValues } from './types';
import { getDefaultParams, RENDERER_META } from './types';

/* ── Styles ───────────────────────────────────────────────────────────── */

const containerStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#0a0a10',
  color: 'white',
  fontFamily: "'JetBrains Mono', monospace",
  display: 'flex',
  overflow: 'hidden',
};

const mainAreaStyles: React.CSSProperties = {
  flex: 1,
  marginLeft: SIDEBAR_WIDTH,
  position: 'relative',
  overflow: 'hidden',
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
  boxShadow:
    '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const infoTitleStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  marginBottom: '6px',
  fontFamily: "'Zalando Sans Expanded', sans-serif",
  letterSpacing: '-0.01em',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
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
  marginLeft: '4px',
  border: '1px solid',
  textTransform: 'uppercase',
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

  const meta = RENDERER_META[activeDemo.renderer];

  return (
    <div style={containerStyles}>
      {/* Sidebar */}
      <Sidebar
        scenes={DEMO_SCENES}
        activeId={activeId}
        onSelect={handleSwitchDemo}
      />

      {/* Main canvas area */}
      <div style={mainAreaStyles}>
        {/* Renderer — Three.js canvas or SVG element */}
        {activeDemo.renderer === 'svg' ? (
          <OroyaSvg
            key={`${activeId}-${buildKey}`}
            scene={scene}
            onAnimate={onAnimate}
          />
        ) : (
          <OroyaCanvas
            key={`${activeId}-${buildKey}`}
            scene={scene}
            onAnimate={onAnimate}
          />
        )}

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
                color: meta.color,
                borderColor: `${meta.color}33`,
                backgroundColor: `${meta.color}12`,
              }}
            >
              {meta.label}
            </span>
          </div>
          <div style={infoDescStyles}>{activeDemo.description}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
