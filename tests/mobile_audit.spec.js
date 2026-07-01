import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots', 'mobile_audit');

test.describe('Mobile page chrome audit', () => {
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
    await expect(page.locator('.top-header')).toBeVisible();
  });

  async function assertChromeClearance(page) {
    const header = page.locator('.top-header');
    const nav = page.locator('.mobile-nav');
    const canvas = page.locator('.content-canvas');

    const headerBox = await header.boundingBox();
    const navBox = await nav.boundingBox();
    const canvasBox = await canvas.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    expect(canvasBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
    expect(canvasBox.y + canvasBox.height).toBeLessThanOrEqual(navBox.y + 1);

    const headerPosition = await header.evaluate((el) => getComputedStyle(el).position);
    const navPosition = await nav.evaluate((el) => getComputedStyle(el).position);
    expect(headerPosition).toBe('relative');
    expect(navPosition).toBe('relative');
  }

  async function assertFabAboveNav(page) {
    const fab = page.locator('.fab');
    if (!(await fab.count())) return;

    const fabBox = await fab.boundingBox();
    const navBox = await page.locator('.mobile-nav').boundingBox();
    expect(fabBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(navBox.y - 8);
  }

  test('inicio keeps alert banner and content clear of chrome', async ({ page }) => {
    await expect(page.locator('text=ALERTA CRÍTICA')).toBeVisible();
    await assertChromeClearance(page);
    await assertFabAboveNav(page);

    const alertBox = await page.locator('text=ALERTA CRÍTICA').first().boundingBox();
    const headerBox = await page.locator('.top-header').boundingBox();
    expect(alertBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);

    await page.screenshot({ path: path.join(screenshotDir, '01_inicio.png'), fullPage: true });
  });

  test('directorio page layout', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(1).click();
    await expect(page.locator('text=Directorio de Pacientes')).toBeVisible();
    await assertChromeClearance(page);
    await page.screenshot({ path: path.join(screenshotDir, '02_directorio.png'), fullPage: true });
  });

  test('patient detail layout', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(1).click();
    await page.locator('.card', { hasText: 'Ricardo Mendoza S.' }).locator('button').first().click();
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
    await assertChromeClearance(page);
    await assertFabAboveNav(page);
    await page.screenshot({ path: path.join(screenshotDir, '03_detalle.png'), fullPage: true });
  });

  test('stats page layout', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(2).click();
    await expect(page.locator('text=Estadísticas e Impacto')).toBeVisible();
    await assertChromeClearance(page);
    await page.screenshot({ path: path.join(screenshotDir, '04_stats.png'), fullPage: true });
  });

  test('settings page layout', async ({ page }) => {
    await page.locator('.mobile-nav-item').last().click();
    await expect(page.locator('text=Configuración de Palia')).toBeVisible();
    await assertChromeClearance(page);
    await page.screenshot({ path: path.join(screenshotDir, '05_configuracion.png'), fullPage: true });
  });

  test('administration page layout', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(3).click();
    await expect(page.locator('text=Panel de Administración')).toBeVisible();
    await assertChromeClearance(page);
    await page.screenshot({ path: path.join(screenshotDir, '06_administracion.png'), fullPage: true });
  });
});
