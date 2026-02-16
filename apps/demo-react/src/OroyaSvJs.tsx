import { useEffect, useRef } from 'react';
import type { SvJs } from '@oroya/renderer-svg';

interface OroyaSvJsProps {
    scene: SvJs; // The scene here is the SvJs root instance
    onAnimate?: (time: number) => void;
}

export function OroyaSvJs({ scene, onAnimate }: OroyaSvJsProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !scene) return;

        // Clear previous content
        container.innerHTML = '';

        // Append the SvJs element
        // SvJs.element is the native SVG element
        if (scene.element) {
            container.appendChild(scene.element);
        }

        // Re-size logic if needed, though SvJS usually handles viewBox
        // We might want to set width/height to 100% or similar
        scene.set({ width: '100%', height: '100%' });

        return () => {
            container.innerHTML = '';
            if (scene.delete) {
                // Optional cleanup if SvJs has it, though removing from DOM is usually enough
            }
        };
    }, [scene]);

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
