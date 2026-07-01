import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Administration, Volunteers and Stats Flow', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should navigate through volunteers, stats, and administration features', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');

    // 1. Check Volunteers Tab
    await page.click('text=Voluntariado');
    await expect(page.locator('text=Comunidad de Voluntarios')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_4_volunteers.png') });

    // 2. Check Stats Tab
    await page.click('text=Estadísticas');
    await expect(page.locator('text=Estadísticas e Impacto')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_4_stats.png') });

    // 3. Check Administration Tab
    await page.click('text=Administración');
    await expect(page.locator('text=Panel de Administración')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_4_admin_initial.png') });

    // 4. Perform assignment: Elena Gutiérrez to Javier Méndez
    await page.selectOption('select:has-text("Elena Gutiérrez")', { label: 'Elena Gutiérrez (14.773.299-X)' });
    await page.selectOption('select:has-text("Marta Rodríguez")', { label: 'Javier Méndez (Activo)' });
    await page.click('text=Asignar Acompañante');

    // 5. Fill and Add Hospital
    await page.fill('[placeholder="Ej: Hospital Clínico San Carlos"]', 'Sanatorio Güemes');
    await page.fill('[placeholder="Ej: Av. Córdoba 2351, CABA, Argentina"]', 'Francisco Acuña de Figueroa 1240, CABA, Argentina');
    await page.click('text=Agregar Hospital');

    // Verify hospital and assignment are updated
    await expect(page.locator('text=Sanatorio Güemes')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_4_admin_updated.png') });
  });
});
