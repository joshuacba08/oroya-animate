import { useEffect, useRef, useState } from "react";
import type { Scene } from "@oroya/core";
import { Camera, CameraType, ComponentType } from "@oroya/core";
import { ThreeRenderer } from "@oroya/renderer-three";
import { renderToSVG, SvJs } from "@oroya/renderer-svg";

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

interface ExampleCardProps {
  example: ExampleDef;
}

function ThreeCard({ example }: ExampleCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      const { scene, animate } = example.factory();

      // Ensure it's a 3D scene
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

      let animationFrameId: number;
      const loop = (time: number) => {
        const t = time * 0.001;
        animate(t);
        renderer.render();
        animationFrameId = requestAnimationFrame(loop);
      };
      animationFrameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        rendererRef.current = null;
      };
    } catch (e) {
      console.error(e);
      setHasError(true);
    }
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

function SvgCard({ example }: ExampleCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    try {
      const { scene } = example.factory();
      // Ensure it's a Scene (legacy SVG)
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

function SvJsCard({ example }: ExampleCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    try {
      const { scene, animate } = example.factory();
      const svjs = scene as any as SvJs; // Cast to SvJs

      if (!svjs.element) throw new Error("Not a valid SvJs instance");

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(svjs.element);

      // Ensure it fits
      svjs.set({ width: '100%', height: '100%' });

      let animationFrameId: number;
      // Some SvJs demos have internal animation loops (like InteractiveGalaxy), 
      // but others might rely on this loop. 
      // However, the factory pattern in web seems to return an 'animate' function meant to be called in RAF.
      // If the demo uses SvJs, it might or might not need external RAF.
      // We'll run it anyway.
      const loop = (time: number) => {
        const t = time * 0.001;
        animate(t);
        animationFrameId = requestAnimationFrame(loop);
      };
      animationFrameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animationFrameId);
        containerRef.current!.innerHTML = '';
      };
    } catch (e) {
      console.error(e);
      setHasError(true);
    }
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

export function ExampleCard({ example }: ExampleCardProps) {
  const getBadgeColor = (cat: string) => {
    switch (cat) {
      case '3d': return 'badge-primary';
      case 'svg': return 'badge-success';
      case 'svjs': return 'badge-secondary';
      default: return 'badge-neutral';
    }
  };

  const getLabel = (cat: string) => {
    switch (cat) {
      case '3d': return 'Three.js';
      case 'svg': return 'SVG';
      case 'svjs': return 'svgnx';
      default: return cat;
    }
  };

  return (
    <div className="group glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]">
      <div className="relative aspect-square bg-base-300/30">
        {example.category === "svg" ? (
          <SvgCard example={example} />
        ) : example.category === "svjs" ? (
          <SvJsCard example={example} />
        ) : (
          <ThreeCard example={example} />
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`badge badge-sm font-mono ${getBadgeColor(example.category)}`}
          >
            {getLabel(example.category)}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg mb-1.5">
          {example.title}
        </h3>
        <p className="text-sm text-base-content/50 leading-relaxed">
          {example.description}
        </p>
      </div>
    </div>
  );
}
