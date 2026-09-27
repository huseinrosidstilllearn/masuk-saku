import { test, expect } from '@playwright/test';

test('edit transfer fee/status and show revisions without moving money before confirmation', async ({
  page,
}) => {
  await page.goto('/');
  const openingBalance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await page.getByRole('button', { name: 'Catat transaksi', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Jenis', exact: true }).selectOption('transfer');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('100000');
  await dialog.getByRole('combobox', { name: 'Dompet sumber', exact: true }).selectOption('bca');
  await dialog.getByRole('combobox', { name: 'Dompet tujuan', exact: true }).selectOption('dana');
  await dialog.getByLabel('Biaya admin (rupiah)', { exact: true }).fill('2500');
  await dialog.getByLabel('Merchant / keterangan').fill('Transfer revisi');
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Ubah Transfer revisi', exact: true }).click();
  await expect(dialog.getByRole('heading')).toHaveText('Ubah transaksi');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('150000');
  await dialog.getByLabel('Biaya admin (rupiah)', { exact: true }).fill('3500');
  await dialog.getByRole('combobox', { name: 'Status', exact: true }).selectOption('pending');
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeHidden();
  const row = page
    .getByRole('row')
    .filter({ has: page.getByText('Transfer revisi', { exact: true }) });
  await expect(row).toContainText('150.000');
  await expect(row).toContainText('Pending');
  await page.getByRole('button', { name: 'Riwayat Transfer revisi', exact: true }).click();
  await expect(dialog).toContainText('Versi 2');
  await expect(dialog).toContainText('100.000');
  await expect(dialog).toContainText('150.000');
  await expect(dialog).toContainText('3.500');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Riwayat Transfer revisi', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.stat.featured h2')).toHaveText(openingBalance!);
});

test('320px editor rejects incorrect splits, preserves inputs and cancels without changing row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  const edit = page.getByRole('button', { name: /^Ubah / }).first();
  await edit.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('100000');
  await dialog.getByRole('button', { name: 'Tambah split', exact: true }).click();
  await dialog
    .getByRole('combobox', { name: 'Kategori split 1', exact: true })
    .selectOption('food');
  await dialog.getByLabel('Nominal split 1', { exact: true }).fill('50000');
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByLabel('Nominal (rupiah)', { exact: true })).toHaveValue('100000');
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
});
