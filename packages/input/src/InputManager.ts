import { EventEmitter } from '@joroya/core';

/**
 * Standard gamepad button names (from the Web Gamepad API "Standard"
 * mapping). Using semantic names keeps app code legible vs. numeric
 * indices: `'A'` instead of `buttons[0]`, `'DPadUp'` instead of `buttons[12]`.
 */
export type GamepadButton =
    | 'A' | 'B' | 'X' | 'Y'
    | 'LB' | 'RB' | 'LT' | 'RT'
    | 'Back' | 'Start'
    | 'LeftStick' | 'RightStick'
    | 'DPadUp' | 'DPadDown' | 'DPadLeft' | 'DPadRight'
    | 'Home';

const STANDARD_BUTTON_NAMES: GamepadButton[] = [
    'A', 'B', 'X', 'Y',
    'LB', 'RB', 'LT', 'RT',
    'Back', 'Start',
    'LeftStick', 'RightStick',
    'DPadUp', 'DPadDown', 'DPadLeft', 'DPadRight',
    'Home',
];

/**
 * A device-agnostic action binding. Any of the listed inputs activate the
 * action — the binding is an OR across devices.
 */
export interface ActionBinding {
    /** Keyboard key (KeyboardEvent.code, e.g. `'KeyW'`, `'Space'`, `'ArrowLeft'`). */
    key?: string;
    /** Mouse button (0=left, 1=middle, 2=right). */
    mouseButton?: number;
    /** Gamepad button. */
    gamepad?: GamepadButton;
}

/**
 * Public event map for the `InputManager`.
 *
 * - `action-down` / `action-up` fire when an action transitions states.
 * - `action` fires every poll while the action is held (poll-driven so
 *   gamepad analog state stays in sync).
 */
export interface InputEventMap {
    'action-down': { name: string };
    'action': { name: string };
    'action-up': { name: string };
    'gamepad-connected': { index: number; id: string };
    'gamepad-disconnected': { index: number };
}

/**
 * Unified input layer.
 *
 * The manager listens to native browser events for keyboard / mouse and
 * polls the Gamepad API every `update()` call. Apps register *named
 * actions* and map them to one or more device bindings; the rest of the
 * code reacts to action names instead of raw events, so re-binding,
 * cross-device support, and accessibility re-mapping are free.
 *
 * ```ts
 * const input = new InputManager(canvas);
 * input.attach();
 * input.bindAction('jump', [{ key: 'Space' }, { gamepad: 'A' }]);
 * input.on('action-down', (e) => {
 *   if (e.name === 'jump') player.jump();
 * });
 *
 * function loop(dt: number) {
 *   input.update(dt);   // polls gamepads
 *   renderer.render(dt);
 * }
 * ```
 *
 * @public
 */
export class InputManager {
    private readonly emitter = new EventEmitter<InputEventMap>();
    private readonly bindings = new Map<string, ActionBinding[]>();
    private readonly keysDown = new Set<string>();
    private readonly mouseButtonsDown = new Set<number>();
    private readonly gamepadButtonsDown = new Map<number, Set<GamepadButton>>();
    private readonly activeActions = new Set<string>();

    // Latest known cursor position in client (CSS-pixel) space.
    private _pointer = { x: 0, y: 0 };
    private _wheel = 0;

    private attached = false;
    private readonly target: HTMLElement | Window;
    private abortController: AbortController | null = null;

    constructor(target: HTMLElement | Window = typeof window !== 'undefined' ? window : (undefined as never)) {
        this.target = target;
    }

    /** Latest pointer position in client space. */
    get pointer(): { x: number; y: number } {
        return { ...this._pointer };
    }

    /** Wheel delta accumulated since the previous `update()` call. */
    get wheelDelta(): number {
        return this._wheel;
    }

    /** Subscribe to input events. */
    on<K extends keyof InputEventMap>(type: K, handler: (e: InputEventMap[K]) => void): void {
        this.emitter.on(type, handler);
    }

    off<K extends keyof InputEventMap>(type: K, handler: (e: InputEventMap[K]) => void): void {
        this.emitter.off(type, handler);
    }

    /** Define / replace an action's binding list. */
    bindAction(name: string, bindings: ActionBinding[]): void {
        this.bindings.set(name, bindings);
    }

    /** Remove an action binding. */
    unbindAction(name: string): void {
        this.bindings.delete(name);
        this.activeActions.delete(name);
    }

    /** Check if a named action is currently active. */
    isActionActive(name: string): boolean {
        return this.activeActions.has(name);
    }

    /** Direct query — useful for movement axes that don't map to discrete events. */
    isKeyDown(code: string): boolean {
        return this.keysDown.has(code);
    }

    isMouseButtonDown(button: number): boolean {
        return this.mouseButtonsDown.has(button);
    }

    isGamepadButtonDown(index: number, button: GamepadButton): boolean {
        return this.gamepadButtonsDown.get(index)?.has(button) ?? false;
    }

    /**
     * Read an analog gamepad axis (-1..1). The Web Gamepad API uses indices
     * 0/1 for the left stick (X, Y) and 2/3 for the right stick.
     */
    getGamepadAxis(index: number, axis: number): number {
        const gp = this.getGamepad(index);
        return gp?.axes[axis] ?? 0;
    }

    attach(): void {
        if (this.attached) return;
        this.attached = true;
        this.abortController = new AbortController();
        const { signal } = this.abortController;
        const t = this.target as EventTarget;

        // Use `keydown`/`keyup` on window so the same handler catches focused
        // and unfocused canvases. `code` (vs `key`) gives us layout-stable
        // physical key identification.
        t.addEventListener('keydown', this.onKeyDown as EventListener, { signal });
        t.addEventListener('keyup', this.onKeyUp as EventListener, { signal });
        t.addEventListener('mousedown', this.onMouseDown as EventListener, { signal });
        t.addEventListener('mouseup', this.onMouseUp as EventListener, { signal });
        t.addEventListener('mousemove', this.onMouseMove as EventListener, { signal });
        t.addEventListener('wheel', this.onWheel as EventListener, { signal });
        t.addEventListener('blur', this.onBlur as EventListener, { signal });
        t.addEventListener('gamepadconnected', this.onGamepadConnected as EventListener, { signal });
        t.addEventListener('gamepaddisconnected', this.onGamepadDisconnected as EventListener, { signal });
    }

    detach(): void {
        if (!this.attached) return;
        this.attached = false;
        this.abortController?.abort();
        this.abortController = null;
        this.keysDown.clear();
        this.mouseButtonsDown.clear();
        this.gamepadButtonsDown.clear();
        this.activeActions.clear();
    }

    /**
     * Per-frame poll. Refreshes gamepad state (the Gamepad API only updates
     * `navigator.getGamepads()` snapshots; there are no continuous events)
     * and emits `action` for any held actions.
     */
    update(_dt: number): void {
        this.pollGamepads();
        this.recomputeActiveActions();
        for (const name of this.activeActions) {
            this.emitter.emit('action', { name });
        }
        this._wheel = 0;
    }

    // ── Native event handlers ─────────────────────────────────

    private onKeyDown = (e: KeyboardEvent): void => {
        if (this.keysDown.has(e.code)) return;
        this.keysDown.add(e.code);
        this.maybeFireActionDown();
    };

    private onKeyUp = (e: KeyboardEvent): void => {
        this.keysDown.delete(e.code);
        this.maybeFireActionUp();
    };

    private onMouseDown = (e: MouseEvent): void => {
        this.mouseButtonsDown.add(e.button);
        this.maybeFireActionDown();
    };

    private onMouseUp = (e: MouseEvent): void => {
        this.mouseButtonsDown.delete(e.button);
        this.maybeFireActionUp();
    };

    private onMouseMove = (e: MouseEvent): void => {
        this._pointer.x = e.clientX;
        this._pointer.y = e.clientY;
    };

    private onWheel = (e: WheelEvent): void => {
        this._wheel += e.deltaY;
    };

    private onBlur = (): void => {
        // Drop all keyboard state on window blur — the OS no longer delivers
        // keyup events for keys the user releases while the window is unfocused,
        // so without this, keys "stick" silently.
        this.keysDown.clear();
        this.mouseButtonsDown.clear();
        this.maybeFireActionUp();
    };

    private onGamepadConnected = (e: GamepadEvent): void => {
        this.emitter.emit('gamepad-connected', { index: e.gamepad.index, id: e.gamepad.id });
    };

    private onGamepadDisconnected = (e: GamepadEvent): void => {
        this.gamepadButtonsDown.delete(e.gamepad.index);
        this.emitter.emit('gamepad-disconnected', { index: e.gamepad.index });
    };

    // ── Gamepad polling ───────────────────────────────────────

    private getGamepad(index: number): Gamepad | null {
        if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
        return navigator.getGamepads()[index] ?? null;
    }

    private pollGamepads(): void {
        if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
            const gp = pads[i];
            if (!gp) continue;
            const buttonsDown = this.gamepadButtonsDown.get(i) ?? new Set<GamepadButton>();
            for (let b = 0; b < gp.buttons.length && b < STANDARD_BUTTON_NAMES.length; b++) {
                const name = STANDARD_BUTTON_NAMES[b];
                const pressed = gp.buttons[b].pressed;
                if (pressed) buttonsDown.add(name);
                else buttonsDown.delete(name);
            }
            this.gamepadButtonsDown.set(i, buttonsDown);
        }
    }

    // ── Action resolution ─────────────────────────────────────

    private maybeFireActionDown(): void {
        const prev = new Set(this.activeActions);
        this.recomputeActiveActions();
        for (const name of this.activeActions) {
            if (!prev.has(name)) this.emitter.emit('action-down', { name });
        }
    }

    private maybeFireActionUp(): void {
        const prev = new Set(this.activeActions);
        this.recomputeActiveActions();
        for (const name of prev) {
            if (!this.activeActions.has(name)) this.emitter.emit('action-up', { name });
        }
    }

    /**
     * Rebuild the `activeActions` set from scratch by checking each binding.
     * Cheap enough at typical action counts (< ~50) that we don't bother with
     * incremental dirty-tracking.
     */
    private recomputeActiveActions(): void {
        this.activeActions.clear();
        for (const [name, bindings] of this.bindings) {
            for (const b of bindings) {
                if (b.key && this.keysDown.has(b.key)) { this.activeActions.add(name); break; }
                if (b.mouseButton !== undefined && this.mouseButtonsDown.has(b.mouseButton)) { this.activeActions.add(name); break; }
                if (b.gamepad && this.gamepadButtonsDownAny(b.gamepad)) { this.activeActions.add(name); break; }
            }
        }
    }

    private gamepadButtonsDownAny(button: GamepadButton): boolean {
        for (const set of this.gamepadButtonsDown.values()) {
            if (set.has(button)) return true;
        }
        return false;
    }
}
