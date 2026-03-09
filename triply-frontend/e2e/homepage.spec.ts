import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows TRIPLY branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TRIPLY|triply/i);
    await expect(page.getByRole('link', { name: /TRIPLY/i }).first()).toBeVisible();
  });

  test('has main navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /destinations/i }).first()).toBeVisible();
  });

  test('can navigate to Destinations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /destinations/i }).first().click();
    await expect(page).toHaveURL(/\/destinations/);
  });

  test('has Get Started CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('How It Works link scrolls to section or stays on home', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /how it works/i }).first().click();
    expect(page.url()).toMatch(/how-it-works|:\d+\/?$/);
    await expect(page.getByRole('heading', { name: /how it works/i }).first()).toBeVisible({ timeout: 5000 });
  });
});
