import { test, expect } from '@playwright/test';

test('create and edit a custom budget, show overspending and preserve wallet balance', async ({
  page,
}) => {
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Anggaran', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah anggaran', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama anggaran').fill('Belajar UI');
  await dialog.getByLabel('Nominal anggaran (rupiah)').fill('600000');
  await dialog
    .getByRole('combobox', { name: 'Kategori anggaran', exact: true })
    .selectOption('education');
  await dialog.getByRole('combobox', { name: 'Dompet anggaran', exact: true }).selectOption('bca');
  await dialog.getByLabel('Ambang peringatan (%)').fill('80, 100');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  const card = page
    .locator('.planning-card')
    .filter({ has: page.getByRole('heading', { name: 'Belajar UI', exact: true }) });
  await expect(card).toContainText(/Melebihi.*150.000/);
  await expect(card).toContainText('Ambang 100% sudah tercapai');
  await card.getByRole('button', { name: 'Ubah anggaran Belajar UI', exact: true }).click();
  await dialog.getByLabel('Nominal anggaran (rupiah)').fill('900000');
  await dialog.getByLabel('Ambang peringatan (%)').fill('101');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('1–100%');
  await dialog.getByLabel('Ambang peringatan (%)').fill('90, 100');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toContainText(/Sisa.*150.000/);
  await expect(card.locator('.planning-warning')).toHaveCount(0);
  await page.screenshot({ path: 'docs/screenshots/budgets.png', fullPage: true });
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
  await page.getByLabel('Lingkup dashboard').selectOption('demo-member');
  await page.getByRole('button', { name: 'Anggaran', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah anggaran', exact: true }).click();
  await expect(dialog.getByRole('combobox', { name: 'Dompet anggaran', exact: true })).toHaveValue(
    'bri',
  );
  await page.keyboard.press('Escape');
});

test('goal editing and virtual progress history never move money; correction and archive work', async ({
  page,
}) => {
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Target tabungan', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah target', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama target').fill('Dana kuliah UI');
  await dialog.getByLabel('Nominal target (rupiah)').fill('1200000');
  await dialog.getByLabel('Tanggal target (opsional)').fill('2027-12-31');
  await dialog.getByLabel('Catatan target').fill('Belajar bersama');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  const card = page
    .locator('.planning-card')
    .filter({ has: page.getByRole('heading', { name: 'Dana kuliah UI', exact: true }) });
  await card.getByRole('button', { name: 'Catat progres Dana kuliah UI', exact: true }).click();
  await dialog.getByLabel('Nominal progres (rupiah)').fill('250000');
  await dialog.getByRole('button', { name: 'Konfirmasi progres' }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toContainText(/Rp\s*250.000/);
  await card.getByRole('button', { name: 'Ubah target Dana kuliah UI', exact: true }).click();
  await dialog.getByLabel('Nominal target (rupiah)').fill('1500000');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toContainText(/Rp\s*250.000/);
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '17');
  await card.getByRole('button', { name: 'Riwayat progres Dana kuliah UI', exact: true }).click();
  await expect(page.locator('.history-row')).toHaveCount(1);
  await expect(page.locator('.history-row')).toContainText('Pemilik');
  await page.screenshot({ path: 'docs/screenshots/goals.png', fullPage: true });
  page.once('dialog', (confirmation) => confirmation.accept());
  await page
    .locator('.history-row')
    .getByRole('button', { name: /^Hapus progres/ })
    .click();
  await expect(page.locator('.history-row')).toHaveCount(0);
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await card.getByRole('button', { name: 'Ubah target Dana kuliah UI', exact: true }).click();
  await dialog
    .getByRole('combobox', { name: 'Status target', exact: true })
    .selectOption('archived');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Tampilkan target', exact: true }).selectOption('all');
  await expect(card).toContainText('Arsip');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
});

test('planning forms remain usable at 320px and Escape restores focus without saving', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Anggaran', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Tambah anggaran', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Buka target tabungan', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah target', exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/planning-mobile.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
