import {
  Box,
  Building2,
  ChevronRight,
  Cpu,
  FileCode2,
  LayoutGrid,
  MousePointerClick,
  Palette,
  Pen,
  RefreshCw,
  Sparkles,
  Sun,
  Target,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { DemoSceneDef, RendererType } from '../types';
import { RENDERER_META } from '../types';

/* ── Icon mapping ─────────────────────────────────────────────────────── */

const SCENE_ICONS: Record<string, LucideIcon> = {
  'interactive-demo': Sparkles,
  'hover-showcase': Target,
  'click-playground': MousePointerClick,
  'wheel-bubbling': RefreshCw,
  'hello-cube': Box,
  'color-palette': Palette,
  'solar-system': Sun,
  'shape-grid': LayoutGrid,
  'camera-viewpoints': Video,
  'procedural-city': Building2,
};

const RENDERER_ICONS: Record<RendererType, LucideIcon> = {
  three: Cpu,
  canvas: Pen,
  svg: FileCode2,
};

/* ── Styles ───────────────────────────────────────────────────────────── */

export const SIDEBAR_WIDTH = 260;

const sidebarStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  width: SIDEBAR_WIDTH,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, rgba(12,12,18,0.98) 0%, rgba(8,8,14,0.98) 100%)',
  borderRight: '1px solid rgba(255,255,255,0.06)',
  fontFamily: "'JetBrains Mono', monospace",
  overflow: 'hidden',
};

const logoAreaStyles: React.CSSProperties = {
  padding: '20px 20px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  flexShrink: 0,
};

const logoStyles: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
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
  color: 'rgba(255,255,255,0.55)',
};

const logoSubStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 400,
  color: 'rgba(255,255,255,0.2)',
  letterSpacing: '0.04em',
  marginTop: '4px',
};

const scrollAreaStyles: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '12px 0',
};

const sectionStyles: React.CSSProperties = {
  marginBottom: '8px',
};

const sectionHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 18px',
  cursor: 'default',
  userSelect: 'none',
};

const sectionLabelStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: "'Zalando Sans Expanded', sans-serif",
};

const sectionCountStyles: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.2)',
  marginLeft: 'auto',
};

const emptyStyles: React.CSSProperties = {
  padding: '10px 18px 10px 44px',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.15)',
  fontStyle: 'italic',
};

const itemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '8px 18px',
  border: 'none',
  background: 'transparent',
  color: 'rgba(255,255,255,0.45)',
  fontSize: '11.5px',
  fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'all 0.2s ease',
  borderLeft: '2px solid transparent',
};

const versionStyles: React.CSSProperties = {
  padding: '14px 20px',
  borderTop: '1px solid rgba(255,255,255,0.06)',
  fontSize: '10px',
  fontWeight: 400,
  color: 'rgba(255,255,255,0.15)',
  letterSpacing: '0.04em',
  flexShrink: 0,
};

/* ── Component ────────────────────────────────────────────────────────── */

interface SidebarProps {
  scenes: DemoSceneDef[];
  activeId: string;
  onSelect: (id: string) => void;
}

// Renderer display order
const RENDERER_ORDER: RendererType[] = ['three', 'canvas', 'svg'];

export function Sidebar({ scenes, activeId, onSelect }: SidebarProps) {
  // Group scenes by renderer
  const grouped = RENDERER_ORDER.map((renderer) => ({
    renderer,
    meta: RENDERER_META[renderer],
    Icon: RENDERER_ICONS[renderer],
    scenes: scenes.filter((s) => s.renderer === renderer),
  }));

  return (
    <div style={sidebarStyles}>
      {/* Logo */}
      <div style={logoAreaStyles}>
        <div style={logoStyles}>
          <span style={logoAccentStyles}>Oroya</span>
          <span style={logoDimStyles}>Animate</span>
        </div>
        <div style={logoSubStyles}>Scene Graph Engine</div>
      </div>

      {/* Scene list */}
      <div style={scrollAreaStyles} className="sidebar-scroll">
        {grouped.map(({ renderer, meta, Icon, scenes: group }) => (
          <div key={renderer} style={sectionStyles}>
            {/* Section header */}
            <div style={sectionHeaderStyles}>
              <Icon
                size={14}
                strokeWidth={1.8}
                style={{ color: meta.color, opacity: 0.7 }}
              />
              <span style={{ ...sectionLabelStyles, color: meta.color }}>
                {meta.label}
              </span>
              <span style={sectionCountStyles}>
                {group.length > 0 ? group.length : ''}
              </span>
            </div>

            {/* Items */}
            {group.length === 0 ? (
              <div style={emptyStyles}>Próximamente</div>
            ) : (
              group.map((demo) => {
                const isActive = demo.id === activeId;
                const SceneIcon = SCENE_ICONS[demo.id] ?? ChevronRight;
                return (
                  <button
                    key={demo.id}
                    className="sidebar-item"
                    onClick={() => onSelect(demo.id)}
                    style={{
                      ...itemStyles,
                      color: isActive ? '#a0b8ff' : 'rgba(255,255,255,0.45)',
                      background: isActive
                        ? 'rgba(108,138,255,0.08)'
                        : 'transparent',
                      borderLeftColor: isActive
                        ? '#6c8aff'
                        : 'transparent',
                    }}
                  >
                    <SceneIcon
                      size={15}
                      strokeWidth={1.8}
                      style={{
                        opacity: isActive ? 1 : 0.5,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {demo.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={versionStyles}>oroya-animate v0.1</div>
    </div>
  );
}
