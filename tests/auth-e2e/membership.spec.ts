import { test, expect } from '@playwright/test';
test('membership revoke needs explicit confirmation, preserves retry on failure and marks access inactive', async ({
  page,
}) => {
  let writes = 0;
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };
    const reply = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(value),
      });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/list_household_invitations')) return reply([]);
    if (path.endsWith('/revoke_household_member')) {
      writes++;
      expect(route.request().postDataJSON()).toMatchObject({
        p_household: 'demo',
        p_user: 'demo-member',
      });
      return writes === 1 ? reply({ message: 'fixture failure' }, 500) : reply(null);
    }
    throw Error('Unexpected backend ' + path);
  });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/membership.tsx';show();",
  });
  await page.getByRole('button', { name: 'Nonaktifkan akses Anggota', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Nonaktifkan akses anggota', exact: true });
  await expect(dialog).toContainText('Riwayat transaksi dan dompet tetap tersimpan');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(writes).toBe(0);
  await page.getByRole('button', { name: 'Nonaktifkan akses Anggota', exact: true }).click();
  await dialog.getByRole('button', { name: 'Ya, nonaktifkan akses', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('belum berhasil');
  await dialog.getByRole('button', { name: 'Ya, nonaktifkan akses', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(writes).toBe(2);
  await expect(page.getByText('Member · Nonaktif', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Nonaktifkan akses Pemilik', exact: true }),
  ).toHaveCount(0);
});
