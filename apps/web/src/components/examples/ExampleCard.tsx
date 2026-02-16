import { useEffect, useRef, useState } from "react";
import type { Scene } from "@oroya/core";
import { Camera, CameraType, ComponentType } from "@oroya/core";
import { ThreeRenderer } from "@oroya/renderer-three";

export interface ExampleDef {
  id: string;
  title: string;
  description: string;
  category: "3d" | "svg";
  factory: () => {
    scene: Scene;
    animate: (time: number) => void;
  };
}

interface ExampleCardProps {
  example: ExampleDef;
}

export function ExampleCard({ example }: ExampleCardProps) {
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

      const cameraNode = scene.root.children.find((n) =>
        n.hasComponent(ComponentType.Camera)
      );
      if (cameraNode) {
        const cam = cameraNode.getComponent<Camera>(ComponentType.Camera)!;
        if (cam.definition.type === CameraType.Perspective) {
          cam.definition.aspect = width / height;
        }
      }

      const renderer = new ThreeRenderer({ canvas, width, height });
      renderer.mount(scene);
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
    } catch {
      setHasError(true);
    }
  }, [isVisible, example]);

  return (
    <div className="group glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]">
      <div className="relative aspect-video bg-base-300/30">
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center text-base-content/40 text-sm">
            Error loading example
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`badge badge-sm font-mono ${
              example.category === "3d"
                ? "badge-primary"
                : "badge-success"
            }`}
          >
            {example.category === "3d" ? "Three.js" : "SVG"}
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
