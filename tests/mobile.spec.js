import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Mobile PWA Visual Verification', () => {
  const artifactPath = (filename) => {
    return path.join('C:\\Users\\matia\\.gemini\\antigravity\\brain\\2e0687bd-9b71-454a-a9a0-c62048b5073e', filename);
  };

  test('should load mobile responsive shell and navigate tabs', async ({ page }) => {
    // 1. Set mobile viewport size (iPhone 13 style)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await page.click('text=Iniciar Sesión con Google');

    // 2. Verify header mobile optimizations
    // Sidebar should be hidden, mobile navigation should be visible
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('.user-name')).toBeHidden(); // Hidden via max-width: 768px query!
    await expect(page.locator('.db-status-text')).toBeHidden(); // Hidden via max-width: 580px query!

    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_mobile_inicio.png') });

    // 3. Navigate to Patients page on mobile via bottom bar click
    await page.click('.mobile-nav-item:has-text("Directorio")');
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: artifactPath('screenshot_mobile_patients.png') });
  });
});
