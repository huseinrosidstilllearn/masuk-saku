import { test, expect, type Page } from '@playwright/test';
const id = '11111111-1111-4111-8111-111111111111';
const activityKey = 'masuk-saku:last-activity:' + id;
const authKey = 'sb-session-fixture-auth-token';
async function setup(page: Page, { restored = false, idleMinutes = 16 } = {}) {
  const now = Date.now();
  const user = {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'fixture@example.test',
    created_at: new Date(now).toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
  };
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token =
    part({ alg: 'HS256', typ: 'JWT' }) +
    '.' +
    part({
      sub: id,
      aud: 'authenticated',
      role: 'authenticated',
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + 3600,
    }) +
    '.fake-test-signature';
  const session = {
    access_token: token,
    refresh_token: 'fake-test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(now / 1000) + 3600,
    user,
  };
  let logout = 0;
  await page.route(/https:\/\/[^/]+\.supabase\.co\//, async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.hostname !== 'session-fixture.supabase.co') throw Error('Unexpected backend');
    const headers = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:5177',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    };
    const reply = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(value),
      });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname === '/functions/v1/username-login')
      return reply({ access_token: token, refresh_token: session.refresh_token });
    if (url.pathname === '/auth/v1/token') return reply(session);
    if (url.pathname === '/auth/v1/user') return reply(user);
    if (url.pathname === '/auth/v1/logout') {
      logout++;
      return route.fulfill({ status: 204, headers });
    }
    if (url.pathname.startsWith('/rest/v1/')) return reply([]);
    throw Error('Unmocked backend request: ' + url.pathname);
  });
  await page.addInitScript(
    ({ activityKey, authKey, session, restored, idleMinutes, now }) => {
      sessionStorage.setItem(activityKey, String(now - idleMinutes * 60000));
      if (restored) sessionStorage.setItem(authKey, JSON.stringify(session));
    },
    { activityKey, authKey, session, restored, idleMinutes, now },
  );
  return { logout: () => logout, session };
}
for (const identifier of ['fixture_saku', 'fixture@example.test'])
  test(`new login with ${identifier.includes('@') ? 'email' : 'username'} replaces stale activity without immediate logout`, async ({
    page,
  }) => {
    const fixture = await setup(page);
    await page.goto('/masuk');
    await page.getByRole('textbox', { name: 'Username atau email', exact: true }).fill(identifier);
    await page.getByLabel('Password', { exact: true }).fill('test-only-password');
    await page.locator('.auth-card').getByRole('button', { name: 'Masuk', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Saku pertama keluargamu', exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('.auth-card').getByRole('textbox', { name: 'Username atau email' }),
    ).toHaveCount(0);
    expect(fixture.logout()).toBe(0);
    expect(
      await page.evaluate((key) => Number(sessionStorage.getItem(key)), activityKey),
    ).toBeGreaterThan(Date.now() - 60000);
  });
test('restored expired session is locked and its activity is cleared', async ({ page }) => {
  const fixture = await setup(page, { restored: true, idleMinutes: 16 });
  await page.goto('/masuk');
  await expect(page.getByRole('heading', { name: 'Masuk ke sakumu.', exact: true })).toBeVisible();
  expect(fixture.logout()).toBe(1);
  expect(await page.evaluate((key) => sessionStorage.getItem(key), activityKey)).toBeNull();
});
test('revalidation for the same signed-in user does not reset inactivity', async ({ page }) => {
  const fixture = await setup(page, { restored: true, idleMinutes: 5 });
  await page.goto('/masuk');
  await expect(
    page.getByRole('heading', { name: 'Saku pertama keluargamu', exact: true }),
  ).toBeVisible();
  const before = await page.evaluate((key) => sessionStorage.getItem(key), activityKey);
  await page.evaluate(
    async ({ session, modulePath }) => {
      // Real Supabase SDK revalidation; every backend request is intercepted above.
      const { supabase } = await import(modulePath);
      await supabase!.auth.setSession(session);
    },
    { session: fixture.session, modulePath: '/src/lib/supabase.ts' },
  );
  expect(await page.evaluate((key) => sessionStorage.getItem(key), activityKey)).toBe(before);
  expect(fixture.logout()).toBe(0);
});
