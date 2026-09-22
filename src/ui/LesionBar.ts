import type { App } from '../app.ts';
import { h } from './dom.ts';
import { t } from '../i18n/index.ts';
import { DEFAULT_RADIUS_MM, MAX_RADIUS_MM, MIN_RADIUS_MM, type LesionController } from '../sim/controller.ts';

/**
 * The three things a reader does to a lesion once it is placed: resize it, put it on the other side, remove it.
 *
 * Size is the control that teaches the most — growing a capsular lacune by two millimetres brings the face in,
 * shrinking it takes the leg back out — so it is a slider, live, not a number box.
 */
export class LesionBar {
  private slider: HTMLInputElement;
  private readout: HTMLElement;
  private buttons: HTMLButtonElement[];

  constructor(app: App, container: HTMLElement, private ctl: LesionController) {
    this.slider = h('input', {
      type: 'range', min: String(MIN_RADIUS_MM), max: String(MAX_RADIUS_MM), step: '1',
      value: String(DEFAULT_RADIUS_MM), 'data-testid': 'lesion-radius',
      oninput: () => { this.readout.textContent = `${this.slider.value} mm`; ctl.setRadius(Number(this.slider.value)); },
    }) as HTMLInputElement;
    this.readout = h('span', { class: 'val' }, `${DEFAULT_RADIUS_MM} mm`);
    const mirror = h('button', { class: 'mini', 'data-testid': 'lesion-mirror', onclick: () => ctl.mirror() }) as HTMLButtonElement;
    const clear = h('button', { class: 'mini', 'data-testid': 'lesion-clear', onclick: () => ctl.clear() }) as HTMLButtonElement;
    this.buttons = [mirror, clear];

    container.append(h('div', { class: 'lesion-bar' },
      h('label', {}, t('sim.radius'), this.slider, this.readout),
      mirror, clear));

    this.applyLocale();
    app.store.subscribe((s) => s.locale, () => this.applyLocale());
    // The radius can also change from a link (`#/lesion/x,y,z,r`), so the slider follows the state, not itself.
    app.store.subscribe((s) => s.lesion?.r ?? null, (r) => {
      if (r === null) return;
      this.slider.value = String(r);
      this.readout.textContent = `${r} mm`;
    });
  }

  private applyLocale(): void {
    const [mirror, clear] = this.buttons;
    mirror!.textContent = t('sim.mirror'); mirror!.title = t('sim.mirror.title');
    clear!.textContent = t('sim.clear');
    const label = this.slider.parentElement;
    if (label) label.firstChild!.textContent = t('sim.radius');
  }
}
