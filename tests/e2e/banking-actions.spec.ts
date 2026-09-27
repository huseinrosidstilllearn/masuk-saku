import { test, expect } from '@playwright/test';

test('cash shortcuts open the intended preview without moving money', async ({ page }) => {
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  const actions = page.getByRole('region', { name: 'Aksi cepat' });
  for (const [label, type] of [
    ['Catat pengeluaran', 'expense'],
    ['Catat pemasukan', 'income'],
    ['Catat transfer', 'transfer'],
  ]) {
    await actions.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('select').first()).toHaveValue(type);
    await page.keyboard.press('Escape');
    await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
  }
  await page.getByRole('button', { name: 'Dompet', exact: true }).click();
  await expect(page.locator('.breadcrumb')).toContainText('Dompet');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Anggaran', exact: true }).click();
  await expect(page.locator('.breadcrumb')).toContainText('Anggaran');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Target tabungan', exact: true }).click();
  await expect(page.locator('.breadcrumb')).toContainText('Target tabungan');
});
