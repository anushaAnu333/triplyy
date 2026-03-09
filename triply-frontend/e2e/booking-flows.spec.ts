import { test, expect } from '@playwright/test';

test.describe('Booking flows (functionality)', () => {
  test('Book Now when not logged in redirects to login', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('domcontentloaded');
    const card = page.locator('a[href^="/destinations/"]').filter({ hasNotText: /back to|browse/i }).first();
    if ((await card.count()) === 0) {
      test.skip();
      return;
    }
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.click();
    await expect(
      page.getByRole('button', { name: /book now/i }).or(page.getByText(/destination not found|browse destinations/i)).first()
    ).toBeVisible({ timeout: 25000 });
    const notFound = await page.getByRole('heading', { name: /destination not found/i }).isVisible().catch(() => false);
    if (notFound) {
      test.skip();
      return;
    }
    await page.getByRole('button', { name: /book now/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });

  test('invalid referral code on destination detail shows error', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('domcontentloaded');
    const card = page.locator('a[href^="/destinations/"]').filter({ hasNotText: /back to|browse/i }).first();
    if ((await card.count()) === 0) {
      test.skip();
      return;
    }
    await card.click();
    await expect(
      page.getByRole('button', { name: /book now/i }).or(page.getByText(/destination not found|browse destinations/i)).first()
    ).toBeVisible({ timeout: 25000 });
    if (await page.getByRole('heading', { name: /destination not found/i }).isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await page.getByPlaceholder(/enter code/i).fill('INVALIDCODE123');
    await page.getByRole('button', { name: /apply/i }).click();
    await expect(page.getByText(/invalid|not valid|affiliate code/i)).toBeVisible({ timeout: 25000 });
  });

  test('referral code Apply button is clickable when destination exists', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('domcontentloaded');
    const card = page.locator('a[href^="/destinations/"]').filter({ hasNotText: /back to|browse/i }).first();
    if ((await card.count()) === 0) {
      test.skip();
      return;
    }
    await card.click();
    await expect(
      page.getByRole('button', { name: /book now/i }).or(page.getByText(/destination not found|browse destinations/i)).first()
    ).toBeVisible({ timeout: 25000 });
    if (await page.getByRole('heading', { name: /destination not found/i }).isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    const applyBtn = page.getByRole('button', { name: /apply/i });
    await expect(applyBtn).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder(/enter code/i).fill('TEST');
    await applyBtn.click();
    await expect(
      page.getByText(/invalid|referred by|code applied|affiliate|not valid/i)
    ).toBeVisible({ timeout: 25000 });
  });
});
