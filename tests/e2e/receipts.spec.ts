import { test, expect } from '@playwright/test';
const image = {
  name: 'struk-contoh.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJwoAAAAASUVORK5CYII=',
    'base64',
  ),
};

test('receipt picker validates files at 320px, stays local in demo and manual fallback does not commit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Tambah transaksi', exact: true }).click();
  await page.getByRole('button', { name: /^Upload struk/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('24 jam setelah konfirmasi');
  await dialog.getByLabel('Gambar struk', { exact: false }).setInputFiles({
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-test'),
  });
  await expect(dialog.getByRole('alert')).toContainText('PDF');
  await dialog.getByLabel('Gambar struk', { exact: false }).setInputFiles(image);
  await expect(dialog.getByRole('img', { name: 'Pratinjau struk pilihan' })).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Lepas gambar', exact: true }).click();
  await expect(dialog.getByRole('img')).toHaveCount(0);
  await dialog.getByLabel('Gambar struk', { exact: false }).setInputFiles(image);
  await expect(dialog.getByRole('img')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Baca dengan AI', exact: true })).toBeDisabled();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/receipt-mobile.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Catat manual tanpa lampiran', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Catat transaksi', exact: true })).toBeVisible();
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).focus();
  await expect(dialog.getByLabel('Nominal (rupiah)', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
  const title = await page.locator('.table-wrap tbody tr:first-child td:first-child').boundingBox();
  expect(title!.width).toBeGreaterThan(70);
});

test('receipt cancel restores focus and BYOK shortcut opens settings', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Upload struk', exact: true });
  await button.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Gambar struk', { exact: false }).setInputFiles(image);
  await expect(dialog.getByRole('img')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
  await button.click();
  await expect(dialog.getByRole('img')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Pengaturan BYOK', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'AI dengan kuncimu sendiri' })).toBeVisible();
});

test('AI settings disclose fixed OpenRouter free model and receipt destination', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pengaturan', exact: true }).click();
  const section = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'AI dengan kuncimu sendiri', exact: true }) });
  await expect(section).toContainText('OpenRouter · openrouter/free');
  await expect(section.getByLabel('API key OpenRouter', { exact: true })).toBeDisabled();
  await expect(section).not.toContainText('gpt-4.1-mini');
  await page.getByRole('button', { name: 'Upload struk', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('melalui OpenRouter');
  await page.keyboard.press('Escape');
});
