import { test, expect } from '@playwright/test';

test.describe('Charts and dashboard layout', () => {
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

  test('weekly summary stat cards stack without horizontal overflow', async ({ page }) => {
    const grid = page.locator('.stat-cards-grid');
    await expect(grid).toBeVisible();

    const columns = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(columns).not.toContain('repeat(3');

    const cards = grid.locator('.stat-card');
    for (let i = 0; i < 3; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }

    const gridStyle = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(gridStyle.split(' ').length).toBe(1);
  });

  test('weekly summary stat cards also fit on narrow fold width', async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 882 });
    await page.reload();
    const cards = page.locator('.stat-cards-grid .stat-card');
    for (let i = 0; i < 3; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box.x + box.width).toBeLessThanOrEqual(344);
    }
  });

  test('monthly chart bar heights follow db hour values', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(2).click();
    await expect(page.locator('#monthly-activity-chart')).toBeVisible();

    const bars = page.locator('.bar-chart--monthly .bar-chart__bar');
    const barCount = await bars.count();
    expect(barCount).toBe(12);

    const measurements = [];
    for (let i = 0; i < barCount; i++) {
      const bar = bars.nth(i);
      const hours = Number(await bar.getAttribute('data-hours'));
      const fill = Number(await bar.getAttribute('data-fill'));
      measurements.push({ hours, fill });
    }

    const nonZero = measurements.filter((item) => item.hours > 0);
    for (let i = 0; i < nonZero.length; i++) {
      for (let j = i + 1; j < nonZero.length; j++) {
        if (nonZero[i].hours > nonZero[j].hours) {
          expect(nonZero[i].fill).toBeGreaterThanOrEqual(nonZero[j].fill);
        }
        if (nonZero[j].hours > nonZero[i].hours) {
          expect(nonZero[j].fill).toBeGreaterThanOrEqual(nonZero[i].fill);
        }
      }
    }

    const visitKpi = page.locator('.bento-grid .card').nth(1).locator('h3');
    await expect(visitKpi).toHaveText('24');
  });
});

test.describe('Settings sync UI and navigation focus', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 344, height: 882 });
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('palia_theme', 'light');
    });
    await page.reload();
    await page.click('text=Iniciar Sesión con Google');
    await page.locator('.mobile-nav-item').last().click();
    await page.click('text=Centro de Sincronización');
  });

  test('network log button opens readable log panel', async ({ page }) => {
    const logButton = page.getByRole('button', { name: 'Ver Log de Red' });
    const box = await logButton.boundingBox();
    expect(box.height).toBeGreaterThan(30);
    expect(box.width).toBeGreaterThan(120);

    await logButton.click();
    await expect(page.locator('#sync-network-log')).toBeVisible();
    await expect(page.locator('.sync-network-log__item').first()).toBeVisible();
  });

  test('conflict badge scrolls to conflict row', async ({ page }) => {
    const badge = page.locator('.sync-conflict-badge');
    await expect(badge).toHaveText(/1 conflicto/i);
    await badge.click();
    await expect(page.locator('#sync-pending-items')).toBeInViewport();
  });
});

test.describe('Cross-page navigation focus', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('palia_theme', 'light');
    });
    await page.reload();
    await page.click('text=Iniciar Sesión con Google');
  });

  test('quick action opens stats and focuses monthly chart', async ({ page }) => {
    await page.getByRole('button', { name: 'Estadísticas' }).click();
    await expect(page.locator('text=Estadísticas e Impacto')).toBeVisible();
    await expect(page.locator('#monthly-activity-chart')).toBeInViewport();
  });

  test('notification alert opens patient detail', async ({ page }) => {
    await page.locator('.header-actions button[aria-label="Notificaciones"]').click();
    await page.locator('.notification-popover button').first().click();
    await expect(page.locator('text=Ficha del Paciente')).toBeVisible();
  });

  test('nuevo paciente quick action opens registration form', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
    await expect(page.locator('text=Registrar Nuevo Paciente')).toBeVisible();
  });

  test('administration link from settings focuses invitations panel', async ({ page }) => {
    await page.locator('.mobile-nav-item').last().click();
    await page.getByRole('button', { name: 'Panel de Administración' }).click();
    await expect(page.locator('text=Invitaciones y Accesos')).toBeVisible();
    await expect(page.locator('#admin-invitations-panel')).toBeInViewport();
  });

  test('home dashboard does not show follow-up FAB', async ({ page }) => {
    await expect(page.locator('.content-canvas .fab')).toHaveCount(0);
  });

  test('tab navigation resets scroll position in content canvas', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(1).click();
    await expect(page.locator('#patients-directory')).toBeVisible();

    await page.locator('.content-canvas').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const scrolledDown = await page.locator('.content-canvas').evaluate((el) => el.scrollTop);
    expect(scrolledDown).toBeGreaterThan(0);

    await page.locator('.mobile-nav-item').first().click();
    await expect(page.locator('text=Resumen Semanal')).toBeVisible();

    await page.locator('.mobile-nav-item').nth(1).click();
    await expect(page.locator('#patients-directory')).toBeVisible();

    await expect.poll(async () =>
      page.locator('.content-canvas').evaluate((el) => el.scrollTop)
    ).toBeLessThan(40);
  });

  test('ver agenda completa opens directorio at the top', async ({ page }) => {
    await page.locator('.mobile-nav-item').nth(1).click();
    await page.locator('.content-canvas').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    await page.locator('.mobile-nav-item').first().click();
    await page.getByRole('button', { name: 'Ver Agenda Completa' }).click();
    await expect(page.locator('#patients-directory')).toBeVisible();

    await expect.poll(async () =>
      page.locator('.content-canvas').evaluate((el) => el.scrollTop)
    ).toBeLessThan(40);
  });
});
