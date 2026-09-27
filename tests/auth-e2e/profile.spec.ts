import { test, expect } from '@playwright/test';
test('profile loads login username and preserves edits when a duplicate is rejected', async ({
  page,
}) => {
  let writes = 0;
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    };
    const reply = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(value),
      });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/user_profiles')) return reply(null);
    if (path.endsWith('/get_my_username')) return reply('akun_awal');
    if (path.endsWith('/set_my_username')) {
      writes++;
      expect(route.request().postDataJSON()).toEqual({ p_username: 'akun_baru' });
      return writes === 1
        ? reply({ message: 'already in use', code: 'P0001' }, 400)
        : reply('akun_baru');
    }
    return reply({});
  });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/profile.tsx';show();",
  });
  const input = page.getByRole('textbox', { name: 'Username', exact: true });
  await expect(input).toHaveValue('akun_awal');
  await input.fill('AKUN_BARU');
  await page.getByRole('button', { name: 'Simpan username', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Username sudah dipakai');
  await expect(input).toHaveValue('AKUN_BARU');
  await page.getByRole('button', { name: 'Simpan username', exact: true }).click();
  await expect(input).toHaveValue('akun_baru');
  await expect(page.getByRole('status')).toContainText('login berikutnya');
});
test('photo preview stays local until Save and explicit rejection cleans only its candidate', async ({
  page,
}) => {
  const user = '11111111-1111-4111-8111-111111111111';
  let uploaded = '';
  let writes = 0;
  const removed: string[] = [];
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    };
    const reply = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/user_profiles')) return reply(null);
    if (path.includes('/object/avatars/') && route.request().method() === 'POST') {
      uploaded = path.split('/object/avatars/')[1];
      return reply({ Key: 'avatars/' + uploaded });
    }
    if (path.endsWith('/save_my_profile')) {
      writes++;
      const body = route.request().postDataJSON();
      expect(body.p_expected_revision).toBe(0);
      expect(body.p_profile.avatar_path).toBe(uploaded);
      return writes === 1
        ? reply({ code: 'P0001', message: 'fixture rejection' }, 400)
        : reply({ ...body.p_profile, user_id: user, revision: 1 });
    }
    if (path.endsWith('/object/avatars') && route.request().method() === 'DELETE') {
      removed.push(...route.request().postDataJSON().prefixes);
      return reply([]);
    }
    if (path.includes('/object/sign/')) return reply({ signedURL: '/fake-avatar.png' });
    return reply({});
  });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/profile.tsx';show();",
  });
  await page.getByRole('textbox', { name: 'Nama lengkap', exact: true }).fill('Nama akun');
  await page.getByLabel('Pilih foto profil').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByAltText('Foto profil saya')).toHaveAttribute('src', /^blob:/);
  expect(uploaded).toBe('');
  expect(writes).toBe(0);
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Data masukan tetap tersedia');
  expect(removed).toEqual([uploaded]);
  await expect(page.getByAltText('Foto profil saya')).toHaveAttribute('src', /^blob:/);
  const rejected = uploaded;
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('berhasil disimpan');
  expect(uploaded).not.toBe(rejected);
  expect(removed).toEqual([rejected]);
});
test('profile removal waits for save, failed saves preserve inputs, and uploads enforce 2 MB', async ({
  page,
}) => {
  const oldPath = '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.png';
  const profile = {
    user_id: '11111111-1111-4111-8111-111111111111',
    full_name: 'Nama akun',
    nickname: 'Anggota',
    phone: '',
    birth_date: null,
    city: '',
    bio: '',
    avatar_path: oldPath,
    revision: 1,
  };
  let writes = 0;
  const deletes: string[] = [];
  await page.route(/https:\/\/session-fixture\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    };
    const reply = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/user_profiles')) return reply(profile);
    if (path.includes('/object/sign/')) return reply({ signedURL: '/fake-avatar.png' });
    if (path.endsWith('/save_my_profile')) {
      writes++;
      const body = route.request().postDataJSON();
      expect(body.p_expected_revision).toBe(1);
      expect(body.p_profile.avatar_path).toBeNull();
      return writes === 1
        ? reply({ code: 'P0001', message: 'fixture failure' }, 400)
        : reply({ ...profile, ...body.p_profile, revision: 2 });
    }
    if (route.request().method() === 'DELETE' && path.endsWith('/object/avatars')) {
      deletes.push(...route.request().postDataJSON().prefixes);
      return reply([]);
    }
    return reply({});
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/profile.tsx';show();",
  });
  await expect(page.getByRole('textbox', { name: 'Nama lengkap', exact: true })).toHaveValue(
    'Nama akun',
  );
  await page
    .getByLabel('Pilih foto profil')
    .setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2097153) });
  await expect(page.getByRole('alert')).toContainText('maksimal 2 MB');
  expect(writes).toBe(0);
  await page.getByRole('button', { name: 'Hapus foto', exact: true }).click();
  expect(deletes).toEqual([]);
  await page.getByRole('textbox', { name: 'Kota' }).fill('Bandung');
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Data masukan tetap tersedia');
  await expect(page.getByRole('textbox', { name: 'Kota' })).toHaveValue('Bandung');
  expect(deletes).toEqual([]);
  await page.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('berhasil disimpan');
  expect(deletes).toEqual([oldPath]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
