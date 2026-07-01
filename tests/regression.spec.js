import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Palia Full App E2E Regression Suite', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test.afterEach(async ({ page }) => {
    // Teardown: clear localStorage to reset database state and auth states
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should execute full clinical workflow (Login -> Create -> Follow-up -> Assign -> Verify -> Logout) on Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // 1. Visit Login screen
    await page.goto('http://localhost:5173');
    await expect(page.locator('text=Portal del Coordinador')).toBeVisible();
    await page.screenshot({ path: artifactPath('reg_1_login_screen.png') });

    // 2. Perform Google Sign-In
    await page.click('text=Iniciar Sesión con Google');
    
    // Wait for the Dashboard shell to load
    await expect(page.locator('text=Vista de Inicio')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_2_home_screen.png') });

    // 3. Navigate to Patients Directory
    await page.click('text=Pacientes');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    
    // 4. Create New Patient
    await page.click('text=Nuevo Paciente');
    await expect(page.locator('text=Registrar Nuevo Paciente')).toBeVisible();

    await page.fill('[placeholder="Ej: María García López"]', 'Clara Benítez');
    await page.fill('[placeholder="Ej: 32.144.555"]', '22.333.444');
    await page.fill('input[type="date"]', '1945-05-12');
    await page.fill('[placeholder="Calle, Número, Piso, Ciudad/Localidad (Argentina)..."]', 'Av. 9 de Julio 500, GBA, Argentina');
    await page.fill('[placeholder="Ej: Neoplasia de pulmón estadio IV"]', 'Cáncer gástrico avanzado con diseminación peritoneal.');
    
    // Caregiver
    await page.fill('[placeholder="Ej: Elena Mendoza R."]', 'Héctor Benítez');
    await page.fill('[placeholder="Ej: +54 9 11 5555 6666"]', '+54 9 11 9876 5432');
    await page.selectOption('select:has-text("Bajo")', 'Alto'); // Burden
    await page.click('text=¿Vive con el paciente?');

    await page.screenshot({ path: artifactPath('reg_3_new_patient_form.png') });
    await page.click('text=Guardar Registro');

    // 5. Landing page should be the Patient Detail view of Clara Benítez
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await expect(page.locator('text=Clara Benítez')).toBeVisible();
    await expect(page.locator('text=Cáncer gástrico avanzado')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_4_patient_detail.png') });

    // 6. Add Follow-up Visit Report
    await page.locator('.fab').click();
    await expect(page.locator('text=Registro Clínico de Seguimiento')).toBeVisible();

    await page.selectOption('select[name="contactType"]', 'Presencial');
    await page.click('label[for="dolor"]');
    await page.click('label[for="nauseas"]');
    await page.click('label[for="disnea"]');
    await page.fill('[placeholder="Describa el estado de ánimo, fatiga, nivel de conciencia o cualquier cambio notable en el estado físico del paciente..."]', 'Paciente presenta dolor agudo y náuseas postprandiales.');
    await page.fill('[placeholder="Describa detalladamente las acciones tomadas durante esta sesión (ej: movilizaciones suave, administración de medicación indicada, contención emocional, diálogo espiritual...)"]', 'Se administró medicación analgésica y antiemética de rescate indicada.');

    // Activate Alert State
    await page.locator('.toggle-slider').click();
    await expect(page.locator('text=ALERTA ACTIVADA')).toBeVisible();

    await page.screenshot({ path: artifactPath('reg_5_followup_form.png') });
    await page.click('text=Guardar Seguimiento');

    // Should return to detail page and show updated emergency event
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await expect(page.locator('text=Visita Domiciliaria - Crisis / Urgencia')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_6_detail_updated.png') });

    // 7. Go to Administration to Assign Volunteer & Add Hospital
    await page.click('text=Administración');
    await expect(page.locator('text=Panel de Administración')).toBeVisible();

    // Assign Ricardo Salinas to Clara Benítez
    await page.selectOption('select:has-text("Clara Benítez")', { label: 'Clara Benítez (22.333.444)' });
    await page.selectOption('select:has-text("Marta Rodríguez")', { label: 'Ricardo Salinas (Activo)' });
    await page.click('text=Asignar Acompañante');

    // Add Hospital
    await page.fill('[placeholder="Ej: Hospital Clínico San Carlos"]', 'Hospital de Clínicas José de San Martín');
    await page.fill('[placeholder="Ej: Av. Córdoba 2351, CABA, Argentina"]', 'Av. Córdoba 2351, CABA, Argentina');
    await page.click('text=Agregar Hospital');

    await expect(page.locator('text=Hospital de Clínicas José de San Martín')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_7_admin_updated.png') });

    // 8. Verify Stats
    await page.click('text=Estadísticas');
    await expect(page.locator('text=Estadísticas e Impacto')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_8_stats.png') });

    // 9. Logout
    await page.click('text=Cerrar Sesión');
    await expect(page.locator('text=Portal del Coordinador')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_9_logout.png') });
  });

  test('should execute full clinical workflow on Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    
    // 1. Visit Login screen
    await page.goto('http://localhost:5173');
    await expect(page.locator('text=Portal del Coordinador')).toBeVisible();
    await page.screenshot({ path: artifactPath('reg_mobile_1_login.png') });

    // 2. Perform Google Sign-In
    await page.click('text=Iniciar Sesión con Google');
    await expect(page.locator('text=Vista de Inicio')).toBeVisible();

    // 3. Navigate to Patients Directory via Bottom Bar
    await page.click('.mobile-nav-item:has-text("Pacientes")');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_mobile_2_directory.png') });

    // 4. Open patient detail card (Ricardo Mendoza S.)
    await page.locator('.card', { hasText: 'Ricardo Mendoza S.' }).locator('button').first().click();
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_mobile_3_detail.png') });

    // 5. Open Follow-up form on mobile
    await page.locator('.fab').click();
    await expect(page.locator('text=Registro Clínico de Seguimiento')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('reg_mobile_4_followup.png') });
  });
});
