import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import type { Scene } from "@joroya/core";
import { Camera, CameraType, ComponentType } from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";
import { renderToSVG, SvJs } from "@joroya/renderer-svg";

export interface ExampleDef {
  id: string;
  title: string;
  description: string;
  category: "3d" | "svg" | "svjs";
  factory: () => {
    scene: Scene | SvJs;
    animate: (time: number) => void;
  };
}

/* ── Error Boundary ───────────────────────────────────────────────────── */

interface EBProps { children: ReactNode; fallback?: ReactNode }
interface EBState { hasError: boolean }

class RendererErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) { console.error("[RendererErrorBoundary]", err); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
          Error loading example
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Renderer props ───────────────────────────────────────────────────── */

interface RendererProps {
  example: ExampleDef;
  eager?: boolean;
}

/* ── Three.js Renderer ────────────────────────────────────────────────── */

export function ThreeRenderer3D({ example, eager }: RendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(eager ?? false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (eager) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    let disposed = false;

    try {
      const canvas = canvasRef.current;
      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 300;

      const { scene, animate } = example.factory();

      if (!(scene as any).root) throw new Error("Not a 3D scene");
      const threeScene = scene as Scene;

      const cameraNode = threeScene.root.children.find((n) =>
        n.hasComponent(ComponentType.Camera)
      );
      if (cameraNode) {
        const cam = cameraNode.getComponent<Camera>(ComponentType.Camera)!;
        if (cam.definition.type === CameraType.Perspective) {
          cam.definition.aspect = width / height;
        }
      }

      const renderer = new ThreeRenderer({ canvas, width, height });
      renderer.mount(threeScene);
      rendererRef.current = renderer;

      const loop = (time: number) => {
        if (disposed) return;
        try {
          const t = time * 0.001;
          animate(t);
          renderer.render();
        } catch { /* swallow animation errors */ }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error(e);
      setHasError(true);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      try { rendererRef.current?.dispose(); } catch { /* safe */ }
      rendererRef.current = null;
    };
  }, [isVisible, example]);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
        Error loading example
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

/* ── SVG Renderer ─────────────────────────────────────────────────────── */

export function SvgRenderer({ example, eager }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(eager ?? false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (eager) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    try {
      const { scene } = example.factory();
      if (!(scene as any).root) throw new Error("Not a Scene graph");

      const size = 1000;
      const svgString = renderToSVG(scene as Scene, {
        width: size,
        height: size,
      });
      containerRef.current.innerHTML = svgString;

      const svgEl = containerRef.current.querySelector("svg");
      if (svgEl) {
        svgEl.style.width = "100%";
        svgEl.style.height = "100%";
      }
    } catch (e) {
      console.error(e);
      setHasError(true);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [isVisible, example]);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
        Error loading example
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
    />
  );
}

/* ── SvJs Renderer ────────────────────────────────────────────────────── */

export function SvJsRenderer({ example, eager }: RendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [isVisible, setIsVisible] = useState(eager ?? false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (eager) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    let disposed = false;

    try {
      const { scene, animate } = example.factory();
      const svjs = scene as any as SvJs;

      if (!svjs.element) throw new Error("Not a valid SvJs instance");

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(svjs.element);

      svjs.set({ width: '100%', height: '100%' });

      const loop = (time: number) => {
        if (disposed) return;
        try {
          const t = time * 0.001;
          animate(t);
        } catch { /* swallow animation errors */ }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error(e);
      setHasError(true);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      try { if (containerRef.current) containerRef.current.innerHTML = ''; } catch { /* safe */ }
    };
  }, [isVisible, example]);

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
        Error loading example
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
    />
  );
}

/* ── DemoRenderer (with error boundary) ───────────────────────────────── */

export function DemoRenderer({ example, eager }: RendererProps) {
  const inner = (() => {
    if (example.category === "svg") return <SvgRenderer example={example} eager={eager} />;
    if (example.category === "svjs") return <SvJsRenderer example={example} eager={eager} />;
    return <ThreeRenderer3D example={example} eager={eager} />;
  })();

  return <RendererErrorBoundary key={example.id}>{inner}</RendererErrorBoundary>;
}

export function getBadgeColor(cat: string) {
  switch (cat) {
    case '3d': return 'badge-primary';
    case 'svg': return 'badge-success';
    case 'svjs': return 'badge-secondary';
    default: return 'badge-neutral';
  }
}

export function getCategoryLabel(cat: string) {
  switch (cat) {
    case '3d': return 'Three.js';
    case 'svg': return 'SVG';
    case 'svjs': return 'SvJs';
    default: return cat;
  }
}

interface ExampleCardProps {
  example: ExampleDef;
  onClick?: () => void;
}

export function ExampleCard({ example, onClick }: ExampleCardProps) {
  return (
    <div
      className="group glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
    >
      <div className="relative aspect-square bg-base-300/30">
        <DemoRenderer example={example} />
        <div className="absolute top-3 right-3">
          <span
            className={`badge badge-sm font-mono ${getBadgeColor(example.category)}`}
          >
            {getCategoryLabel(example.category)}
          </span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-base-content/0 group-hover:bg-base-content/10 transition-colors duration-300 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-base-100/90 backdrop-blur-sm text-base-content text-sm font-medium px-4 py-2 rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
            Abrir demo
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg mb-1.5">
          {example.title}
        </h3>
        <p className="text-sm text-base-content/50 leading-relaxed line-clamp-2">
          {example.description}
        </p>
      </div>
    </div>
  );
}
