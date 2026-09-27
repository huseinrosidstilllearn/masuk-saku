import { test, expect } from '@playwright/test';

test('bank navigation is ordered and fixed; chooser restores focus and manual stays uncommitted', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  expect(
    await nav
      .locator('button:visible')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('aria-label'))),
  ).toEqual(['Dashboard', 'Dompet', 'Tambah transaksi', 'Transaksi', 'Anggaran']);
  const before = await page.locator('.stat.featured h2').textContent();
  const trigger = nav.getByRole('button', { name: 'Tambah transaksi', exact: true });
  const position = await nav.boundingBox();
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Tambah transaksi', exact: true });
  await expect(dialog.locator('.capture-options > button')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: /^Tambah manual/ }).click();
  await expect(page.getByRole('heading', { name: 'Catat transaksi', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.stat.featured h2')).toHaveText(before!);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect((await nav.boundingBox())!.y).toBeCloseTo(position!.y, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'docs/screenshots/bank-nav-mobile.png' });
});

test('camera is requested only after Foto struk; denial offers upload and manual', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).cameraCalls = 0;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: async () => {
        (window as any).cameraCalls++;
        throw new DOMException('denied', 'NotAllowedError');
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah transaksi', exact: true }).click();
  expect(await page.evaluate(() => (window as any).cameraCalls)).toBe(0);
  await page.getByRole('button', { name: /^Foto struk/ }).click();
  await expect(page.getByRole('alert')).toContainText('Izin kamera belum diberikan');
  await expect(page.getByRole('button', { name: 'Ambil foto', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Pilih upload struk', exact: true }).click();
  await expect(page.getByLabel('Gambar struk', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Catat manual tanpa lampiran' }).click();
  await expect(page.getByRole('heading', { name: 'Catat transaksi', exact: true })).toBeVisible();
});

async function fakeCamera(page: import('@playwright/test').Page, late = false) {
  await page.addInitScript(
    ({ late }) => {
      (window as any).cameraTracks = [];
      (window as any).releaseCameras = [];
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: (constraints: MediaStreamConstraints) => {
          if (constraints.audio !== false) throw new Error('Audio must remain disabled');
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d')!;
          const stream = canvas.captureStream(10);
          const tracks = stream.getTracks();
          (window as any).cameraTracks.push(...tracks);
          const timer = setInterval(() => {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = '#222';
            ctx.fillText('STRUK CONTOH', 100, 100);
          }, 50);
          tracks.forEach((track) => {
            const stop = track.stop.bind(track);
            track.stop = () => {
              clearInterval(timer);
              stop();
            };
          });
          return late
            ? new Promise((resolve) => (window as any).releaseCameras.push(() => resolve(stream)))
            : Promise.resolve(stream);
        },
      });
    },
    { late },
  );
}

test('photo creates a valid local JPEG, stops all camera tracks and still needs confirmation', async ({
  page,
}) => {
  await fakeCamera(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const before = await page.locator('.stat.featured h2').textContent();
  await page.getByRole('button', { name: 'Tambah transaksi', exact: true }).click();
  await page.getByRole('button', { name: /^Foto struk/ }).click();
  const snap = page.getByRole('button', { name: 'Ambil foto', exact: true });
  await expect(snap).toBeEnabled();
  await page.screenshot({ path: 'docs/screenshots/receipt-camera-mobile.png' });
  await snap.click();
  await expect(page.getByRole('img', { name: 'Pratinjau struk pilihan' })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('foto-struk.jpg');
  await expect(page.getByRole('button', { name: 'Baca dengan AI', exact: true })).toBeDisabled();
  expect(
    await page.evaluate(() =>
      (window as any).cameraTracks.every((t: MediaStreamTrack) => t.readyState === 'ended'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Ambil foto ulang' }).click();
  await expect(snap).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(snap).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('Kamera dihentikan');
  expect(
    await page.evaluate(() =>
      (window as any).cameraTracks.every((t: MediaStreamTrack) => t.readyState === 'ended'),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Coba kamera lagi' }).click();
  await expect(snap).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(
    await page.evaluate(() =>
      (window as any).cameraTracks.every((t: MediaStreamTrack) => t.readyState === 'ended'),
    ),
  ).toBe(true);
  await expect(page.locator('.stat.featured h2')).toHaveText(before!);
});

test('permission resolving after cancel cannot leave a camera running', async ({ page }) => {
  await fakeCamera(page, true);
  await page.goto('/');
  await page.getByRole('button', { name: 'Tambah transaksi', exact: true }).click();
  await page.getByRole('button', { name: /^Foto struk/ }).click();
  await expect(page.getByRole('status')).toContainText('Menunggu izin');
  await page.evaluate(() => {
    const dialog = document.querySelector('dialog[open]')!;
    (window as any).dialogDiagnostics = [];
    for (const name of ['keydown', 'cancel', 'close'])
      dialog.addEventListener(name, (event) =>
        (window as any).dialogDiagnostics.push({ event: name, key: (event as KeyboardEvent).key }),
      );
  });
  await page.keyboard.press('Escape');
  console.log(
    'permission-dialog events',
    await page.evaluate(() => ({
      events: (window as any).dialogDiagnostics,
      active: document.activeElement?.tagName,
      browser: navigator.userAgent,
    })),
  );
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.evaluate(() =>
    (window as any).releaseCameras.forEach((release: () => void) => release()),
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as any).cameraTracks.length > 0 &&
          (window as any).cameraTracks.every((t: MediaStreamTrack) => t.readyState === 'ended'),
      ),
    )
    .toBe(true);
});
