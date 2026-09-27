import { test, expect } from '@playwright/test';

test('public demo changes only local example data and resets on reload', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET' && request.url().includes('.supabase.co/'))
      writes.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Jelajahi demo interaktif' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(
    page.getByText('Simulasi lokal dengan data fiktif.', { exact: false }),
  ).toBeVisible();
  const initial = await page.locator('.demo-stat-primary strong').innerText();
  await page.getByLabel('Lingkup tampilan').selectOption('demo-member');
  await expect(page.locator('.demo-stat-primary strong')).not.toHaveText(initial);
  await page.getByLabel('Lingkup tampilan').selectOption('family');
  await page.getByRole('button', { name: 'Tambah transaksi' }).click();
  const dialog = page.getByRole('dialog', { name: 'Catat transaksi' });
  await dialog.getByLabel('Nominal (rupiah)').fill('10000');
  await dialog.getByLabel('Merchant / keterangan').fill('Belanja contoh');
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.demo-stat-primary strong')).not.toHaveText(initial);
  await page
    .getByRole('navigation', { name: 'Navigasi demo' })
    .getByRole('button', { name: 'Transaksi' })
    .click();
  await expect(page.getByText('Belanja contoh')).toBeVisible();
  await page.reload();
  await expect(page.locator('.demo-stat-primary strong')).toHaveText(initial);
  await expect(page.getByText('Belanja contoh')).toHaveCount(0);
  await page.getByRole('button', { name: 'Sembunyikan saldo demo' }).click();
  await expect(page.locator('.demo-stat-primary strong')).not.toContainText(/\d/);
  expect(writes).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('public demo automatically resets its local edits after 15 idle minutes', async ({ page }) => {
  await page.clock.install();
  await page.goto('/demo');
  const initial = await page.locator('.demo-stat-primary strong').innerText();
  await page.getByRole('button', { name: 'Tambah transaksi' }).click();
  const dialog = page.getByRole('dialog', { name: 'Catat transaksi' });
  await dialog.getByLabel('Nominal (rupiah)').fill('10000');
  await dialog.getByLabel('Merchant / keterangan').fill('Belanja contoh');
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(page.locator('.demo-stat-primary strong')).not.toHaveText(initial);
  await page.clock.fastForward(15 * 60 * 1000 + 1000);
  await expect(page.locator('.demo-stat-primary strong')).toHaveText(initial);
  await expect(page.getByRole('status')).toContainText('otomatis kembali ke data awal');
  await page
    .getByRole('navigation', { name: 'Navigasi demo' })
    .getByRole('button', { name: 'Transaksi' })
    .click();
  await expect(page.getByText('Belanja contoh')).toHaveCount(0);
});
