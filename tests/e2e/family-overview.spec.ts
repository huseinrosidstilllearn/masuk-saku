import { test, expect } from '@playwright/test';

test('family balances select ownership, mask amounts and open invitation directly', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  const family = page.getByRole('region', { name: 'Keuangan keluarga' });
  const cards = family.locator('.family-balance-card');
  await expect(cards).toHaveCount(3);
  const sums = await cards.locator('strong').allTextContents();
  const number = (text: string) => Number(text.replace(/[^\d-]/g, ''));
  const total = await page.locator('.balance-pocket h2').innerText();
  expect(sums.reduce((sum, text) => sum + number(text), 0)).toBe(number(total));
  await cards.first().click();
  await expect(page.getByLabel('Lingkup dashboard')).toHaveValue('demo-owner');
  await expect(page.locator('.balance-pocket h2')).toHaveText(sums[0]);
  await page.getByRole('button', { name: 'Sembunyikan saldo' }).click();
  for (const text of await cards.locator('strong').allTextContents())
    expect(text).not.toMatch(/\d/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await family.getByRole('button', { name: 'Tambah anggota' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Undang anggota keluarga');
  await expect(page.getByRole('dialog').getByLabel('Email penerima')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await family.getByRole('button', { name: 'Kelola anggota' }).click();
  await expect(page.getByRole('heading', { name: 'Anggota keluarga', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
