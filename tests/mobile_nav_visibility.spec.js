import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots', 'mobile_audit');

test.describe('Mobile bottom nav visibility', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test('bottom nav is visible and uses column shell layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('palia_theme', 'light');
    });
    await page.reload();
    await page.click('text=Iniciar Sesión con Google');

    const shell = page.locator('.app-shell');
    const nav = page.locator('.mobile-nav');

    await expect(nav).toBeVisible();

    const layout = await page.evaluate(() => {
      const shellEl = document.querySelector('.app-shell');
      const navEl = document.querySelector('.mobile-nav');
      const shellStyle = getComputedStyle(shellEl);
      const navStyle = getComputedStyle(navEl);
      const navRect = navEl.getBoundingClientRect();
      return {
        shellDisplay: shellStyle.display,
        gridTemplateRows: shellStyle.gridTemplateRows,
        navDisplay: navStyle.display,
        navPosition: navStyle.position,
        navHeight: navRect.height,
        navBottom: navRect.bottom,
        viewportHeight: window.innerHeight,
      };
    });

    expect(layout.shellDisplay).toBe('flex');
    expect(layout.navDisplay).toBe('flex');
    expect(layout.navPosition).toBe('fixed');
    expect(layout.navHeight).toBeGreaterThan(40);
    expect(layout.navBottom).toBeGreaterThan(layout.viewportHeight - 8);
    expect(layout.navBottom).toBeLessThanOrEqual(layout.viewportHeight + 1);

    await page.screenshot({ path: path.join(screenshotDir, '00_nav_visibility_check.png'), fullPage: false });
  });
});
