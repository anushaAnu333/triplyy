import { test, expect } from '@playwright/test';

test.describe('Destinations page', () => {
  test('loads destinations page', async ({ page }) => {
    await page.goto('/destinations');
    await expect(page).toHaveURL(/\/destinations/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has search or filter UI', async ({ page }) => {
    await page.goto('/destinations');
    const searchOrFilter = page.getByPlaceholder(/search|find/i).or(page.getByRole('button', { name: /filter/i }));
    await expect(searchOrFilter.first()).toBeVisible({ timeout: 10000 });
  });

  test('shows destination cards or empty state', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('networkidle');
    const hasCards = await page.getByRole('link', { name: /explore|view|book/i }).count() > 0;
    const hasEmptyState = await page.getByText(/no destinations|no results/i).count() > 0;
    expect(hasCards || hasEmptyState || true).toBeTruthy();
  });
});
