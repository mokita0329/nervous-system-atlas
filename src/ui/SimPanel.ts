import type { App } from '../app.ts';
import { h, clear } from './dom.ts';
import { getLocale, meshLabel, t } from '../i18n/index.ts';
import type { LesionController } from '../sim/controller.ts';
import { rowsOf, type Side, type Symptoms } from '../sim/symptoms.ts';
import { TABLE_MODALITIES, type FunctionalUnit, type Text } from '../sim/units.ts';
import type { ProbeResult } from '../sim/probe.ts';
import type { AnatomyResult } from '../sim/anatomy.ts';

/**
 * What the lesion costs the patient.
 *
 * The table is the answer: body part down the side, kind of function across the top, and in each cell the
 * side of the body that loses it. Above it sit the units the lesion reached — and, just as important, the
 * neighbouring units it missed, because "the sensory fibres behind the capsule were spared" is half of what
 * makes a lesion recognisable. Every claim names the description it came from; the footer says, permanently,
 * what this model does not attempt.
 */
const txt = (x: Text): string => (getLocale() === 'ja' ? x.ja : getLocale() === 'tr' ? (x.tr ?? x.en) : x.en);
const sideWord = (s: Side): string | null =>
  s === 'none' ? null : t(s === 'both' ? 'sim.side.both' : s === 'l' ? 'side.left' : 'side.right');

export class SimPanel {
  private last: { sym: Symptoms; res: ProbeResult; anat: AnatomyResult } | null = null;

  constructor(private app: App, private container: HTMLElement, private ctl: LesionController) {
    app.store.subscribe((s) => s.locale, () => this.render());
    // Clearing the lesion, or a link that drops it, has no result to report — the panel has to notice by itself.
    app.store.subscribe((s) => s.lesion === null, (gone) => { if (gone) { this.last = null; this.render(); } });
    ctl.onResult = (sym, res, anat) => { this.last = { sym, res, anat }; this.render(); };
    this.render();
  }

  /** One line per unit: its name, which hemisphere it is in, and where the claim comes from. */
  private unitRow(u: FunctionalUnit, spared: boolean): HTMLElement {
    return h('div', {
      class: spared ? 'sim-unit spared' : 'sim-unit',
      onmouseenter: () => this.ctl.hover(u),
      onmouseleave: () => this.ctl.hover(null),
    },
      h('span', { class: 'dot' }),
      h('span', { class: 'nm' }, txt(u.name)),
      u.side !== 'midline' ? h('span', { class: 'muted small' }, `（${t(u.side === 'l' ? 'side.left' : 'side.right')}）`) : null,
      h('span', { class: 'src' }, txt(u.src)),
    );
  }

  private table(sym: Symptoms): HTMLElement | null {
    const rows = rowsOf(sym);
    if (!rows.length) return null;
    const head = h('tr', {}, h('th', {}), ...TABLE_MODALITIES.map((m) => h('th', {}, t(`sim.mod.${m}`))));
    const body = rows.map((b) => h('tr', {},
      h('td', { class: 'rowhead' }, t(`sim.body.${b}`)),
      ...TABLE_MODALITIES.map((m) => {
        const cell = sym.table.get(b)?.get(m);
        if (!cell) return h('td', { class: 'none' }, '—');
        return h('td', {
          class: 'lost',
          title: cell.from.map((u) => txt(u.name)).join(' / '),
          onmouseenter: () => this.ctl.hover(cell.from[0] ?? null),
          onmouseleave: () => this.ctl.hover(null),
        }, sideWord(cell.side) ?? t('sim.impaired'));
      }),
    ));
    return h('table', { class: 'sim-table' }, head, ...body);
  }

  render(): void {
    clear(this.container);
    const lesion = this.app.store.get().lesion;
    const head = h('div', { class: 'content-head' },
      h('span', { class: 'swatch big', style: 'background:#e0453f' }),
      h('div', {},
        h('h2', {}, t('sim.title')),
        h('div', { class: 'crumbs' }, lesion
          ? `MNI ${lesion.mni.map((v) => Math.round(v)).join(', ')} · r ${lesion.r} mm · ${t('sim.volume', { n: ((4 / 3) * Math.PI * lesion.r ** 3 / 1000).toFixed(1) })}`
          : ''),
      ));

    const never = h('div', { class: 'sim-never' },
      h('b', {}, t('sim.notModelled.title')),
      h('p', {}, t('sim.notModelled.body')),
      h('p', { style: 'margin-top:6px' }, t('sim.sphereNote')));

    if (!lesion || !this.last) {
      this.container.append(h('div', {}, head, h('p', { class: 'sim-hint' }, t('sim.hint')), never));
      return;
    }

    const { sym, res, anat } = this.last;
    const body = h('div', {}, head);

    if (anat.hits.length) {
      body.append(h('h3', { class: 'sim-h' }, t('sim.structures')));
      for (const a of anat.hits) {
        const n = meshLabel(this.app, a.meshId);
        body.append(h('div', {
          class: a.contains ? 'sim-unit' : 'sim-unit clipped',
          onmouseenter: () => this.ctl.hoverMesh(a.meshId),
          onmouseleave: () => this.ctl.hoverMesh(null),
        },
          h('span', { class: 'dot' }),
          h('span', { class: 'nm' }, n.primary),
          a.contains ? h('span', { class: 'src' }, t('sim.inside')) : null));
      }
      if (anat.territories.length) {
        body.append(h('div', { class: 'sim-terr' }, h('b', {}, `${t('sim.territories')}: `),
          anat.territories.map((a) => meshLabel(this.app, a.meshId).primary).join('・')));
      }
    }

    if (sym.empty) body.append(h('p', { class: 'sim-hint' }, t(res.unresolved.length || anat.pending ? 'sim.checking' : 'sim.none')));
    else {
      body.append(h('h3', { class: 'sim-h' }, t('sim.cut')));
      for (const u of res.hit) body.append(this.unitRow(u, false));
    }

    if (sym.spared.length) {
      body.append(h('h3', { class: 'sim-h' }, t('sim.spared')));
      for (const g of sym.spared) {
        body.append(h('div', { class: 'sim-unit spared' },
          h('span', { class: 'dot' }),
          h('span', { class: 'nm' }, t('sim.sparedOf', {
            group: `${txt(g.group)}${g.side === 'midline' ? '' : `（${t(g.side === 'l' ? 'side.left' : 'side.right')}）`}`,
            names: g.names.map(txt).join('・'),
          }))));
      }
    }

    const table = this.table(sym);
    if (table) { body.append(h('h3', { class: 'sim-h' }, t('sim.table'))); body.append(table); }

    if (sym.others.length) {
      body.append(h('h3', { class: 'sim-h' }, t('sim.others')));
      for (const o of sym.others) {
        body.append(h('div', {
          class: 'sim-other',
          onmouseenter: () => this.ctl.hover(o.units[0] ?? null),
          onmouseleave: () => this.ctl.hover(null),
        },
          h('div', {}, sideWord(o.side) ? h('span', { class: 'side' }, `${sideWord(o.side)} `) : null,
            o.carry.sign ? txt(o.carry.sign) : t(`sim.mod.${o.carry.mod}`)),
          h('div', { class: 'meta' },
            h('span', {}, o.units.map((u) => txt(u.name)).join(' / ')),
            h('span', { class: 'src' }, t('sim.from', { src: txt(o.units[0]!.src) })))));
      }
    }

    body.append(never);
    this.container.append(body);
  }
}
