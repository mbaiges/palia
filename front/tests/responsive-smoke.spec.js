import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const artifacts = path.resolve(process.cwd(), '../e2e/artifacts/screenshots/api-front-separation');
const capture = async (page, name) => {
  fs.mkdirSync(artifacts, { recursive: true });
  await page.screenshot({ path: path.join(artifacts, name), fullPage: true });
};

async function signInAsAdmin(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.getByRole('button', { name: 'Acceso de prueba admin' }).click();
  await expect(page.getByRole('heading', { name: /Buenas/ })).toBeVisible();
}

test('mobile directory and offline settings fit compact phone viewport', async ({ page }) => {
  await signInAsAdmin(page, 390, 844);
  await page.getByRole('button', { name: /Directorio|Pacientes/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Directorio de Pacientes' })).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, '14-mobile-directory.png');

  await page.locator('.user-profile-menu').click();
  await page.getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('heading', { name: 'Configuración de Palia' })).toBeVisible();
  await page.getByRole('button', { name: 'Centro de Sincronización' }).click();
  await expect(page.getByText('Estado de red:')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, '15-mobile-offline-settings.png');
});

test('narrow phone login and shell render without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 344, height: 882 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Portal de Acompañamiento' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, '16-narrow-mobile-login.png');
  await page.getByRole('button', { name: 'Acceso de prueba admin' }).click();
  await expect(page.locator('.mobile-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, '17-narrow-mobile-shell.png');
});
