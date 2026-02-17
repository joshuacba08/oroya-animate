import { useEffect, useRef, useState, useCallback } from "react";
import type { Scene } from "@joroya/core";
import { Camera, CameraType, ComponentType } from "@joroya/core";
import { ThreeRenderer } from "@joroya/renderer-three";

interface SceneResult {
  scene: Scene;
  animate: (time: number) => void;
  cameraNode?: import("@joroya/core").Node;
}

interface LiveDemoProps {
  /** Factory that creates the scene + animation loop */
  createScene: (aspect: number) => SceneResult;
  /** CSS class for the container */
  className?: string;
}

export default function LiveDemo({ createScene, className = "" }: LiveDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  const sceneRef = useRef<SceneResult | null>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !sceneRef.current) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;

    // Update camera aspect
    const cameraNode = sceneRef.current.cameraNode;
    if (cameraNode) {
      const cam = cameraNode.getComponent<Camera>(ComponentType.Camera);
      if (cam && cam.definition.type === CameraType.Perspective) {
        cam.definition.aspect = aspect;
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const result = createScene(width / height);
    sceneRef.current = result;

    const renderer = new ThreeRenderer({ canvas, width, height });
    renderer.mount(result.scene);
    rendererRef.current = renderer;

    setLoaded(true);

    window.addEventListener("resize", handleResize);

    let frameId: number;
    const loop = (time: number) => {
      const t = time * 0.001;
      result.animate(t);
      renderer.render();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
    };
  }, [createScene, handleResize]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-300/30 rounded-2xl animate-pulse">
          <span className="text-sm text-base-content/40 font-mono">
            Loading 3D scene...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-2xl"
        style={{ display: loaded ? "block" : "none" }}
      />
    </div>
  );
}
