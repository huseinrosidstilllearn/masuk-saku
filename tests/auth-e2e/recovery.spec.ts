import { test, expect } from '@playwright/test';
test('same-document recovery hash navigation opens invalid-link panel instead of silently remaining at login', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('textbox', { name: 'Username atau email', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    location.hash = 'pemulihan-password';
  });
  await expect(
    page.getByRole('heading', { name: 'Tautan pemulihan belum valid', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Password baru', { exact: true })).toHaveCount(0);
});

test('forgot password requests email privately and returns a generic success message', async ({
  page,
}) => {
  let requests = 0;
  await page.route('https://session-fixture.supabase.co/auth/v1/recover**', async (route) => {
    requests++;
    expect(route.request().postDataJSON().email).toBe('unknown@example.test');
    expect(new URL(route.request().url()).searchParams.get('redirect_to')).toBe(
      'http://127.0.0.1:5177/#pemulihan-password',
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: '{}',
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Lupa password?', exact: true }).click();
  await page.getByLabel('Email pemulihan', { exact: true }).fill('unknown@example.test');
  await page.getByRole('button', { name: 'Kirim tautan pemulihan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Jika email terdaftar');
  expect(requests).toBe(1);
  await page.getByRole('button', { name: 'Kembali ke masuk', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Username atau email' })).toBeVisible();
});

test('expired recovery callback cannot expose finance or update a password', async ({ page }) => {
  let writes = 0;
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    writes++;
    await route.abort();
  });
  await page.goto('/#pemulihan-password');
  await expect(
    page.getByRole('heading', { name: 'Tautan pemulihan belum valid', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Password baru', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Ringkasan keuangan' })).toHaveCount(0);
  expect(writes).toBe(0);
});

test('recovery session blocks mismatched passwords, updates authenticated user and signs out', async ({
  page,
}) => {
  const now = Math.floor(Date.now() / 1000),
    id = '11111111-1111-4111-8111-111111111111';
  const user = {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'fixture@example.test',
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
  };
  const part = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const token =
    part({ alg: 'HS256' }) + '.' + part({ sub: id, exp: now + 3600 }) + '.test-signature';
  const session = {
    user,
    access_token: token,
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
  };
  let updates = 0,
    logout = 0,
    financeReads = 0;
  await page.addInitScript(
    (session) => sessionStorage.setItem('sb-session-fixture-auth-token', JSON.stringify(session)),
    session,
  );
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path === '/auth/v1/user') {
      if (request.method() === 'PUT') {
        updates++;
        expect(request.postDataJSON().password).toBe('new-test-password');
      }
      return route.fulfill({
        status: 200,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    }
    if (path === '/auth/v1/logout') {
      logout++;
      return route.fulfill({ status: 204, headers });
    }
    if (path.startsWith('/rest/')) {
      financeReads++;
      return route.fulfill({ status: 200, headers, body: '[]', contentType: 'application/json' });
    }
    throw Error('Unexpected request ' + path);
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/#pemulihan-password');
  await expect(
    page.getByRole('heading', { name: 'Buat password baru', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Password baru', { exact: true }).fill('new-test-password');
  await page.getByLabel('Ulangi password baru', { exact: true }).fill('different-test-password');
  await page.getByRole('button', { name: 'Simpan password baru', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Password belum sama');
  expect(updates).toBe(0);
  await page.getByLabel('Ulangi password baru', { exact: true }).fill('new-test-password');
  await page.getByRole('button', { name: 'Simpan password baru', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Masuk ke sakumu.', exact: true })).toBeVisible();
  expect(updates).toBe(1);
  expect(logout).toBe(1);
  expect(financeReads).toBe(0);
  expect(new URL(page.url()).hash).toBe('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
