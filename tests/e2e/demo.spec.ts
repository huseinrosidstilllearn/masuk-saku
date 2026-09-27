import { test, expect } from '@playwright/test';
test('Quick Add stays a preview; confirm, trash and restore update the ledger', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Mode demo', { exact: true })).toBeVisible();
  await page.getByLabel('Input Quick Add').fill('-27k makan @dana');
  await page.getByRole('button', { name: 'Tinjau', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Nominal (rupiah)')).toHaveValue('27000');
  await page.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'makan', exact: false }).first()).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Hapus makan', exact: true }).click();
  await page.getByRole('button', { name: 'Sampah', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pulihkan' })).toBeVisible();
  await page.getByRole('button', { name: 'Pulihkan' }).click();
  await expect(page.getByText('Belum ada transaksi di sini.')).toBeVisible();
});
test('personal view follows wallet ownership and masking applies', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Lingkup dashboard').selectOption('demo-member');
  await expect(page.locator('.wallet-card')).toHaveCount(1);
  await expect(
    page.locator('.wallet-card').getByRole('heading', { name: 'BRI Harian' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sembunyikan saldo' }).click();
  await expect(page.locator('.stat').first()).toContainText('Rp ••••••');
  await expect(page.locator('.balance-flow strong')).toHaveText(['Rp ••••••', 'Rp ••••••']);
  await expect(page.locator('.planning-summary h2')).toHaveText(['Rp ••••••', 'Rp ••••••']);
  await expect(page.locator('.wallet-card')).toContainText('Rp ••••••');
  await expect(page.getByText('Grafik disembunyikan bersama saldo')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Rincian arus uang mingguan' })).toHaveCount(0);
});
test('mobile dashboard has no page-level overflow and remains operable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Tambah transaksi', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  const navBox = await nav.boundingBox();
  expect(navBox!.y + navBox!.height).toBeCloseTo(844, 0);
  await expect(page.locator('.page-actions')).toBeHidden();
  expect(await page.locator('.page-heading .page-actions').count()).toBe(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await nav.boundingBox())!.y).toBeCloseTo(navBox!.y, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'docs/screenshots/mobile.png', fullPage: true });
  await page.screenshot({ path: 'docs/screenshots/mobile-preview.png' });
});
test('desktop dashboard is readable and produces a reference screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1350 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Ringkasan keuangan', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/desktop.png', fullPage: true });
  await page.screenshot({ path: 'docs/screenshots/desktop-preview.png' });
});

test('search is discoverable, focuses input and can recover from no results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cari transaksi', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Cari transaksi' });
  await expect(search).toBeFocused();
  await expect(page.getByRole('button', { name: 'Transaksi', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await search.fill('no-matching-transaction-9382');
  await expect(page.getByText('Belum ada transaksi di sini.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Kosongkan pencarian' }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('cell', { name: /^Proyek freelance/ })).toBeVisible();
});

test('narrow screen supports navigation and cancelling a preview without changing balance', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Tambah transaksi', exact: true }).click();
  await page.getByRole('button', { name: /Tambah manual/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('Nominal (rupiah)')).toBeVisible();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
  for (const name of ['Transaksi', 'Dompet', 'Pengaturan', 'Dashboard']) {
    if (name === 'Pengaturan') {
      await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
      await page.getByRole('button', { name: 'Buka pengaturan', exact: true }).click();
    } else await page.getByRole('button', { name, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  }
});

test('mobile Dashboard holds secondary destinations below the overview', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const extra = page.locator('.dashboard-more');
  await expect(extra.getByRole('button', { name: 'Buka target tabungan' })).toBeVisible();
  await expect(extra.getByRole('button', { name: 'Buka sampah' })).toBeVisible();
  await expect(extra.getByRole('button', { name: 'Buka pengaturan' })).toBeVisible();
  expect(
    await page
      .locator('.overview')
      .evaluate((el) => el.nextElementSibling?.classList.contains('dashboard-more')),
  ).toBe(true);
  await extra.getByRole('button', { name: 'Buka target tabungan' }).click();
  await expect(page.locator('.breadcrumb')).toContainText('Target tabungan');
  await expect(page.getByRole('heading', { name: 'Kamera baru', exact: true })).toBeVisible();
});

test('grouped transfer review preserves separate actor/scope and applies only its fee to total balance', async ({
  page,
}) => {
  await page.goto('/');
  const before = await page.locator('.stat.featured h2').textContent();
  const parse = (value: string) => Number(value.replace(/[^0-9]/g, ''));
  await page.getByRole('button', { name: 'Catat transaksi', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Jenis', exact: true }).selectOption('transfer');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('10000');
  const destination = dialog.getByLabel('Dompet tujuan');
  const destinationId = await destination.locator('option').nth(1).getAttribute('value');
  await destination.selectOption(destinationId!);
  await dialog.getByLabel('Biaya admin (rupiah)').fill('2500');
  await dialog.getByLabel('Dilakukan oleh').selectOption('demo-member');
  await dialog.getByLabel('Ruang lingkup').selectOption('personal');
  await dialog.getByLabel('Untuk siapa').selectOption('demo-owner');
  await expect(dialog.getByRole('group', { name: 'Pelaku & lingkup' })).toBeVisible();
  await dialog.getByLabel('Merchant / keterangan').fill('Transfer UI check');
  await page.screenshot({ path: 'docs/screenshots/transaction-review.png', fullPage: true });
  await expect(page.locator('.stat.featured h2')).toHaveText(before!);
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeHidden();
  await expect
    .poll(async () => parse((await page.locator('.stat.featured h2').textContent())!))
    .toBe(parse(before!) - 2500);
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Transfer UI check' })).toContainText(
    'Anggota',
  );
});

test('rebuilt workspace remains readable across phone, tablet and desktop widths', async ({
  page,
}) => {
  await page.goto('/');
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.balance-card h2')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    const balance = await page.locator('.balance-card').boundingBox();
    const plans = await page.locator('.planning-summary').boundingBox();
    if (width > 800) expect(plans!.y + plans!.height).toBeLessThanOrEqual(balance!.y + 1);
    else expect(balance!.y + balance!.height).toBeLessThanOrEqual(plans!.y + 1);
    const pocket = await page.locator('.balance-pocket').boundingBox();
    const flow = await page.locator('.cashflow-panel').boundingBox();
    if (width > 800) expect(pocket!.x + pocket!.width).toBeLessThanOrEqual(flow!.x + 1);
    else expect(pocket!.y + pocket!.height).toBeLessThanOrEqual(flow!.y + 1);
    if (width <= 800) await expect(page.locator('nav .nav-label').first()).toBeVisible();
  }
});
