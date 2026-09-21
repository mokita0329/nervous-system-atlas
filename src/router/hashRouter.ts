import type { Store } from '../state/store.ts';
import { isContrast, type AppState, type Axis, type Contrast } from '../types/state.ts';
import type { Locale } from '../i18n/index.ts';

export type Route =
  | { kind: 'home' }
  | { kind: 'structure'; id: string }
  | { kind: 'syndrome'; id: string; step?: number }
  | { kind: 'pathway'; id: string }
  | { kind: 'quiz'; index?: number }
  | { kind: 'glossary'; id?: string }
  | { kind: 'topic'; id?: string }
  | { kind: 'about' }
  | { kind: 'slice' };

/**
 * The part of a link that the app's own hash rewriting leaves out: everything the reader can change about
 * the scene beyond the slice positions and the contrast. "Share view" writes these; a plain link never carries
 * them, so ordinary URLs stay short.
 */
export interface ViewParams {
  cam?: [number, number, number, number, number, number];   // camera position, then its orbit target, MNI mm
  sys?: string[];                                            // visible systems (an empty list = none)
  show?: string[]; hide?: string[];                          // per-mesh overrides on top of the systems
  sl?: string;                                               // visible slices as letters of a/c/s, '-' for none
  peel?: string;                                             // clipping, e.g. "ap,sn": axis letter, then p/n for the side kept
  pin?: boolean;                                             // slices pinned (a selection does not move them)
}
export interface RouteParams extends ViewParams { ax?: number; cor?: number; sag?: number; c?: Contrast; side?: 'l' | 'r'; lang?: Locale }
const ID = /^[a-z0-9._-]+$/i;
const AXES: Axis[] = ['axial', 'coronal', 'sagittal'];

export function parseHash(hash: string): { route: Route; params: RouteParams } {
  const h = hash.replace(/^#\/?/, '');
  const [path, query = ''] = h.split('?');
  const q = new URLSearchParams(query);
  const num = (k: string): number | undefined => { const v = q.get(k); if (v === null) return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; };
  const params: RouteParams = { ax: num('ax'), cor: num('cor'), sag: num('sag') };
  const c = q.get('c'); if (isContrast(c)) params.c = c;
  const side = q.get('side'); if (side === 'l' || side === 'r') params.side = side;
  const lang = q.get('lang'); if (lang === 'en' || lang === 'tr' || lang === 'ja') params.lang = lang;
  const cam = q.get('cam'); if (cam) { const n = cam.split(',').map(Number); if (n.length === 6 && n.every(Number.isFinite)) params.cam = n as ViewParams['cam']; }
  for (const k of ['sys', 'show', 'hide'] as const) { const v = q.get(k); if (v !== null) params[k] = v.split(',').filter((x) => ID.test(x)); }
  const sl = q.get('sl'); if (sl !== null && /^(-|[acs]{0,3})$/.test(sl)) params.sl = sl;
  const peel = q.get('peel'); if (peel && /^[acs][pn](,[acs][pn])*$/.test(peel)) params.peel = peel;
  if (q.get('pin') === '1') params.pin = true;
  const seg = (path ?? '').split('/').filter(Boolean);
  let route: Route = { kind: 'home' };
  if (seg[0] === 'structure' && seg[1]) route = { kind: 'structure', id: seg[1] };
  else if (seg[0] === 'syndrome' && seg[1]) route = { kind: 'syndrome', id: seg[1], step: num('step') };
  else if (seg[0] === 'pathway' && seg[1]) route = { kind: 'pathway', id: seg[1] };
  else if (seg[0] === 'quiz') route = { kind: 'quiz', index: seg[1] ? Number(seg[1]) - 1 : undefined };
  else if (seg[0] === 'glossary') route = { kind: 'glossary', id: seg[1] };
  else if (seg[0] === 'topic') route = { kind: 'topic', id: seg[1] };
  else if (seg[0] === 'about') route = { kind: 'about' };
  else if (seg[0] === 'slice') route = { kind: 'slice' };
  return { route, params };
}

export function serialize(route: Route, params: RouteParams): string {
  let path = '';
  if (route.kind === 'structure') path = `structure/${route.id}`;
  else if (route.kind === 'syndrome') path = `syndrome/${route.id}`;
  else if (route.kind === 'pathway') path = `pathway/${route.id}`;
  else if (route.kind === 'quiz') path = route.index !== undefined ? `quiz/${route.index + 1}` : 'quiz';
  else if (route.kind === 'glossary') path = route.id ? `glossary/${route.id}` : 'glossary';
  else if (route.kind === 'topic') path = route.id ? `topic/${route.id}` : 'topic';
  else if (route.kind === 'about') path = 'about';
  else if (route.kind === 'slice') path = 'slice';
  const q = new URLSearchParams();
  if (route.kind === 'syndrome' && route.step !== undefined) q.set('step', String(route.step));
  if (params.ax !== undefined) q.set('ax', String(params.ax));
  if (params.cor !== undefined) q.set('cor', String(params.cor));
  if (params.sag !== undefined) q.set('sag', String(params.sag));
  if (params.c) q.set('c', params.c);
  if (params.side) q.set('side', params.side);
  if (params.lang) q.set('lang', params.lang);
  if (params.cam) q.set('cam', params.cam.map((x) => String(Math.round(x * 10) / 10)).join(','));
  if (params.sys) q.set('sys', params.sys.join(','));
  if (params.show?.length) q.set('show', params.show.join(','));
  if (params.hide?.length) q.set('hide', params.hide.join(','));
  if (params.sl !== undefined) q.set('sl', params.sl);
  if (params.peel) q.set('peel', params.peel);
  if (params.pin) q.set('pin', '1');
  const qs = q.toString().replace(/%2C/g, ',');      // commas are safe in a fragment, and the lists read better
  return `#/${path}${qs ? '?' + qs : ''}`;
}

/** The route the state is in: an active syndrome wins, then an open panel, then the selection, else the plain view. */
export function routeOf(s: AppState): Route {
  const syn = s.syndrome; const panel = s.panel; const sel = s.selectedId ?? s.selectedStructureId;
  if (syn) return { kind: 'syndrome', id: syn.id, step: syn.step >= 0 ? syn.step : undefined };
  if (panel?.kind === 'quiz') return { kind: 'quiz', index: panel.index };
  if (panel?.kind === 'glossary') return { kind: 'glossary', id: panel.id ?? undefined };
  if (panel?.kind === 'topic') return { kind: 'topic', id: panel.id ?? undefined };
  if (panel?.kind === 'about') return { kind: 'about' };
  if (panel?.kind === 'pathway') return { kind: 'pathway', id: panel.id };
  if (sel) return { kind: 'structure', id: sel };
  return { kind: 'slice' };
}

/** The params every link carries: slice positions, a non-default contrast, the demo side, a non-default language. */
export function paramsOf(s: AppState): RouteParams {
  return { ax: s.slices.axial, cor: s.slices.coronal, sag: s.slices.sagittal, c: s.contrast !== 't1w' ? s.contrast : undefined,
    side: s.syndrome && s.lesionSide ? s.lesionSide : undefined, lang: s.locale === 'en' ? undefined : s.locale };
}

/** The rest of the view, for a link that reproduces the scene exactly (camera, what is shown, slices, peels). */
export function viewParams(s: AppState, cam: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }): ViewParams {
  const sl = AXES.filter((a) => s.slices.visible[a]).map((a) => a[0]).join('') || '-';
  const peel = AXES.filter((a) => s.peel[a]).map((a) => a[0] + (s.peel[a] === 'positive' ? 'p' : 'n')).join(',');
  return { cam: [cam.position.x, cam.position.y, cam.position.z, cam.target.x, cam.target.y, cam.target.z],
    sys: [...s.visibleSystems], show: [...s.shownStructures], hide: [...s.hiddenStructures], sl, peel: peel || undefined, pin: s.slices.pinned || undefined };
}

/** Two-way binding: hashchange → handlers; store → location.hash (debounced, replaceState). */
export function bindRouter(store: Store<AppState>, handlers: { onRoute(route: Route, params: RouteParams): void }): () => void {
  let applying = false;
  let timer = 0;
  // a navigation drops any rewrite still queued from the state before it, which would otherwise land on top of the new hash
  const apply = () => { clearTimeout(timer); applying = true; try { const { route, params } = parseHash(location.hash); handlers.onRoute(route, params); } finally { applying = false; } };
  window.addEventListener('hashchange', apply);
  const unsub = store.subscribe((s) => [s.selectedId ?? s.selectedStructureId, s.syndrome?.id ?? null, s.syndrome?.step ?? -1, s.slices.axial, s.slices.coronal, s.slices.sagittal, s.contrast, s.syndrome ? s.lesionSide : null, s.panel, s.locale] as const, (v) => {
    if (applying) return;
    clearTimeout(timer);
    // `location.hash = x` changes the URL at once but delivers hashchange later; a rewrite that fires in
    // between would put the old route back and the handler would then read that. So a rewrite only lands
    // on the hash it was scheduled from.
    const from = location.hash;
    timer = window.setTimeout(() => {
      if (location.hash !== from) return;
      const s = store.get();
      const hash = serialize(routeOf(s), paramsOf(s));
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }, 150);
  }, (a, b) => a.every((x, i) => x === b[i] || (i === 8 && JSON.stringify(x) === JSON.stringify(b[i]))));
  apply();
  return () => { window.removeEventListener('hashchange', apply); unsub(); };
}
