import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Navigation Shell Verification', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should load shell and navigate tabs successfully', async ({ page }) => {
    // Set viewport size for desktop evaluation
    await page.setViewportSize({ width: 1280, height: 800 });

    // Go to local server
    await page.goto('http://localhost:5173');

    // Wait for the app shell to load
    await expect(page.locator('.app-shell')).toBeVisible();

    // 1. Verify and capture 'Inicio' Tab
    await page.screenshot({ path: artifactPath('screenshot_1_inicio.png') });

    // 2. Click 'Pacientes' Tab and capture
    await page.click('text=Pacientes');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_1_pacientes.png') });

    // 3. Click 'Voluntariado' Tab and capture
    await page.click('text=Voluntariado');
    await expect(page.locator('text=Comunidad de Voluntarios')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_1_voluntariado.png') });

    // 4. Click 'Estadísticas' Tab and capture
    await page.click('text=Estadísticas');
    await expect(page.locator('text=Estadísticas e Impacto')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_1_estadisticas.png') });

    // 5. Click 'Administración' Tab and capture
    await page.click('text=Administración');
    await expect(page.locator('text=Panel de Administración')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_1_administracion.png') });
  });
});
