import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const screenshots = path.resolve(process.cwd(), '../e2e/artifacts/screenshots/local-backend-switch');
const capture = async (page, name) => {
  fs.mkdirSync(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, name), fullPage: true });
};

test('switches between API and seeded IndexedDB without mixing data', async ({ page }) => {
  test.setTimeout(60000);
  page.on('dialog', (dialog) => dialog.accept());
  await page.addInitScript(() => {
    const claims = { email: 'matiasbaiges@gmail.com', name: 'Matias Baiges', sub: 'google-test-matias' };
    const encoded = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    window.google = { accounts: { oauth2: { initCodeClient: ({ callback }) => ({ requestCode: () => callback({ code: `test-google:${encoded}` }) }) } } };
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Portal de Acompañamiento' })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar Sesión con Google' }).click();
  await expect(page.getByRole('heading', { name: /buenos días|buenas tardes|buenas noches/i })).toBeVisible();

  await page.getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('heading', { name: 'Configuración de Palia' })).toBeVisible();
  await capture(page, '01-settings-api.png');
  await page.getByRole('button', { name: 'Usar Local' }).click();
  await expect(page.getByRole('region', { name: 'Backend de datos' }).getByText('Local (IndexedDB)', { exact: true })).toBeVisible();
  await capture(page, '02-settings-local.png');

  await page.getByRole('button', { name: 'Cargar seed local' }).click();
  await expect(page.getByText('Seed local cargado correctamente.')).toBeVisible();
  await page.getByRole('button', { name: 'Inicio' }).click();
  await expect(page.getByText('Paciente Demo Activo').first()).toBeVisible();
  await capture(page, '03-local-seed-dashboard.png');

  await page.reload();
  await expect(page.getByRole('heading', { name: /buenos días|buenas tardes|buenas noches/i })).toBeVisible();
  await page.getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('region', { name: 'Backend de datos' }).getByText('Local (IndexedDB)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inicio' }).click();
  await expect(page.getByText('Paciente Demo Activo').first()).toBeVisible();

  await page.getByRole('button', { name: 'person_search Pacientes' }).click();
  await page.getByText('Paciente Demo Activo').first().click();
  await expect(page.getByText('Cuidador Demo')).toBeVisible();
  await capture(page, '04-local-patient-detail.png');

  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole('button', { name: 'Avatar del usuario administrador' }).click();
  await page.getByRole('button', { name: 'Configuración' }).click();
  await capture(page, '05-local-mobile-settings.png');
  await page.setViewportSize({ width: 1280, height: 800 });
  await capture(page, '06-desktop-switch.png');
});
