# @joroya/input

> Unified keyboard / mouse / gamepad input layer with declarative action mapping for [Oroya Animate](https://github.com/joshuacba08/oroya-animate).

[![npm](https://img.shields.io/npm/v/@joroya/input.svg)](https://www.npmjs.com/package/@joroya/input)
[![License](https://img.shields.io/npm/l/@joroya/input.svg)](../../LICENSE)

Map logical actions (`"jump"`, `"move-forward"`) to multiple device bindings.
Re-binding, cross-device support, and accessibility re-mapping are free.

## Install

```bash
npm install @joroya/input @joroya/core
```

## Usage

```ts
import { InputManager } from '@joroya/input';

const input = new InputManager();
input.attach();

input.bindAction('jump', [
    { key: 'Space' },
    { gamepad: 'A' },
]);
input.bindAction('move-forward', [
    { key: 'KeyW' },
    { key: 'ArrowUp' },
]);

input.on('action-down', (e) => {
    if (e.name === 'jump') player.jump();
});

function frame(dt) {
    input.update(dt); // polls gamepads
    if (input.isActionActive('move-forward')) {
        player.move(dt);
    }
    renderer.render(dt);
}
```

## Features

- **Keyboard** via `KeyboardEvent.code` (layout-stable).
- **Mouse** buttons + position + wheel.
- **Gamepad** Standard mapping (A/B/X/Y, DPad, LB/RB/LT/RT, sticks).
- **Action mapping** — multiple bindings per action, OR semantics.
- **Three event types** — `action-down` / `action` (continuous) / `action-up`.
- **Blur-safe** — drops state on window blur so keys don't "stick".

## API surface

| Symbol | Stability |
|---|---|
| `InputManager` (class) | `@public` |
| `ActionBinding` (type) | `@public` |
| `GamepadButton` (type) | `@public` |
| `InputEventMap` (type) | `@public` |

## License

MIT
