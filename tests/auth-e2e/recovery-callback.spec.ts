import { test, expect } from '@playwright/test';
for (const fragment of ['#pemulihan-password', ''])
  test(`real SDK PKCE recovery (${fragment || 'site URL fallback'}) replaces stale idle deadline and cancellation signs out without finance reads`, async ({
    page,
  }) => {
    const id = '11111111-1111-4111-8111-111111111111',
      now = Math.floor(Date.now() / 1000);
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
    const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const token =
      part({ alg: 'HS256' }) + '.' + part({ sub: id, exp: now + 3600 }) + '.test-signature';
    let exchange = 0,
      logout = 0,
      finance = 0;
    await page.addInitScript((id) => {
      sessionStorage.setItem(
        'sb-session-fixture-auth-token-code-verifier',
        JSON.stringify('fixture-verifier/recovery'),
      );
      sessionStorage.setItem('masuk-saku:last-activity:' + id, String(Date.now() - 16 * 60000));
    }, id);
    await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      };
      const reply = (value: unknown) =>
        route.fulfill({
          status: 200,
          headers,
          contentType: 'application/json',
          body: JSON.stringify(value),
        });
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.pathname === '/auth/v1/token') {
        exchange++;
        expect(url.searchParams.get('grant_type')).toBe('pkce');
        expect(req.postDataJSON()).toMatchObject({
          auth_code: 'fixture-code',
          code_verifier: 'fixture-verifier',
        });
        return reply({
          user,
          access_token: token,
          refresh_token: 'fake-test-refresh',
          token_type: 'bearer',
          expires_in: 3600,
        });
      }
      if (url.pathname === '/auth/v1/user') return reply(user);
      if (url.pathname === '/auth/v1/logout') {
        logout++;
        return route.fulfill({ status: 204, headers });
      }
      if (url.pathname.startsWith('/rest/')) {
        finance++;
        return reply([]);
      }
      throw Error('Unexpected backend ' + url.pathname);
    });
    await page.goto('/?code=fixture-code' + fragment);
    await expect(
      page.getByRole('heading', { name: 'Buat password baru', exact: true }),
    ).toBeVisible();
    expect(exchange).toBe(1);
    expect(logout).toBe(0);
    expect(finance).toBe(0);
    await page.getByRole('button', { name: 'Batalkan pemulihan', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'Username atau email', exact: true }),
    ).toBeVisible();
    expect(logout).toBe(1);
    expect(finance).toBe(0);
    expect(new URL(page.url()).hash).toBe('');
  });
