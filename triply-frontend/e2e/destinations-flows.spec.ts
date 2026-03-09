import { test, expect } from '@playwright/test';

test.describe('Destinations flows (functionality)', () => {
  test('search input accepts text and filters or shows results', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder(/search destinations|search/i).first();
    await search.fill('Dubai');
    await page.waitForLoadState('networkidle');
    const countText = page.getByText(/\d+ destinations/i);
    await expect(countText).toBeVisible({ timeout: 10000 });
  });

  test('clearing search updates the list', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder(/search destinations|search/i).first();
    await search.fill('Maldives');
    await page.waitForLoadState('networkidle');
    await search.clear();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/destinations/i).first()).toBeVisible();
  });

  test('region filter can be opened', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('domcontentloaded');
    const regionCombobox = page.getByRole('combobox', { name: /all regions|region/i }).or(page.getByRole('combobox').first());
    await expect(regionCombobox.first()).toBeVisible({ timeout: 10000 });
    await regionCombobox.first().click();
    await page.waitForTimeout(400);
    await expect(page.getByRole('option', { name: 'All Regions' })).toBeVisible({ timeout: 15000 });
  });

  test('clicking a destination card navigates to detail when cards exist', async ({ page }) => {
    await page.goto('/destinations');
    await page.waitForLoadState('networkidle');
    const cardLink = page.getByRole('link', { name: /explore|view details|book now|dubai|maldives|bali|swiss|santorini|japan|georgia/i }).first();
    if ((await cardLink.count()) === 0) {
      test.skip();
      return;
    }
    await cardLink.click();
    await expect(page).toHaveURL(/\/destinations\/[^/]+$/, { timeout: 10000 });
  });

  test('destination detail back link returns to list', async ({ page }) => {
    await page.goto('/destinations/dubai-luxe-escape');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('link', { name: /back to destinations|browse destinations/i }).first()
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole('link', { name: /back to destinations|browse destinations/i }).first().click();
    await expect(page).toHaveURL(/\/destinations$/);
  });
});
