import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots', 'address-bar-visible');

/** Simulates Android Chrome with the top address bar visible (844px layout, ~688px visible). */
const ADDRESS_BAR = { offsetTop: 56, visibleHeight: 688 };
const VIEWPORT = { width: 390, height: 844 };

async function loginMobile(page) {
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('palia_theme', 'light');
  });
  await page.reload();
  await page.click('text=Iniciar Sesión con Google');
  await expect(page.locator('.mobile-nav')).toBeVisible();
}

async function applyAddressBarVisible(page) {
  await page.evaluate(async ({ offsetTop, visibleHeight }) => {
    const layoutHeight = 844;
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      get: () => layoutHeight,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      get: () => layoutHeight,
    });

    const viewport = {
      height: visibleHeight,
      offsetTop,
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      get: () => viewport,
    });

    const { syncMobileLayout } = await import('/src/utils/viewport.js');
    syncMobileLayout();
  }, ADDRESS_BAR);
}

async function assertVisibleShell(page, label) {
  const metrics = await page.evaluate(({ offsetTop, visibleHeight }) => {
    const shell = document.querySelector('.app-shell');
    const canvas = document.querySelector('.content-canvas');
    const nav = document.querySelector('.mobile-nav');
    const shellRect = shell.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const visibleBottom = offsetTop + visibleHeight;
    return {
      shellTop: shellRect.top,
      shellBottom: shellRect.bottom,
      visibleBottom,
      canvasBottom: canvasRect.bottom,
      navTop: navRect.top,
      contentHeight: parseFloat(getComputedStyle(canvas).height),
      contentMaxHeight: getComputedStyle(canvas).maxHeight,
    };
  }, { ...ADDRESS_BAR, visibleHeight: ADDRESS_BAR.visibleHeight });

  expect(metrics.shellTop, `${label} shell top`).toBeGreaterThanOrEqual(ADDRESS_BAR.offsetTop - 1);
  expect(metrics.shellTop, `${label} shell top`).toBeLessThanOrEqual(ADDRESS_BAR.offsetTop + 2);
  expect(metrics.shellBottom, `${label} shell bottom`).toBeLessThanOrEqual(metrics.visibleBottom + 2);
  expect(metrics.canvasBottom, `${label} canvas bottom`).toBeLessThanOrEqual(metrics.navTop + 2);
  expect(metrics.contentHeight, `${label} content height`).toBeGreaterThan(200);
}

async function assertScrolledBottomClearsNav(page, label) {
  await page.locator('.content-canvas').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(120);

  const gap = await page.evaluate(() => {
    const nav = document.querySelector('.mobile-nav');
    const canvas = document.querySelector('.content-canvas');
    const last = canvas.querySelector('.card:last-of-type, button.btn-primary, section:last-of-type');
    const navTop = nav.getBoundingClientRect().top;
    const canvasBottom = canvas.getBoundingClientRect().bottom;
    const lastBottom = last ? last.getBoundingClientRect().bottom : canvasBottom;
    return {
      layoutGap: navTop - canvasBottom,
      lastGap: navTop - lastBottom,
    };
  });

  expect(gap.layoutGap, `${label} scroll region above nav`).toBeGreaterThanOrEqual(-1);
}

test.describe('Address bar visible (Android simulation)', () => {
  test.beforeAll(() => {
    fs.mkdirSync(screenshotDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
    await page.goto('http://localhost:5173');
    await loginMobile(page);
    await applyAddressBarVisible(page);
  });

  const screens = [
    { name: 'inicio', navIndex: 0, ready: 'text=Resumen Semanal' },
    { name: 'directorio', navIndex: 1, ready: '#patients-directory' },
    { name: 'stats', navIndex: 2, ready: 'text=Actividades Recientes' },
    { name: 'admin', navIndex: 3, ready: 'text=Invitaciones y Accesos' },
    { name: 'perfil', navIndex: -1, ready: 'text=Panel de Administración' },
  ];

  for (const screen of screens) {
    test(`${screen.name} fits visible viewport with address bar`, async ({ page }) => {
      const nav = page.locator('.mobile-nav-item').nth(screen.navIndex === -1 ? 4 : screen.navIndex);
      if (screen.navIndex !== 0) {
        await nav.click();
      }
      await expect(page.locator(screen.ready)).toBeVisible();
      await applyAddressBarVisible(page);

      await assertVisibleShell(page, screen.name);
      await assertScrolledBottomClearsNav(page, screen.name);

      await page.screenshot({
        path: path.join(screenshotDir, `${screen.name}_address_bar_visible.png`),
        fullPage: false,
      });
    });
  }

  test('production viewport sync keeps shell inside visualViewport metrics', async ({ page }) => {
    await page.evaluate(async () => {
      const { syncMobileLayout } = await import('/src/utils/viewport.js');
      syncMobileLayout();
    });

    const metrics = await page.evaluate(({ offsetTop, visibleHeight }) => {
      const vv = window.visualViewport;
      const shell = document.querySelector('.app-shell');
      const shellRect = shell.getBoundingClientRect();
      return {
        vvHeight: vv?.height ?? window.innerHeight,
        vvOffsetTop: vv?.offsetTop ?? 0,
        shellTop: shellRect.top,
        shellBottom: shellRect.bottom,
        cssVvh: getComputedStyle(document.documentElement).getPropertyValue('--vvh').trim(),
        cssOffset: getComputedStyle(document.documentElement).getPropertyValue('--vv-offset-top').trim(),
        simulatedVisibleBottom: offsetTop + visibleHeight,
      };
    }, { ...ADDRESS_BAR, visibleHeight: ADDRESS_BAR.visibleHeight });

    expect(parseFloat(metrics.cssVvh)).toBeLessThanOrEqual(metrics.vvHeight + 1);
    expect(metrics.shellBottom).toBeLessThanOrEqual(metrics.vvOffsetTop + parseFloat(metrics.cssVvh) + 2);
  });
});
