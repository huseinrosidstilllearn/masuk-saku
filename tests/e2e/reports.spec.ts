import { test, expect } from '@playwright/test';
test('pagination reaches all rows beyond old200cap, without duplicates, and search resets the page', async ({
  page,
}) => {
  // This regression visits eleven pages; keep per-assertion timeouts unchanged
  // while allowing the full sequence to finish on a busy CI machine.
  test.setTimeout(60_000);
  await page.goto('/tests/e2e/fixtures/pagination.html');
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await page.getByText('Filter transaksi', { exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Cari transaksi', exact: true });
  await search.fill('Fixture');
  const pager = page.getByRole('navigation', { name: 'Halaman transaksi', exact: true });
  const found = new Set<string>();
  for (let i = 0; i < 11; i++) {
    await expect(pager).toContainText(`${i + 1} / 11`);
    const merchants = await page.locator('tbody tr td:first-child strong').allTextContents();
    expect(merchants.length).toBe(i === 10 ? 10 : 25);
    for (const merchant of merchants) {
      expect(found.has(merchant)).toBe(false);
      found.add(merchant);
    }
    if (i < 10) await pager.getByRole('button', { name: 'Berikutnya', exact: true }).click();
  }
  expect(found.size).toBe(260);
  await expect(pager.getByRole('button', { name: 'Berikutnya', exact: true })).toBeDisabled();
  await search.fill('Fixture 010');
  await expect(pager).toContainText('1 / 1');
  await expect(page.locator('tbody tr')).toHaveCount(1);
});
test('transaction filters separate actor/type/status and preserve money; report comparisons mask amounts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const before = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Transaksi', exact: true }).click();
  await page.getByText('Filter transaksi', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Jenis transaksi', exact: true }).selectOption('income');
  await page.getByRole('button', { name: 'Terapkan filter', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page
    .getByRole('combobox', { name: 'Pelaku transaksi', exact: true })
    .selectOption('demo-member');
  await page.getByRole('button', { name: 'Terapkan filter', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset filter', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.stat.featured h2')).toHaveText(before!);
  await page.getByRole('button', { name: 'Buka laporan', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Perbandingan periode', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Pokok transfer tidak dihitung sebagai pemasukan/pengeluaran.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sembunyikan saldo', exact: true }).click();
  const report = page.locator('.reports-panel');
  await expect(report).toContainText('Rp ••••••');
  expect(await report.innerText()).not.toMatch(/Rp\s*[0-9]/);
  await expect(report.locator('[role="progressbar"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
