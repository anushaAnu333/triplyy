import { test, expect } from '@playwright/test';

test.describe('Become a Merchant page', () => {
  test('loads become merchant page', async ({ page }) => {
    await page.goto('/become-merchant');
    await expect(page).toHaveURL(/\/become-merchant/);
    await expect(page.getByRole('heading', { name: /become a merchant|list your activities|partner with us/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('has CTA to register or get started', async ({ page }) => {
    await page.goto('/become-merchant');
    await expect(page.getByRole('button', { name: /become a merchant|get started|register|join/i }).or(page.getByRole('link', { name: /become a merchant|get started/i })).first()).toBeVisible({ timeout: 10000 });
  });

  test('can navigate from homepage via Become a Merchant link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /become a merchant|merchant/i }).first().click();
    await expect(page).toHaveURL(/\/become-merchant/);
  });
});
