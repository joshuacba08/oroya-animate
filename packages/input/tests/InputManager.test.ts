import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../src/InputManager';

/**
 * Drive the manager off a fake EventTarget so the tests don't depend on
 * a real DOM. Vitest provides `EventTarget` via happy-dom or jsdom; here
 * we lean on the built-in Node 18+ implementation to keep the suite zero-dep.
 */
function makeTarget(): EventTarget {
    return new EventTarget();
}

function fireKey(target: EventTarget, type: 'keydown' | 'keyup', code: string): void {
    target.dispatchEvent(Object.assign(new Event(type), { code }));
}

function fireMouse(target: EventTarget, type: 'mousedown' | 'mouseup', button: number): void {
    target.dispatchEvent(Object.assign(new Event(type), { button }));
}

describe('InputManager — keyboard', () => {
    let target: EventTarget;
    let input: InputManager;

    beforeEach(() => {
        target = makeTarget();
        input = new InputManager(target as unknown as Window);
        input.attach();
    });

    afterEach(() => input.detach());

    it('tracks key down/up state', () => {
        fireKey(target, 'keydown', 'KeyW');
        expect(input.isKeyDown('KeyW')).toBe(true);
        fireKey(target, 'keyup', 'KeyW');
        expect(input.isKeyDown('KeyW')).toBe(false);
    });

    it('fires action-down when a bound key transitions down', () => {
        input.bindAction('jump', [{ key: 'Space' }]);
        const handler = vi.fn();
        input.on('action-down', handler);

        fireKey(target, 'keydown', 'Space');
        expect(handler).toHaveBeenCalledWith({ name: 'jump' });
        expect(input.isActionActive('jump')).toBe(true);
    });

    it('does not refire action-down for repeats of the same physical key', () => {
        input.bindAction('jump', [{ key: 'Space' }]);
        const handler = vi.fn();
        input.on('action-down', handler);

        fireKey(target, 'keydown', 'Space');
        fireKey(target, 'keydown', 'Space'); // browser key-repeat — second event ignored
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('fires action-up when the last bound input releases', () => {
        input.bindAction('move-forward', [{ key: 'KeyW' }, { key: 'ArrowUp' }]);
        const ups: string[] = [];
        input.on('action-up', (e) => ups.push(e.name));

        fireKey(target, 'keydown', 'KeyW');
        fireKey(target, 'keydown', 'ArrowUp');
        fireKey(target, 'keyup', 'KeyW'); // still active via ArrowUp
        expect(ups).toEqual([]);
        fireKey(target, 'keyup', 'ArrowUp');
        expect(ups).toEqual(['move-forward']);
    });

    it('fires continuous `action` events during update() while held', () => {
        input.bindAction('shoot', [{ key: 'Space' }]);
        const calls: string[] = [];
        input.on('action', (e) => calls.push(e.name));

        fireKey(target, 'keydown', 'Space');
        input.update(0.016);
        input.update(0.016);
        input.update(0.016);
        expect(calls).toEqual(['shoot', 'shoot', 'shoot']);

        fireKey(target, 'keyup', 'Space');
        input.update(0.016);
        expect(calls).toEqual(['shoot', 'shoot', 'shoot']); // no more after release
    });

    it('clears keyboard state on blur', () => {
        fireKey(target, 'keydown', 'KeyA');
        expect(input.isKeyDown('KeyA')).toBe(true);
        target.dispatchEvent(new Event('blur'));
        expect(input.isKeyDown('KeyA')).toBe(false);
    });
});

describe('InputManager — mouse', () => {
    it('tracks mouse buttons and binds them to actions', () => {
        const target = makeTarget();
        const input = new InputManager(target as unknown as Window);
        input.attach();
        input.bindAction('fire', [{ mouseButton: 0 }]);

        const handler = vi.fn();
        input.on('action-down', handler);

        fireMouse(target, 'mousedown', 0);
        expect(input.isMouseButtonDown(0)).toBe(true);
        expect(handler).toHaveBeenCalledWith({ name: 'fire' });

        fireMouse(target, 'mouseup', 0);
        expect(input.isMouseButtonDown(0)).toBe(false);
        input.detach();
    });
});

describe('InputManager — bindings management', () => {
    it('replaces bindings when bindAction is called with the same name', () => {
        const target = makeTarget();
        const input = new InputManager(target as unknown as Window);
        input.attach();

        input.bindAction('action', [{ key: 'KeyA' }]);
        input.bindAction('action', [{ key: 'KeyB' }]);

        fireKey(target, 'keydown', 'KeyA');
        expect(input.isActionActive('action')).toBe(false);
        fireKey(target, 'keydown', 'KeyB');
        expect(input.isActionActive('action')).toBe(true);
        input.detach();
    });

    it('unbindAction stops the action from firing', () => {
        const target = makeTarget();
        const input = new InputManager(target as unknown as Window);
        input.attach();

        input.bindAction('jump', [{ key: 'Space' }]);
        input.unbindAction('jump');

        const handler = vi.fn();
        input.on('action-down', handler);
        fireKey(target, 'keydown', 'Space');
        expect(handler).not.toHaveBeenCalled();
        input.detach();
    });
});
