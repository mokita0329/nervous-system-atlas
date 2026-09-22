/**
 * Which of the two apps this page is: the lesion simulator, or the anatomy atlas it grew out of.
 *
 * The switch is a query-string parameter rather than part of the hash, so it survives every later hash
 * navigation the app does to itself, and it is remembered for the tab — which is what lets the atlas's own
 * end-to-end tests opt in once, at the first `goto`, and keep the atlas for the rest of the run.
 *
 * Nothing is deleted in atlas mode and nothing is deleted in sim mode: both shells are built from the same
 * panels, and a CSS attribute on <html> decides which of them the reader sees.
 */
export type Mode = 'sim' | 'atlas';

const KEY = 'atlas.mode';
const isMode = (v: unknown): v is Mode => v === 'sim' || v === 'atlas';

export function currentMode(): Mode {
  const asked = new URLSearchParams(location.search).get('mode');
  if (isMode(asked)) {
    try { sessionStorage.setItem(KEY, asked); } catch { /* private window: the URL alone still decides */ }
    return asked;
  }
  try {
    const kept = sessionStorage.getItem(KEY);
    if (isMode(kept)) return kept;
  } catch { /* ignore */ }
  return 'sim';
}
