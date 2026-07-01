import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');

test.describe('Mobile layout fixes verification', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('palia_theme', 'light');
    });
    await page.reload();
    await page.click('text=Iniciar Sesión con Google');
    await expect(page.locator('text=Resumen Semanal')).toBeVisible();
  });

  test('home stat cards and weekly chart fit within viewport', async ({ page }) => {
    const statGrid = page.locator('.stat-cards-grid');
    await expect(statGrid).toBeVisible();

    const gridBox = await statGrid.boundingBox();
    expect(gridBox.x).toBeGreaterThanOrEqual(0);
    expect(gridBox.x + gridBox.width).toBeLessThanOrEqual(390);

    const cards = statGrid.locator('.stat-card');
    await expect(cards).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const cardBox = await cards.nth(i).boundingBox();
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(390);
    }

    const chart = page.locator('.bar-chart--weekly');
    const chartBox = await chart.boundingBox();
    expect(chartBox.x).toBeGreaterThanOrEqual(0);
    expect(chartBox.x + chartBox.width).toBeLessThanOrEqual(390);

    await page.screenshot({ path: path.join(screenshotDir, 'mobile_home_resumen_semanal.png'), fullPage: true });
  });

  test('stats monthly chart stays within viewport', async ({ page }) => {
    await page.click('.mobile-nav-item:has-text("Stats")');
    await expect(page.locator('text=Actividad Mensual')).toBeVisible();

    const chart = page.locator('.bar-chart--monthly');
    const chartBox = await chart.boundingBox();
    expect(chartBox.x).toBeGreaterThanOrEqual(0);
    expect(chartBox.x + chartBox.width).toBeLessThanOrEqual(390);

    await page.screenshot({ path: path.join(screenshotDir, 'mobile_stats_chart.png'), fullPage: true });
  });

  test('defaults to light theme on first visit', async ({ page }) => {
    const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(isDark).toBe(false);

    await page.screenshot({ path: path.join(screenshotDir, 'mobile_light_theme_default.png'), fullPage: true });
  });
});
