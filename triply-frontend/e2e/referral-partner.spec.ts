import { test, expect } from '@playwright/test';

test.describe('Referral Partner page', () => {
  test('loads referral partner page', async ({ page }) => {
    await page.goto('/referral-partner');
    await expect(page).toHaveURL(/\/referral-partner/);
    await expect(page.getByRole('heading', { name: /referral|affiliate|earn|partner/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('has CTA to join or register as affiliate', async ({ page }) => {
    await page.goto('/referral-partner');
    await expect(page.getByRole('button', { name: /become a referral|join|register|get started/i }).or(page.getByRole('link', { name: /become a referral|join|affiliate/i })).first()).toBeVisible({ timeout: 10000 });
  });
});
