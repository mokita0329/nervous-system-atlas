import type { App } from '../app.ts';
import type { ContentBundle, ContentEntryBase } from '../types/content.ts';
import { en } from './en.ts';
import { ja } from './ja.ts';
import { tr } from './tr.ts';

export type Locale = 'en' | 'tr' | 'ja';
/** English first, then the translated editions in the order they were added. */
export const LOCALES: Locale[] = ['en', 'tr', 'ja'];
/** Every interface string key; `tr.ts` and `ja.ts` are typed against it, so a missing translation fails typecheck. */
export type Key = keyof typeof en;

const TABLES: Record<Locale, Record<string, string>> = { en, tr, ja };
export const LOCALE_KEY = 'atlas.locale';
/** The translated edition the toolbar switch offers next to English: the one used last. */
export const ALT_LOCALE_KEY = 'atlas.locale.alt';

export function isLocale(v: unknown): v is Locale { return typeof v === 'string' && (LOCALES as string[]).includes(v); }

/** The translated edition the browser asks for, if there is one. */
function browserLocale(): Locale | null {
  try {
    const lang = navigator.language.toLowerCase();
    for (const l of LOCALES) if (l !== 'en' && lang.startsWith(l)) return l;
  } catch { /* no navigator */ }
  return null;
}

/** hash `lang` > localStorage > browser language > English. */
function resolve(): Locale {
  try {
    const q = (location.hash.split('?')[1] ?? '');
    const fromHash = new URLSearchParams(q).get('lang');
    if (isLocale(fromHash)) return fromHash;
  } catch { /* no location (unit tests) */ }
  try { const s = localStorage.getItem(LOCALE_KEY); if (isLocale(s)) return s; } catch { /* private mode */ }
  return browserLocale() ?? 'en';
}

let current: Locale = resolve();
try { document.documentElement.lang = current; } catch { /* no document */ }
// a link that opens in a translated edition makes that edition the one the switch offers from English
try { if (current !== 'en') localStorage.setItem(ALT_LOCALE_KEY, current); } catch { /* private mode */ }

const listeners = new Set<(l: Locale) => void>();

export function getLocale(): Locale { return current; }

/** Keep `lang` in the hash without disturbing the route or the other params. */
function writeHashLang(l: Locale): void {
  try {
    const raw = location.hash || '#/';
    const [path, query = ''] = raw.replace(/^#/, '').split('?');
    const q = new URLSearchParams(query);
    if (l === 'en') q.delete('lang'); else q.set('lang', l);
    const qs = q.toString();
    const next = `#${path || '/'}${qs ? '?' + qs : ''}`;
    if (location.hash !== next) history.replaceState(null, '', next);
  } catch { /* no location */ }
}

/**
 * Switch the interface language. Writes the hash and localStorage, moves `<html lang>` and tells
 * every listener; main.ts turns that into `AppState.locale`, which is what the panels re-render from.
 */
export function setLocale(l: Locale): void {
  if (!isLocale(l)) return;
  const changed = l !== current;
  current = l;
  try { localStorage.setItem(LOCALE_KEY, l); if (l !== 'en') localStorage.setItem(ALT_LOCALE_KEY, l); } catch { /* private mode */ }
  try { document.documentElement.lang = l; } catch { /* no document */ }
  writeHashLang(l);
  if (changed) for (const cb of Array.from(listeners)) cb(l);
}

export function onLocaleChange(cb: (l: Locale) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** One interface string, with `{name}` placeholders filled in. Falls back to English, then to the key. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const s = TABLES[current][key] ?? (en as Record<string, string>)[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}

/**
 * The other locale — what the toolbar switch offers. From a translated edition it is always English; from
 * English it is the translated edition used last, else the browser's, else Turkish (the first one added).
 * `?lang=ja` in the hash still selects any edition directly.
 */
export function otherLocale(l: Locale = current): Locale {
  if (l !== 'en') return 'en';
  try { const s = localStorage.getItem(ALT_LOCALE_KEY); if (isLocale(s) && s !== 'en') return s; } catch { /* private mode */ }
  return browserLocale() ?? 'tr';
}

export interface DisplayName {
  /** what to print as the name */
  primary: string;
  /** the English name, when the primary is not it (translated editions only); null otherwise */
  secondary: string | null;
}

export interface NamedEntry { name: string; latin?: string; names?: Partial<Record<Locale, string>> }

/**
 * Display name of a content entry. In `en` nothing changes (the panels keep showing `latin` in the crumbs).
 * Turkish medical teaching names structures in Latin, so in `tr` the primary line is
 * `names.tr ?? latin ?? name`; Japanese teaching uses the Japanese anatomical term, so in `ja` it is
 * `names.ja ?? name`. In both the English name goes underneath when it differs.
 */
export function entryName(e: NamedEntry | undefined | null, fallback = '', locale: Locale = current): DisplayName {
  const name = (e?.name ?? '') || fallback;
  if (locale === 'en') return { primary: name, secondary: null };
  const primary = e?.names?.[locale] ?? (locale === 'tr' ? e?.latin : undefined) ?? name;
  return { primary, secondary: name && name !== primary ? name : null };
}

export type EntryKind = 'structures' | 'pathways' | 'syndromes' | 'glossary' | 'quiz' | 'topics';
export type Rec = ContentEntryBase & Record<string, unknown>;

/** The translated bundle of the current locale (content.<lang>.json), once main.ts has fetched it. */
function translatedBundle(app: App): ContentBundle | null {
  return current === 'en' ? null : app.contentByLang[current] ?? null;
}

/** One content entry in the current language: the translated copy when the locale's bundle has it, else the English one. */
export function entryOf(app: App, kind: EntryKind, id: string): Rec | undefined {
  const tb = translatedBundle(app);
  if (tb) { const e = (tb[kind] as Record<string, Rec> | undefined)?.[id]; if (e) return e; }
  return (app.content?.[kind] as Record<string, Rec> | undefined)?.[id];
}

/** Every entry of a kind in the current language (English entries stand in for the untranslated ones). */
export function entriesOf(app: App, kind: EntryKind): Record<string, Rec> {
  const base = (app.content?.[kind] as Record<string, Rec> | undefined) ?? {};
  const tb = translatedBundle(app);
  if (!tb) return base;
  const tr = (tb[kind] as Record<string, Rec> | undefined) ?? {};
  const out: Record<string, Rec> = {};
  for (const [id, e] of Object.entries(base)) out[id] = tr[id] ?? e;
  return out;
}

/** True when this entry's prose is in the interface language (English mode, or an entry translated into the current locale). */
export function isTranslated(e: { lang?: string } | undefined | null): boolean { return current === 'en' || e?.lang === current; }
export type { ContentBundle };

/**
 * A trailing side marker as the manifest writes it: `(L)`, `(R)`, or `(L, AAN atlas)` where the parenthesis
 * carries something else too. Matched so it can be stripped and re-added in the interface language.
 */
const SIDE_TAIL = /\s*\((?:L|R)(?:,\s*([^)]*))?\)\s*$/i;

/**
 * Put the side into a display name.
 *
 * The two members of a pair share one content entry -- `caudate-nucleus-l` and `-r` both resolve to
 * `caudate-nucleus` -- so a name taken from the entry has no side in it and the tree printed "Caudate nucleus"
 * twice. The mesh record always knows: `side` is "left" or "right". The manifest's own name carries a marker
 * too, but only in English, so any existing one is stripped and rewritten in the current language.
 */
function withSide(n: DisplayName, side: string | undefined): DisplayName {
  if (side !== 'left' && side !== 'right') return n;
  const put = (s: string, mark: string): string => {
    const rest = SIDE_TAIL.exec(s)?.[1];
    const base = s.replace(SIDE_TAIL, '').trim();
    return rest ? `${base} (${mark}, ${rest})` : `${base} (${mark})`;
  };
  const key = side === 'left' ? 'side.l' : 'side.r';
  // the secondary line is the English name, so it keeps the English marker
  return { primary: put(n.primary, t(key)), secondary: n.secondary ? put(n.secondary, en[key]) : null };
}

/** Display name of a mesh: its content entry if it has one, otherwise the manifest label, plus its side. */
export function meshLabel(app: App, meshId: string): DisplayName {
  const mesh = app.registry?.byId.get(meshId) ?? app.manifest.meshes.find((m) => m.id === meshId);
  const sid = app.content?.meshToStructure[meshId] ?? mesh?.structureId ?? null;
  const entry = sid ? (app.content?.structures[sid] as NamedEntry | undefined) : undefined;
  return withSide(entryName(entry, mesh?.name ?? meshId), mesh?.side);
}
