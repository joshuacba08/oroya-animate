import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../src';
afterEach(() => vi.unstubAllGlobals());
describe('gamepad action lifecycle', () => {
  it('delivers down/up and clears disconnected or blurred state', () => {
    const target = new EventTarget(); const manager = new InputManager(target as unknown as Window); manager.attach();
    let pressed = true; let connected = true;
    vi.stubGlobal('navigator', { getGamepads: () => [connected ? { buttons: [{ pressed }], axes: [] } : null] });
    manager.bindAction('jump', [{ gamepad: 'A' }]); const down = vi.fn(), up = vi.fn(); manager.on('action-down', down); manager.on('action-up', up);
    manager.update(0); expect(down).toHaveBeenCalledOnce(); pressed = false; manager.update(0); expect(up).toHaveBeenCalledOnce();
    pressed = true; manager.update(0); target.dispatchEvent(new Event('blur')); expect(up).toHaveBeenCalledTimes(2);
    manager.update(0); connected = false; manager.update(0); expect(up).toHaveBeenCalledTimes(3); manager.detach();
  });
});
