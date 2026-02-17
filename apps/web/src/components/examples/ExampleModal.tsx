import { useEffect, useCallback, useRef } from "react";
import {
  DemoRenderer,
  getBadgeColor,
  getCategoryLabel,
  type ExampleDef,
} from "./ExampleCard";

interface ExampleModalProps {
  example: ExampleDef;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ExampleModal({
  example,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ExampleModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
      if (e.key === "ArrowRight" && hasNext) onNext?.();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "3d":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case "svg":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        );
      case "svjs":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getCategoryDescription = (cat: string) => {
    switch (cat) {
      case "3d":
        return "Renderizado con Three.js — WebGL 3D interactivo";
      case "svg":
        return "Renderizado SVG via renderToSVG() — gráficos vectoriales estáticos";
      case "svjs":
        return "Renderizado con SvJs — SVG generativo e interactivo";
      default:
        return "";
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={example.title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] glass-card rounded-3xl overflow-hidden flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-300/40">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`badge badge-sm font-mono gap-1.5 ${getBadgeColor(example.category)}`}>
              {getCategoryIcon(example.category)}
              {getCategoryLabel(example.category)}
            </span>
            <h2 className="font-display font-bold text-xl truncate">
              {example.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Nav arrows */}
            <button
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              disabled={!hasPrev}
              className="btn btn-ghost btn-sm btn-circle disabled:opacity-30"
              aria-label="Anterior"
              title="Anterior (←)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              disabled={!hasNext}
              className="btn btn-ghost btn-sm btn-circle disabled:opacity-30"
              aria-label="Siguiente"
              title="Siguiente (→)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            {/* Close */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="btn btn-ghost btn-sm btn-circle ml-1"
              aria-label="Cerrar"
              title="Cerrar (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            {/* Demo area */}
            <div className="lg:flex-1 min-h-0">
              <div className="relative bg-base-300/30 aspect-square lg:aspect-auto lg:h-full min-h-[320px]">
                <DemoRenderer key={example.id} example={example} eager />
              </div>
            </div>

            {/* Info panel */}
            <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-base-300/40 p-6 flex flex-col gap-5">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-2">
                  Descripción
                </h3>
                <p className="text-base-content/70 leading-relaxed text-sm">
                  {example.description}
                </p>
              </div>

              {/* Category info */}
              <div>
                <h3 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider mb-2">
                  Renderer
                </h3>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0 text-base-content/50">
                    {getCategoryIcon(example.category)}
                  </div>
                  <p className="text-base-content/60 text-sm leading-relaxed">
                    {getCategoryDescription(example.category)}
                  </p>
                </div>
              </div>

              {/* Interactions hint */}
              <div className="mt-auto">
                <div className="rounded-xl bg-base-200/50 p-4">
                  <h4 className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
                    Controles
                  </h4>
                  <ul className="text-xs text-base-content/50 space-y-1.5">
                    {example.category === "3d" && (
                      <>
                        <li className="flex items-center gap-2">
                          <kbd className="kbd kbd-xs">Mouse</kbd>
                          <span>Interactuar con la escena</span>
                        </li>
                      </>
                    )}
                    {example.category === "svjs" && (
                      <li className="flex items-center gap-2">
                        <kbd className="kbd kbd-xs">Mouse</kbd>
                        <span>Interacción del cursor</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <kbd className="kbd kbd-xs">←</kbd>
                      <kbd className="kbd kbd-xs">→</kbd>
                      <span>Navegar demos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <kbd className="kbd kbd-xs">Esc</kbd>
                      <span>Cerrar</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-in {
          animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
