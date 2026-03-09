import { test, expect } from '@playwright/test';

test.describe('Activities flows (functionality)', () => {
  test('search input accepts text', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder(/search activities/i);
    await search.fill('diving');
    await expect(search).toHaveValue('diving');
  });

  test('location filter accepts text', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForLoadState('networkidle');
    const location = page.getByPlaceholder(/filter by location/i);
    await location.fill('Dubai');
    await expect(location).toHaveValue('Dubai');
  });

  test('page shows activities list or empty state after load', async ({ page }) => {
    await page.goto('/activities');
    await page.waitForLoadState('networkidle');
    const hasList = await page.getByText(/no activities found/i).isVisible();
    const hasCards = await page.locator('[class*="grid"]').count() > 0;
    expect(hasList || hasCards).toBeTruthy();
  });
});
