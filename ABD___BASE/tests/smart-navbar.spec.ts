import { test, expect } from '@playwright/test';

test.describe('SmartNavbar — Public Mode (ABD___BASE)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/es');
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  test('should render SmartNavbar with brand', async ({ page }) => {
    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
  });

  test('should navigate to /en via language switcher', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });
  });
});
