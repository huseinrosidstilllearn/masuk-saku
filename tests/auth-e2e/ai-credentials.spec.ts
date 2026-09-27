import { test, expect } from '@playwright/test';
test('own BYOK status contains no key; replacement clears input; revocation is explicit and retryable', async ({
  page,
}) => {
  let saved = true,
    saves = 0,
    revokes = 0;
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const reply = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(value),
      });
    if (path.endsWith('/get_my_ai_credential_status'))
      return reply(
        saved
          ? [
              {
                provider: 'openrouter',
                model: 'openrouter/free',
                updated_at: '2026-09-27T04:00:00Z',
              },
            ]
          : [],
      );
    if (path.endsWith('/ai-credentials')) {
      saves++;
      expect(route.request().postDataJSON().api_key).toBe('fixture-key-not-a-secret');
      saved = true;
      return reply({ saved: true });
    }
    if (path.endsWith('/revoke_my_ai_credential')) {
      revokes++;
      if (revokes === 1) return reply({ message: 'fixture failure' }, 500);
      saved = false;
      return reply(null);
    }
    throw Error('Unexpected request ' + path);
  });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/ai-credentials.tsx';show();",
  });
  await expect(page.getByText('Kunci akunmu tersimpan', { exact: true })).toBeVisible();
  await page.getByLabel('API key OpenRouter', { exact: true }).fill('fixture-key-not-a-secret');
  await page.getByRole('button', { name: 'Simpan kunci terenkripsi', exact: true }).click();
  await expect(page.getByLabel('API key OpenRouter', { exact: true })).toHaveValue('');
  await expect(page.getByRole('status')).toContainText('Kunci disimpan');
  expect(saves).toBe(1);
  await page.getByRole('button', { name: 'Cabut kunci AI', exact: true }).click();
  expect(revokes).toBe(0);
  await page.getByRole('button', { name: 'Ya, cabut kunci akun saya', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Permintaan belum berhasil');
  await page.getByRole('button', { name: 'Ya, cabut kunci akun saya', exact: true }).click();
  await expect(page.getByText('Belum ada kunci untuk akunmu', { exact: true })).toBeVisible();
  expect(revokes).toBe(2);
  expect(
    await page.evaluate(() =>
      JSON.stringify({ ...sessionStorage, ...localStorage }).includes('fixture-key-not-a-secret'),
    ),
  ).toBe(false);
});
