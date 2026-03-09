import { test, expect } from '@playwright/test';

test.describe('Destination detail page', () => {
  test('shows destination or not-found when opening a slug', async ({ page }) => {
    await page.goto('/destinations/4-days-3-nights-georgia-tour');
    await expect(
      page.getByRole('heading', { name: /georgia|4 days|3 nights|about this trip|get travel inspiration/i }).or(page.getByText(/not found|browse destinations/i)).first()
    ).toBeVisible({ timeout: 25000 });
  });

  test('detail page has Back to Destinations or Browse Destinations link', async ({ page }) => {
    await page.goto('/destinations/4-days-3-nights-georgia-tour');
    await page.waitForLoadState('networkidle');
    const backOrBrowse = page.getByRole('link', { name: /back to destinations|browse destinations/i });
    await expect(backOrBrowse.first()).toBeVisible({ timeout: 10000 });
  });

  test('when destination exists, has Book Now and deposit info', async ({ page }) => {
    await page.goto('/destinations/4-days-3-nights-georgia-tour');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/destination not found/i).or(page.getByRole('heading', { name: /about this trip/i }))
    ).toBeVisible({ timeout: 15000 });
    const notFound = await page.getByText(/destination not found/i).isVisible();
    if (notFound) {
      test.skip();
      return;
    }
    await expect(page.getByRole('button', { name: /book now/i }).or(page.getByRole('link', { name: /book now/i })).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=AED').first()).toBeVisible();
  });

  test('when destination exists, has About This Trip and Highlights sections', async ({ page }) => {
    await page.goto('/destinations/4-days-3-nights-georgia-tour');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByText(/destination not found/i).or(page.getByRole('heading', { name: /about this trip/i }))
    ).toBeVisible({ timeout: 15000 });
    const notFound = await page.getByText(/destination not found/i).isVisible();
    if (notFound) {
      test.skip();
      return;
    }
    await expect(page.getByRole('heading', { name: /about this trip/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /highlights/i })).toBeVisible();
  });
});
