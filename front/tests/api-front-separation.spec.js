import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const screenshots = path.resolve(process.cwd(), '../e2e/artifacts/screenshots/api-front-separation');
const capture = async (page, filename) => {
  fs.mkdirSync(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, filename), fullPage: true });
};

test('admin connects to the API, creates a patient, records a follow-up and opens statistics', async ({ page, context, browser }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Portal de Acompañamiento' })).toBeVisible();
  await capture(page, '01-login.png');

  await page.getByRole('button', { name: 'Acceso de prueba admin' }).click();
  await expect(page.getByRole('heading', { name: /buenos días|buenas tardes|buenas noches/i })).toBeVisible();
  await expect(page.getByText('Ricardo Soto')).toHaveCount(0);
  await expect(page.getByText('Frase del Día')).toHaveCount(0);
  await expect.poll(async () => (await context.cookies()).some((cookie) => cookie.name === 'medice_session' && cookie.httpOnly)).toBe(true);
  await capture(page, '02-dashboard-api.png');

  await page.getByRole('button', { name: /Pacientes/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Directorio de Pacientes' })).toBeVisible();
  await capture(page, '03-patient-directory-empty.png');
  await page.getByRole('button', { name: 'Nuevo Paciente' }).click();
  await expect(page.getByRole('heading', { name: 'Registrar Nuevo Paciente' })).toBeVisible();
  await capture(page, '04-patient-create-form.png');

  await page.getByPlaceholder('Ej: María García López').fill('Paciente de prueba API');
  await page.getByPlaceholder('Ej: 32.144.555').fill('10.234.567');
  await page.locator('input[type="date"]').fill('1950-01-02');
  await page.getByPlaceholder('Calle, Número, Piso, Ciudad/Localidad (Argentina)...').fill('Calle de prueba 123, Quilmes');
  await page.getByPlaceholder('Ej: Neoplasia de pulmón estadio IV').fill('Diagnóstico de prueba');
  await page.getByPlaceholder('Ej: Elena Mendoza R.').fill('Cuidadora de prueba');
  await page.getByPlaceholder('Ej: +54 9 11 5555 6666').fill('+54 11 4444 5555');
  await page.getByRole('button', { name: 'Guardar Registro' }).click();
  await expect(page.getByRole('heading', { name: 'Paciente de prueba API' })).toBeVisible();
  await capture(page, '05-patient-created-detail.png');

  await page.getByRole('button', { name: 'Registrar Seguimiento' }).first().click();
  await expect(page.getByRole('heading', { name: 'Registro Clínico de Seguimiento' })).toBeVisible();
  await capture(page, '06-follow-up-form.png');
  await page.getByPlaceholder(/Describa el estado de ánimo, fatiga/).fill('Observación clínica de prueba.');
  await page.getByPlaceholder(/Describa detalladamente las acciones tomadas/).fill('Observación clínica de prueba.');
  await page.getByRole('button', { name: 'Guardar Seguimiento' }).click();
  await expect(page.getByRole('button', { name: 'Registrar Seguimiento' }).first()).toBeVisible();
  await expect(page.getByText('Observación clínica de prueba.', { exact: true })).toBeVisible();
  await capture(page, '07-follow-up-confirmed.png');

  await page.getByRole('button', { name: 'Editar ficha' }).click();
  await expect(page.getByRole('heading', { name: 'Editar Paciente y Cuidador' })).toBeVisible();
  await capture(page, '23-patient-edit-form.png');
  await page.getByPlaceholder('Ej: Elena Mendoza R.').fill('Cuidadora editada por API');
  await page.getByPlaceholder('Ej: +54 9 11 5555 6666').fill('+54 11 4444 7777');
  await page.getByRole('button', { name: 'Guardar Cambios' }).click();
  await expect(page.getByRole('heading', { name: 'Paciente de prueba API' })).toBeVisible();
  await expect(page.getByText('Cuidadora editada por API')).toBeVisible();
  await capture(page, '24-patient-edited-detail.png');

  await page.getByRole('button', { name: /Estadísticas/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Estadísticas e impacto' })).toBeVisible();
  await expect(page.getByText('María García S.')).toHaveCount(0);
  await expect(page.getByText('Cicely Saunders')).toHaveCount(0);
  await capture(page, '08-stats-api.png');

  await page.getByRole('button', { name: /Administración/ }).first().click();
  await page.getByPlaceholder('Ej: Hospital Clínico San Carlos').fill('Centro de prueba API');
  await page.getByPlaceholder('Ej: Av. Córdoba 2351, CABA, Argentina').fill('Dirección de prueba');
  await page.getByRole('button', { name: 'Agregar Hospital' }).click();
  await expect(page.getByText('Centro de prueba API', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Archivar' }).click();
  await expect(page.getByText('Centro de prueba API · Archivado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restaurar' }).click();
  await expect(page.getByText('Centro de prueba API · Archivado', { exact: true })).toHaveCount(0);
  await capture(page, '18-admin-hospitals.png');

  const patientId = await page.evaluate(async () => (await fetch('/api/patients', { credentials: 'include' }).then((response) => response.json())).data[0].id);
  const assignmentStatus = await page.evaluate(async (id) => {
    const auth = await fetch('/api/auth/me', { credentials: 'include' }).then((response) => response.json());
    const csrf = decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('medice_csrf='))?.split('=')[1] ?? '');
    const response = await fetch(`/api/patients/${id}/assignments`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ volunteerIds: [auth.data.user.id] }) });
    return response.status;
  }, patientId);
  expect(assignmentStatus).toBe(200);
  await page.reload();
  await page.getByRole('button', { name: /Pacientes/ }).first().click();
  await page.getByText('Paciente de prueba API', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Paciente de prueba API' })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar Seguimiento' }).first().click();
  await page.context().setOffline(true);
  await page.getByPlaceholder(/Describa el estado de ánimo, fatiga/).fill('Registro offline de prueba.');
  await page.getByPlaceholder(/Describa detalladamente las acciones tomadas/).fill('Intervención registrada sin conexión.');
  await page.getByRole('button', { name: 'Guardar Seguimiento' }).click();
  await expect(page.getByText('Pendiente de sincronización')).toBeVisible();
  await capture(page, '09-offline-queued.png');

  await page.reload();
  await expect(page.getByText('Sin conexión · cola local')).toBeVisible();
  await page.getByRole('button', { name: 'Configuración' }).click();
  await page.getByRole('button', { name: 'Centro de Sincronización' }).click();
  await expect(page.getByText('Cola local (1)')).toBeVisible();
  await expect(page.getByText('Paciente de prueba API', { exact: true })).toBeVisible();
  await capture(page, '10-offline-restored.png');

  await page.context().setOffline(false);
  await expect(page.getByText('Cola local (0)')).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /Pacientes/ }).first().click();
  await page.getByText('Paciente de prueba API', { exact: true }).click();
  await expect(page.getByText(/Intervención registrada sin conexión\./)).toBeVisible();
  await expect(page.getByText('Registro offline de prueba.', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Pendiente de sincronización')).toHaveCount(0);
  await capture(page, '11-offline-synced.png');

  const alertNotice = await page.evaluate(async (id) => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('medice_csrf='))?.split('=')[1] ?? '');
    const signIn = async (email, name) => fetch('/api/auth/dev/bypass', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ email, name }) }).then((response) => response.json());
    const allowlistResponse = await fetch('/api/coordinator/allowed-users', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ email: 'volunteer@medice.test' }) });
    if (![201, 409].includes(allowlistResponse.status)) throw new Error(`allowlist add failed: ${allowlistResponse.status}`);
    const volunteer = await signIn('volunteer@medice.test', 'Voluntario de prueba');
    await signIn('admin@medice.test', 'Admin de prueba');
    const auth = await fetch('/api/auth/me', { credentials: 'include' }).then((response) => response.json());
    const assignmentResponse = await fetch(`/api/patients/${id}/assignments`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ volunteerIds: [auth.data.user.id, volunteer.data.user.id] }) });
    if (!assignmentResponse.ok) throw new Error(`assign failed: ${assignmentResponse.status}`);
    const alertResponse = await fetch(`/api/patients/${id}/alerts`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ level: 'standard', motive: 'pain', observations: 'Detalle clínico confidencial' }) });
    if (!alertResponse.ok) throw new Error(`alert failed: ${alertResponse.status}`);
    const alertBody = await alertResponse.json();
    const roleResponse = await fetch(`/api/admin/users/${volunteer.data.user.id}/role`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ role: 'coordinator' }) });
    if (!roleResponse.ok) throw new Error(`role update failed: ${roleResponse.status}`);
    await signIn('volunteer@medice.test', 'Voluntario de prueba');
    const feed = await fetch('/api/notifications/me', { credentials: 'include' }).then((response) => response.json());
    const notification = feed.notifications.find((item) => item.id === `alert-${alertBody.data.id}-${volunteer.data.user.id}`);
    const globalStatsStatus = (await fetch('/api/stats/global', { credentials: 'include' })).status;
    const coordinatorRemoveStatus = (await fetch('/api/admin/settings/allowed_users/volunteer%40medice.test', { method: 'DELETE', credentials: 'include', headers: { 'X-CSRF-Token': csrf } })).status;
    return { notification: notification ?? null, volunteerId: volunteer.data.user.id, alertId: alertBody.data.id, globalStatsStatus, coordinatorRemoveStatus };
  }, patientId);
  const volunteerCookie = (await context.cookies()).find((cookie) => cookie.name === 'medice_session');
  expect(alertNotice.notification).toMatchObject({ title: 'Palia', body: 'Hay una actualización. Inicia sesión para consultar la información.' });
  expect(JSON.stringify(alertNotice.notification)).not.toContain('Paciente de prueba API');
  expect(alertNotice.globalStatsStatus).toBe(200);
  expect(alertNotice.coordinatorRemoveStatus).toBe(403);
  await page.evaluate(async () => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('medice_csrf='))?.split('=')[1] ?? '');
    await fetch('/api/auth/dev/bypass', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ email: 'admin@medice.test', name: 'Admin de prueba' }) });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Pacientes' }).first().click();
  await page.getByText('Paciente de prueba API', { exact: true }).click();
  await expect(page.getByText('Detalle clínico confidencial')).toBeVisible();
  await capture(page, '21-alert-active.png');
  page.once('dialog', (dialog) => dialog.accept('Resolución de prueba'));
  const resolveResponsePromise = page.waitForResponse((response) => response.url().includes(`/api/alerts/${alertNotice.alertId}/resolve`) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Resolver alerta' }).click();
  expect((await resolveResponsePromise).status()).toBe(200);
  await expect(page.getByText('Resuelta — Resolución de prueba')).toBeVisible();
  await capture(page, '22-alert-resolved.png');
  await page.getByRole('button', { name: 'Activar Alerta' }).click();
  const alertDialog = page.getByRole('dialog', { name: 'Activar Alerta Clínica' });
  await alertDialog.getByLabel('Motivo de la Alerta').selectOption('Dolor No Controlado');
  await alertDialog.getByLabel('Observaciones Clínicas').fill('Alerta registrada desde el formulario.' );
  await capture(page, '25-alert-form.png');
  const createAlertResponsePromise = page.waitForResponse((response) => response.url().includes(`/api/patients/${patientId}/alerts`) && response.request().method() === 'POST');
  await alertDialog.getByRole('button', { name: 'Activar Alerta' }).click();
  expect((await createAlertResponsePromise).status()).toBe(201);
  await expect(page.getByText('Alerta registrada desde el formulario.')).toBeVisible();
  await capture(page, '26-alert-created-from-form.png');
  page.once('dialog', (dialog) => dialog.accept('Cierre de prueba'));
  const secondResolvePromise = page.waitForResponse((response) => /\/api\/alerts\/.+\/resolve/.test(response.url()) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Resolver alerta' }).click();
  expect((await secondResolvePromise).status()).toBe(200);
  await expect(page.getByText('Resuelta — Cierre de prueba')).toBeVisible();
  await capture(page, '27-alert-form-resolved.png');

  const archiveResponsePromise = page.waitForResponse((response) => response.url().includes(`/api/patients/${patientId}/archive`) && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Archivar paciente' }).click();
  expect((await archiveResponsePromise).status()).toBe(200);
  await page.getByRole('button', { name: /Pacientes/ }).first().click();
  await page.getByRole('button', { name: 'Archivados' }).click();
  await expect(page.getByRole('button', { name: 'Archivados' })).toHaveAttribute('aria-pressed', 'true');
  const archivedPatient = await page.evaluate(async (id) => (await fetch(`/api/patients/${id}`, { credentials: 'include' })).json(), patientId);
  expect(archivedPatient.data.archived_at).toBeTruthy();
  await expect(page.getByText('Paciente de prueba API', { exact: true })).toBeVisible();
  await capture(page, '12-archived-patient.png');
  const restoreStatus = await page.evaluate(async (id) => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('medice_csrf='))?.split('=')[1] ?? '');
    return (await fetch(`/api/patients/${id}/restore`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf } })).status;
  }, patientId);
  expect(restoreStatus).toBe(403);
  const coordinatorRestoreStatus = await page.evaluate(async (id) => {
    const csrf = decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('medice_csrf='))?.split('=')[1] ?? '');
    const login = await fetch('/api/auth/dev/bypass', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ email: 'volunteer@medice.test', name: 'Coordinadora de prueba' }) });
    if (!login.ok) throw new Error(`coordinator sign in failed: ${login.status}`);
    const restore = await fetch(`/api/patients/${id}/restore`, { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrf } });
    await fetch('/api/auth/dev/bypass', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ email: 'admin@medice.test', name: 'Admin de prueba' }) });
    return restore.status;
  }, patientId);
  expect(coordinatorRestoreStatus).toBe(200);

  await page.getByRole('button', { name: /Administración/ }).first().click();
  await page.getByRole('button', { name: 'Invitaciones y Accesos' }).click();
  await expect(page.getByText('volunteer@medice.test', { exact: true })).toBeVisible();
  const bootstrapAdminRow = page.getByRole('row').filter({ hasText: 'matiasbaiges@gmail.com' });
  await expect(bootstrapAdminRow.getByText('Administrador', { exact: true })).toBeVisible();
  await capture(page, '19-admin-allowlist.png');
  await page.getByRole('button', { name: 'Quitar acceso a volunteer@medice.test' }).click();
  await expect(page.getByText('volunteer@medice.test', { exact: true })).toHaveCount(0);
  await capture(page, '20-admin-allowlist-revoked.png');
  const volunteerContext = await browser.newContext();
  await volunteerContext.addCookies([volunteerCookie]);
  const revokedResponse = await volunteerContext.request.get('http://localhost:5173/api/auth/me');
  expect(revokedResponse.status()).toBe(401);
  await volunteerContext.close();

  await context.grantPermissions(['notifications']);
  await page.getByRole('button', { name: 'Configuración' }).click();
  await expect(page.getByRole('heading', { name: 'Configuración de Palia' })).toBeVisible();
  await page.getByRole('button', { name: 'Habilitar push' }).click();
  await expect(page.getByText('Estado actual: granted')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'notificaciones push no están configuradas' })).toBeVisible();
  await capture(page, '13-push-unconfigured.png');
});
