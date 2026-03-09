import { test, expect } from '@playwright/test';

test.describe('Activities page', () => {
  test('loads activities page', async ({ page }) => {
    await page.goto('/activities');
    await expect(page).toHaveURL(/\/activities/);
    await expect(page.getByRole('heading', { name: /browse activities/i })).toBeVisible();
  });

  test('has search and location filter', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.getByPlaceholder(/search activities/i)).toBeVisible();
    await expect(page.getByPlaceholder(/filter by location/i)).toBeVisible();
  });

  test('shows activities grid or empty state', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForLoadState('networkidle');
    const hasActivities = await page.getByText(/no activities found/i).count() > 0;
    const hasGrid = await page.locator('[class*="grid"]').count() > 0;
    expect(hasActivities || hasGrid).toBeTruthy();
  });

  test('can navigate from homepage via Activities link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /activities/i }).first().click();
    await expect(page).toHaveURL(/\/activities/);
  });
});
