import { test, expect } from '@playwright/test';

test('Owner invite dialog explains access, demo cannot send, Escape restores focus at 320px', async ({
  page,
}) => {
  await page.goto('/');
  const balance = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Pengaturan', exact: true }).click();
  await expect(page.locator('.household-panel')).toContainText('Owner');
  await expect(page.locator('.household-panel')).toContainText('Member');
  await expect(page.locator('.household-panel')).toContainText('Kode tidak dikirim otomatis');
  const open = page.getByRole('button', { name: 'Undang anggota', exact: true });
  await page.setViewportSize({ width: 320, height: 740 });
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('akses ke keuangan keluarga');
  await dialog.getByLabel('Email penerima').fill('recipient@example.test');
  await dialog.getByRole('button', { name: 'Buat kode undangan', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Mode demo');
  await expect(dialog.getByLabel('Email penerima')).toHaveValue('recipient@example.test');
  expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(page.locator('.stat.featured h2')).toHaveText(balance!);
});

test('join onboarding validates code and keeps inputs after demo rejection at320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/onboarding.tsx';show();",
  });
  await page.getByRole('button', { name: 'Punya kode undangan? Bergabung', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Bergabung dengan keluarga', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Nama panggilan').fill('Penerima uji');
  await page.getByLabel('Kode undangan', { exact: true }).fill('bad-code');
  await page.getByRole('button', { name: 'Terima undangan', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('64 karakter');
  await page.getByLabel('Kode undangan', { exact: true }).fill('a'.repeat(64));
  await page.getByRole('button', { name: 'Terima undangan', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Mode demo');
  await expect(page.getByLabel('Nama panggilan')).toHaveValue('Penerima uji');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Buat keluarga sendiri', exact: true }).click();
  await expect(page.getByLabel('Nama keluarga')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
