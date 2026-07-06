import { test, expect } from '@playwright/test';
import { injectAdminSession } from './helpers/auth';

const pageErrors: string[] = [];

test.describe('Flujo de examen en ABDQuiz', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err: Error) => {
      pageErrors.push(`${err.message} at ${err.stack}`);
    });
    await injectAdminSession(page);
  });

  test('debe mostrar la pagina de examenes con titulo y tarjetas', async ({ page }) => {
    await page.goto('/en/exams');
    await page.waitForLoadState('networkidle');

    const header = page.locator('h1');
    await expect(header).toContainText('EXAMS');

    const cards = page.locator('div[role="region"] > div');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('debe permitir lanzar un examen desde la primera tarjeta disponible', async ({ page }) => {
    await page.goto('/en/exams');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('div[role="region"] > div').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const launchButton = firstCard.locator('button');
    await expect(launchButton).toBeVisible();

    const currentUrl = page.url();
    await launchButton.click();

    await page.waitForURL(/\/quiz\//, { timeout: 15000 });
    expect(page.url()).not.toBe(currentUrl);
  });

  test('debe mostrar los detalles del examen en cada tarjeta', async ({ page }) => {
    await page.goto('/en/exams');
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('div[role="region"] > div').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const qsInfo = firstCard.locator('span', { hasText: /Qs/ });
    await expect(qsInfo).toBeVisible();

    const scoringMode = firstCard.locator('span.text-primary');
    await expect(scoringMode).toBeVisible();
  });
});
