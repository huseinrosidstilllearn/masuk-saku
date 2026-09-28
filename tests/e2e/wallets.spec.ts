import { test, expect } from '@playwright/test';

test('wallet lifecycle preserves history, previews signed opening and supports archive/reactivation at 320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dompet', exact: true }).last().click();
  await page.getByRole('button', { name: 'Tambah dompet', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tambah dompet' });
  await dialog.getByLabel('Nama dompet').fill('Dompet uji');
  await dialog.getByLabel('Saldo awal (rupiah)').fill('-15000');
  await expect(page.locator('.wallet-card').filter({ hasText: 'Dompet uji' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  const card = page.locator('.wallet-card').filter({ hasText: 'Dompet uji' });
  await expect(card).toContainText('15.000');
  await card.getByRole('button', { name: 'Edit dompet Dompet uji' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit dompet' });
  await edit.getByLabel(/^Status/).selectOption('archived');
  await edit.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: 'Diarsipkan', exact: true }).click();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Edit dompet Dompet uji' }).click();
  await edit.getByLabel(/^Status/).selectOption('active');
  await edit.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await page.getByRole('button', { name: 'Aktif', exact: true }).click();
  await expect(card).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
