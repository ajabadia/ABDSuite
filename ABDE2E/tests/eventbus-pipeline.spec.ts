import { test, expect } from '@playwright/test';

const AUTH_URL = process.env.E2E_AUTH_URL || 'http://localhost:5001';
const QUIZ_URL = process.env.E2E_QUIZ_URL || 'http://localhost:5020';
const LOGS_URL = process.env.E2E_LOGS_URL || 'http://localhost:5003';
const LOCALE = process.env.E2E_LOCALE || 'es';

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL || 'student@test-tenant.com';
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD || 'student-test-password';

async function loginAs(page: import('@playwright/test').Page, url: string, email: string, password: string) {
  await page.goto(`${url}/${LOCALE}/login`);
  await page.waitForURL(/\/login/);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /autenticar|ingresar|iniciar sesión|sign in|login/i }).click();
}

test.describe('EventBus Pipeline — Quiz → Logs', () => {

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('Iniciar examen y verificar que aparece en los logs de auditoría', async ({ page, context }) => {
    test.setTimeout(120000);

    // 1. Login as student
    await loginAs(page, AUTH_URL, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.waitForURL(/\/dashboard/);
    expect(await page.context().cookies().then(c => c.some(c => c.name === 'abd_session'))).toBe(true);

    // 2. Navigate to ABDQuiz exams page
    await page.goto(`${QUIZ_URL}/${LOCALE}/exams`);
    await page.waitForURL(/\/exams$/);

    // Check if any exams are available
    const examCards = page.locator('form button');
    const examCount = await examCards.count();

    test.skip(examCount === 0, 'No hay exámenes disponibles para el usuario de prueba');

    // 3. Click the first available exam to start
    await examCards.first().click();

    // 4. Wait for redirect to /quiz/[id] (the attempt page)
    await page.waitForURL(/\/quiz\//);
    const currentUrl = page.url();
    const attemptMatch = currentUrl.match(/\/quiz\/([a-f0-9]+)/);
    expect(attemptMatch).not.toBeNull();
    const attemptId = attemptMatch![1];
    console.log(`[TEST] Attempt started: ${attemptId}`);

    // 5. Wait a moment for the event to propagate through Redis
    await page.waitForTimeout(2000);

    // 6. Navigate to ABDLogs audit page
    await page.goto(`${LOGS_URL}/${LOCALE}/admin/audit`);
    await page.waitForURL(/\/admin\/audit/);

    // Reload to pick up the log entry written by the client-side EventBusBridge
    await page.waitForTimeout(3000);
    await page.reload();
    await page.waitForURL(/\/admin\/audit/);

    // 7. Check page content for the attempt ID
    const pageText = await page.locator('body').innerText();
    expect(pageText).toContain(attemptId);

    console.log(`[TEST] ✅ EventBus pipeline verified: attempt ${attemptId} found in audit logs`);
  });

});
