import { test, expect } from '@playwright/test';
test('signup requires a valid username; login accepts a handle without email validation at320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/auth.tsx';show();",
  });
  await page.getByRole('button', { name: 'Mulai catat sekarang', exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-only-password');
  const username = page.getByRole('textbox', { name: 'Username', exact: true });
  expect(await username.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await username.fill('bad name');
  expect(await username.evaluate((el: HTMLInputElement) => el.validity.patternMismatch)).toBe(true);
  await username.fill('Owner_Saku');
  expect(await username.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true);
  await page.getByRole('button', { name: 'Sudah punya akun? Masuk', exact: true }).click();
  await expect(username).toHaveCount(0);
  const identifier = page.getByRole('textbox', { name: 'Username atau email', exact: true });
  await identifier.fill('Owner_Saku');
  expect(await identifier.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true);
  await page.locator('.auth-card').getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Hubungkan Supabase');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
