import { test, expect, type Page } from '@playwright/test';

// CI runs on a GPU-less runner where WebGL is software-rendered and everything is several times slower
const SLOW = process.env['CI'] ? 4 : 1;

// Smoke tests against the dev server (npm run dev). Run: npx playwright install chromium && npm run e2e
const errors: string[] = [];
async function boot(page: Page, hash = ''): Promise<void> {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`/?mode=atlas${hash}`);
  await page.waitForFunction(() => (window as unknown as { atlas?: { store: { get(): { loaded: { manifest: boolean } } } } }).atlas?.store.get().loaded.manifest === true, null, { timeout: 60_000 * SLOW });
}
const atlas = (page: Page) => page.evaluate(() => { const a = (window as unknown as { atlas: { store: { get(): Record<string, unknown> }; manifest: { meshes: unknown[] }; registry: { loaded(): Iterable<unknown> } } }).atlas; const st = a.store.get(); return { state: st, involved: [...(st['involved'] as Set<string>)], meshes: a.manifest.meshes.length, loaded: [...a.registry.loaded()].length }; });

test('loads without console errors and renders meshes', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);
  await boot(page);
  await page.waitForFunction(() => [...(window as unknown as { atlas: { registry: { loaded(): Iterable<unknown> } } }).atlas.registry.loaded()].length > 20, null, { timeout: 120_000 * SLOW });
  const a = await atlas(page);
  expect(a.meshes).toBeGreaterThan(400);
  expect(errors.filter((e) => !/favicon/.test(e))).toEqual([]);
});

test('selecting from the tree updates the content panel and the hash', async ({ page }) => {
  await boot(page);
  await page.fill('.tree-filter', 'putamen');
  await page.locator('#left').getByText('Putamen', { exact: false }).first().click();
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText(/Putamen/i, { timeout: 20_000 * SLOW });
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/#\/structure\/putamen/);
});

test('syndrome route dims the scene, marks involved meshes and steps deficits', async ({ page }) => {
  await boot(page, '#/syndrome/syn-wallenberg-lateral-medullary?step=1');
  await expect(page.locator('#syndrome-bar')).toBeVisible({ timeout: 30_000 * SLOW });
  await expect(page.locator('#syndrome-bar')).toContainText('Wallenberg');
  const a = await atlas(page);
  expect((a.state['syndrome'] as { step: number }).step).toBe(1);
  expect(a.involved.length).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#syndrome-bar')).toBeHidden({ timeout: 30_000 * SLOW });
});

test('quiz answers and glossary render', async ({ page }) => {
  await boot(page, '#/quiz/1');
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText('Clinical vignette 1');
  await page.keyboard.press('b');
  await expect(page.locator('.reveal')).toBeVisible();
  await page.goto('/?mode=atlas#/glossary/g-decussation');
  await expect(page.locator('.gterm.active h3')).toContainText('Decussation');
});

test('real mouse input: click selects, drag orbits, nothing hidden covers the canvas', async ({ page }) => {
  test.setTimeout(120_000 * SLOW);
  await boot(page);
  await page.waitForFunction(() => [...(window as unknown as { atlas: { registry: { loaded(): Iterable<unknown> } } }).atlas.registry.loaded()].length > 100, null, { timeout: 90_000 * SLOW });
  const box = (await page.locator('#gl').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  // no [hidden] element may still be laid out (that was the bug: overlays with display:flex swallowed pointer events)
  const covering = await page.evaluate(([x, y]) => {
    const el = document.elementFromPoint(x!, y!);
    const bad = [...document.querySelectorAll('[hidden]')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.id || e.className);
    return { center: el?.id ?? null, bad };
  }, [cx, cy]);
  expect(covering).toEqual({ center: 'gl', bad: [] });
  await page.mouse.click(cx, cy);
  await expect.poll(() => page.evaluate(() => (window as unknown as { atlas: { store: { get(): { selectedId: string | null } } } }).atlas.store.get().selectedId), { timeout: 10_000 * SLOW }).not.toBeNull();
  const before = await page.evaluate(() => (window as unknown as { atlas: { sm: { camera: { position: { toArray(): number[] } } } } }).atlas.sm.camera.position.toArray());
  await page.mouse.move(cx - 80, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(cx - 80 + i * 16, cy + i * 4);
  await page.mouse.up();
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => (window as unknown as { atlas: { sm: { camera: { position: { toArray(): number[] } } } } }).atlas.sm.camera.position.toArray());
  const moved = Math.hypot(after[0]! - before[0]!, after[1]! - before[1]!, after[2]! - before[2]!);
  expect(moved).toBeGreaterThan(20);
  // a drag must not count as a click (selection unchanged by the orbit)
  const sel = await page.evaluate(() => (window as unknown as { atlas: { store: { get(): { selectedId: string | null } } } }).atlas.store.get().selectedId);
  expect(sel).not.toBeNull();
});

test('topic route spotlights its meshes and selecting a structure returns to the structure panel', async ({ page }) => {
  await boot(page, '#/topic/topic-epilepsy-localization');
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText(/Epilepsy/i, { timeout: 30_000 * SLOW });
  await expect.poll(() => page.evaluate(() => [...(window as unknown as { atlas: { store: { get(): { involved: Set<string> } } } }).atlas.store.get().involved].length), { timeout: 30_000 * SLOW }).toBeGreaterThan(3);
  await page.fill('.tree-filter', 'putamen');
  await page.locator('#left').getByText('Putamen', { exact: false }).first().click();
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText(/Putamen/i, { timeout: 20_000 * SLOW });
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/#\/structure\/putamen/);
});

test('the sources tab lists open-access citations that link to free full text', async ({ page }) => {
  await boot(page, '#/structure/putamen');
  await page.locator('#right .tabs button', { hasText: 'Sources' }).click();
  const link = page.locator('#right .section .cite a').first();
  await expect(link).toBeVisible({ timeout: 20_000 * SLOW });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', /^https:\/\/(www\.ncbi\.nlm\.nih\.gov\/books\/NBK|pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC)/);
  await expect(page.locator('#right .section')).not.toContainText(/Snell|Berkowitz/i);
});

// ---- left tree: group visibility -------------------------------------------------
type TreeWin = { atlas: { manifest: { systems: { id: string }[]; meshes: { id: string; system: string; subsystem?: string }[] };
  registry: { loaded(): Iterable<{ userData: { id: string }; visible: boolean }>; byId: Map<string, { visible: boolean }> };
  store: { get(): { visibleSystems: Set<string>; shownStructures: Set<string>; hiddenStructures: Set<string> } } } };

/** how many meshes of one tree group are actually visible in the scene right now */
const groupVisible = (page: Page, key: string) => page.evaluate((k) => {
  const a = (window as unknown as TreeWin).atlas;
  const [sys, sub = ''] = k.split('/');
  const ids = new Set(a.manifest.meshes.filter((m) => m.system === sys && (m.subsystem ?? '') === sub).map((m) => m.id));
  let visible = 0;
  for (const m of a.registry.loaded()) if (ids.has(m.userData.id) && m.visible) visible++;
  return { total: ids.size, visible };
}, key);

const sceneVisible = (page: Page) => page.evaluate(() => {
  let n = 0;
  for (const m of (window as unknown as TreeWin).atlas.registry.loaded()) if (m.visible) n++;
  return n;
});

test('tree groups: a subsystem checkbox shows/hides all of its meshes, tri-state and all', async ({ page }) => {
  test.setTimeout(120_000 * SLOW);
  await boot(page);
  await page.waitForFunction(() => [...(window as unknown as { atlas: { registry: { loaded(): Iterable<unknown> } } }).atlas.registry.loaded()].length > 20, null, { timeout: 90_000 * SLOW });
  await page.locator('.tree-sys .name', { hasText: 'Cerebrum' }).first().click();
  const sub = page.locator('.tree-sub').first();
  const key = (await sub.getAttribute('data-group'))!;
  expect(key).toContain('/');
  const box = sub.locator('input[type=checkbox]');
  const total = (await groupVisible(page, key)).total;
  expect(total).toBeGreaterThan(0);
  // tick → every mesh in the group is on (even the ones the manifest hides by default)
  await box.click();
  await expect.poll(() => groupVisible(page, key).then((g) => g.visible), { timeout: 30_000 * SLOW }).toBe(total);
  expect(await box.isChecked()).toBe(true);
  expect(await box.evaluate((e: HTMLInputElement) => e.indeterminate)).toBe(false);
  // untick → all of them off
  await box.click();
  await expect.poll(() => groupVisible(page, key).then((g) => g.visible), { timeout: 30_000 * SLOW }).toBe(0);
  expect(await box.isChecked()).toBe(false);
  // a single structure back on inside the group → the group box goes indeterminate
  await page.locator(`.tree-sub[data-group="${key}"]`).click();          // expand it
  await page.locator('.tree-row input[type=checkbox]').first().click();
  await expect.poll(() => page.locator(`.tree-sub[data-group="${key}"] input`).evaluate((e: HTMLInputElement) => e.indeterminate), { timeout: 20_000 * SLOW }).toBe(true);
});

test('tree master switch turns every structure on and off, and Defaults restores the start view', async ({ page }) => {
  // "all on" pulls every one of the ~660 meshes in, which saturates the main thread under the
  // software renderer a headless run uses — hence the roomy budget; the store itself changes synchronously.
  test.setTimeout(420_000 * SLOW);
  await boot(page);
  await page.waitForFunction(() => [...(window as unknown as { atlas: { registry: { loaded(): Iterable<unknown> } } }).atlas.registry.loaded()].length > 20, null, { timeout: 90_000 * SLOW });
  const before = await sceneVisible(page);
  expect(before).toBeGreaterThan(0);
  // first click: everything on (all systems, every mesh forced visible)
  await page.locator('.master-box').click();
  await expect.poll(() => page.evaluate(() => {
    const a = (window as unknown as TreeWin).atlas; const s = a.store.get();
    return s.visibleSystems.size === a.manifest.systems.length && s.shownStructures.size === a.manifest.meshes.length && s.hiddenStructures.size === 0;
  }), { timeout: 90_000 * SLOW }).toBe(true);
  // let the ~660 meshes finish arriving: while they decode, the main thread starves input and the
  // next click can sit in the queue for a long time
  await page.waitForFunction(() => {
    const a = (window as unknown as TreeWin).atlas;
    return [...a.registry.loaded()].length === a.manifest.meshes.length;
  }, null, { timeout: 240_000 * SLOW });
  await expect(page.locator('.master-box')).toBeChecked();
  // second click: nothing at all
  await page.locator('.master-box').click();
  await expect.poll(() => page.evaluate(() => {
    const s = (window as unknown as TreeWin).atlas.store.get();
    return s.visibleSystems.size + s.shownStructures.size + s.hiddenStructures.size;
  }), { timeout: 60_000 * SLOW }).toBe(0);
  await expect.poll(() => sceneVisible(page), { timeout: 60_000 * SLOW }).toBe(0);
  // Defaults: back to the manifest's own view (more meshes have finished loading by now, so
  // compare the state rather than a count taken while the scene was still filling in)
  await page.locator('.tree-master button').click();
  await expect.poll(() => page.evaluate(() => {
    const a = (window as unknown as TreeWin).atlas; const s = a.store.get();
    return { shown: s.shownStructures.size, hidden: s.hiddenStructures.size, systems: s.visibleSystems.size };
  }), { timeout: 60_000 * SLOW }).toEqual({ shown: 0, hidden: 0, systems: (await page.evaluate(() => (window as unknown as { atlas: { manifest: { systems: { defaultVisible?: boolean }[] } } }).atlas.manifest.systems.filter((x) => x.defaultVisible).length)) });
  const after = await sceneVisible(page);
  expect(after).toBeGreaterThanOrEqual(before);
  expect(after).toBeLessThan(await page.evaluate(() => (window as unknown as TreeWin).atlas.manifest.meshes.length));
});

// ---- camera interaction budget --------------------------------------------------
type PerfWin = { atlas: { picker: { picks: number }; sm: { renders: number } } };
const counters = (page: Page) => page.evaluate(() => ({ picks: (window as unknown as PerfWin).atlas.picker.picks, renders: (window as unknown as PerfWin).atlas.sm.renders }));

test('interaction budget: a drag runs no hover raycasts, the view settles and the loop idles', async ({ page }) => {
  test.setTimeout(300_000 * SLOW);
  await boot(page);
  await page.waitForFunction(() => [...(window as unknown as { atlas: { registry: { loaded(): Iterable<unknown> } } }).atlas.registry.loaded()].length > 100, null, { timeout: 120_000 * SLOW });
  await page.waitForTimeout(3000);
  const box = (await page.locator('#gl').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  for (const quality of ['low', 'high'] as const) {
    await page.evaluate((q) => (window as unknown as { atlas: { store: { set(p: { quality: string }): void } } }).atlas.store.set({ quality: q }), quality);
    await page.waitForTimeout(1500);
    await page.mouse.move(cx - 250, cy - 80);
    await page.waitForTimeout(400);
    await page.evaluate(() => { const w = window as unknown as { __frames: number[] }; w.__frames = []; let last = performance.now(); const tick = (): void => { const n = performance.now(); w.__frames.push(n - last); last = n; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    const start = await counters(page);
    await page.mouse.down();
    // few steps on purpose: headless Chromium software-renders ~600 meshes at about 1 fps, and every
    // mouse.move waits for a frame. The counters below do not depend on how fast the frames come.
    for (let i = 1; i <= 10; i++) await page.mouse.move(cx - 250 + i * 40, cy - 80 + Math.sin(i / 2) * 40);
    const during = await counters(page);
    await page.mouse.up();
    // a BVH raycast over ~600 meshes must not run while the pointer is steering the camera
    expect(during.picks - start.picks).toBe(0);
    const frames = await page.evaluate(() => { const w = window as unknown as { __frames: number[] }; const f = [...w.__frames]; w.__frames = []; return f; });
    const sorted = [...frames].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    console.log(`[${quality}] drag: ${during.renders - start.renders} frames, p50 ${sorted[Math.floor(sorted.length / 2)]?.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms, picks ${during.picks - start.picks}`);
    // the flick coasts briefly and stops instead of drifting
    await page.waitForTimeout(1500);
    const settled = await counters(page);
    const idle0 = settled.renders;
    await page.waitForTimeout(2000);
    const idle1 = (await counters(page)).renders;
    console.log(`[${quality}] coast after release: ${settled.renders - during.renders} frames · idle 2 s: ${idle1 - idle0} renders`);
    expect(settled.renders - during.renders).toBeLessThan(60);   // ~1 s of damping tail at 60 Hz would be 60+
    // render-on-demand: a continuous loop would draw once per animation frame (~120 over 2 s in a
    // real browser). A handful is fine — background LOD upgrades still request the odd frame.
    expect(idle1 - idle0).toBeLessThanOrEqual(10);
  }
});

// ---- PAM50 spinal levels on the cord slices ------------------------------------
type SpineWin = { atlas: {
  store: { get(): { loaded: { cord: boolean }; selectedId: string | null; cordLevel: number | null }; set(p: Record<string, unknown>): void };
  spine: { byId: Map<number, { name: string; meshId: string; region: string }>; vol: { dims: [number, number, number]; data: ArrayLike<number> } } | null;
  cordGrid: { affine: { elements: number[] } } | null;
  uniforms: { uHasSpine: { value: number }; uSpineSel: { value: number }; uSpineHover: { value: number } };
  sm: { camera: { fov: number; up: { set(x: number, y: number, z: number): void }; near: number; far: number; updateProjectionMatrix(): void };
        controls: { target: { set(x: number, y: number, z: number): void }; update(): void };
        moveCamera(p: { x: number; y: number; z: number }, t: { x: number; y: number; z: number }, ms: number): void; requestRender(): void };
} };

/** Point the camera straight down the cord at a world point, near-orthographically (see scripts/shots-cord.mjs). */
async function lookDownCord(page: Page, at: { x: number; y: number; z: number }, half = 22): Promise<void> {
  await page.evaluate(([at, half]) => {
    const a = (window as unknown as SpineWin).atlas;
    a.sm.controls.target.set(at.x, at.y, at.z);
    a.sm.camera.up.set(0, 1, 0);
    a.sm.camera.fov = 6;
    const dist = (half / Math.tan((a.sm.camera.fov * Math.PI) / 360)) * 1.05;
    a.sm.moveCamera({ x: at.x, y: at.y, z: at.z + dist }, at, 0);
    a.sm.camera.near = 1; a.sm.camera.far = 4000; a.sm.camera.updateProjectionMatrix();
    a.sm.controls.update(); a.sm.requestRender();
  }, [at, half] as const);
  await page.waitForTimeout(1200);
}

test('cord slices: the spinal level under the cursor is named, and clicking it selects the cord segment', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);
  const errorsBefore = errors.length;
  await boot(page);
  await page.waitForFunction(() => (window as unknown as { atlas: { store: { get(): { loaded: { volume: boolean } } } } }).atlas.store.get().loaded.volume === true, null, { timeout: 120_000 * SLOW });
  // cord MRI on, no meshes at all so the raycast can only land on the slice plane
  await page.evaluate(() => {
    const a = (window as unknown as SpineWin).atlas;
    a.store.set({ cordMri: true, contrast: 't2w', visibleSystems: new Set(), shownStructures: new Set(), hiddenStructures: new Set(),
      overlay: { opacity: 0.75, showAllLabels: true, territory: false, tracts: false } });
  });
  await page.waitForFunction(() => (window as unknown as SpineWin).atlas.store.get().loaded.cord === true, null, { timeout: 120_000 * SLOW });
  await page.waitForFunction(() => (window as unknown as SpineWin).atlas.spine !== null, null, { timeout: 60_000 * SLOW });
  // the level volume and its LUT reached the shader
  expect(await page.evaluate(() => (window as unknown as SpineWin).atlas.uniforms.uHasSpine.value)).toBe(1);
  expect(await page.evaluate(() => (window as unknown as SpineWin).atlas.spine!.byId.size)).toBe(30);
  // the centre of a level, in mm, from the level volume the app loaded — whichever cord template this edition
  // ships (PAM50 privately, the composed open one publicly); the released bundle carries no other level geometry
  const centre = (name: string) => page.evaluate((name) => {
    const a = (window as unknown as SpineWin).atlas;
    const id = [...a.spine!.byId].find(([, e]) => e.name === name)![0];
    const { dims, data } = a.spine!.vol; const e = a.cordGrid!.affine.elements;
    let n = 0, si = 0, sj = 0, sk = 0;
    for (let k = 0; k < dims[2]; k++) for (let j = 0; j < dims[1]; j++) { const row = dims[0] * (j + dims[1] * k); for (let i = 0; i < dims[0]; i++) if (data[row + i] === id) { n++; si += i; sj += j; sk += k; } }
    const i = si / n, j = sj / n, k = sk / n;
    return { x: e[0]! * i + e[4]! * j + e[8]! * k + e[12]!, y: e[1]! * i + e[5]! * j + e[9]! * k + e[13]!, z: e[2]! * i + e[6]! * j + e[10]! * k + e[14]! };
  }, name);
  const c5 = await centre('C5');
  expect(c5.z).toBeLessThan(-110);
  await page.evaluate((c5) => {
    (window as unknown as SpineWin).atlas.store.set({ slices: { axial: Math.round(c5.z), coronal: Math.round(c5.y), sagittal: Math.round(c5.x), visible: { axial: true, coronal: false, sagittal: false }, pinned: true } });
  }, c5);
  await lookDownCord(page, c5);
  const box = (await page.locator('#gl').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx - 30, cy - 30);
  await page.mouse.move(cx, cy);
  // hovering the cord slice names the level in the MNI readout and lights that level up on the slice
  await expect.poll(() => page.locator('.hud').textContent(), { timeout: 30_000 * SLOW }).toMatch(/C5 · cervical segment/);
  expect(await page.evaluate(() => (window as unknown as SpineWin).atlas.store.get().cordLevel)).toBe(5);
  expect(await page.evaluate(() => (window as unknown as SpineWin).atlas.uniforms.uSpineHover.value)).toBe(1 << 5);

  // clicking the level selects the cord segment that contains it, and the shader gets its outline mask
  await page.mouse.click(cx, cy);
  // the cord segment the LUT itself names for this level (spinal-segment-cervical privately, its
  // vertebral-landmark counterpart in the public edition)
  const segmentOf = (id: number) => page.evaluate((n) => (window as unknown as SpineWin).atlas.spine!.byId.get(n)!.meshId, id);
  await expect.poll(() => page.evaluate(() => (window as unknown as SpineWin).atlas.store.get().selectedId), { timeout: 20_000 * SLOW }).toBe(await segmentOf(5));
  expect(await page.evaluate(() => (window as unknown as SpineWin).atlas.uniforms.uSpineSel.value)).toBe(0b111111110);

  // one level lower down the cord the readout follows the level, not the click
  const t10 = await centre('T10');
  await page.evaluate((t10) => {
    const a = (window as unknown as SpineWin).atlas;
    a.store.set({ slices: { axial: Math.round(t10.z), coronal: Math.round(t10.y), sagittal: Math.round(t10.x), visible: { axial: true, coronal: false, sagittal: false }, pinned: true } });
  }, t10);
  await lookDownCord(page, t10);
  await page.mouse.move(cx - 30, cy - 30);
  await page.mouse.move(cx, cy);
  await expect.poll(() => page.locator('.hud').textContent(), { timeout: 30_000 * SLOW }).toMatch(/T10 · thoracic segment/);
  await page.mouse.click(cx, cy);
  await expect.poll(() => page.evaluate(() => (window as unknown as SpineWin).atlas.store.get().selectedId), { timeout: 20_000 * SLOW }).toBe(await segmentOf(18));
  expect(errors.slice(errorsBefore).filter((e) => !/favicon/.test(e))).toEqual([]);
});

// ---- about and credits (#/about) -------------------------------------------------
type AboutWin = { atlas: { manifest: { edition?: string; sources: Record<string, { license: string; citation: string }>; licenses: Record<string, unknown> } } };

/** One round trip that reads the whole credits table out of the DOM (a per-row locator loop is far too slow here). */
const auditAbout = (page: Page) => page.evaluate(() => {
  const m = (window as unknown as AboutWin).atlas.manifest;
  const rows = [...document.querySelectorAll('#right .content:not([hidden]) .about-sources tbody tr')];
  return {
    manifestSources: Object.keys(m.sources).sort(),
    manifestLicences: Object.keys(m.licenses).length,
    edition: m.edition ?? 'private',
    rows: rows.map((r) => ({
      id: (r as HTMLElement).dataset['source'] ?? '',
      licenceHref: r.querySelector('.about-lic a')?.getAttribute('href') ?? '',
      licenceName: r.querySelector('.about-lic a')?.textContent ?? '',
      citation: r.querySelector('.cite-text')?.textContent ?? '',
      sourceHref: r.querySelector('.src-link')?.getAttribute('href') ?? '',
      origin: r.querySelector('.src-origin')?.textContent?.trim() ?? '',
      meshes: r.querySelector('.num')?.textContent ?? '',
      badge: !!r.querySelector('.badge-nc'),
    })),
    licenceSections: document.querySelectorAll('#right .content:not([hidden]) .licence-details').length,
    editionTag: document.querySelector('#about-edition')?.textContent ?? '',
    codeLicence: document.querySelector('#about-code-licence')?.getAttribute('href') ?? '',
    dataLicence: document.querySelector('#about-data-licence')?.getAttribute('href') ?? '',
  };
});

test('the About panel credits every data source in the manifest, each with a licence link', async ({ page }) => {
  test.setTimeout(240_000 * SLOW);
  const errorsBefore = errors.length;
  await boot(page, '#/about');
  const panel = page.locator('#right .content:not([hidden])');
  await expect(panel.locator('h2').first()).toContainText('About and credits', { timeout: 60_000 * SLOW });
  await expect.poll(() => auditAbout(page).then((a) => a.rows.length), { timeout: 30_000 * SLOW }).toBeGreaterThan(5);

  const a = await auditAbout(page);
  // one row per manifest source, with the same ids
  expect(a.rows.map((r) => r.id).sort()).toEqual(a.manifestSources);
  for (const r of a.rows) {
    expect(r.licenceHref, `licence link of ${r.id}`).toMatch(/^https?:\/\//);
    expect(r.licenceName.length, `licence name of ${r.id}`).toBeGreaterThan(3);
    expect(r.citation.length, `citation of ${r.id}`).toBeGreaterThan(20);
    // every source says where it came from: a download link, or a line saying it was built here or read
    // live from an API (the FastSurfer cerebellum segmentation and the terminology sources have no file)
    if (r.sourceHref) expect(r.sourceHref, `download link of ${r.id}`).toMatch(/^https?:\/\//);
    else expect(r.origin.length, `origin line of ${r.id}`).toBeGreaterThan(10);
    expect(Number(r.meshes), `mesh count of ${r.id}`).toBeGreaterThanOrEqual(0);
  }
  expect(a.rows.some((r) => r.badge), 'a restricted source is badged').toBe(a.edition === 'private');
  expect(a.editionTag).toContain(a.edition);
  expect(a.codeLicence).toMatch(/apache\.org\/licenses\/LICENSE-2\.0/);
  expect(a.dataLicence).toMatch(/creativecommons\.org\/licenses\/by-sa\/4\.0/);
  expect(a.licenceSections).toBe(a.manifestLicences);   // one expandable text per licence

  await page.evaluate(() => { document.getElementById('right')!.scrollTop = 0; });
  await page.screenshot({ path: 'qa/shots/about/about-panel.png' });
  await panel.locator('.about-sources').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'qa/shots/about/about-sources.png' });

  // the verbatim licence text really loads out of public/data/licenses/
  const cc = panel.locator('.licence-details', { hasText: 'Attribution-ShareAlike 4.0' }).first();
  await cc.locator('summary').click();
  await expect(cc.locator('.licence-text')).toContainText(/Creative Commons/i, { timeout: 30_000 * SLOW });
  await page.screenshot({ path: 'qa/shots/about/about-licence-text.png' });
  expect(errors.slice(errorsBefore).filter((e) => !/favicon/.test(e))).toEqual([]);
});

test('every structure panel shows a Source line that opens the credits', async ({ page }) => {
  test.setTimeout(240_000 * SLOW);
  await boot(page, '#/structure/putamen');
  const panel = page.locator('#right .content:not([hidden])');
  await expect(panel.locator('h2').first()).toContainText(/Putamen/i, { timeout: 60_000 * SLOW });
  const line = panel.locator('.source-line').first();
  await expect(line).toContainText('Source:', { timeout: 30_000 * SLOW });
  await expect(line.locator('a.src-credit').first()).toHaveAttribute('href', '#/about');
  await expect(line.locator('.src-lic').first()).toContainText(/\(.+\)/);
  await page.screenshot({ path: 'qa/shots/about/structure-source-line.png' });

  const hash = (h: string) => page.evaluate((x) => { location.hash = x; }, h);
  const sourceText = () => page.evaluate(() => document.querySelector('#right .content:not([hidden]) .source-line')?.textContent ?? '');

  // a derived mesh says so, with the construction method in the tooltip
  await hash('#/structure/nerve-phrenic');
  await expect.poll(sourceText, { timeout: 60_000 * SLOW }).toMatch(/Source:.*derived:/s);
  expect((await page.getAttribute('#right .content:not([hidden]) .derived-tag', 'title'))!.length).toBeGreaterThan(40);

  // a pathway credits its stations' sources too
  await hash('#/pathway/pathway-lateral-corticospinal');
  await expect.poll(sourceText, { timeout: 60_000 * SLOW }).toContain('Source:');

  // the credit link and the toolbar button both reach the About panel
  await hash('#/structure/putamen');
  await expect.poll(sourceText, { timeout: 60_000 * SLOW }).toContain('Source:');
  await panel.locator('.source-line a.src-credit').first().click();
  await expect.poll(() => page.evaluate(() => location.hash), { timeout: 30_000 * SLOW }).toBe('#/about');
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText('About and credits', { timeout: 30_000 * SLOW });
  await hash('#/slice');
  await page.locator('.about-btn').click();
  await expect.poll(() => page.evaluate(() => location.hash), { timeout: 30_000 * SLOW }).toBe('#/about');
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText('About and credits', { timeout: 30_000 * SLOW });
});

// ---- interface language (English / Türkçe / 日本語) ---------------------------------
/** boot() only waits for the manifest; the Turkish names live in the content bundle. */
async function bootWithContent(page: Page, hash: string): Promise<void> {
  await boot(page, hash);
  await page.waitForFunction(() => (window as unknown as { atlas: { store: { get(): { loaded: { content: boolean } } } } }).atlas.store.get().loaded.content === true, null, { timeout: 60_000 * SLOW });
}

test('#/...?lang=tr renders the interface and the structure names in Turkish', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);
  await bootWithContent(page, '#/structure/brainstem?lang=tr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  const panel = page.locator('#right .content:not([hidden])');
  // Turkish medical teaching names structures in Latin; the English name stays underneath
  await expect(panel.locator('h2').first()).toContainText('Truncus encephali', { timeout: 30_000 * SLOW });
  await expect(panel.locator('h2 .name-secondary').first()).toHaveText('Brainstem');
  await expect(page.locator('#toolbar')).toContainText('Sözlük');
  await expect(page.locator('#toolbar')).toContainText('Vaka soruları');
  await expect(page.locator('#left .panel-head')).toHaveText('Yapılar');
  await expect(page.locator('#locale-switch')).toHaveText('EN');

  // the clinical prose comes from content.tr.json: the syndrome is named and written in Turkish and carries no English flag
  await page.goto('/?mode=atlas#/syndrome/syn-wallenberg-lateral-medullary?lang=tr');
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText('Lateral medüller sendrom', { timeout: 30_000 * SLOW });
  await expect(page.locator('#right .content:not([hidden])')).toContainText('Klinik tablo');
  await expect(page.locator('#right .content:not([hidden]) .tag.lang-en')).toHaveCount(0);

  // switching back to English drops the flags, the lang attribute and the hash parameter
  await page.locator('#locale-switch').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#right .content:not([hidden]) .tag.lang-en')).toHaveCount(0, { timeout: 20_000 * SLOW });
  await expect(page.locator('#toolbar')).toContainText('Glossary');
  await expect.poll(() => page.evaluate(() => location.hash)).not.toMatch(/lang=/);
});

test('#/...?lang=ja renders the interface and the structure names in Japanese, English underneath', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);
  await bootWithContent(page, '#/structure/brainstem?lang=ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  const panel = page.locator('#right .content:not([hidden])');
  // Japanese teaching names structures in Japanese (content/i18n/ja/names.json), never in Latin
  await expect(panel.locator('h2').first()).toContainText('脳幹', { timeout: 30_000 * SLOW });
  await expect(panel.locator('h2 .name-secondary').first()).toHaveText('Brainstem');
  await expect(page.locator('#toolbar')).toContainText('用語集');
  await expect(page.locator('#left .panel-head')).toHaveText('構造');
  await expect(page.locator('#locale-switch')).toHaveText('EN');
  // an entry without a Japanese overlay keeps its English prose and says so
  await expect(page.locator('#tr-notice')).toBeVisible();
  // from English, the switch offers the edition used last
  await page.locator('#locale-switch').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#locale-switch')).toHaveText('JA');
  await page.evaluate(() => { localStorage.removeItem('atlas.locale.alt'); localStorage.setItem('atlas.locale', 'en'); });
});

test('the L shortcut switches language and the choice survives a reload', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);
  await bootWithContent(page, '#/structure/putamen');
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText(/Putamen/i, { timeout: 30_000 * SLOW });
  await page.keyboard.press('l');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr', { timeout: 20_000 * SLOW });
  await expect(page.locator('#toolbar')).toContainText('Sözlük');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('atlas.locale'))).toBe('tr');
  // no hash: localStorage decides
  await page.goto('/?mode=atlas');
  await page.waitForFunction(() => (window as unknown as { atlas?: { store: { get(): { loaded: { manifest: boolean } } } } }).atlas?.store.get().loaded.manifest === true, null, { timeout: 60_000 * SLOW });
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
  await page.evaluate(() => localStorage.setItem('atlas.locale', 'en'));
});

test('the contrast menu lists the T1, the T2 and every subject scan, and a linked contrast survives the first paint', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);
  type Win = { atlas: { manifest: { volumes: Record<string, { kind?: string; file: string }> }; store: { get(): { contrast: string; loaded: { volume: boolean } } }; uniforms: { uIntensity: { value: { image: { width: number } } } } } };
  await boot(page, '#/slice?c=t2w&ax=-2');
  const keys = await page.evaluate(() => { const v = (window as unknown as Win).atlas.manifest.volumes; return Object.keys(v).filter((k) => k === 't1w' || k === 't2w' || v[k]!.kind === 'subject'); });
  await expect.poll(() => page.locator('select.contrast option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value))).toEqual(keys);
  // the link chose T2; the T1 of the first paint must not replace it once both have arrived
  await page.waitForFunction(() => (window as unknown as Win).atlas.store.get().loaded.volume === true, null, { timeout: 120_000 * SLOW });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => (window as unknown as Win).atlas.store.get().contrast)).toBe('t2w');
  const subject = keys.find((k) => k.startsWith('subject-'));
  if (subject) {
    // an individual's scan: selectable from the menu, on the brain grid, and its option says how it was registered
    await page.selectOption('select.contrast', subject);
    await expect.poll(() => page.evaluate(() => (window as unknown as Win).atlas.store.get().contrast)).toBe(subject);
    await expect(page.locator(`select.contrast option[value="${subject}"]`)).toHaveAttribute('title', /SyN|Affine/);
    await expect.poll(() => page.evaluate(() => location.hash)).toContain(`c=${subject}`);
  }
  // a scan this bundle does not carry is ignored rather than breaking the slices
  await page.evaluate(() => { location.hash = '#/slice?c=subject-nobody&ax=-2'; });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as Win).atlas.store.get().contrast)).toBe(subject ?? 't2w');
});

// ---- interaction correctness: teaching modes, Mirror, slow loads, links (added after an external review)
type StateWin = { atlas: { store: { get(): Record<string, unknown>; set(p: Record<string, unknown>): void }; lesion: { position: { x: number }; visible: boolean };
  registry: { byId: Map<string, { centroid: number[] }> }; sm: { camera: { position: { x: number; y: number; z: number; set(x: number, y: number, z: number): void } }; controls: { target: { x: number; y: number; z: number; set(x: number, y: number, z: number): void }; update(): void } } } };
const overrides = (page: Page) => page.evaluate(() => { const s = (window as unknown as StateWin).atlas.store.get(); return { hidden: [...(s['hiddenStructures'] as Set<string>)], shown: [...(s['shownStructures'] as Set<string>)], involved: [...(s['involved'] as Set<string>)] }; });

test('Mirror moves the lesion marker, the involved meshes, the slices and the link to the other side', async ({ page }) => {
  await boot(page, '#/syndrome/syn-aphasia-broca');
  await expect(page.locator('#syndrome-bar')).toBeVisible({ timeout: 30_000 * SLOW });
  const before = await page.evaluate(() => { const a = (window as unknown as StateWin).atlas; const s = a.store.get(); return { x: a.lesion.position.x, visible: a.lesion.visible, sag: (s['slices'] as { sagittal: number }).sagittal, involved: [...(s['involved'] as Set<string>)] }; });
  expect(before.visible).toBe(true);
  expect(before.x).toBeLessThan(0);
  expect(before.involved.some((m) => m.endsWith('-l'))).toBe(true);
  expect(before.involved.some((m) => m.endsWith('-r'))).toBe(false);
  await page.locator('#syndrome-bar').getByRole('button', { name: /Mirror|Aynala/ }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as StateWin).atlas.lesion.position.x)).toBe(-before.x);
  const after = await page.evaluate(() => { const s = (window as unknown as StateWin).atlas.store.get(); return { sag: (s['slices'] as { sagittal: number }).sagittal, involved: [...(s['involved'] as Set<string>)], side: s['lesionSide'] }; });
  expect(after.side).toBe('r');
  expect(after.sag).toBe(-before.sag);
  expect(after.involved.some((m) => m.endsWith('-r'))).toBe(true);
  expect(after.involved.some((m) => m.endsWith('-l'))).toBe(false);
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/side=r/);
});

test('leaving a syndrome, a pathway, a topic or a quiz reveal leaves the anatomy as it was before', async ({ page }) => {
  await boot(page);
  expect(await overrides(page)).toEqual({ hidden: [], shown: [], involved: [] });
  // a syndrome whose involved meshes include structures that are on screen by default (the cerebrum is)
  await page.evaluate(() => { location.hash = '#/syndrome/syn-aphasia-broca'; });
  await expect(page.locator('#syndrome-bar')).toBeVisible({ timeout: 30_000 * SLOW });
  expect((await overrides(page)).involved.length).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#syndrome-bar')).toBeHidden({ timeout: 30_000 * SLOW });
  expect(await overrides(page)).toEqual({ hidden: [], shown: [], involved: [] });
  // a pathway
  await page.evaluate(() => { location.hash = '#/pathway/pathway-anterior-corticospinal'; });
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText(/corticospinal/i, { timeout: 30_000 * SLOW });
  await page.evaluate(() => { location.hash = '#/slice'; });
  await expect.poll(() => overrides(page)).toEqual({ hidden: [], shown: [], involved: [] });
  // a topic
  await page.evaluate(() => { location.hash = '#/topic/topic-epilepsy-localization'; });
  await expect.poll(() => overrides(page).then((o) => o.involved.length), { timeout: 30_000 * SLOW }).toBeGreaterThan(3);
  await page.evaluate(() => { location.hash = '#/slice'; });
  await expect.poll(() => overrides(page)).toEqual({ hidden: [], shown: [], involved: [] });
  // a quiz reveal
  await page.evaluate(() => { location.hash = '#/quiz'; });
  await expect(page.locator('#right .content:not([hidden]) .opt').first()).toBeVisible({ timeout: 30_000 * SLOW });
  await page.locator('#right .content:not([hidden]) .opt').first().click();
  await expect.poll(() => overrides(page).then((o) => o.involved.length), { timeout: 30_000 * SLOW }).toBeGreaterThan(0);
  await page.evaluate(() => { location.hash = '#/slice'; });
  await expect.poll(() => overrides(page)).toEqual({ hidden: [], shown: [], involved: [] });
});

test('a slower earlier selection cannot move the slices away from the structure selected after it', async ({ page }) => {
  await boot(page);
  // the dev server serves the app's own module, so this is the same selectStructure the tree calls
  await page.evaluate(async () => {
    const { selectStructure } = await import('/src/state/actions.ts') as { selectStructure(app: unknown, id: string, o: Record<string, boolean>): void };
    const a = (window as unknown as StateWin).atlas;
    selectStructure(a, 'putamen-l', { moveSlices: true });
    selectStructure(a, 'hippocampus-r', { moveSlices: true });
  });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => { const a = (window as unknown as StateWin).atlas; const s = a.store.get(); return { sel: s['selectedId'], sag: (s['slices'] as { sagittal: number }).sagittal, want: a.registry.byId.get('hippocampus-r')!.centroid }; });
  expect(r.sel).toBe('hippocampus-r');
  expect(r.sag).toBe(Math.round(r.want[0]!));
});

test('a pathway keeps its link while the reader moves slices and picks waypoints, and survives a reload', async ({ page }) => {
  await boot(page, '#/pathway/pathway-anterior-corticospinal');
  const title = page.locator('#right .content:not([hidden]) h2').first();
  await expect(title).toContainText(/corticospinal/i, { timeout: 30_000 * SLOW });
  await page.mouse.click(700, 450);                    // focus the canvas so the arrow key reaches the app
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#\/pathway\/pathway-anterior-corticospinal\?.*ax=/);
  await page.locator('.wp-pick:enabled').first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as StateWin).atlas.store.get()['selectedId'])).not.toBeNull();
  await expect(title).toContainText(/corticospinal/i);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => location.hash)).toMatch(/^#\/pathway\/pathway-anterior-corticospinal/);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { atlas?: { store: { get(): { loaded: { manifest: boolean } } } } }).atlas?.store.get().loaded.manifest === true, null, { timeout: 60_000 * SLOW });
  await expect(page.locator('#right .content:not([hidden]) h2').first()).toContainText(/corticospinal/i, { timeout: 30_000 * SLOW });
});

test('Share view writes the exact scene into the link, and the link reproduces it', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    const a = (window as unknown as StateWin).atlas;
    a.store.set({ visibleSystems: new Set(['brainstem', 'cerebellum']), shownStructures: new Set(['putamen-l']), hiddenStructures: new Set(['pons']) });
    const sl = a.store.get()['slices'] as Record<string, unknown>;
    a.store.set({ slices: { ...sl, visible: { axial: false, coronal: true, sagittal: true }, pinned: true }, peel: { sagittal: 'positive' }, contrast: 't2w' });
    a.sm.camera.position.set(100, 200, 300); a.sm.controls.target.set(1, 2, 3); a.sm.controls.update();
  });
  await page.getByTestId('share-view').click();
  const hash = await page.evaluate(() => location.hash);
  expect(hash).toMatch(/^#\/slice\?/);
  for (const part of ['cam=100,200,300,1,2,3', 'sys=brainstem,cerebellum', 'show=putamen-l', 'hide=pons', 'sl=cs', 'peel=sp', 'pin=1', 'c=t2w']) expect(hash).toContain(part);
  await expect(page.locator('.toast')).toBeVisible();
  await boot(page, hash);
  await page.waitForTimeout(600);                      // past the boot preset's tween
  const got = await page.evaluate(() => { const a = (window as unknown as StateWin).atlas; const s = a.store.get(); return {
    cam: [a.sm.camera.position.x, a.sm.camera.position.y, a.sm.camera.position.z, a.sm.controls.target.x, a.sm.controls.target.y, a.sm.controls.target.z].map((v) => Math.round(v)),
    sys: [...(s['visibleSystems'] as Set<string>)].sort(), shown: [...(s['shownStructures'] as Set<string>)], hidden: [...(s['hiddenStructures'] as Set<string>)],
    visible: (s['slices'] as { visible: Record<string, boolean> }).visible, pinned: (s['slices'] as { pinned: boolean }).pinned, peel: s['peel'], contrast: s['contrast'] }; });
  expect(got.cam).toEqual([100, 200, 300, 1, 2, 3]);
  expect(got.sys).toEqual(['brainstem', 'cerebellum']); expect(got.shown).toEqual(['putamen-l']); expect(got.hidden).toEqual(['pons']);
  expect(got.visible).toEqual({ axial: false, coronal: true, sagittal: true }); expect(got.pinned).toBe(true);
  expect(got.peel).toEqual({ sagittal: 'positive' }); expect(got.contrast).toBe('t2w');
});

test('quiz answers survive a reload, and the filters narrow the set', async ({ page }) => {
  await boot(page, '#/quiz');
  const opts = page.locator('#right .content:not([hidden]) .opt');
  await expect(opts.first()).toBeVisible({ timeout: 30_000 * SLOW });
  await opts.first().click();
  await expect(page.locator('#right .content:not([hidden]) .reveal')).toBeVisible();
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { atlas?: { store: { get(): { loaded: { manifest: boolean } } } } }).atlas?.store.get().loaded.manifest === true, null, { timeout: 60_000 * SLOW });
  await expect(page.locator('#right .content:not([hidden]) .reveal')).toBeVisible({ timeout: 30_000 * SLOW });
  const filters = page.locator('#right .content:not([hidden]) .quiz-filters select');
  await filters.nth(1).selectOption('3');
  await expect(page.locator('#right .content:not([hidden]) .crumbs')).toContainText(/3\/3|zorluk 3/);
  await expect(page.locator('#right .content:not([hidden]) .crumbs')).toContainText(/1\/3/);
});
