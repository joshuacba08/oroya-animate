import { Scene } from '@oroya/core';
import { ThreeRenderer } from '@oroya/renderer-three';
import { useEffect, useRef } from 'react';

interface OroyaCanvasProps {
  scene: Scene;
}

export function OroyaCanvas({ scene }: OroyaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const renderer = new ThreeRenderer({
      canvas: canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    });
    renderer.mount(scene);
    rendererRef.current = renderer;

    let animationFrameId: number;

    const animate = (time: number) => {
      time *= 0.001; // convert time to seconds
      const boxNode = scene.findNodeByName('rotating-box-react');
      
      if (boxNode) {
        const { transform } = boxNode;
        const speed = 0.4;
        transform.rotation.x = Math.cos(time * speed);
        transform.rotation.y = Math.sin(time * speed);
        transform.updateLocalMatrix(); // Mark the transform as dirty
      }
      
      renderer.render();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [scene]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

