// The lesion simulator is what the app opens as. These tests hold the three things that make it usable:
// the atlas shell is out of the way, a lesion placed in the internal capsule reports the right body parts
// (and the right spared ones), and a lesion survives being turned into a link and opened again.
import { test, expect, type Page } from '@playwright/test';

const SLOW = process.env['CI'] ? 3 : 1;

async function boot(page: Page, hash = '#/'): Promise<void> {
  // `lang` is read from the hash query, not the page query — so it goes after the route, not before it
  await page.goto(`/${hash}${hash.includes('?') ? '&' : '?'}lang=ja`);
  await page.waitForFunction(
    () => (window as unknown as { atlas?: { store: { get(): { loaded: { content: boolean } } } } }).atlas?.store.get().loaded.content === true,
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

  // the sensory fibres sit behind the motor ones: a 5 mm lesion must not reach them
  await expect(p.locator('.sim-table tr', { hasText: '手' }).first().locator('td')).toContainText(['手', '右', '—', '—']);
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
