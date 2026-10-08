import type { App } from '../app.ts';
import { h } from './dom.ts';
import { t } from '../i18n/index.ts';
import { shallowEq } from '../state/store.ts';

/**
 * The two views of the simulator, side by side at the top of its panel: the MRI slice a lesion is placed on,
 * and the see-through brain it is looked at in (`sim/view.ts`). The see-through view needs a lesion to show, so
 * its button waits for one; clearing the lesion brings the reader back to the MRI to place the next.
 */
export class SimViewSwitch {
  private mri: HTMLButtonElement;
  private glass: HTMLButtonElement;

  constructor(private app: App, container: HTMLElement) {
    this.mri = h('button', { class: 'mini', 'data-testid': 'sim-view-mri', onclick: () => app.store.set({ simView: 'mri' }) }) as HTMLButtonElement;
    this.glass = h('button', { class: 'mini', 'data-testid': 'sim-view-glass', onclick: () => app.store.set({ simView: 'glass' }) }) as HTMLButtonElement;
    container.append(h('div', { class: 'sim-view', role: 'group' }, this.mri, this.glass));
    this.render();
    app.store.subscribe((s) => [s.simView, !!s.lesion, s.locale] as const, () => this.render(), shallowEq);
  }

  private render(): void {
    const s = this.app.store.get();
    this.mri.textContent = t('sim.view.mri'); this.mri.title = t('sim.view.mri.title');
    this.glass.textContent = t('sim.view.glass');
    this.glass.title = s.lesion ? t('sim.view.glass.title') : t('sim.view.glass.needsLesion');
    this.glass.disabled = !s.lesion;
    for (const [b, on] of [[this.mri, s.simView === 'mri'], [this.glass, s.simView === 'glass']] as const) {
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    }
  }
}
