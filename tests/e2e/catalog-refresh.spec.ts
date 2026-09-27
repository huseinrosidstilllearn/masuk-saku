import { test, expect } from '@playwright/test';

test('catalog budget summary masks derived usage immediately and remains accessible on small screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.budget-pulse')).toContainText('Alokasi terpakai');
  await expect(page.getByRole('button', { name: 'Lihat anggaran', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sembunyikan saldo' }).click();
  await expect(page.locator('.budget-pulse')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tampilkan saldo' }).click();
  await expect(page.locator('.budget-pulse')).toBeVisible();
  await page.getByLabel('Lingkup dashboard').selectOption('demo-member');
  await expect(page.locator('.budget-pulse')).toHaveCount(0);
  await page.getByLabel('Lingkup dashboard').selectOption('family');
  const budget = page.getByRole('button', { name: 'Lihat anggaran', exact: true });
  await budget.focus();
  await expect(budget).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Anggaran', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
