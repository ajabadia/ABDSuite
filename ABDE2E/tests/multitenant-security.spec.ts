import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const locale = process.env.E2E_LOCALE || 'es';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'admin@test-tenant.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin-test-password';
const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || 'student@test-tenant.com';
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD || 'student-test-password';

async function login(page: Page, email: string, password: string) {
  await page.goto(`/${locale}/auth/login`);
  await expect(page).toHaveURL(/\/login/);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/${locale}\//);
}

test.describe.configure({ mode: 'serial' });

test('Flujo completo multitenant E2E', async ({ browser }) => {
  let adminContext: BrowserContext;
  let adminPage: Page;
  let studentPage: Page;

  try {
    // --- 1. Autenticación del administrador ---
    await test.step('Inicialización y login del SUPER_ADMIN', async () => {
      adminContext = await browser.newContext({ storageState: undefined });
      adminPage = await adminContext.newPage();
      await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    // --- 2. Edición de permisos en Gobernanza ---
    await test.step('Editar rol del estudiante a ADMIN', async () => {
      await adminPage.goto(`/${locale}/gobernanza/users`);
      await expect(adminPage).toHaveURL(/\/gobernanza\/users/);

      await adminPage.fill('input[placeholder*="buscar" i]', STUDENT_EMAIL);
      await adminPage.click(`text=${STUDENT_EMAIL}`);

      await adminPage.selectOption('select[name="role"]', 'ADMIN');
      await adminPage.click('button:has-text("Guardar")');

      await expect(adminPage.locator('text=Usuario actualizado')).toBeVisible({ timeout: 10000 });
    });

    // --- 3. Intento de examen como estudiante promovido ---
    let examCompleted = false;
    await test.step('Login como estudiante y realizar examen', async () => {
      studentPage = await adminContext.newPage();
      await login(studentPage, STUDENT_EMAIL, STUDENT_PASSWORD);

      await studentPage.goto(`/${locale}/quiz`);
      await expect(studentPage.locator('text=Empezar examen')).toBeVisible({ timeout: 15000 });
      await studentPage.click('text=Empezar examen');

      for (let i = 0; i < 5; i++) {
        const options = studentPage.locator('input[type="radio"]');
        const count = await options.count();
        if (count > 0) {
          await options.nth(0).check();
        }
        await studentPage.click('button:has-text("Siguiente")');
      }

      await studentPage.click('button:has-text("Finalizar")');
      await expect(studentPage.locator('text=Examen completado')).toBeVisible({ timeout: 15000 });
      examCompleted = true;
    });

    // --- 4. Trazabilidad de auditoría ---
    await test.step('Verificar logs en ABDLogs', async () => {
      await adminPage.goto(`/${locale}/logs/admin/dashboard`);
      await expect(adminPage).toHaveURL(/\/logs\/admin\/dashboard/);

      await expect(adminPage.locator('text=SSO_HANDSHAKE_GRANTED')).toBeVisible({ timeout: 15000 });
      await expect(adminPage.locator('text=USER_UPDATED')).toBeVisible({ timeout: 15000 });

      if (examCompleted) {
        await expect(adminPage.locator('text=EXAM_ATTEMPT_SUBMIT')).toBeVisible({ timeout: 15000 });
      }

      const integrityPanel = adminPage.locator('[data-testid="integrity-check-panel"]');
      if (await integrityPanel.isVisible()) {
        await integrityPanel.scrollIntoViewIfNeeded();
        await expect(integrityPanel.locator('text=Integridad verificada')).toBeVisible({ timeout: 10000 });
      }
    });

  } finally {
    await adminContext?.close();
  }
});
