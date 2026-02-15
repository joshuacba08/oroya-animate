import { Scene } from '@oroya/core';
import { renderToSVGElement } from '@oroya/renderer-svg';
import { useEffect, useRef, useCallback } from 'react';

export type AnimateCallback = (time: number, scene: Scene) => void;

interface OroyaSvgProps {
  scene: Scene;
  onAnimate?: AnimateCallback;
}

/**
 * React component that renders an Oroya Scene using the SVG renderer.
 * Produces a live SVG DOM element with support for native SVG animations
 * and interactive event delegation.
 */
export function OroyaSvg({ scene, onAnimate }: OroyaSvgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onAnimateRef = useRef<AnimateCallback | undefined>(onAnimate);
  const disposeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onAnimateRef.current = onAnimate;
  }, [onAnimate]);

  const rebuildSvg = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dispose previous SVG element
    if (disposeRef.current) {
      disposeRef.current();
      disposeRef.current = null;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const { dispose } = renderToSVGElement(scene, {
      width,
      height,
      container,
    });

    disposeRef.current = dispose;
  }, [scene]);

  useEffect(() => {
    if (!containerRef.current) return;

    rebuildSvg();

    // If the scene has animations driven by JS, run an animation loop
    // that periodically re-renders the SVG.
    let animationFrameId: number;
    let running = true;

    const animate = (time: number) => {
      if (!running) return;
      const t = time * 0.001;
      const cb = onAnimateRef.current;

      if (cb) {
        cb(t, scene);
        rebuildSvg();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Only start the loop if there's an animate callback
    if (onAnimateRef.current) {
      animationFrameId = requestAnimationFrame(animate);
    }

    const handleResize = () => rebuildSvg();
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (disposeRef.current) {
        disposeRef.current();
        disposeRef.current = null;
      }
    };
  }, [scene, rebuildSvg]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    />
  );
}
