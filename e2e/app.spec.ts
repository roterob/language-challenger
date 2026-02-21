import { test, expect } from '@playwright/test';

test.describe('Language Challenger E2E', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Language Challenger/i })).toBeVisible();
    await expect(page.getByLabel(/usuario/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('wronguser');
    await page.getByLabel(/contraseña/i).fill('wrongpass');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page.getByText(/error|invalid|no encontrado/i)).toBeVisible({ timeout: 5000 });
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('secret');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Should redirect to resources page
    await expect(page).toHaveURL(/\/resources/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /recursos/i })).toBeVisible();
  });

  test('should display resources after login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('secret');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/resources/, { timeout: 10000 });

    // Should see the resource table
    await expect(page.getByText(/código/i)).toBeVisible();
    await expect(page.getByText(/PH-/)).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to lists page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('secret');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/resources/, { timeout: 10000 });

    // Navigate to lists
    await page.getByRole('link', { name: /listas/i }).click();
    await expect(page).toHaveURL(/\/lists/);
    await expect(page.getByRole('heading', { name: /listas/i })).toBeVisible();
  });

  test('should navigate to executions page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('secret');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/resources/, { timeout: 10000 });

    await page.getByRole('link', { name: /ejecuciones/i }).click();
    await expect(page).toHaveURL(/\/executions/);
    await expect(page.getByRole('heading', { name: /ejecuciones/i })).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/usuario/i).fill('admin');
    await page.getByLabel(/contraseña/i).fill('secret');
    await page.getByRole('button', { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/resources/, { timeout: 10000 });

    // Click user menu → logout
    await page.getByText('AD').click(); // Avatar fallback for admin
    await page.getByText(/cerrar sesión/i).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
