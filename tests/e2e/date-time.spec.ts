import { test, expect } from '@playwright/test';

test.use({ locale: 'en-US', timezoneId: 'America/New_York' });

test('Indonesian calendar and 24-hour WIB persist only after confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2026-09-27T15:05:00Z'));
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page
    .getByRole('region', { name: 'Aksi cepat' })
    .getByRole('button', { name: 'Catat pengeluaran', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('1000');
  await dialog.getByLabel('Merchant / keterangan').fill('Kalender WIB');
  await dialog.getByLabel('Tanggal transaksi', { exact: true }).fill('27/09/2026');
  await dialog.getByRole('button', { name: 'Pilih tanggal transaksi' }).click();
  await expect(dialog.getByRole('columnheader')).toHaveText([
    'Sen',
    'Sel',
    'Rab',
    'Kam',
    'Jum',
    'Sab',
    'Min',
  ]);
  await expect(dialog.getByRole('columnheader').first()).toBeVisible();
  await dialog.locator('.date-calendar-panel').scrollIntoViewIfNeeded();
  await dialog.locator('.date-time-field').evaluate(async (el) => {
    await Promise.allSettled(
      el.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
  });
  await dialog.locator('.date-time-field').screenshot({
    path: 'docs/screenshots/date-time-picker-desktop.png',
    animations: 'disabled',
  });
  await expect(
    dialog.getByRole('button', { name: 'Minggu, 27 September 2026', exact: true }),
  ).toBeFocused();
  await dialog.getByRole('button', { name: 'Minggu, 27 September 2026', exact: true }).click();
  await expect(
    dialog.getByRole('combobox', { name: 'Jam', exact: true }).locator('option'),
  ).toHaveCount(24);
  await dialog.getByRole('combobox', { name: 'Jam', exact: true }).selectOption('22');
  await dialog.getByRole('combobox', { name: 'Menit', exact: true }).selectOption('05');
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await page.getByRole('button', { name: 'Ubah Kalender WIB', exact: true }).click();
  await expect(dialog.getByLabel('Tanggal transaksi', { exact: true })).toHaveValue('27/09/2026');
  await expect(dialog.getByRole('combobox', { name: 'Jam', exact: true })).toHaveValue('22');
  await expect(dialog.getByRole('combobox', { name: 'Menit', exact: true })).toHaveValue('05');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Ekspor JSON' }).click();
  const stream = await (await downloaded).createReadStream();
  let json = '';
  for await (const chunk of stream!) json += chunk.toString();
  expect(json).toContain('2026-09-27T15:05:00.000Z');
});

test('invalid date blocks saving; calendar keyboard and narrow layout work', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-26T17:15:00Z'));
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah transaksi', exact: true }).click();
  await page.getByRole('button', { name: /^Tambah manual/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nominal (rupiah)', { exact: true }).fill('1000');
  const date = dialog.getByLabel('Tanggal transaksi', { exact: true });
  await date.fill('31/02/2026');
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(dialog).toBeVisible();
  expect(await date.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
  await dialog.getByRole('button', { name: 'Waktu sekarang', exact: true }).click();
  await expect(date).toHaveValue('27/09/2026');
  await expect(dialog.getByRole('combobox', { name: 'Jam', exact: true })).toHaveValue('00');
  await expect(dialog.getByRole('combobox', { name: 'Menit', exact: true })).toHaveValue('15');
  expect(await date.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(true);
  await date.fill('30/09/2026');
  await dialog.getByRole('button', { name: 'Pilih tanggal transaksi' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(
    dialog.getByRole('button', { name: 'Kamis, 1 Oktober 2026', exact: true }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(date).toHaveValue('01/10/2026');
  await dialog.getByRole('button', { name: 'Pilih tanggal transaksi' }).click();
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await expect(dialog.getByRole('columnheader').first()).toBeVisible();
  const cells = await dialog
    .locator('.date-calendar tbody tr')
    .first()
    .locator('td')
    .evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().top));
  expect(Math.max(...cells) - Math.min(...cells)).toBeLessThan(1);
  await dialog.locator('.date-calendar-panel').scrollIntoViewIfNeeded();
  await dialog.locator('.date-time-field').evaluate(async (el) => {
    await Promise.allSettled(
      el.getAnimations({ subtree: true }).map((animation) => animation.finished),
    );
  });
  await dialog.locator('.date-time-field').screenshot({
    path: 'docs/screenshots/date-time-picker-mobile.png',
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Pilih tanggal transaksi' })).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Pilih tanggal transaksi' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
