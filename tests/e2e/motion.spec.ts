import { test, expect } from '@playwright/test';

test('a new transaction preview during an old exit keeps its own draft and cancels stale close cleanup', async ({
  page,
}) => {
  await page.goto('/');
  const balance = await page.locator('.balance-card h2').textContent();
  const actions = page.getByRole('region', { name: 'Aksi cepat' });
  await actions.getByRole('button', { name: 'Catat pengeluaran', exact: true }).click();
  await page.getByLabel('Nominal (rupiah)').fill('98765');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('.balance-shortcuts button'))
      .find((button) => button.textContent?.trim() === 'Catat pemasukan')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('select').first()).toHaveValue('income');
  await expect(page.getByLabel('Nominal (rupiah)')).toHaveValue('');
  await expect
    .poll(() =>
      dialog.evaluate(
        (element) => element.getAnimations().filter((a) => a.playState === 'running').length,
      ),
    )
    .toBe(0);
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveClass(/is-open/);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('.balance-card h2')).toHaveText(balance!);
});

test('confirmed save notification has an exit lifecycle and keyboard focus survives dismiss', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Input Quick Add').fill('-10k makan @dana');
  await page.getByRole('button', { name: 'Tinjau', exact: true }).click();
  await page.getByRole('button', { name: 'Konfirmasi & simpan' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  const toast = page.locator('.status-message.t-toast');
  await expect(toast).toContainText('Transaksi tersimpan.');
  await expect(toast).toHaveClass(/is-open/);
  await page.getByRole('button', { name: 'Tutup pemberitahuan' }).focus();
  // Capture the short exit state in the same browser task as the real keyboard event.
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      () => {
        const toast = document.querySelector('.status-message.t-toast') as HTMLElement | null;
        (window as unknown as { toastExit: unknown }).toastExit = {
          inert: toast?.inert,
          open: toast?.classList.contains('is-open'),
        };
      },
      { once: true },
    );
  });
  await page.keyboard.press('Enter');
  expect(
    await page.evaluate(() => (window as unknown as { toastExit: unknown }).toastExit),
  ).toEqual({ inert: true, open: false });
  await expect(toast).toHaveCount(0);
  await expect(page.locator('#main-content')).toBeFocused();
});

test('native dialog animates both ways, blocks interaction during exit and restores focus', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Catat transaksi', exact: true });
  const balance = await page.locator('.balance-card h2').textContent();
  const entranceAnimations = await trigger.evaluate(async (element) => {
    (element as HTMLButtonElement).focus();
    (element as HTMLButtonElement).click();
    await new Promise(requestAnimationFrame);
    return document
      .querySelector('dialog')!
      .getAnimations()
      .filter((a) => a.playState === 'running').length;
  });
  expect(entranceAnimations).toBeGreaterThan(0);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveClass(/t-modal.*is-open/);
  expect(await dialog.evaluate((el) => getComputedStyle(el).transitionDuration)).toContain('0.25s');
  await page.getByLabel('Nominal (rupiah)').fill('100000');
  await page.evaluate(() => {
    document.querySelector('dialog')!.addEventListener(
      'cancel',
      (event) => {
        const dialog = event.target as HTMLDialogElement;
        (window as unknown as { modalExit: unknown }).modalExit = {
          closing: dialog.classList.contains('is-closing'),
          inert: dialog.inert,
          connected: dialog.isConnected,
        };
      },
      { once: true },
    );
  });
  await page.keyboard.press('Escape');
  // Closing is a real lifecycle state, not an animation on an already removed element.
  expect(
    await page.evaluate(() => (window as unknown as { modalExit: unknown }).modalExit),
  ).toEqual({ closing: true, inert: true, connected: true });
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.balance-card h2')).toHaveText(balance!);
  await trigger.click();
  await expect(page.getByRole('dialog')).toHaveClass(/is-open/);
  await expect(page.getByRole('dialog')).not.toHaveClass(/is-closing/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('page animation keeps search focus and masks money immediately without outgoing snapshots', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Cari transaksi', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Cari transaksi' })).toBeFocused();
  await page.evaluate(async () => {
    const nav = document.querySelector('nav[aria-label="Navigasi utama"]')!;
    for (const label of ['Dompet', 'Anggaran', 'Dashboard']) {
      Array.from(nav.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === label)!
        .click();
      await new Promise(requestAnimationFrame);
    }
  });
  await expect(page.locator('.workspace-content .t-page')).toHaveCount(1);
  await expect(page.locator('.balance-card')).toBeVisible();
  const navigationMotion = await page.locator('.workspace-content .t-page').evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      properties: style.transitionProperty,
      duration: style.transitionDuration,
      filter: style.filter,
      transform: style.transform,
      willChange: style.willChange,
    };
  });
  expect(navigationMotion).toEqual({
    properties: 'opacity',
    duration: '0.12s',
    filter: 'none',
    transform: 'none',
    willChange: 'auto',
  });
  const result = await page.evaluate(async () => {
    (document.querySelector('.balance-toggle') as HTMLButtonElement).click();
    await new Promise(requestAnimationFrame);
    return {
      balance: document.querySelector('.balance-card h2')!.textContent,
      chart: document.querySelector('.balance-card svg[role="img"]') !== null,
      table: document.querySelector('.balance-card table') !== null,
      amounts: Array.from(
        document.querySelectorAll('.balance-flow strong, .planning-summary h2'),
      ).map((el) => el.textContent),
      copies: document.querySelectorAll('.workspace-content .t-page').length,
    };
  });
  expect(result.balance).toBe('Rp ••••••');
  expect(result.amounts).toEqual(Array(4).fill('Rp ••••••'));
  expect(result.chart).toBe(false);
  expect(result.table).toBe(false);
  expect(result.copies).toBe(1);
  await expect(page.locator('.balance-toggle .t-icon-swap')).toHaveAttribute('data-state', 'b');
});

test('reduced motion disables recipes and dialog closing has no animation delay', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dompet', exact: true }).click();
  expect(
    await page
      .locator('.workspace-content .t-page')
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  await page.getByRole('button', { name: 'Catat transaksi', exact: true }).click();
  expect(
    await page.getByRole('dialog').evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe('0s');
  await page.keyboard.press('Escape');
  expect(await page.locator('dialog').count()).toBe(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('welcome motion preserves keyboard FAQ semantics and reduced-motion hero readability', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/auth.tsx';show();",
  });
  const heading = page.getByRole('heading', { name: 'Semua uang keluarga. Dalam satu saku.' });
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  const disclosure = page.getByRole('button', { name: 'Apakah aplikasi ini memindahkan uang?' });
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByText('Masuk Saku mencatat dan mengelola keuangan.', { exact: false }),
  ).toBeVisible();
  await page.keyboard.press('Space');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  expect(
    await page
      .locator('.t-acc-panel')
      .first()
      .evaluate((el) => (el as HTMLElement).inert),
  ).toBe(true);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
