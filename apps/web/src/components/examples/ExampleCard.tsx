import { useEffect, useRef, useState } from "react";
import { Camera, CameraType, ComponentType, type Scene } from "@joroya/core";
import type { ThreeRenderer } from "@joroya/renderer-three";
import type { SvJs } from "@joroya/renderer-svg";

export interface ExampleResult {
  scene: Scene | SvJs;
  animate: (time: number) => void;
  dispose?: () => void;
}
export interface ExampleDef {
  id: string;
  title: string;
  description: string;
  category: "3d" | "svg" | "svjs";
  factory: () => Promise<ExampleResult>;
}
interface RendererProps { example: ExampleDef; eager?: boolean }

export function DemoRenderer({ example, eager = false }: RendererProps) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    if (eager || !host.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { threshold: 0.1 });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [eager]);
  useEffect(() => {
    if (!visible || !host.current) return;
    const container = host.current;
    let abandoned = false, frame = 0;
    let renderer: ThreeRenderer | undefined;
    let release: (() => void) | undefined;
    setStatus("loading");
    void (async () => {
      try {
        const result = await example.factory();
        release = result.dispose;
        if (abandoned) { release?.(); release = undefined; return; }
        if (example.category === "3d") {
          const { ThreeRenderer } = await import("@joroya/renderer-three");
          if (abandoned) { release?.(); release = undefined; return; }
          if (!("root" in result.scene)) throw new Error("Expected scene graph");
          const scene = result.scene;
          const canvas = document.createElement("canvas");
          canvas.style.cssText = "width:100%;height:100%;display:block";
          container.appendChild(canvas);
          const width = container.clientWidth || 300, height = container.clientHeight || 300;
          scene.traverse((node) => {
            const camera = node.getComponent<Camera>(ComponentType.Camera);
            if (camera?.definition.type === CameraType.Perspective) camera.definition.aspect = width / height;
          });
          renderer = new ThreeRenderer({ canvas, width, height });
          renderer.mount(scene);
          renderer.enableInteraction();
          let previous = performance.now() * 0.001;
          const loop = (time: number) => {
            if (abandoned) return;
            try {
              const seconds = time * 0.001;
              result.animate(seconds);
              renderer!.render(Math.max(0, Math.min(seconds - previous, 0.1)));
              previous = seconds;
              frame = requestAnimationFrame(loop);
            } catch (error) { console.error(error); setStatus("error"); }
          };
          frame = requestAnimationFrame(loop);
        } else if (example.category === "svjs") {
          if (!("element" in result.scene)) throw new Error("Expected SvJs");
          const svg = result.scene;
          container.appendChild(svg.element); svg.set({ width: "100%", height: "100%" });
          const loop = (time: number) => {
            if (abandoned) return;
            result.animate(time * 0.001); frame = requestAnimationFrame(loop);
          };
          frame = requestAnimationFrame(loop);
        } else {
          const { renderToSVGElement } = await import("@joroya/renderer-svg");
          if (abandoned) return;
          if (!("root" in result.scene)) throw new Error("Expected scene graph");
          const { svg, dispose } = renderToSVGElement(result.scene, { width: 1000, height: 1000 });
          const releaseFactory = release;
          release = () => { dispose(); releaseFactory?.(); };
          container.appendChild(svg); svg.style.width = "100%"; svg.style.height = "100%";
        }
        if (!abandoned) setStatus("ready");
      } catch (error) { if (!abandoned) { console.error(error); setStatus("error"); } }
    })();
    return () => {
      abandoned = true; cancelAnimationFrame(frame);
      renderer?.dispose(); release?.(); release = undefined; container.replaceChildren();
    };
  }, [visible, example]);
  return <div className="relative w-full h-full">
    <div ref={host} className="w-full h-full flex items-center justify-center" />
    {status !== "ready" && <div role="status" className="absolute inset-0 flex items-center justify-center text-sm text-base-content/40 pointer-events-none">
      {status === "error" ? "Error loading example" : "Loading example…"}
    </div>}
  </div>;
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
