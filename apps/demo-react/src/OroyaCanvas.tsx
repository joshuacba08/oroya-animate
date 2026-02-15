import { Scene, Camera, CameraType, ComponentType } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';
import { useEffect, useRef, useCallback } from 'react';

export type AnimateCallback = (time: number, scene: Scene) => void;

interface OroyaCanvasProps {
  scene: Scene;
  onAnimate?: AnimateCallback;
}

export function OroyaCanvas({ scene, onAnimate }: OroyaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const onAnimateRef = useRef<AnimateCallback | undefined>(onAnimate);

  // Keep the callback ref in sync without re-triggering the effect
  useEffect(() => {
    onAnimateRef.current = onAnimate;
  }, [onAnimate]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Update camera aspect ratio on resize
    const cameraNode = scene.root.children.find(
      (n) => n.hasComponent(ComponentType.Camera)
    );
    if (cameraNode) {
      const cam = cameraNode.getComponent<Camera>(ComponentType.Camera)!;
      if (cam.definition.type === CameraType.Perspective) {
        cam.definition.aspect = width / height;
      }
    }
  }, [scene]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new ThreeRenderer({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
    renderer.mount(scene);
    renderer.enableInteraction();
    rendererRef.current = renderer;

    // Fix camera aspect ratio on mount (scenes use window.innerWidth which
    // doesn't account for the sidebar).
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;

    const animate = (time: number) => {
      const t = time * 0.001; // convert to seconds
      onAnimateRef.current?.(t, scene);
      renderer.render();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [scene, handleResize]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

