import { test, expect } from '@playwright/test';
test('profile avatar remains visible and clickable on narrow banking header', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  const button = page
    .getByRole('banner')
    .getByRole('button', { name: 'Buka profil saya', exact: true });
  await expect(button.locator('.small-avatar')).toBeVisible();
  const box = await button.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(40);
  await button.click();
  await expect(
    page.getByRole('heading', { name: 'Profil saya', exact: true, level: 2 }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Username', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
