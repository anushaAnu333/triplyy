import { test, expect } from '@playwright/test';

test.describe('Auth flows (functionality)', () => {
  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(
      page.getByText(/login failed|invalid|error|invalid email or password/i).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('login with empty password shows validation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/password is required/i)).toBeVisible({ timeout: 5000 });
  });

  test('register with short password shows validation', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/^password$/i).fill('short');
    await page.getByLabel(/confirm password/i).fill('short');
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await expect(page.getByText(/at least 8 characters|password must contain/i)).toBeVisible({ timeout: 5000 });
  });

  test('register with mismatched passwords shows validation', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/^password$/i).fill('ValidPass1');
    await page.getByLabel(/confirm password/i).fill('ValidPass2');
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 5000 });
  });

  test('register form submits and shows toast (success or API error)', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/first name/i).fill('E2E');
    await page.getByLabel(/last name/i).fill('Tester');
    await page.getByLabel(/email/i).fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel(/^password$/i).fill('ValidPass1');
    await page.getByLabel(/confirm password/i).fill('ValidPass1');
    await page.getByRole('button', { name: /create account|sign up|register/i }).click();
    await expect(
      page.getByText(/registration successful|registration failed|check your email|something went wrong|success|failed/i).first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('forgot password submit shows success or error message', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).fill('noreply@example.com');
    await page.getByRole('button', { name: /send|reset|submit/i }).click();
    await expect(
      page.getByText(/check your email|email sent|something went wrong|error/i).first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('forgot password submit shows Check Your Email or error', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /send|reset|submit/i }).click();
    await expect(
      page.getByRole('heading', { name: /check your email/i }).or(page.getByText(/error|something went wrong/i).first())
    ).toBeVisible({ timeout: 20000 });
  });

  test('login form link to register works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('login form link to forgot password works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
