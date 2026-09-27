import { test, expect } from '@playwright/test';

test('component accents animate once without animating money; masking and reduced motion stay immediate', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const icon = page.locator('.quick-icon');
  expect(await icon.evaluate((el) => getComputedStyle(el).animationName)).toBe('t-accent-enter');
  expect(
    await page.locator('.balance-pocket h2').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  expect(
    await page
      .locator('.balance-pocket')
      .evaluate((el) => getComputedStyle(el, '::before').animationName),
  ).toBe('t-pocket-unfold');
  await page.getByRole('button', { name: 'Sembunyikan saldo', exact: true }).click();
  await expect(page.locator('.balance-pocket h2')).toHaveText('Rp ••••••');
  await expect(page.getByRole('table', { name: 'Rincian arus uang mingguan' })).toHaveCount(0);
  await expect(page.locator('.budget-pulse')).toHaveCount(0);
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document
              .getAnimations()
              .filter(
                (animation) =>
                  animation instanceof CSSAnimation &&
                  ['t-accent-enter', 't-pocket-unfold'].includes(animation.animationName),
              ).length,
        ),
      { timeout: 2000 },
    )
    .toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Dompet', exact: true }).click();
  expect(
    await page
      .locator('.wallet-symbol')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  const wallet = page.locator('.wallet-card').first();
  await wallet.hover();
  expect(
    await wallet.locator('.wallet-symbol svg').evaluate((el) => getComputedStyle(el).transform),
  ).toBe('none');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
