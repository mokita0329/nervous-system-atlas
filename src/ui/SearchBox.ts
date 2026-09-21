import Fuse from 'fuse.js';
import type { App } from '../app.ts';
import { h, clear, secondaryName } from './dom.ts';
import { entryName, t, type Key } from '../i18n/index.ts';

const KIND_KEY: Record<string, Key> = {
  structure: 'kind.structure', 'cranial-nerve': 'kind.cranial-nerve', pathway: 'kind.pathway',
  syndrome: 'kind.syndrome', topic: 'kind.topic', glossary: 'kind.glossary', mesh: 'kind.mesh',
};

export interface SearchDoc { id: string; kind: string; name: string; names?: { tr?: string; ja?: string }; latin?: string; aliases: string[]; summary: string }

/** Toolbar search over the prebuilt content index (structures, cranial nerves, pathways, syndromes). */
export class SearchBox {
  readonly input: HTMLInputElement;
  private list: HTMLElement;
  private fuse: Fuse<SearchDoc> | null = null;
  private docs: SearchDoc[] = [];
  constructor(container: HTMLElement, private onPick: (doc: SearchDoc) => void, app?: App) {
    // a combobox over a listbox: the arrow keys move aria-activedescendant while focus stays in the field,
    // so a screen reader announces the highlighted result and Enter takes it
    this.input = h('input', { type: 'search', class: 'search', placeholder: t('search.placeholder'), autocomplete: 'off',
      role: 'combobox', 'aria-autocomplete': 'list', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-controls': 'search-results' }) as HTMLInputElement;
    this.list = h('div', { class: 'search-results', id: 'search-results', role: 'listbox', hidden: true });
    const wrap = h('div', { class: 'search-wrap' }, this.input, this.list);
    container.append(wrap);
    this.input.addEventListener('input', () => this.update());
    this.input.addEventListener('focus', () => this.update());
    this.input.addEventListener('keydown', (e) => {
      const items = this.items(); const cur = items.findIndex((x) => x.classList.contains('active'));
      if (e.key === 'ArrowDown') { this.setActive(Math.min(items.length - 1, cur + 1)); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { this.setActive(Math.max(0, cur - 1)); e.preventDefault(); }
      else if (e.key === 'Enter') { (items[cur >= 0 ? cur : 0])?.click(); }
      else if (e.key === 'Escape') { this.input.blur(); this.close(); }
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target as Node)) this.close(); });
    app?.store.subscribe((s) => s.locale, () => { this.input.placeholder = t('search.placeholder'); if (!this.list.hidden) this.update(); });
  }
  async load(url = 'data/search-index.json', extra: SearchDoc[] = []): Promise<void> {
    try { const r = await fetch(url); if (r.ok) this.docs = (await r.json()) as SearchDoc[]; } catch { /* no index yet */ }
    const seen = new Set(this.docs.map((d) => d.id));
    for (const d of extra) if (!seen.has(d.id)) this.docs.push(d);
    this.fuse = new Fuse(this.docs, { keys: [{ name: 'name', weight: 3 }, { name: 'aliases', weight: 2 }, { name: 'id', weight: 1 }, { name: 'summary', weight: 0.3 }], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 });
  }
  private items(): HTMLElement[] { return Array.from(this.list.querySelectorAll('.sr')) as HTMLElement[]; }
  private close(): void { this.list.hidden = true; this.input.setAttribute('aria-expanded', 'false'); this.input.removeAttribute('aria-activedescendant'); }
  private setActive(i: number): void {
    const items = this.items();
    for (const x of items) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); }
    const el = items[i]; if (!el) { this.input.removeAttribute('aria-activedescendant'); return; }
    el.classList.add('active'); el.setAttribute('aria-selected', 'true'); this.input.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView?.({ block: 'nearest' });
  }
  private update(): void {
    clear(this.list);
    let q = this.input.value.trim(); let kind: string | null = null;
    if (q.startsWith('>')) { kind = 'syndrome'; q = q.slice(1).trim(); }
    if (!this.fuse || q.length < 2) { this.close(); return; }
    let hits = this.fuse.search(q, { limit: 40 }).map((r) => r.item);
    if (kind) hits = hits.filter((d) => d.kind === kind);
    hits = hits.slice(0, 12);
    if (!hits.length) { this.close(); return; }
    hits.forEach((d, i) => {
      const n = entryName(d, d.name);
      const kindKey = KIND_KEY[d.kind];
      this.list.append(h('div', { class: 'sr', id: `search-opt-${i}`, role: 'option', 'aria-selected': 'false', onclick: () => { this.onPick(d); this.close(); this.input.blur(); } },
        h('span', { class: `kind kind-${d.kind}` }, kindKey ? t(kindKey) : d.kind), ' ', h('b', {}, n.primary, secondaryName(n)),
        h('div', { class: 'muted small' }, d.summary.slice(0, 110))));
    });
    this.list.hidden = false; this.input.setAttribute('aria-expanded', 'true');
    this.setActive(0);
  }
}
