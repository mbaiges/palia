import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots', 'viewport-audit');

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'iphone-14-chrome-visible', width: 390, height: 700 },
  { name: 'pixel-7', width: 412, height: 915 },
  { name: 'galaxy-fold-narrow', width: 344, height: 882 },
  { name: 'ipad-mini', width: 768, height: 1024 },
];

async function loginMobile(page) {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('palia_theme', 'light');
  });
  await page.reload();
  await page.click('text=Iniciar Sesión con Google');
  await expect(page.locator('.mobile-nav')).toBeVisible();
}

async function assertBottomNavVisible(page) {
  const metrics = await page.evaluate(() => {
    const nav = document.querySelector('.mobile-nav');
    const rect = nav.getBoundingClientRect();
    const vvh = getComputedStyle(document.documentElement).getPropertyValue('--vvh').trim();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    return {
      navTop: rect.top,
      navBottom: rect.bottom,
      navHeight: rect.height,
      viewportHeight,
      vvh,
      shellHeight: parseFloat(getComputedStyle(document.querySelector('.app-shell')).height),
    };
  });

  expect(metrics.navHeight).toBeGreaterThan(40);
  expect(metrics.navBottom).toBeLessThanOrEqual(metrics.viewportHeight + 2);
  expect(metrics.navBottom).toBeGreaterThan(metrics.viewportHeight - metrics.navHeight - 4);
  expect(metrics.shellHeight).toBeLessThanOrEqual(metrics.viewportHeight + 2);
  if (metrics.vvh) {
    expect(parseFloat(metrics.vvh)).toBeLessThanOrEqual(metrics.viewportHeight + 2);
  }
}

test.describe('Mobile viewport audit', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  for (const viewport of VIEWPORTS) {
    test(`bottom nav visible on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:5173');
      await loginMobile(page);
      await assertBottomNavVisible(page);

      await page.screenshot({
        path: path.join(screenshotDir, `${viewport.name}_home.png`),
        fullPage: false,
      });

      await page.locator('.content-canvas').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(120);
      await assertBottomNavVisible(page);

      await page.screenshot({
        path: path.join(screenshotDir, `${viewport.name}_home_scrolled.png`),
        fullPage: false,
      });
    });
  }

  test('notifications popover stays within viewport after scrolling content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await loginMobile(page);

    await page.locator('.content-canvas').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await page.locator('.header-actions button[aria-label="Notificaciones"]').click();
    await expect(page.locator('.notification-popover')).toBeVisible();

    const placement = await page.evaluate(() => {
      const popover = document.querySelector('.notification-popover');
      const bell = document.querySelector('.header-actions button[aria-label="Notificaciones"]');
      const popoverRect = popover.getBoundingClientRect();
      const bellRect = bell.getBoundingClientRect();
      const scrim = document.querySelector('.mobile-popover-scrim');
      return {
        popoverLeft: popoverRect.left,
        popoverRight: popoverRect.right,
        popoverTop: popoverRect.top,
        bellBottom: bellRect.bottom,
        viewportWidth: window.innerWidth,
        hasScrim: Boolean(scrim),
        popoverPosition: getComputedStyle(popover).position,
      };
    });

    expect(placement.hasScrim).toBe(false);
    expect(placement.popoverPosition).toBe('fixed');
    expect(placement.popoverLeft).toBeGreaterThanOrEqual(8);
    expect(placement.popoverRight).toBeLessThanOrEqual(placement.viewportWidth - 8);
    expect(placement.popoverTop).toBeGreaterThanOrEqual(placement.bellBottom - 2);

    await page.screenshot({
      path: path.join(screenshotDir, 'notifications_after_scroll.png'),
      fullPage: false,
    });
  });

  test('profile popover stays within viewport without dim overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await loginMobile(page);

    await page.locator('.user-profile-menu').click();
    await expect(page.locator('.profile-popover')).toBeVisible();

    const placement = await page.evaluate(() => {
      const popover = document.querySelector('.profile-popover');
      const avatar = document.querySelector('.user-profile-menu');
      const scrim = document.querySelector('.mobile-popover-scrim');
      const popoverRect = popover.getBoundingClientRect();
      return {
        popoverTop: popoverRect.top,
        popoverLeft: popoverRect.left,
        avatarBottom: avatar.getBoundingClientRect().bottom,
        hasScrim: Boolean(scrim),
        popoverPosition: getComputedStyle(popover).position,
      };
    });

    expect(placement.hasScrim).toBe(false);
    expect(placement.popoverPosition).toBe('fixed');
    expect(placement.popoverTop).toBeGreaterThanOrEqual(placement.avatarBottom - 2);
    expect(placement.popoverLeft).toBeGreaterThanOrEqual(8);

    await page.screenshot({
      path: path.join(screenshotDir, 'profile_popover.png'),
      fullPage: false,
    });
  });

  test('bottom content clears the fixed navigation bar on key pages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await loginMobile(page);

    const assertScrollRegionAboveNav = async (label) => {
      await page.locator('.content-canvas').evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(150);

      const metrics = await page.evaluate(() => {
        const canvas = document.querySelector('.content-canvas');
        const nav = document.querySelector('.mobile-nav');
        const main = document.querySelector('.main-content');
        const canvasRect = canvas.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        return {
          layoutGap: navRect.top - canvasRect.bottom,
          navOffset: parseFloat(getComputedStyle(main).paddingBottom),
          navHeight: navRect.height,
        };
      });

      expect(metrics.navOffset, `${label} reserves nav height`).toBeGreaterThanOrEqual(metrics.navHeight - 1);
      expect(metrics.layoutGap, `${label} scroll area ends above nav`).toBeGreaterThanOrEqual(-1);
    };

    await assertScrollRegionAboveNav('Home');
    await page.locator('.mobile-nav-item').nth(2).click();
    await expect(page.locator('text=Actividades Recientes')).toBeVisible();
    await assertScrollRegionAboveNav('Stats');
    await page.locator('.mobile-nav-item').last().click();
    await expect(page.getByRole('button', { name: 'Panel de Administración' })).toBeVisible();
    await assertScrollRegionAboveNav('Settings');
  });
});
