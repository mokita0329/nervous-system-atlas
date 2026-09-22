import type { App } from '../app.ts';
import { h, clear, enTag } from './dom.ts';
import { entryName, t, type NamedEntry, entryOf } from '../i18n/index.ts';
import { citeNode } from './cite.ts';
import type { Citation } from '../types/content.ts';
import { applyStates, showForMode } from '../state/actions.ts';

type Rec = Record<string, unknown>;
const STORAGE = 'atlas.quiz.answers';

/**
 * Right panel quiz: original vignettes; answering reveals the explanation and spotlights the target meshes.
 * Answers are kept in this browser (keyed by vignette id, so a re-ordered set keeps them), and the reader can
 * narrow the set to one type or difficulty or to the vignettes they got wrong.
 */
export class QuizPanel {
  private index = 0;
  private answered = new Map<string, string>();
  private restoreShown: (() => void) | null = null;
  private ids: string[] = [];
  private filter: { type: string; difficulty: string; missed: boolean } = { type: '', difficulty: '', missed: false };
  constructor(private app: App, private container: HTMLElement) {
    try { const raw = localStorage.getItem(STORAGE); if (raw) for (const [id, k] of Object.entries(JSON.parse(raw) as Record<string, string>)) this.answered.set(id, k); } catch { /* storage blocked or unreadable: start clean */ }
    // a language switch redraws the open vignette (answers already given are kept)
    app.store.subscribe((s) => s.locale, () => { if (this.ids.length && this.container.childElementCount) this.render(); });
  }
  private items(): Rec[] { return this.ids.map((id) => entryOf(this.app, 'quiz', id)!); }
  private persist(): void { try { localStorage.setItem(STORAGE, JSON.stringify(Object.fromEntries(this.answered))); } catch { /* storage blocked */ } }
  private wrong(i: number): boolean { const id = this.ids[i]!; const k = this.answered.get(id); return k !== undefined && k !== String(entryOf(this.app, 'quiz', id)?.['answer']); }
  /** indices of the vignettes the current filter admits, in order */
  private pool(): number[] {
    const items = this.items();
    return this.ids.map((_, i) => i).filter((i) => { const q = items[i]!; return (!this.filter.type || q['type'] === this.filter.type) && (!this.filter.difficulty || String(q['difficulty']) === this.filter.difficulty) && (!this.filter.missed || this.wrong(i)); });
  }
  private clearHighlight(): void {
    this.restoreShown?.(); this.restoreShown = null;
    const st = this.app.store.get();
    if (!st.syndrome && st.involved.size) this.app.store.set({ involved: new Set(), shell: new Set(), stepHighlight: new Set() });
    if (!st.syndrome) applyStates(this.app);
  }
  exit(): void { this.clearHighlight(); }
  private highlight(ids: string[]): void {
    this.clearHighlight();
    const valid = ids.filter((m) => this.app.registry.byId.has(m));
    this.restoreShown = showForMode(this.app, valid);
    this.app.store.set({ involved: new Set(valid), stepHighlight: new Set() });
    void this.app.registry.ensure(valid).then(() => { applyStates(this.app); const first = valid[0] && this.app.registry.byId.get(valid[0]); if (first) { const c = first.centroid; this.app.store.set({ slices: { ...this.app.store.get().slices, sagittal: Math.round(c[0]), coronal: Math.round(c[1]), axial: Math.round(c[2]) } }); } });
  }
  private link(id: string, kind: 'structure' | 'syndrome' | 'pathway'): HTMLElement {
    const c = this.app.content!; const e = (kind === 'structure' ? c.structures[id] : kind === 'syndrome' ? c.syndromes[id] : c.pathways[id]) as NamedEntry | undefined;
    const n = entryName(e, id);
    return h('a', { class: 'chip', href: `#/${kind}/${id}`, title: n.secondary ?? undefined }, n.primary);
  }
  show(index?: number): void {
    if (!this.app.content) { clear(this.container); this.container.append(h('p', { class: 'muted' }, t('quiz.notLoaded'))); return; }
    if (!this.ids.length) this.ids = Object.keys(this.app.content.quiz).sort();
    if (index !== undefined) this.index = Math.max(0, Math.min(this.ids.length - 1, index));
    this.render();
  }
  private choose(key: string): void {
    const id = this.ids[this.index]!;
    if (this.answered.has(id)) return;
    this.answered.set(id, key); this.persist();
    const q = this.items()[this.index]!;
    this.highlight((q['highlightOnReveal'] as string[]) ?? []);
    this.render();
  }
  /** move within the filtered set; from outside it, the first step lands on its first (or last) vignette */
  private go(delta: number): void {
    const pool = this.pool(); if (!pool.length) return;
    const pos = pool.indexOf(this.index);
    const next = pos < 0 ? (delta >= 0 ? pool[0]! : pool[pool.length - 1]!) : pool[Math.max(0, Math.min(pool.length - 1, pos + delta))]!;
    this.jump(next);
  }
  private jump(i: number): void { this.clearHighlight(); this.index = i; this.app.store.set({ panel: { kind: 'quiz', index: this.index } }); this.render(); }
  private setFilter(patch: Partial<QuizPanel['filter']>): void {
    this.filter = { ...this.filter, ...patch };
    const pool = this.pool();
    if (pool.length && !pool.includes(this.index)) this.jump(pool[0]!); else this.render();
  }
  private render(): void {
    clear(this.container);
    const items = this.items(); const q = items[this.index]; if (!q) return;
    const id = this.ids[this.index]!;
    const given = this.answered.get(id); const correct = String(q['answer']);
    const score = [...this.answered.entries()].filter(([qid, k]) => String(entryOf(this.app, 'quiz', qid)?.['answer']) === k).length;
    const targets = q['targets'] as Rec;
    const pool = this.pool(); const pos = pool.indexOf(this.index);
    const filtered = !!(this.filter.type || this.filter.difficulty || this.filter.missed);
    const missed = this.ids.filter((_, i) => this.wrong(i)).length;
    const types = [...new Set(items.map((x) => String(x['type'])))].sort(); const levels = [...new Set(items.map((x) => String(x['difficulty'])))].sort();
    const sel = (key: 'type' | 'difficulty', values: string[]): HTMLElement => h('select', { class: 'quiz-filter', onchange: (e: Event) => this.setFilter({ [key]: (e.target as HTMLSelectElement).value }) },
      h('option', { value: '', selected: this.filter[key] === '' ? 'true' : null }, t('quiz.filter.all')), ...values.map((v) => h('option', { value: v, selected: this.filter[key] === v ? 'true' : null }, v)));
    const missedBox = h('input', { type: 'checkbox', onchange: (e: Event) => this.setFilter({ missed: (e.target as HTMLInputElement).checked }) }) as HTMLInputElement; missedBox.checked = this.filter.missed; missedBox.disabled = !missed && !this.filter.missed;
    this.container.append(h('div', {},
      h('div', { class: 'content-head' }, h('span', { class: 'swatch big', style: 'background:#4e79a7' }), h('div', {}, h('h2', {}, t('quiz.title', { n: this.index + 1, total: items.length })),
        h('div', { class: 'crumbs' }, t('quiz.crumbs', { type: String(q['type']), difficulty: String(q['difficulty']), score, answered: this.answered.size }) + (filtered && pos >= 0 ? ` · ${t('quiz.filtered', { n: pos + 1, total: pool.length })}` : '')))),
      h('div', { class: 'quiz-filters' }, h('label', {}, t('quiz.filter.type'), ' ', sel('type', types)), h('label', {}, t('quiz.filter.difficulty'), ' ', sel('difficulty', levels)), h('label', {}, missedBox, ' ', t('quiz.missed', { n: missed }))),
      h('p', { class: 'vignette' }, enTag(q), String(q['vignette'])),
      h('p', {}, h('b', {}, String(q['stem']))),
      h('div', { class: 'options' }, ...(q['options'] as Rec[]).map((o) => { const k = String(o['key']); const cls = given ? (k === correct ? 'opt right' : k === given ? 'opt wrong' : 'opt') : 'opt'; return h('button', { class: cls, onclick: () => this.choose(k) }, h('b', {}, k), ' ', String(o['text'])); })),
      given ? h('div', { class: given === correct ? 'reveal ok' : 'reveal bad' }, h('b', {}, given === correct ? t('quiz.correct') : t('quiz.wrong', { key: correct })), h('p', {}, enTag(q), String(q['explanation'])),
        h('div', { class: 'chips' }, ...((targets['structureIds'] as string[]) ?? []).map((id) => this.link(id, 'structure')), ...((targets['syndromeIds'] as string[]) ?? []).map((id) => this.link(id, 'syndrome')), ...((targets['pathwayIds'] as string[]) ?? []).map((id) => this.link(id, 'pathway'))),
        h('div', { class: 'muted small' }, t('quiz.sources'), h('ul', { class: 'cites' }, ...(((q['citations'] as unknown as Citation[]) ?? []).map((c) => h('li', {}, citeNode(this.app.content?.bibliography, c))))))) : h('p', { class: 'muted small' }, t('quiz.hint')),
      h('div', { class: 'quiz-nav' }, h('button', { disabled: pos <= 0 && pool.length ? 'true' : null, onclick: () => this.go(-1) }, t('quiz.prev')), h('button', { disabled: pos >= pool.length - 1 ? 'true' : null, onclick: () => this.go(1) }, t('quiz.next')),
        h('button', { onclick: () => { this.answered.clear(); this.persist(); this.filter = { ...this.filter, missed: false }; this.jump(0); } }, t('quiz.restart'))),
      h('p', { class: 'muted small' }, t('quiz.saved')),
    ));
  }
  key(k: string): void { if (/^[a-eA-E]$/.test(k)) this.choose(k.toUpperCase()); else if (k === 'ArrowRight') this.go(1); else if (k === 'ArrowLeft') this.go(-1); }
}
