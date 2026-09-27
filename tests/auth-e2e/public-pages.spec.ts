import { test, expect } from '@playwright/test';

test('landing and account pages have separate URLs with refresh and browser history', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  await expect(page.locator('.billow-hero h1')).toBeVisible();
  await expect(page.locator('form')).toHaveCount(0);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/masuk$/);
  await expect(page.getByRole('heading', { name: 'Masuk ke sakumu.' })).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('example-only-password');
  await page.getByRole('button', { name: 'Belum punya akun? Daftar' }).click();
  await expect(page).toHaveURL(/\/daftar$/);
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Buat akun pertamamu' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Masuk ke sakumu.' })).toBeVisible();
  await expect(page.locator('.billow-hero')).toHaveCount(0);
  await page.getByRole('link', { name: 'Kembali ke beranda' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:5177/');
  await expect(page.locator('form')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('login direct URL loads after refresh and Google remains available', async ({ page }) => {
  await page.goto('/masuk');
  await expect(page.getByRole('textbox', { name: 'Username atau email' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Lanjutkan dengan Google' })).toBeVisible();
  await expect(page.locator('.billow-hero')).toHaveCount(0);
  await expect(page).toHaveTitle('Masuk — Masuk Saku');
});
