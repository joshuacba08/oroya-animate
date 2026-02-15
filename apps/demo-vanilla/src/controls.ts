import type { ControlDef, ParamValues } from './types';

/**
 * Builds DOM controls inside a container and returns helpers to read/write params.
 */
export function buildControlPanel(
  container: HTMLElement,
  controls: ControlDef[],
  initialParams: ParamValues,
  onChange: (key: string, value: number | string, rebuild: boolean) => void,
) {
  container.innerHTML = '';

  if (controls.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = '';

  // Title
  const title = document.createElement('div');
  title.className = 'ctrl-title';
  title.textContent = 'Controles';
  container.appendChild(title);

  for (const ctrl of controls) {
    const row = document.createElement('div');
    row.className = 'ctrl-row';

    const label = document.createElement('label');
    label.className = 'ctrl-label';
    label.textContent = ctrl.label;
    row.appendChild(label);

    switch (ctrl.type) {
      case 'slider': {
        const wrapper = document.createElement('div');
        wrapper.className = 'ctrl-slider-wrap';

        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(ctrl.min);
        input.max = String(ctrl.max);
        input.step = String(ctrl.step);
        input.value = String(initialParams[ctrl.key]);
        input.className = 'ctrl-slider';

        const valSpan = document.createElement('span');
        valSpan.className = 'ctrl-value';
        valSpan.textContent = formatNum(initialParams[ctrl.key] as number, ctrl.step);

        input.addEventListener('input', () => {
          const v = parseFloat(input.value);
          valSpan.textContent = formatNum(v, ctrl.step);
          onChange(ctrl.key, v, !!ctrl.rebuild);
        });

        wrapper.appendChild(input);
        wrapper.appendChild(valSpan);
        row.appendChild(wrapper);
        break;
      }

      case 'color': {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = initialParams[ctrl.key] as string;
        input.className = 'ctrl-color';

        input.addEventListener('input', () => {
          onChange(ctrl.key, input.value, !!ctrl.rebuild);
        });

        row.appendChild(input);
        break;
      }

      case 'select': {
        const select = document.createElement('select');
        select.className = 'ctrl-select';

        for (const opt of ctrl.options) {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          select.appendChild(option);
        }
        select.value = initialParams[ctrl.key] as string;

        select.addEventListener('change', () => {
          onChange(ctrl.key, select.value, !!ctrl.rebuild);
        });

        row.appendChild(select);
        break;
      }
    }

    container.appendChild(row);
  }
}

function formatNum(n: number, step: number): string {
  return step < 1 ? n.toFixed(1) : String(Math.round(n));
}
