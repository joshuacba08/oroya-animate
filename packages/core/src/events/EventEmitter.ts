/**
 * A generic, type-safe event emitter.
 *
 * Uses a `Set` for handlers to prevent duplicates and provide O(1) add/remove.
 * Parameterized by an `EventMap` record so that `on()`, `off()`, and `emit()`
 * are fully typed — IDE autocompletion works for both event names and payloads.
 *
 * @example
 * ```ts
 * interface MyEvents {
 *   click: { x: number; y: number };
 *   resize: { width: number; height: number };
 * }
 *
 * const emitter = new EventEmitter<MyEvents>();
 * emitter.on('click', (e) => console.log(e.x, e.y));
 * emitter.emit('click', { x: 10, y: 20 });
 * ```
 */

type EventHandler<T> = (event: T) => void;

export class EventEmitter<EventMap extends Record<string, any>> {
    private listeners = new Map<keyof EventMap, Set<EventHandler<any>>>();

    /**
     * Register a handler for the given event type.
     * If the same handler is registered twice for the same type, it is stored only once.
     */
    on<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void {
        let set = this.listeners.get(type);
        if (!set) {
            set = new Set();
            this.listeners.set(type, set);
        }
        set.add(handler);
    }

    /**
     * Remove a previously registered handler.
     */
    off<K extends keyof EventMap>(type: K, handler: EventHandler<EventMap[K]>): void {
        const set = this.listeners.get(type);
        if (set) {
            set.delete(handler);
            if (set.size === 0) {
                this.listeners.delete(type);
            }
        }
    }

    /**
     * Invoke all handlers registered for the given event type.
     * Handlers are called synchronously in registration order.
     */
    emit<K extends keyof EventMap>(type: K, event: EventMap[K]): void {
        const set = this.listeners.get(type);
        if (set) {
            for (const handler of set) {
                handler(event);
            }
        }
    }

    /**
     * Remove all registered handlers for all event types.
     */
    removeAllListeners(): void {
        this.listeners.clear();
    }

    /**
     * Returns `true` if at least one handler is registered for the given type.
     */
    hasListeners<K extends keyof EventMap>(type: K): boolean {
        const set = this.listeners.get(type);
        return set !== undefined && set.size > 0;
    }
}
