import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/events/EventEmitter';

interface TestEvents {
    click: { x: number; y: number };
    resize: { width: number; height: number };
}

describe('EventEmitter', () => {
    it('should invoke handler on emit', () => {
        const emitter = new EventEmitter<TestEvents>();
        const handler = vi.fn();

        emitter.on('click', handler);
        emitter.emit('click', { x: 10, y: 20 });

        expect(handler).toHaveBeenCalledOnce();
        expect(handler).toHaveBeenCalledWith({ x: 10, y: 20 });
    });

    it('should support multiple handlers for the same event', () => {
        const emitter = new EventEmitter<TestEvents>();
        const h1 = vi.fn();
        const h2 = vi.fn();

        emitter.on('click', h1);
        emitter.on('click', h2);
        emitter.emit('click', { x: 1, y: 2 });

        expect(h1).toHaveBeenCalledOnce();
        expect(h2).toHaveBeenCalledOnce();
    });

    it('should not invoke handler after off()', () => {
        const emitter = new EventEmitter<TestEvents>();
        const handler = vi.fn();

        emitter.on('click', handler);
        emitter.off('click', handler);
        emitter.emit('click', { x: 0, y: 0 });

        expect(handler).not.toHaveBeenCalled();
    });

    it('should not add the same handler twice (Set behavior)', () => {
        const emitter = new EventEmitter<TestEvents>();
        const handler = vi.fn();

        emitter.on('click', handler);
        emitter.on('click', handler); // duplicate
        emitter.emit('click', { x: 0, y: 0 });

        expect(handler).toHaveBeenCalledOnce();
    });

    it('removeAllListeners clears everything', () => {
        const emitter = new EventEmitter<TestEvents>();
        const h1 = vi.fn();
        const h2 = vi.fn();

        emitter.on('click', h1);
        emitter.on('resize', h2);
        emitter.removeAllListeners();
        emitter.emit('click', { x: 0, y: 0 });
        emitter.emit('resize', { width: 0, height: 0 });

        expect(h1).not.toHaveBeenCalled();
        expect(h2).not.toHaveBeenCalled();
    });

    it('hasListeners returns correct state', () => {
        const emitter = new EventEmitter<TestEvents>();
        const handler = vi.fn();

        expect(emitter.hasListeners('click')).toBe(false);
        emitter.on('click', handler);
        expect(emitter.hasListeners('click')).toBe(true);
        emitter.off('click', handler);
        expect(emitter.hasListeners('click')).toBe(false);
    });

    it('emitting an event with no listeners does not throw', () => {
        const emitter = new EventEmitter<TestEvents>();
        expect(() => emitter.emit('click', { x: 0, y: 0 })).not.toThrow();
    });
});
