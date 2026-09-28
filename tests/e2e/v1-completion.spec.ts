import { test, expect } from '@playwright/test';
test('recurring review records once and keeps money unchanged before confirmation at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.clock.setFixedTime(new Date('2026-09-28T05:00:00Z'));
  await page.goto('/');
  const before = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Buka transaksi berulang', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah jadwal', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama jadwal', { exact: true }).fill('Sewa rutin');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('25000');
  await dialog.getByLabel('Merchant / keterangan').fill('Sewa rutin');
  await dialog.getByLabel('Tanggal transaksi', { exact: true }).fill('27/09/2026');
  await dialog.getByRole('button', { name: 'Setujui jadwal', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Sewa rutin', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tinjau transaksi', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Dashboard', exact: true }).last().click();
  await expect(page.locator('.stat.featured h2')).toHaveText(before!);
  await page.getByRole('button', { name: 'Buka transaksi berulang', exact: true }).click();
  await page.getByRole('button', { name: 'Tinjau transaksi', exact: true }).click();
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Tinjau transaksi', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Periksa jadwal', exact: true }).click();
  await expect(page.locator('.recurring-row').filter({ hasText: 'Tercatat' })).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
test('budget rollover creates one successor without changing wallet money', async ({ page }) => {
  await page.goto('/');
  const before = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Anggaran', exact: true }).last().click();
  await page.getByRole('button', { name: 'Tambah anggaran', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nama anggaran').fill('Periode riwayat');
  await dialog.getByLabel('Nominal anggaran (rupiah)').fill('100000');
  await dialog.getByLabel('Mulai periode').fill('2025-01-01');
  await dialog.getByLabel('Akhir periode').fill('2025-01-31');
  await dialog.getByLabel('Jenis periode').selectOption('monthly');
  await dialog.getByLabel('Sisa periode').selectOption('rollover');
  await dialog.getByLabel('Periode berikutnya').selectOption('yes');
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  const card = page.locator('.planning-card').filter({ hasText: 'Periode riwayat' });
  await card.getByRole('button', { name: 'Tutup periode', exact: true }).click();
  await dialog.getByRole('button', { name: 'Tutup periode', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(card).toHaveCount(2);
  await expect(card.filter({ hasText: '2025-02-01' })).toContainText('Sisa dibawa');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).last().click();
  await expect(page.locator('.stat.featured h2')).toHaveText(before!);
});
test('dashboard ordering and Ctrl+K navigation remain usable with hidden widgets', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Atur dashboard', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Catat cepat', { exact: true }).uncheck();
  await dialog.getByRole('button', { name: 'Naikkan Target tabungan', exact: true }).click();
  await dialog.getByRole('button', { name: 'Simpan', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.quick')).toHaveCount(0);
  await expect(page.locator('.dashboard-more')).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByLabel('Pencarian global').fill('Anggaran');
  await page.getByRole('dialog').getByRole('button', { name: 'Anggaran', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Rencana pengeluaran', exact: true }),
  ).toBeVisible();
});
test('PDF receipt is rendered locally and more than three pages are rejected', async ({
  page,
  context,
}) => {
  const source = await context.newPage();
  await source.setContent('<h1>Receipt IDR 27000</h1><p>Example receipt</p>');
  const pdf = await source.pdf({ format: 'A4' });
  await source.setContent(
    '<style>.page{height:800px;break-after:page}</style>' +
      Array.from({ length: 4 }, () => '<div class="page">Example</div>').join(''),
  );
  const long = await source.pdf({ format: 'A4' });
  await source.close();
  await page.goto('/');
  await page.getByRole('button', { name: 'Upload struk', exact: true }).last().click();
  const dialog = page.getByRole('dialog');
  await dialog
    .locator('input[type=file]')
    .setInputFiles({ name: 'receipt.pdf', mimeType: 'application/pdf', buffer: pdf });
  // Local PDF rendering lazily loads its worker and has a 20-second operation deadline.
  await expect(dialog.locator('.receipt-preview img')).toBeVisible({ timeout: 20000 });
  await dialog
    .locator('input[type=file]')
    .setInputFiles({ name: 'large.pdf', mimeType: 'application/pdf', buffer: long });
  await expect(dialog.getByRole('alert')).toContainText('maksimal 3 halaman');
});
