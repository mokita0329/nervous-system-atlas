// The lesion simulator is what the app opens as. These tests hold the three things that make it usable:
// the atlas shell is out of the way, a lesion placed in the internal capsule reports the right body parts
// (and the right spared ones), and a lesion survives being turned into a link and opened again.
import { test, expect, type Page } from '@playwright/test';

const SLOW = process.env['CI'] ? 3 : 1;

async function boot(page: Page, hash = '#/'): Promise<void> {
  // `lang` is read from the hash query, not the page query — so it goes after the route, not before it
  await page.goto(`/${hash}${hash.includes('?') ? '&' : '?'}lang=ja`);
  await page.waitForFunction(
    () => {
      const l = (window as unknown as { atlas?: { store: { get(): { loaded: { content: boolean; volume: boolean } } } } }).atlas?.store.get().loaded;
      return l?.content === true && l.volume === true;
    },
    null, { timeout: 60_000 * SLOW });
}

const panel = (page: Page) => page.locator('#right .sim:not([hidden])');

test('opens as the simulator, with the atlas shell out of the way', async ({ page }) => {
  await boot(page);
  await expect(page.locator('html')).toHaveAttribute('data-mode', 'sim');
  await expect(page.locator('#left')).toBeHidden();
  // the atlas is still there, one button away
  await expect(page.locator('#toolbar .sim-only')).toBeVisible();
  await expect(page.locator('#toolbar .atlas-only').first()).toBeHidden();
});

test('a capsular lacune names the body parts it takes, and the ones it spares', async ({ page }) => {
  // the arm fibres of the left posterior limb
  await boot(page, '#/lesion/-22,-7,10,5');
  const p = panel(page);
  await expect(p).toContainText('内包 後脚 上肢・手', { timeout: 30_000 * SLOW });
  await expect(p).toContainText('保たれた部位');

  // the table: the hand is lost on the right, and nothing is lost on the left
  const row = p.locator('.sim-table tr', { hasText: '手' }).first();
  await expect(row.locator('td.lost').first()).toHaveText('右');
  await expect(p.locator('.sim-table')).not.toContainText('左');

  // the optic radiation runs behind the sensory fibres: a lacune this far forward cannot reach it
  await expect(p).toContainText('視放線');          // in the spared list
  await expect(p).not.toContainText('同名半盲');
});

test('growing the lesion brings in the structures behind it', async ({ page }) => {
  await boot(page, '#/lesion/-22,-7,10,5');
  const p = panel(page);
  await expect(p).toContainText('内包 後脚 上肢・手', { timeout: 30_000 * SLOW });
  await expect(p).not.toContainText('内包 後脚 後方（感覚）');

  await page.locator('[data-testid=lesion-radius]').fill('14');
  await page.locator('[data-testid=lesion-radius]').dispatchEvent('input');

  // the sensory band is now reached, so touch is lost as well as movement
  await expect(p).toContainText('内包 後脚 後方（感覚）', { timeout: 20_000 * SLOW });
  const row = p.locator('.sim-table tr', { hasText: '手' }).first();
  await expect(row.locator('td.lost')).toHaveCount(3, { timeout: 20_000 * SLOW });
});

test('the lesion is in the address bar, and mirroring moves it to the other side', async ({ page }) => {
  await boot(page, '#/lesion/-22,-7,10,5');
  await expect(panel(page)).toContainText('内包', { timeout: 30_000 * SLOW });
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('#/lesion/-22,-7,10,5');

  await page.locator('[data-testid=lesion-mirror]').click();
  await expect(panel(page)).toContainText('（右）', { timeout: 20_000 * SLOW });
  await expect(panel(page).locator('.sim-table td.lost').first()).toHaveText('左');
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('#/lesion/22,-7,10,5');
});

test('a lesion in the right parietal lobe gives neglect; the same lesion on the left does not', async ({ page }) => {
  await boot(page, '#/lesion/43,-65,31,12');
  const p = panel(page);
  await expect(p).toContainText('半側空間無視', { timeout: 30_000 * SLOW });
  await expect(p).toContainText('左');                       // shown on the opposite side

  await page.locator('[data-testid=lesion-mirror]').click();
  await expect(p).toContainText('（左）', { timeout: 20_000 * SLOW });
  await expect(p).not.toContainText('半側空間無視');
  await expect(p).toContainText('身体部位失認');              // the left hemisphere's own deficit instead
});

test('clearing puts the anatomy back', async ({ page }) => {
  await boot(page, '#/lesion/-22,-7,10,5');
  await expect(panel(page)).toContainText('内包', { timeout: 30_000 * SLOW });
  await page.locator('[data-testid=lesion-clear]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { atlas: { store: { get(): { lesion: unknown; involved: Set<string> } } } }).atlas.store.get().involved.size)).toBe(0);
  await expect(panel(page)).toContainText('クリック');
});

test('a click on the axial slice puts the lesion at that level, not on the cortex in front of it', async ({ page }) => {
  await boot(page);
  // the simulator opens looking down at one axial slice, with everything above it peeled away
  const view = await page.evaluate(() => {
    const s = (window as unknown as { atlas: { store: { get(): { slices: { axial: number; visible: Record<string, boolean> }; peel: Record<string, string> } } } }).atlas.store.get();
    return { z: s.slices.axial, axialOn: s.slices.visible['axial'], coronalOn: s.slices.visible['coronal'], peel: s.peel['axial'] };
  });
  expect(view).toEqual({ z: 10, axialOn: true, coronalOn: false, peel: 'positive' });

  const box = (await page.locator('#gl').boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.46, box.y + box.height * 0.47);

  // the z of the lesion is the z of the slice: the click cannot land on the brain surface above it
  await expect.poll(() => page.evaluate(() => (window as unknown as { atlas: { store: { get(): { lesion: { mni: number[] } | null } } } }).atlas.store.get().lesion?.mni[2] ?? null),
    { timeout: 20_000 * SLOW }).toBe(10);
  await expect(panel(page)).toContainText('病巣が達した部位', { timeout: 30_000 * SLOW });
});

test('a thalamic bleed names the nuclei it is in, and grows into the capsule as the radius rises', async ({ page }) => {
  await boot(page, '#/lesion/-12,-20,8,8?lang=ja');
  const p = panel(page);
  await expect(p).toContainText('病巣が噛んでいる構造', { timeout: 30_000 * SLOW });
  await expect(p).toContainText('視床');

  // sensory loss over the whole opposite side, and — the point of the spared list — no weakness
  const touch = p.locator('.sim-table tr', { hasText: '手' }).first().locator('td').nth(2);
  await expect(touch).toHaveText('右');
  await expect(p.locator('.sim-table tr', { hasText: '手' }).first().locator('td').nth(1)).toHaveText('—');
  await expect(p).toContainText('皮質脊髄路');            // listed under 保たれた部位
  await expect(p).toContainText('視床痛');

  // widen it: the internal capsule comes in, and with it the weakness
  await page.locator('[data-testid=lesion-radius]').fill('16');
  await page.locator('[data-testid=lesion-radius]').dispatchEvent('input');
  await expect(p).toContainText('内包', { timeout: 20_000 * SLOW });
  await expect.poll(
    () => p.locator('.sim-table tr', { hasText: '手' }).first().locator('td').nth(1).innerText(),
    { timeout: 20_000 * SLOW }).toBe('右');
});

// ---- the see-through view (Step C): the brain without its cortex, the lesion and what it reaches inside it
type GlassWin = { atlas: {
  store: { get(): { simView: string; peel: Record<string, string>; involved: Set<string>; contextSystems: Set<string>; lesion: { mni: number[] } | null } };
  slices: { axial: { mesh: { visible: boolean } } };
  registry: { get(id: string): { visible: boolean; material: { userData: { state: string } } } | undefined };
  sm: { camera: { position: { x: number; y: number; z: number } }; controls: { target: { x: number; y: number; z: number } } };
} };
type SceneProbe = { view: string; axial: boolean; peel: string | null; cortex: boolean | null; thalamus: boolean | null; litTracts: number };
const sceneState = (page: Page, cortexId = 'dkt-precentral-l') => page.evaluate((cid): SceneProbe => {
  const a = (window as unknown as GlassWin).atlas;
  const s = a.store.get();
  const lit = (id: string) => ['involved', 'shell'].includes(a.registry.get(id)?.material.userData.state ?? '');
  return {
    view: s.simView, axial: a.slices.axial.mesh.visible, peel: s.peel['axial'] ?? null,
    cortex: a.registry.get(cid)?.visible ?? null, thalamus: a.registry.get('thalamus-l')?.visible ?? null,
    litTracts: [...s.involved].filter((id) => id.startsWith('tract-') && lit(id)).length,
  };
}, cortexId);
const meshState = (page: Page, id: string) => page.evaluate((m) => (window as unknown as GlassWin).atlas.registry.get(m)?.material.userData.state ?? null, id);
/** which side of the brain the camera looks from: -1 left, +1 right */
const cameraSide = (page: Page) => page.evaluate(() => { const sm = (window as unknown as GlassWin).atlas.sm; return Math.sign(sm.camera.position.x - sm.controls.target.x); });
const camera = (page: Page) => page.evaluate(() => { const p = (window as unknown as GlassWin).atlas.sm.camera.position; return [p.x, p.y, p.z].map(Math.round); });

test('the see-through view takes the cortex and the slice away, and the MRI view puts them back', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);   // two boots: the empty simulator, then the lesion
  // nothing to look through yet: the button waits for a lesion
  await boot(page);
  await expect(page.locator('[data-testid=sim-view-glass]')).toBeDisabled();

  await boot(page, '#/lesion/-12,-20,8,12');
  await expect(panel(page)).toContainText('病巣が噛んでいる構造', { timeout: 30_000 * SLOW });
  await page.waitForTimeout(1000);
  const before = await camera(page);
  await page.locator('[data-testid=sim-view-glass]').click();
  // the cortex and the MRI are gone; the thalamus the bleed is in is lit; the wide tract maps are not
  await expect.poll(() => sceneState(page), { timeout: 20_000 * SLOW })
    .toEqual({ view: 'glass', axial: false, peel: null, cortex: false, thalamus: true, litTracts: 0 });
  // the panel still says the bleed is *in* the thalamus: the inside test does not follow how the view draws faces
  await expect(panel(page).locator('.sim-unit:not(.clipped)').first()).toContainText('視床 (左)');
  // looking from the lesion's side; mirroring the lesion brings the camera round with it
  await expect.poll(() => cameraSide(page), { timeout: 10_000 * SLOW }).toBe(-1);
  await page.locator('[data-testid=lesion-mirror]').click();
  await expect.poll(() => cameraSide(page), { timeout: 10_000 * SLOW }).toBe(1);
  await page.locator('[data-testid=lesion-mirror]').click();

  // back on the MRI: slice, peel, cortex, lit tracts, and the camera where it was
  await page.locator('[data-testid=sim-view-mri]').click();
  await expect.poll(() => sceneState(page), { timeout: 20_000 * SLOW })
    .toMatchObject({ view: 'mri', axial: true, peel: 'positive', cortex: true, thalamus: true });
  expect((await sceneState(page)).litTracts).toBeGreaterThan(0);
  await expect.poll(() => camera(page), { timeout: 10_000 * SLOW }).toEqual(before);

  // clearing from the see-through view goes back to the MRI, where the next lesion is placed
  await page.locator('[data-testid=sim-view-glass]').click();
  await expect.poll(async () => (await sceneState(page)).view, { timeout: 20_000 * SLOW }).toBe('glass');
  await page.locator('[data-testid=lesion-clear]').click();
  await expect.poll(() => sceneState(page), { timeout: 20_000 * SLOW })
    .toMatchObject({ view: 'mri', axial: true, peel: 'positive', cortex: true });
  await expect(page.locator('[data-testid=sim-view-glass]')).toBeDisabled();
});

test('in the see-through view a cortical lesion keeps the gyrus it is in, and only that one', async ({ page }) => {
  await boot(page, '#/lesion/-38,-20,56,8');
  await expect(panel(page)).toContainText('中心前回', { timeout: 30_000 * SLOW });
  await page.locator('[data-testid=sim-view-glass]').click();
  await expect.poll(() => sceneState(page), { timeout: 20_000 * SLOW }).toMatchObject({ view: 'glass', cortex: true });
  // a gyrus the lesion does not reach is gone with the rest of the cortex
  expect((await sceneState(page, 'dkt-superior-frontal-l')).cortex).toBe(false);
});

test('a lesion that reaches only white matter stays see-through; a link from the view opens on the MRI; leaving the simulator leaves the view', async ({ page }) => {
  test.setTimeout(180_000 * SLOW);   // two boots: the lesion, then the shared link
  // corona radiata: the hemisphere's white matter and tract maps, nothing else
  await boot(page, '#/lesion/-25,-10,30,4');
  await expect(panel(page)).toContainText('大脳白質', { timeout: 30_000 * SLOW });
  await page.locator('[data-testid=sim-view-glass]').click();
  await expect.poll(async () => (await sceneState(page)).view, { timeout: 20_000 * SLOW }).toBe('glass');
  // everything it reaches is drawn faint, and the scene stays in lesion mode: the landmarks are landmarks, not solid
  await expect.poll(() => meshState(page, 'cerebral-white-matter-l'), { timeout: 10_000 * SLOW }).toBe('dimmed');
  await expect.poll(() => meshState(page, 'brainstem'), { timeout: 10_000 * SLOW }).toBe('context');

  // a link shared from here carries the MRI view behind it, so it opens on something a lesion can be placed on
  await page.getByTestId('share-view').click();
  const hash = await page.evaluate(() => location.hash);
  expect(hash).toContain('#/lesion/-25,-10,30,4');
  for (const part of ['cerebrum', 'sl=a', 'peel=ap']) expect(hash).toContain(part);
  // opened in this tab (a hash change, no reload) it takes the view down; opened fresh it starts on the MRI anyway
  await boot(page, hash);
  await expect.poll(() => sceneState(page), { timeout: 20_000 * SLOW }).toMatchObject({ view: 'mri', axial: true, peel: 'positive', cortex: true });
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { atlas?: { store: { get(): { loaded: { volume: boolean } } } } }).atlas?.store.get().loaded.volume === true, null, { timeout: 60_000 * SLOW });
  await expect.poll(() => sceneState(page), { timeout: 20_000 * SLOW }).toMatchObject({ view: 'mri', axial: true, peel: 'positive', cortex: true });

  // going somewhere else from the see-through view takes it down on the way, cortex and landmarks put back
  await page.locator('[data-testid=sim-view-glass]').click();
  await expect.poll(async () => (await sceneState(page)).view, { timeout: 20_000 * SLOW }).toBe('glass');
  await page.evaluate(() => { location.hash = '#/syndrome/syn-wallenberg-lateral-medullary'; });
  await expect.poll(() => page.evaluate(() => {
    const s = (window as unknown as GlassWin).atlas.store.get();
    return { view: s.simView, context: s.contextSystems.size };
  }), { timeout: 20_000 * SLOW }).toEqual({ view: 'mri', context: 0 });
  await expect.poll(async () => (await sceneState(page)).cortex, { timeout: 20_000 * SLOW }).toBe(true);
});
