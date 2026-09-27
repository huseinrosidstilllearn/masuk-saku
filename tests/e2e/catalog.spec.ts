import { test, expect } from '@playwright/test';

test('manage category hierarchy and tags without changing balance', async ({ page }) => {
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Pengaturan', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah kategori', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama', { exact: true }).fill('Pendidikan keluarga');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Tambah kategori', exact: true }).click();
  await dialog.getByLabel('Nama', { exact: true }).fill('Buku kuliah');
  await dialog.getByLabel('Kategori induk').selectOption({ label: 'Pendidikan keluarga' });
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(
    page.locator('.catalog-row').filter({ hasText: 'Pendidikan keluarga / Buku kuliah' }),
  ).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Hapus Pendidikan keluarga', exact: true }).click();
  await expect(page.locator('.catalog-panel').getByRole('alert')).toContainText('Masih digunakan');
  await page.getByRole('button', { name: 'Tambah tag', exact: true }).click();
  await dialog.getByLabel('Nama', { exact: true }).fill('Kuliah bersama');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
  await page.getByRole('button', { name: 'Pengaturan', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.getByRole('button', { name: 'Tambah tag', exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('select, find, revise and clear transaction tags with history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pengaturan', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah tag', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama', { exact: true }).fill('Tag uji pencarian');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await page.getByRole('button', { name: 'Catat transaksi', exact: true }).click();
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('12000');
  await dialog.getByLabel('Merchant / keterangan').fill('Buku bertag');
  await dialog.getByLabel('Tag uji pencarian', { exact: true }).check();
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeHidden();
  await page.locator('#search').fill('Tag uji pencarian');
  await expect(page.getByRole('button', { name: 'Ubah Buku bertag', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ubah Buku bertag', exact: true }).click();
  await expect(dialog.getByLabel('Tag uji pencarian', { exact: true })).toBeChecked();
  await dialog.getByLabel('Tag uji pencarian', { exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ubah Buku bertag', exact: true })).toBeHidden();
  await page.locator('#search').fill('Buku bertag');
  await page.getByRole('button', { name: 'Riwayat Buku bertag', exact: true }).click();
  await expect(dialog).toContainText('Tag uji pencarian');
  await expect(dialog).toContainText('Tanpa tag');
});
