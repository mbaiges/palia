import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Patient Details & Follow-up Flow', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should view patient details and log a follow-up report', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');
    await page.click('text=Iniciar Sesión con Google');

    // 1. Navigate to Patients
    await page.click('text=Pacientes');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();

    // 2. Open Ricardo Mendoza's card
    const card = page.locator('.card', { hasText: 'Ricardo Mendoza S.' });
    await card.locator('button', { hasText: 'Atención Urgente' }).click();

    // Verify detail page elements
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await expect(page.locator('text=Cuidador Principal')).toBeVisible();
    await expect(page.locator('text=Historial de Seguimientos')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_3_detail_page.png') });

    // 3. Click FAB to Register a Follow-up
    await page.locator('.fab').click();
    await expect(page.locator('text=Registro Clínico de Seguimiento')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_3_followup_empty.png') });

    // 4. Fill in Follow-up report
    await page.selectOption('select[name="contactType"]', 'Remoto');
    await page.click('button:has-text("4-6 - Moderado")');
    await page.click('button:has-text("Ninguno")');
    await page.click('button:has-text("G1 - Leve")');
    await page.fill('[placeholder="Describa el estado de ánimo, fatiga, nivel de conciencia o cualquier cambio notable en el estado físico del paciente..."]', 'Llamada de seguimiento de la tarde. El paciente se encuentra más calmado pero reporta dolor moderado.');

    // Social Risk
    await page.click('text=Sólido y constante');
    await page.fill('[placeholder="Estado anímico del cuidador, higiene del hogar, apoyo vecinal..."]', 'Hogar templado, el cuidador se encuentra descansando.');

    // Equipments
    await page.click('text=Concentrador Oxígeno');
    await page.click('text=Cama Articulada');

    // Interventions
    await page.fill('[placeholder="Describa detalladamente las acciones tomadas durante esta sesión (ej: movilizaciones suave, administración de medicación indicada, contención emocional, diálogo espiritual...)"]', 'Se dialogó con el paciente sobre control de dolor y se verificó el uso del concentrador de oxígeno.');

    // Activate Alert State via Toggle
    await page.locator('.toggle-slider').click();
    await expect(page.locator('text=ALERTA ACTIVADA')).toBeVisible();

    await page.screenshot({ path: artifactPath('screenshot_3_followup_filled.png') });

    // 5. Submit Follow-up
    await page.click('text=Guardar Seguimiento');

    // Should return to detail page and show updated timeline event
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await expect(page.locator('text=Llamado Telefónico - Crisis / Urgencia')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_3_detail_updated.png') });
  });
});
