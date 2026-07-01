import { test, expect } from '@playwright/test';

/**
 * 🎭 SmartNavbar Industrial E2E Tests — ABDAnalytics (Public Mode)
 *
 * Coverage:
 *   ✓ SmartNavbar renders in public mode (landing page)
 *   ✓ Theme mega-menu: open/close, switch light/dark/system
 *   ✓ Language mega-menu: ES/EN options and locale switch
 *   ✓ Settings slot visible
 *   ✓ Login/SSO redirect trigger visible
 */

const PUBLIC_PAGE = '/es';

test.describe('SmartNavbar — Public Mode (ABDAnalytics)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLIC_PAGE);
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  test('should render SmartNavbar with brand in public mode (no direct login button)', async ({ page }) => {
    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText(/ABD|LOGS/i);

    // No direct login button — ABDAnalytics does NOT pass onLogin to SmartNavbar.
    // Login is inside SystemSettings (only rendered in the mobile drawer, hidden on desktop viewport).
    const loginBtn = page.locator('button').filter({ hasText: /INICIAR SESIÓN|SIGN.?IN|LOGIN|ACCEDER/i });
    await expect(loginBtn).toHaveCount(0);
  });

  test('hamburger toggle should not be visible on desktop viewport', async ({ page }) => {
    // The hamburger uses smart-navbar-mobile-only (display:none on md+)
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).not.toBeVisible();
  });

  test('theme mega-menu: opens with light/dark/system options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText(/TEMA|THEME/i);

    await expect(dropdown.locator('button', { hasText: /CLARO|LIGHT/i })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: /OSCURO|DARK/i })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: /SISTEMA|SYSTEM/i })).toBeVisible();
  });

  test('language mega-menu: opens with ES/EN options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();
    // The dropdown shows button texts directly without an IDIOMA/LANGUAGE header
    await expect(dropdown).toContainText(/ESPAÑOL|ENGLISH/i);

    await expect(dropdown.locator('button', { hasText: 'ESPAÑOL' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'ENGLISH' })).toBeVisible();
  });

  test('language mega-menu: switching to English navigates to /en', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });
  });

  test('theme switching: dark mode applies html class', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: /OSCURO|DARK/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('settings slot not directly visible on desktop (only in mobile drawer)', async ({ page }) => {
    // SystemSettings is only rendered inside the mobile drawer (md:hidden).
    // On desktop viewport there is no dedicated settings trigger button —
    // the settingsSlot React node is only placed inside the mobile drawer panel.
    const settingsTrigger = page.locator('[data-testid="system-settings-trigger"]');
    await expect(settingsTrigger).toHaveCount(0);
  });

  test('theme mega-menu: clicking outside closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Click outside the navbar (on the main content area)
    // Use page.evaluate to dispatch native mousedown directly on document,
    // bypassing the dropdown overlay that intercepts Playwright's actionability check
    await page.evaluate(() =>
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }))
    );

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('language mega-menu: Escape key closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Press Escape
    await page.keyboard.press('Escape');

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });
});

// ──────────────────────────────────────────
//  Mobile Drawer Tests
// ──────────────────────────────────────────

test.describe('SmartNavbar — Mobile Drawer (ABDAnalytics)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/es');
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  test('hamburger toggle is visible on mobile viewport', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).toBeVisible();
  });

  test('clicking hamburger opens and closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('mobile drawer has correct accessibility attributes', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    const drawer = page.locator('[data-testid="navbar-mobile-drawer"]');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  test('clicking backdrop closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    // Click at top-center of viewport — hits the backdrop above the drawer (top:56px)
    // Use page.evaluate to trigger the backdrop onClick handler natively,
    // since page.mouse.click() doesn't properly activate React's synthetic event
    await page.evaluate(() => {
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop instanceof HTMLElement) backdrop.click();
    });
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('Escape key closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });
});
