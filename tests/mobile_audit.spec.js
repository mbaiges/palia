import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Mobile Audit Screenshots Collection', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should capture screenshots for all main views on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // 1. Login
    await page.goto('http://localhost:5173');
    await expect(page.locator('text=Portal del Coordinador')).toBeVisible();
    await page.screenshot({ path: artifactPath('audit_mobile_1_login.png') });

    // Login click
    await page.click('text=Iniciar Sesión con Google');
    
    // 2. Inicio
    await expect(page.locator('text=Vista de Inicio')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_2_inicio.png') });

    // 3. Pacientes
    await page.click('.mobile-nav-item:has-text("Pacientes")');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_3_pacientes.png') });

    // 4. Detalle de Paciente (Ricardo Mendoza S.)
    await page.locator('.card', { hasText: 'Ricardo Mendoza S.' }).locator('button').first().click();
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_4_detalle.png') });

    // 5. Nuevo Seguimiento
    await page.locator('.fab').click();
    await expect(page.locator('text=Registro Clínico de Seguimiento')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_5_seguimiento.png') });
    await page.click('span:has-text("Ficha del Paciente")'); // Go back

    // 6. Nuevo Paciente
    await page.click('.mobile-nav-item:has-text("Pacientes")');
    await page.click('text=Nuevo Paciente');
    await expect(page.locator('text=Registrar Nuevo Paciente')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_6_nuevo_paciente.png') });

    // 7. Voluntariado
    await page.click('.mobile-nav-item:has-text("Voluntarios")');
    await expect(page.locator('text=Comunidad de Voluntarios')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_7_voluntariado.png') });

    // 8. Estadísticas
    await page.click('.mobile-nav-item:has-text("Estadísticas")');
    await expect(page.locator('text=Estadísticas e Impacto')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_8_estadisticas.png') });

    // 9. Administración
    await page.click('.mobile-nav-item:has-text("Admin")');
    await expect(page.locator('text=Panel de Administración')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('audit_mobile_9_administracion.png') });
  });
});
