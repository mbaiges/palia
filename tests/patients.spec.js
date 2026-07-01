import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Patient Directory & Registration Flow', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should navigate, register patient, and verify details', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');

    // 1. Navigate to Patients Directory
    await page.click('text=Pacientes');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_2_directory.png') });

    // 2. Click Nuevo Paciente to open form
    await page.click('text=Nuevo Paciente');
    await expect(page.locator('text=Registrar Nuevo Paciente')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_2_form_empty.png') });

    // 3. Fill in Form Fields
    await page.fill('[placeholder="Ej: María García López"]', 'Sofía Loren');
    await page.fill('[placeholder="Ej: 32.144.555"]', '95.123.456');
    await page.fill('input[type="date"]', '1934-09-20');
    await page.fill('[placeholder="Calle, Número, Piso, Ciudad/Localidad (Argentina)..."]', 'Calle Corrientes 1500, CABA, Argentina');
    await page.fill('[placeholder="Ej: Neoplasia de pulmón estadio IV"]', 'Demencia avanzada con fragilidad social severa');
    
    // Check 'Situación Compleja'
    await page.click('text=Situación Compleja');
    
    // Caregiver Info
    await page.fill('[placeholder="Ej: Elena Mendoza R."]', 'Carlos Ponti');
    await page.fill('[placeholder="Ej: +54 9 11 5555 6666"]', '+54 9 11 4444 5555');
    await page.selectOption('select:has-text("Bajo")', 'Alto'); // Selector for caregiver burden level dropdown
    await page.click('text=¿Vive con el paciente?');

    await page.screenshot({ path: artifactPath('screenshot_2_form_filled.png') });

    // 4. Click Guardar Registro
    await page.click('text=Guardar Registro');

    // Verify redirect to detail sheet
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();

    // Click back breadcrumb link to go to directory
    await page.locator('text=Pacientes').first().click();

    // 5. Verify Redirect and filter newly created complex patient
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await expect(page.locator('text=Sofía Loren')).toBeVisible();

    // Click Alerta filter to see only alert/complex patients (now includes Sofía Loren)
    await page.click('button:has-text("Alerta")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_2_directory_filtered.png') });
  });
});
