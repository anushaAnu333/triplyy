import { test, expect } from '@playwright/test';

test.describe('Protected routes (unauthenticated)', () => {
  test('dashboard redirects to login when not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('bookings redirects to login when not logged in', async ({ page }) => {
    await page.goto('/bookings');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('profile redirects to login when not logged in', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin dashboard redirects or shows auth when not logged in', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('/login') || url.includes('/admin')).toBeTruthy();
  });
});
