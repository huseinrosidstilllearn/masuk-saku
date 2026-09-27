import { test, expect } from '@playwright/test';

test('scope picker uses the shared panel, keyboard, Escape and real owner scope at320px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  const scope = page.getByLabel('Lingkup dashboard');
  expect(await scope.evaluate((el) => getComputedStyle(el).appearance)).toBe('base-select');
  await scope.click();
  await expect(scope).toHaveJSProperty('value', 'family');
  expect(await scope.evaluate((el) => el.matches(':open'))).toBe(true);
  expect(await scope.evaluate((el) => getComputedStyle(el, '::picker(select)').borderRadius)).toBe(
    '16px',
  );
  await page.screenshot({ path: 'docs/screenshots/dropdown-scope-320.png' });
  await page.keyboard.press('Escape');
  expect(await scope.evaluate((el) => el.matches(':open'))).toBe(false);
  await expect(scope).toBeFocused();
  await expect(scope).toHaveValue('family');
  await scope.click();
  await page.getByRole('option', { name: 'Anggota', exact: true }).click();
  await expect(scope).toHaveValue('demo-member');
  await expect(page.locator('.wallet-card')).toHaveCount(1);
  await scope.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(scope).toHaveValue('family');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('form and time pickers stay inside native review, close before the dialog and preserve 24-hour values', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Catat transaksi', exact: true }).click();
  const dialog = page.getByRole('dialog');
  // Use labelled native selectors: no surrogate or hidden select is added.
  const first = dialog.locator('select').first();
  await first.click();
  expect(await first.evaluate((el) => el.matches(':open'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  expect(await first.evaluate((el) => el.matches(':open'))).toBe(false);
  const hour = dialog.getByLabel('Jam', { exact: true });
  await hour.click();
  await hour.getByRole('option', { name: '23', exact: true }).click();
  await expect(hour).toHaveValue('23');
  const minute = dialog.getByLabel('Menit', { exact: true });
  await minute.click();
  expect(
    await minute.evaluate((el) => getComputedStyle(el, '::picker(select)').transitionDuration),
  ).toBe('0s');
  await page.screenshot({ path: 'docs/screenshots/dropdown-time-review.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
