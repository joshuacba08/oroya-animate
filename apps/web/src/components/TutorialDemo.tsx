import { useEffect, useRef, useState, useCallback } from "react";
import type { Scene } from "@joroya/core";
import { Camera, CameraType, ComponentType } from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";
import { renderToSVG } from "@joroya/renderer-svg";
import type { SvJs } from "@joroya/renderer-svg";
import { EXAMPLES } from "./examples/scenes";
import type { ExampleDef } from "./examples/ExampleCard";

const TUTORIAL_SCENE_MAP: Record<string, string> = {
  "01-hello-cube": "hello-cube",
  "02-color-palette": "color-palette",
  "04-solar-system": "solar-system",
  "05-svg-generative-art": "svjs-generative",
  "06-cameras-viewpoints": "camera-viewpoints",
  "07-procedural-city": "procedural-city",
  "09-svg-gradients-filters": "svg-showcase",
  "10-svg-animations": "svg-animations",
  "11-svg-interactive": "svg-interactive",
  "12-keyframe-animation": "interpolation-comparison",
  "13-3d-interactivity": "interactive-cubes",
};

interface Props {
  tutorialId: string;
}

export default function TutorialDemo({ tutorialId }: Props) {
  const [restartKey, setRestartKey] = useState(0);

  const sceneId = TUTORIAL_SCENE_MAP[tutorialId];
  const example = sceneId ? EXAMPLES.find((e) => e.id === sceneId) : null;

  if (!example) {
    return (
      <div className="tutorial-demo-wrapper rounded-2xl overflow-hidden border border-base-300/30">
        <div className="w-full aspect-video renderer-preview flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/30">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="m10 8 6 4-6 4Z" />
            </svg>
            <span className="text-sm text-base-content/40 font-mono">
              Demo no disponible
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tutorial-demo-wrapper rounded-2xl overflow-hidden border border-base-300/30">
      <DemoPlayer key={restartKey} example={example} onRestart={() => setRestartKey((k) => k + 1)} />
    </div>
  );
}

/* ── Demo Player ────────────────────────────────────────────────────── */

interface DemoPlayerProps {
  example: ExampleDef;
  onRestart: () => void;
}

function DemoPlayer({ example, onRestart }: DemoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);

  const is3D = example.category === "3d";
  const isSvJs = example.category === "svjs";

  useEffect(() => {
    let disposed = false;

    try {
      const { scene, animate } = example.factory();

      if (is3D) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const width = container.clientWidth || 640;
        const height = container.clientHeight || 360;

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
        setIsLoaded(true);

        const loop = (time: number) => {
          if (disposed) return;
          if (!pausedRef.current) {
            try {
              animate(time * 0.001);
              renderer.render();
            } catch { /* swallow */ }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } else if (isSvJs) {
        const container = svgContainerRef.current;
        if (!container) return;

        const svjs = scene as unknown as SvJs;
        if (!svjs.element) throw new Error("Not a valid SvJs instance");

        container.innerHTML = "";
        container.appendChild(svjs.element);
        svjs.set({ width: "100%", height: "100%" });
        setIsLoaded(true);

        const loop = (time: number) => {
          if (disposed) return;
          if (!pausedRef.current) {
            try { animate(time * 0.001); } catch { /* swallow */ }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } else {
        const container = svgContainerRef.current;
        if (!container) return;

        const svgString = renderToSVG(scene as Scene, { width: 1000, height: 1000 });
        container.innerHTML = svgString;
        const svgEl = container.querySelector("svg");
        if (svgEl) {
          svgEl.style.width = "100%";
          svgEl.style.height = "100%";
        }
        setIsLoaded(true);
      }
    } catch (e) {
      console.error("[TutorialDemo]", e);
      setHasError(true);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafRef.current);
      try { rendererRef.current?.dispose(); } catch { /* safe */ }
      rendererRef.current = null;
    };
  }, [example, is3D, isSvJs]);

  useEffect(() => {
    const wrapper = wrapperRef.current?.closest(".tutorial-demo-wrapper");
    if (!wrapper) return;

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      pausedRef.current = p;
      return !p;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wrapper = wrapperRef.current?.closest(".tutorial-demo-wrapper");
    if (!wrapper) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapper.requestFullscreen();
    }
  }, []);

  if (hasError) {
    return (
      <>
        <div className="w-full aspect-video renderer-preview flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-error/60">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-sm text-base-content/40">Error al cargar la demo</span>
          </div>
        </div>
        <ControlsBar
          isPlaying={false}
          isFullscreen={false}
          onTogglePlay={() => {}}
          onRestart={onRestart}
          onToggleFullscreen={() => {}}
          category={example.category}
        />
      </>
    );
  }

  return (
    <>
      <div ref={wrapperRef}>
        <div
          ref={containerRef}
          className={`relative w-full renderer-preview ${isFullscreen ? "h-[calc(100vh-48px)]" : "aspect-video"}`}
        >
          {/* Loading spinner */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-base-content/40 font-mono">Cargando demo...</span>
              </div>
            </div>
          )}

          {is3D ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: isLoaded ? "block" : "none" }}
            />
          ) : (
            <div
              ref={svgContainerRef}
              className="w-full h-full flex items-center justify-center"
              style={{ display: isLoaded ? "flex" : "none" }}
            />
          )}

          {/* Paused overlay */}
          {isLoaded && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-base-100/90 backdrop-blur-sm flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-primary ml-1">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <ControlsBar
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        onTogglePlay={togglePlay}
        onRestart={onRestart}
        onToggleFullscreen={toggleFullscreen}
        category={example.category}
      />
    </>
  );
}

/* ── Controls Bar ───────────────────────────────────────────────────── */

interface ControlsBarProps {
  isPlaying: boolean;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onToggleFullscreen: () => void;
  category: string;
}

function ControlsBar({
  isPlaying,
  isFullscreen,
  onTogglePlay,
  onRestart,
  onToggleFullscreen,
  category,
}: ControlsBarProps) {
  const categoryLabel = category === "3d" ? "Three.js" : category === "svg" ? "SVG" : "SvJs";
  const categoryBadge =
    category === "3d"
      ? "badge-primary"
      : category === "svg"
        ? "badge-success"
        : "badge-secondary";

  return (
    <div className="tutorial-demo-controls flex items-center gap-1.5 px-3 py-2">
      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        className="btn btn-ghost btn-xs btn-square rounded-lg"
        title={isPlaying ? "Pausar" : "Reproducir"}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Restart */}
      <button
        onClick={onRestart}
        className="btn btn-ghost btn-xs btn-square rounded-lg"
        title="Reiniciar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-base-content/10 mx-1" />

      {/* Category badge */}
      <span className={`badge badge-xs font-mono ${categoryBadge}`}>
        {categoryLabel}
      </span>

      <div className="flex-1" />

      {/* Label */}
      <span className="text-xs text-base-content/40 font-display tracking-wide hidden sm:inline">
        Resultado final
      </span>

      <div className="flex-1" />

      {/* Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        className="btn btn-ghost btn-xs btn-square rounded-lg"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        )}
      </button>
    </div>
  );
}
