import { test, expect } from '@playwright/test';

test.describe('CTA flows (Become Merchant, Referral Partner)', () => {
  test('Become a Merchant CTA when not logged in redirects to login', async ({ page }) => {
    await page.goto('/become-merchant');
    await page.waitForLoadState('domcontentloaded');
    const cta = page.getByRole('link', { name: /sign in to get started|sign in/i }).or(page.getByRole('button', { name: /sign in to get started|become a merchant/i }));
    await expect(cta.first()).toBeVisible({ timeout: 15000 });
    await cta.first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 25000 });
  });

  test('Referral Partner CTA when not logged in redirects to login', async ({ page }) => {
    await page.goto('/referral-partner');
    await page.waitForLoadState('networkidle');
    const cta = page.getByRole('button', { name: /become a referral|join|register|get started/i }).or(
      page.getByRole('link', { name: /become a referral|join|affiliate/i })
    ).first();
    await cta.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Get Started on homepage goes to register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('Sign In on homepage goes to login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /sign in/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});
