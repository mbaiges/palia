import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Global Search Integration', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should filter volunteers list dynamically based on top search bar input', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173');

    // 1. Go to Voluntariado
    await page.click('text=Voluntariado');
    await expect(page.locator('text=Comunidad de Voluntarios')).toBeVisible();

    // Verify both volunteers are visible
    await expect(page.locator('text=Marta Rodríguez')).toBeVisible();
    await expect(page.locator('text=Javier Méndez')).toBeVisible();

    // 2. Type "Marta" in the local search bar
    await page.fill('[placeholder="Buscar voluntario..."]', 'Marta');

    // Verify Marta Rodríguez is visible, and Javier Méndez is filtered out
    await expect(page.locator('text=Marta Rodríguez')).toBeVisible();
    await expect(page.locator('text=Javier Méndez')).toBeHidden();

    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_search_volunteers.png') });
  });
});
