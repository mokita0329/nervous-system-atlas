import type { App } from '../app.ts';
import { h, clear, enTag, secondaryName } from './dom.ts';
import { entryName, t, type NamedEntry, entryOf } from '../i18n/index.ts';
import { citeNode } from './cite.ts';
import type { Citation } from '../types/content.ts';
import { selectStructure, setSlices, showForMode } from '../state/actions.ts';
import { applyVisualState } from '../scene/materials.ts';
import { sourceLine } from './sourceLine.ts';
import { TractLayer } from '../scene/TractLayer.ts';
import { tractFor } from '../tracts/index.ts';

type Rec = Record<string, unknown>;

/** Renders a pathway entry into the right panel and highlights its waypoint meshes in order. */
export class PathwayPanel {
  private cleanup: (() => void) | null = null;
  private currentId: string | null = null;
  private current: Rec | undefined;
  /** built the first time a pathway with a curve is opened */
  private tracts: TractLayer | null = null;
  constructor(private app: App, private container: HTMLElement) {
    // a language switch re-renders the open pathway in place
    app.store.subscribe((s) => s.locale, () => { if (this.currentId && !this.container.hidden) this.show(this.currentId); });
  }

  private html(s: unknown): HTMLElement {
    const d = h('div', { class: 'prose' }); d.innerHTML = String(s ?? '');
    const tag = enTag(this.current); if (tag) d.prepend(tag);
    return d;
  }
  private cite(c: Citation): HTMLElement { return citeNode(this.app.content?.bibliography, c); }
  private meshForStructure(sid: string, preferred?: string): string | null {
    if (preferred && this.app.registry.byId.has(preferred)) return preferred;
    const st = entryOf(this.app, 'structures', sid);
    const ids = (st?.['meshIds'] as string[] | undefined) ?? [];
    for (const id of ids) if (this.app.registry.byId.has(id)) return id;
    const m = this.app.manifest.meshes.find((x) => x.structureId === sid);
    return m ? m.id : null;
  }

  exit(): void { this.cleanup?.(); this.cleanup = null; this.currentId = null; }

  show(id: string): void {
    this.exit();
    this.currentId = id;
    const p = entryOf(this.app, 'pathways', id);
    this.current = p;
    clear(this.container);
    if (!p) { this.container.append(h('p', { class: 'muted' }, t('pathway.notFound', { id }))); return; }
    const html = (p['html'] ?? {}) as Record<string, string>;
    const wps = p['waypoints'] as Rec[];
    // highlight waypoint meshes
    const meshIds = new Set<string>([...((p['meshIds'] as string[]) ?? []), ...wps.map((w) => this.meshForStructure(String(w['structureId']), w['meshId'] as string | undefined)).filter((x): x is string => !!x)]);
    const restoreShown = showForMode(this.app, meshIds);
    // A pathway that has a drawn curve takes the scene over: the curve, its own structures lit, and everything
    // else at 3 % through the existing `involved` machinery (applyStates). `involved` is claimed from the
    // promise below, not here: the route switches the panel right after this call, and showPanel() ends with
    // quizPanel.exit(), which clears a non-syndrome `involved` set (it owns one for its reveal).
    const tract = tractFor(id);
    if (tract) { this.tracts ??= new TractLayer(this.app); this.tracts.show(tract); }
    void this.app.registry.ensure(meshIds).then((meshes) => {
      for (const m of meshes) applyVisualState(m, 'involved');
      if (tract && this.currentId === id && !this.app.store.get().syndrome) this.app.store.set({ involved: new Set(meshIds), shell: new Set(meshIds) });
      this.app.sm.requestRender();
    });
    this.cleanup = () => {
      restoreShown();
      for (const mid of meshIds) { const m = this.app.registry.get(mid); if (m) applyVisualState(m, 'normal'); }
      if (tract) { this.tracts?.clear(); if (!this.app.store.get().syndrome) this.app.store.set({ involved: new Set(), shell: new Set() }); }
      this.app.sm.requestRender();
    };

    const stepList = h('ol', { class: 'waypoints' }, ...wps.map((w, i) => {
      const sid = String(w['structureId']); const st = entryOf(this.app, 'structures', sid);
      const mid = this.meshForStructure(sid, w['meshId'] as string | undefined);
      const side = String(w['sideRelativeToOrigin']);
      const n = entryName(st, sid);
      // a real button, so the step can be reached with Tab and taken with Enter or Space
      const order = Number(w['order'] ?? i + 1);
      return h('li', { class: `wp side-${side}` },
        h('button', {
          type: 'button', class: 'wp-pick', disabled: mid || tract ? null : 'true',
          onclick: () => {
            // with a curve open the station itself is the place to look, so the slices go to the curve's own
            // point (the centroid of a whole-brainstem mesh is not where the tract passes through it)
            const at = this.tracts?.positionOf(order) ?? null;
            this.tracts?.highlight(order);
            if (at) setSlices(this.app, { sagittal: Math.round(at.x), coronal: Math.round(at.y), axial: Math.round(at.z) });
            if (mid) selectStructure(this.app, mid, { moveSlices: !at });
          },
        },
          h('span', { class: 'wp-n' }, String(i + 1)), h('b', {}, n.primary, secondaryName(n)), h('span', { class: 'tag' }, side)),
        w['note'] ? h('div', { class: 'muted small' }, String(w['note'])) : null);
    }));
    const dec = p['decussation'] as Rec | null;
    const title = entryName(p as unknown as NamedEntry, String(p['name'] ?? id));
    const chip = (sid: string): HTMLElement => {
      const n = entryName(entryOf(this.app, 'syndromes', sid), sid);
      return h('a', { class: 'chip', href: `#/syndrome/${sid}`, title: n.secondary ?? undefined }, n.primary);
    };
    this.container.append(h('div', {},
      h('div', { class: 'content-head' }, h('span', { class: 'swatch big', style: 'background:#EDE3D2' }), h('div', {}, h('h2', {}, title.primary, secondaryName(title)), h('div', { class: 'crumbs' }, t('pathway.crumbs', { type: String(p['type']), modality: String(p['modality']) })))),
      this.html(html['summary']),
      sourceLine(this.app, meshIds),
      h('h3', {}, enTag(this.current), t('pathway.neuronChain')), h('ol', {}, ...(p['neuronChain'] as Rec[]).map((n) => h('li', {}, h('b', {}, String(n['cellBody'])), ` → ${n['synapse']}`))),
      h('h3', {}, enTag(this.current), t('pathway.decussation')), dec ? h('p', {}, h('b', {}, String(dec['level'])), `: ${dec['note']}`) : h('p', { class: 'muted' }, t('pathway.uncrossed')),
      h('h3', {}, t('pathway.course')), tract ? h('p', { class: 'muted small tract-note' }, t('tract.schematic')) : null, stepList,
      h('h3', {}, t('pathway.termination')), this.html(html['termination'] ?? p['termination']),
      p['somatotopy'] ? h('div', {}, h('h3', {}, t('pathway.somatotopy')), this.html(html['somatotopy'] ?? p['somatotopy'])) : null,
      h('h3', {}, enTag(this.current), t('pathway.lesionByLevel')), h('table', { class: 'tbl' }, h('tr', {}, h('th', {}, t('th.level')), h('th', {}, t('th.effects')), h('th', {}, t('th.side'))),
        ...(p['lesionEffectsByLevel'] as Rec[]).map((x) => h('tr', {}, h('td', {}, String(x['level'])), h('td', {}, String(x['effects'])), h('td', {}, String(x['side']))))),
      h('h3', {}, enTag(this.current), t('pathway.pearls')), h('ul', {}, ...((p['clinical'] as Rec)['pearls'] as string[]).map((x) => h('li', {}, x))),
      ((p['clinical'] as Rec)['syndromes'] as string[]).length ? h('div', {}, h('h3', {}, t('pathway.syndromes')), h('div', { class: 'chips' }, ...((p['clinical'] as Rec)['syndromes'] as string[]).map((sid) => chip(sid)))) : null,
      h('h3', {}, t('pathway.sources')), h('ul', {}, ...(p['citations'] as unknown as Citation[]).map((c) => h('li', {}, this.cite(c)))),
    ));
  }
}
