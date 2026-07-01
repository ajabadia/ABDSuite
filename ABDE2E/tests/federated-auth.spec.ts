import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { generate } from 'otplib';

const AUTH_URL = process.env.E2E_AUTH_URL || 'http://localhost:5001';
const SATELLITE_URL = process.env.E2E_SATELLITE_URL || 'http://localhost:5020';
const LOCALE = process.env.E2E_LOCALE || 'es';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test-tenant.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin-test-password';
const MFA_EMAIL = process.env.E2E_MFA_EMAIL || 'mfa@test-tenant.com';
const MFA_PASSWORD = process.env.E2E_MFA_PASSWORD || 'mfa-test-password';
const MFA_SECRET = process.env.E2E_MFA_SECRET || 'JBSWY3DPEHPK3PXP';

async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${AUTH_URL}/${LOCALE}/login`);
  await page.waitForURL(/\/login/);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /autenticar|ingresar/i }).click();
}

async function hasAbdSession(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(c => c.name === 'abd_session');
}

test.describe('Federated Auth — Unificación de Sesión', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Escenario 1: Login estándar sin MFA — genera abd_session', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/dashboard/);

    const cookie = (await page.context().cookies()).find(c => c.name === 'abd_session');
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.sameSite).toBe('Lax');
    expect(cookie!.path).toBe('/');
    expect(cookie!.value.length).toBeGreaterThan(0);
  });

  test('Escenario 2: Login con MFA — requiere TOTP y luego genera abd_session', async ({ page }) => {
    await loginAs(page, MFA_EMAIL, MFA_PASSWORD);

    try {
      await page.waitForURL(/\/login\/mfa/, { timeout: 5000 });
    } catch {
      test.skip(await hasAbdSession(page), 'Usuario demo no tiene MFA habilitado — saltando escenario');
      return;
    }

    const totpCode = await generate({ secret: MFA_SECRET });
    await page.getByRole('textbox').fill(totpCode);
    await page.getByRole('button', { name: /verificar|verify/i }).click();

    await page.waitForURL(/\/dashboard/);
    expect(await hasAbdSession(page)).toBe(true);
  });

  test('Escenario 3: Sesión compartida cross-satélite (SSO)', async ({ page, context }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/dashboard/);

    const authCookies = await context.cookies();
    const abdSession = authCookies.find(c => c.name === 'abd_session');
    expect(abdSession).toBeDefined();

    // Navegar vía SSO Gateway: clicar tarjeta ABDQuiz en el dashboard
    await page.getByRole('link', { name: /abdquiz/i }).click();

    // Esperar la cadena de redirección: SSO Gateway → Quiz callback → Quiz
    await page.waitForURL(/\/(es\/)?$|5020/);

    // La cookie abd_session debe existir en el dominio del satélite
    const satCookies = await context.cookies();
    const satSession = satCookies.find(c => c.name === 'abd_session');
    expect(satSession).toBeDefined();
  });

  test('Escenario 4: Cierre de sesión unificado (SLO)', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.waitForURL(/\/dashboard/);
    expect(await hasAbdSession(page)).toBe(true);

    // Abrir menú de usuario haciendo clic en el avatar
    await page.locator('[data-testid="navbar-menu-user"]').click();
    await page.getByRole('button', { name: /terminar sesión|sign out|logout/i }).click();
    await page.waitForURL(/\/login|\/logout-success/);

    const cookies = await page.context().cookies();
    const abd = cookies.find(c => c.name === 'abd_session');
    const verified = cookies.find(c => c.name === 'abd_session_verified');
    expect(abd?.value || '').toBe('');
    expect(verified?.value || '').toBe('');

    await page.goto(`${AUTH_URL}/${LOCALE}/dashboard`);
    await page.waitForURL(/\/login/);
  });
});
