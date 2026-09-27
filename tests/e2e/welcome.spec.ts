import { test, expect } from '@playwright/test';

test('Billow-style welcome uses real signup/login form and labelled demo preview', async ({
  page,
}) => {
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/auth.tsx';show();",
  });
  await expect(
    page.getByRole('heading', { name: 'Semua uang keluarga. Dalam satu saku.' }),
  ).toBeVisible();
  await expect(page.getByText('Contoh tampilan · Data demo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mulai catat sekarang', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Buat akun pertamamu', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Sudah punya akun? Masuk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Masuk ke sakumu.', exact: true })).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: 'docs/screenshots/billow-welcome-desktop.png',
    animations: 'disabled',
  });
});

test('welcome works at320px with readable FAQ and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/auth.tsx';show();",
  });
  await expect(page.locator('.billow-hero h1')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({
    path: 'docs/screenshots/billow-welcome-mobile.png',
    animations: 'disabled',
  });
  await page.getByText('Apakah aplikasi ini memindahkan uang?', { exact: true }).click();
  await expect(
    page.getByText('Masuk Saku mencatat dan mengelola keuangan.', { exact: false }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Masuk', exact: true }).first().click();
  await expect(
    page.getByRole('textbox', { name: 'Username atau email', exact: true }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
