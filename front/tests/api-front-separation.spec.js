import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const screenshots = path.resolve(
  process.cwd(),
  "../e2e/artifacts/screenshots/api-front-separation",
);
const capture = async (page, filename) => {
  fs.mkdirSync(screenshots, { recursive: true });
  await page.screenshot({
    path: path.join(screenshots, filename),
    fullPage: true,
  });
};

test("admin connects to the API, creates a patient, records a follow-up and opens statistics", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(60000);
  const frontendOrigin = test.info().project.use.baseURL;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const claims = {
      email: "matiasbaiges@gmail.com",
      name: "Matias Baiges",
      sub: "google-test-matias",
    };
    const encoded = btoa(JSON.stringify(claims))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    window.google = {
      accounts: {
        oauth2: {
          initCodeClient: ({ callback }) => ({
            requestCode: () => callback({ code: `test-google:${encoded}` }),
          }),
        },
      },
    };
  });
  await page.goto("/api/health/ready");
  await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("palia-offline-v1", 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("patients", { keyPath: ["userId", "id"] });
        db.createObjectStore("profiles", { keyPath: "id" });
        const outbox = db.createObjectStore("outbox", { keyPath: "id" });
        outbox.createIndex("userId", "userId", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("outbox", "readwrite");
      transaction.objectStore("outbox").put({
        id: "legacy-v1-pending",
        userId: "legacy-migration-user",
        patientId: "legacy-patient",
        payload: { clientMutationId: "legacy-v1-pending" },
        status: "pending",
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastError: null,
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  const emailAuth = await page.request.post(
    new URL("/api/auth/email/sign-in", frontendOrigin).toString(),
    { data: { email: "volunteer@medice.test", password: "irrelevant" } },
  );
  const bearerOnly = await page.request.get(
    new URL("/api/bootstrap", frontendOrigin).toString(),
    { headers: { Authorization: "Bearer invalid-scaffold-token" } },
  );
  expect(emailAuth.status()).toBe(404);
  expect(bearerOnly.status()).toBe(401);
  await capture(page, "01-login.png");

  await page.getByRole("button", { name: "Iniciar Sesión con Google" }).click();
  await expect(
    page.getByRole("heading", {
      name: /buenos días|buenas tardes|buenas noches/i,
    }),
  ).toBeVisible();
  const offlineMigration = await page.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("palia-offline-v1");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const state = await new Promise((resolve, reject) => {
      const transaction = database.transaction("outbox", "readonly");
      const store = transaction.objectStore("outbox");
      const request = store.index("userId").getAll("legacy-migration-user");
      request.onsuccess = () =>
        resolve({
          version: database.version,
          keyPath: store.keyPath,
          items: request.result,
        });
      request.onerror = () => reject(request.error);
    });
    database.close();
    return state;
  });
  expect(offlineMigration.version).toBe(2);
  expect(offlineMigration.keyPath).toEqual(["userId", "id"]);
  expect(offlineMigration.items.map((item) => item.id)).toEqual([
    "legacy-v1-pending",
  ]);
  await expect(page.getByText("Ricardo Soto")).toHaveCount(0);
  await expect(page.getByText("Frase del Día")).toHaveCount(0);
  await expect
    .poll(async () =>
      (await context.cookies()).some(
        (cookie) => cookie.name === "medice_session" && cookie.httpOnly,
      ),
    )
    .toBe(true);
  const csrfCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "medice_csrf",
  );
  const missingOriginMutation = await context.request.patch(
    new URL("/api/users/me/profile", frontendOrigin).toString(),
    {
      headers: { "X-CSRF-Token": csrfCookie.value },
      data: { phone: "+54 11 5555 1212" },
    },
  );
  expect(missingOriginMutation.status()).toBe(403);
  await capture(page, "02-dashboard-api.png");

  await page
    .getByRole("button", { name: /Pacientes/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Directorio de Pacientes" }),
  ).toBeVisible();
  await capture(page, "03-patient-directory-empty.png");
  await page.getByRole("button", { name: "Nuevo Paciente" }).click();
  await expect(
    page.getByRole("heading", { name: "Registrar Nuevo Paciente" }),
  ).toBeVisible();
  await capture(page, "04-patient-create-form.png");

  await page
    .getByPlaceholder("Ej: María García López")
    .fill("Paciente de prueba API");
  await page.getByPlaceholder("Ej: 32.144.555").fill("10.234.567");
  await page.locator('input[type="date"]').fill("1950-01-02");
  await page
    .getByPlaceholder("Calle, Número, Piso, Ciudad/Localidad (Argentina)...")
    .fill("Calle de prueba 123, Quilmes");
  await page
    .getByPlaceholder("Ej: Neoplasia de pulmón estadio IV")
    .fill("Diagnóstico de prueba");
  await page
    .getByPlaceholder("Ej: Elena Mendoza R.")
    .fill("Cuidadora de prueba");
  await page
    .getByPlaceholder("Ej: +54 9 11 5555 6666")
    .fill("+54 11 4444 5555");
  await page.getByRole("button", { name: "Guardar Registro" }).click();
  await expect(
    page.getByRole("heading", { name: "Paciente de prueba API" }),
  ).toBeVisible();
  await capture(page, "05-patient-created-detail.png");

  await page.getByRole("button", { name: /Pacientes/ }).first().click();
  await page.getByRole("button", { name: "Nuevo Paciente" }).click();
  await page
    .getByPlaceholder("Ej: María García López")
    .fill("Paciente con DNI duplicado");
  await page.getByPlaceholder("Ej: 32.144.555").fill("10.234.567");
  await page.locator('input[type="date"]').fill("1960-02-03");
  await page
    .getByPlaceholder("Calle, Número, Piso, Ciudad/Localidad (Argentina)...")
    .fill("Dirección que debe conservarse");
  await page
    .getByPlaceholder("Ej: Neoplasia de pulmón estadio IV")
    .fill("Diagnóstico que debe conservarse");
  await page
    .getByPlaceholder("Ej: Elena Mendoza R.")
    .fill("Cuidador que debe conservarse");
  await page
    .getByPlaceholder("Ej: +54 9 11 5555 6666")
    .fill("+54 11 5555 7777");
  await page.getByRole("button", { name: "Guardar Registro" }).click();
  await expect(page.getByText(/El DNI ya está registrado/)).toBeVisible();
  await expect(page.getByPlaceholder("Ej: María García López")).toHaveValue(
    "Paciente con DNI duplicado",
  );
  await expect(
    page.getByPlaceholder(
      "Calle, Número, Piso, Ciudad/Localidad (Argentina)...",
    ),
  ).toHaveValue("Dirección que debe conservarse");
  await expect(
    page.getByPlaceholder("Ej: Elena Mendoza R."),
  ).toHaveValue("Cuidador que debe conservarse");
  await capture(page, "43-patient-duplicate-dni.png");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();

  await page
    .getByRole("button", { name: "Registrar Seguimiento" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Registro Clínico de Seguimiento" }),
  ).toBeVisible();
  const durationGroup = page
    .locator(".form-group")
    .filter({ hasText: "Duración del acompañamiento" });
  await durationGroup.locator("select").selectOption("custom");
  const customDurationInput = page.getByLabel(
    "Duración personalizada en minutos",
  );
  for (const invalidDuration of [14, 16, 1441, 17]) {
    await customDurationInput.fill(String(invalidDuration));
    expect(
      await customDurationInput.evaluate((input) => input.checkValidity()),
    ).toBe(false);
  }
  await customDurationInput.fill("135");
  expect(
    await customDurationInput.evaluate((input) => input.checkValidity()),
  ).toBe(true);
  await capture(page, "34-custom-followup-duration.png");
  await capture(page, "06-follow-up-form.png");
  await page.locator('select[name="dolorLevel"]').selectOption("7-9");
  await page.locator('select[name="nauseaLevel"]').selectOption("Frecuente");
  await page
    .locator('select[name="disnea"]')
    .selectOption({ label: "Grado 2 – Moderada" });
  await page.getByText("Intermitente / Fragilidad").click();
  await page
    .getByPlaceholder(
      "Estado anímico del cuidador, higiene del hogar, apoyo vecinal...",
    )
    .fill("Vivienda ventilada, apoyo familiar intermitente.");
  await page.getByLabel("Concentrador Oxígeno").check();
  await page
    .getByPlaceholder("Otro equipamiento específico...")
    .fill("Silla de traslado");
  await page
    .getByPlaceholder(/Describa el estado de ánimo, fatiga/)
    .fill("Observación clínica de prueba.");
  await page
    .getByPlaceholder(/Describa detalladamente las acciones tomadas/)
    .fill("Observación clínica de prueba.");
  await page.getByRole("button", { name: "Guardar Seguimiento" }).click();
  await expect(
    page.getByRole("button", { name: "Registrar Seguimiento" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Observación clínica de prueba.", { exact: true }),
  ).toBeVisible();
  await capture(page, "07-follow-up-confirmed.png");
  await page.setViewportSize({ width: 1440, height: 1900 });
  await page.getByRole("button", { name: "Imprimir Historial" }).click();
  const printableReport = page.locator("#print-preview-modal-root");
  await expect(page.getByText("Vista Previa de Impresión")).toBeVisible();
  await expect(printableReport).toContainText("Hospital de Referencia");
  await expect(printableReport).toContainText("Intermitente / Fragilidad");
  await expect(printableReport).toContainText(
    "Modalidad y duración: Presencial · 135 min",
  );
  await expect(printableReport).toContainText("Dolor 7-9");
  await expect(printableReport).toContainText("Náuseas Frecuente");
  await expect(printableReport).toContainText("Disnea Grado 2 – Moderada");
  await expect(printableReport).toContainText(
    "Vivienda ventilada, apoyo familiar intermitente.",
  );
  await expect(printableReport).toContainText("Concentrador Oxígeno");
  await expect(printableReport).toContainText("Silla de traslado");
  await expect(printableReport).toContainText(
    "Intervenciones: Observación clínica de prueba.",
  );
  await capture(page, "30-print-report-full-fields.png");
  await page.emulateMedia({ media: "print" });
  await expect(printableReport).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Imprimir / Guardar PDF" }),
  ).toBeHidden();
  await capture(page, "31-print-document.png");
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.getByRole("button", { name: "Editar ficha" }).click();
  await expect(
    page.getByRole("heading", { name: "Editar Paciente y Cuidador" }),
  ).toBeVisible();
  await capture(page, "23-patient-edit-form.png");
  await page
    .getByPlaceholder("Ej: Elena Mendoza R.")
    .fill("Cuidadora editada por API");
  await page
    .getByPlaceholder("Ej: +54 9 11 5555 6666")
    .fill("+54 11 4444 7777");
  await page.getByRole("button", { name: "Guardar Cambios" }).click();
  await expect(
    page.getByRole("heading", { name: "Paciente de prueba API" }),
  ).toBeVisible();
  await expect(page.getByText("Cuidadora editada por API")).toBeVisible();
  await capture(page, "24-patient-edited-detail.png");

  await page
    .getByRole("button", { name: /Estadísticas/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Estadísticas e impacto" }),
  ).toBeVisible();
  await expect(page.getByText("María García S.")).toHaveCount(0);
  await expect(page.getByText("Cicely Saunders")).toHaveCount(0);
  const yearSelector = page.getByRole("combobox", { name: "Año de actividad" });
  const currentYear = new Date().getFullYear();
  await expect(yearSelector).toHaveValue(String(currentYear));
  await yearSelector.selectOption(String(currentYear - 1));
  await expect
    .poll(() =>
      page
        .locator("[data-hours]")
        .evaluateAll((nodes) =>
          nodes.every((node) => node.dataset.hours === "0"),
        ),
    )
    .toBe(true);
  await yearSelector.selectOption(String(currentYear));
  const weeklySelector = page.getByRole("combobox", {
    name: "Período semanal",
  });
  await weeklySelector.selectOption("14");
  await expect(weeklySelector).toHaveValue("14");
  await weeklySelector.selectOption("7");
  await capture(page, "08-stats-api.png");

  await page
    .getByRole("button", { name: /Administración/ })
    .first()
    .click();
  await page
    .getByPlaceholder("Ej: Hospital Clínico San Carlos")
    .fill("Centro de prueba API");
  await page
    .getByPlaceholder("Ej: Av. Córdoba 2351, CABA, Argentina")
    .fill("Dirección de prueba");
  await page.getByRole("button", { name: "Agregar Hospital" }).click();
  await expect(
    page.getByText("Centro de prueba API", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Archivar" }).click();
  await expect(
    page.getByText("Centro de prueba API · Archivado", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Pacientes/ }).first().click();
  await page.getByRole("button", { name: "Nuevo Paciente" }).click();
  const hospitalSelector = page.getByLabel("Hospital de Referencia");
  await expect(
    hospitalSelector.locator("option", { hasText: "Centro de prueba API" }),
  ).toHaveCount(0);
  await capture(page, "44-archived-hospital-excluded-from-new-patient.png");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page
    .getByRole("button", { name: /Administración/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Restaurar" }).click();
  await expect(
    page.getByText("Centro de prueba API · Archivado", { exact: true }),
  ).toHaveCount(0);
  await capture(page, "18-admin-hospitals.png");

  const patientId = await page.evaluate(
    async () =>
      (
        await fetch("/api/patients", { credentials: "include" }).then(
          (response) => response.json(),
        )
      ).data[0].id,
  );
  const assignmentStatus = await page.evaluate(async (id) => {
    const auth = await fetch("/api/auth/me", { credentials: "include" }).then(
      (response) => response.json(),
    );
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const response = await fetch(`/api/patients/${id}/assignments`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({ volunteerIds: [auth.data.user.id] }),
    });
    return response.status;
  }, patientId);
  expect(assignmentStatus).toBe(200);
  await page.reload();
  await page
    .getByRole("button", { name: /Pacientes/ })
    .first()
    .click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Paciente de prueba API" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar Seguimiento" })
    .first()
    .click();
  await page.context().setOffline(true);
  await page
    .getByPlaceholder(/Describa el estado de ánimo, fatiga/)
    .fill("Registro offline de prueba.");
  await page
    .getByPlaceholder(/Describa detalladamente las acciones tomadas/)
    .fill("Intervención registrada sin conexión.");
  await page.getByRole("button", { name: "Guardar Seguimiento" }).click();
  await expect(page.getByText("Pendiente de sincronización")).toBeVisible();
  await capture(page, "09-offline-queued.png");

  await page.reload();
  await expect(page.getByText("Sin conexión · cola local")).toBeVisible();
  await page.getByRole("button", { name: "Configuración" }).click();
  await page.getByRole("button", { name: "Centro de Sincronización" }).click();
  await expect(page.getByText("Cola local (1)")).toBeVisible();
  await expect(
    page.getByText("Paciente de prueba API", { exact: true }),
  ).toBeVisible();
  await capture(page, "10-offline-restored.png");

  await page.context().setOffline(false);
  await expect(page.getByText("Cola local (0)")).toBeVisible({
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: /Pacientes/ })
    .first()
    .click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();
  await expect(
    page.getByText(/Intervención registrada sin conexión\./),
  ).toBeVisible();
  await expect(
    page.getByText("Registro offline de prueba.", { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByText("Pendiente de sincronización")).toHaveCount(0);
  await capture(page, "11-offline-synced.png");

  const alertNotice = await page.evaluate(async (id) => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const missingGoogleRequestMarker = await fetch("/api/auth/google", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({ authCode: "not-a-real-code" }),
    });
    const signIn = async (email, name) =>
      fetch("/api/auth/dev/bypass", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ email, name }),
      }).then((response) => response.json());
    const allowlistResponse = await fetch("/api/coordinator/allowed-users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({ email: "volunteer@medice.test" }),
    });
    if (![201, 409].includes(allowlistResponse.status))
      throw new Error(`allowlist add failed: ${allowlistResponse.status}`);
    const volunteer = await signIn(
      "volunteer@medice.test",
      "Voluntario de prueba",
    );
    const patientRecord = await fetch(`/api/patients/${id}`, {
      credentials: "include",
    }).then((response) => response.json());
    const patientEditBody = {
      name: patientRecord.data.name,
      dni: patientRecord.data.dni,
      dob: patientRecord.data.dob,
      updatedAt: patientRecord.data.updated_at,
      address: "Dirección actualizada por coordinación",
      diagnosis: patientRecord.data.diagnosis,
      hospitalId: patientRecord.data.hospital_id,
      complexSituation: patientRecord.data.complex_situation,
      caregiver: {
        name: patientRecord.data.caregiver.name,
        relation: "Hija",
        phone: patientRecord.data.caregiver.phone,
        livesWithPatient: patientRecord.data.caregiver.lives_with_patient,
        burdenLevel: patientRecord.data.caregiver.burden_level,
      },
    };
    const volunteerEditPatient = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({}),
    });
    const hospitalList = await fetch("/api/hospitals?includeArchived=true", {
      credentials: "include",
    }).then((response) => response.json());
    const hospital = hospitalList.data.find(
      (item) => item.name === "Centro de prueba API",
    );
    if (!hospital) throw new Error("E2E hospital not found");
    const volunteerArchiveHospital = await fetch(
      `/api/hospitals/${hospital.id}/archive`,
      {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      },
    );
    const followUpPayload = {
      occurredAt: new Date().toISOString(),
      contactType: "in_person",
      durationMinutes: 120,
      symptoms: {},
      symptomObservations: "Seguimiento de paciente no asignado.",
      socialRisk: {},
      equipmentNeeds: [],
      equipmentOther: "",
      interventions: "Prueba de permiso de directorio.",
      clientMutationId: crypto.randomUUID(),
    };
    const unassignedFollowUpResponse = await fetch(
      `/api/patients/${id}/follow-ups`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify(followUpPayload),
      },
    );
    const idempotentReplayResponse = await fetch(
      `/api/patients/${id}/follow-ups`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify(followUpPayload),
      },
    );
    const conflictingReplayResponse = await fetch(
      `/api/patients/${id}/follow-ups`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          ...followUpPayload,
          interventions: "Contenido distinto.",
        }),
      },
    );
    const defaultDurations = [];
    for (const contactType of ["in_person", "remote"]) {
      const response = await fetch(`/api/patients/${id}/follow-ups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          ...followUpPayload,
          clientMutationId: crypto.randomUUID(),
          contactType,
          durationMinutes: undefined,
        }),
      });
      const responseBody = await response.json();
      defaultDurations.push({
        status: response.status,
        duration:
          responseBody.data.durationMinutes ??
          responseBody.data.duration_minutes,
      });
    }
    const durationStatuses = [];
    for (const durationMinutes of [15, 1440, 14, 16, 1441, 17]) {
      const response = await fetch(`/api/patients/${id}/follow-ups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({
          ...followUpPayload,
          clientMutationId: crypto.randomUUID(),
          durationMinutes,
        }),
      });
      durationStatuses.push(response.status);
    }
    const personalStatsStatus = (
      await fetch("/api/stats/me", { credentials: "include" })
    ).status;
    const unassignedFollowUpStatus = unassignedFollowUpResponse.status;
    await signIn("admin@medice.test", "Admin de prueba");
    const auth = await fetch("/api/auth/me", { credentials: "include" }).then(
      (response) => response.json(),
    );
    const assignmentResponse = await fetch(`/api/patients/${id}/assignments`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        volunteerIds: [auth.data.user.id, volunteer.data.user.id],
      }),
    });
    if (!assignmentResponse.ok)
      throw new Error(`assign failed: ${assignmentResponse.status}`);
    const alertResponse = await fetch(`/api/patients/${id}/alerts`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        level: "standard",
        motive: "pain",
        observations: "Detalle clínico confidencial",
      }),
    });
    if (!alertResponse.ok)
      throw new Error(`alert failed: ${alertResponse.status}`);
    const alertBody = await alertResponse.json();
    const roleResponse = await fetch(
      `/api/admin/users/${volunteer.data.user.id}/role`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ role: "coordinator" }),
      },
    );
    if (!roleResponse.ok)
      throw new Error(`role update failed: ${roleResponse.status}`);
    await signIn("volunteer@medice.test", "Voluntario de prueba");
    const coordinatorIdentity = await fetch("/api/auth/me", {
      credentials: "include",
    }).then((response) => response.json());
    const coordinatorEditPatient = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify(patientEditBody),
    });
    const staleCoordinatorEdit = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify(patientEditBody),
    });
    const editConflictState = await fetch(`/api/patients/${id}`, {
      credentials: "include",
    }).then((response) => response.json());
    const coordinatorArchiveHospital = await fetch(
      `/api/hospitals/${hospital.id}/archive`,
      {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      },
    );
    const hospitalsWhileArchived = await fetch(
      "/api/hospitals?includeArchived=true",
      { credentials: "include" },
    ).then((response) => response.json());
    const activeHospitals = await fetch("/api/hospitals", {
      credentials: "include",
    }).then((response) => response.json());
    const archivedHospital = hospitalsWhileArchived.data.find(
      (item) => item.id === hospital.id,
    );
    const coordinatorRestoreHospital = await fetch(
      `/api/hospitals/${hospital.id}/restore`,
      {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      },
    );
    const feed = await fetch("/api/notifications/me", {
      credentials: "include",
    }).then((response) => response.json());
    const notification = feed.notifications.find(
      (item) =>
        item.id === `alert-${alertBody.data.id}-${volunteer.data.user.id}`,
    );
    const alertPage = await fetch("/api/alerts?limit=1&cursor=0", {
      credentials: "include",
    }).then((response) => response.json());
    const globalStatsStatus = (
      await fetch("/api/stats/global", { credentials: "include" })
    ).status;
    const coordinatorRemoveStatus = (
      await fetch("/api/admin/settings/allowed_users/volunteer%40medice.test", {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      })
    ).status;
    const coordinatorDeleteAdminStatus = (
      await fetch(`/api/users/${auth.data.user.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      })
    ).status;
    return {
      notification: notification ?? null,
      alertPage: {
        items: alertPage.data.length,
        limit: alertPage.page.limit,
        total: alertPage.page.total,
        nextCursor: alertPage.page.next_cursor,
      },
      volunteerId: volunteer.data.user.id,
      alertId: alertBody.data.id,
      globalStatsStatus,
      personalStatsStatus,
      coordinatorRemoveStatus,
      coordinatorDeleteAdminStatus,
      unassignedFollowUpStatus,
      idempotentReplayStatus: idempotentReplayResponse.status,
      conflictingReplayStatus: conflictingReplayResponse.status,
      durationStatuses,
      defaultDurations,
      missingGoogleRequestMarkerStatus: missingGoogleRequestMarker.status,
      volunteerArchiveHospitalStatus: volunteerArchiveHospital.status,
      coordinatorArchiveHospitalStatus: coordinatorArchiveHospital.status,
      coordinatorRestoreHospitalStatus: coordinatorRestoreHospital.status,
      archivedHospitalVisible: Boolean(archivedHospital?.archived_at),
      archivedHospitalInActiveList: activeHospitals.data.some(
        (item) => item.id === hospital.id,
      ),
      volunteerEditPatientStatus: volunteerEditPatient.status,
      coordinatorEditPatientStatus: coordinatorEditPatient.status,
      staleCoordinatorEditStatus: staleCoordinatorEdit.status,
      editConflictAddress: editConflictState.data.address,
      editConflictCaregiverRelation: editConflictState.data.caregiver.relation,
      assignedVolunteerRole: coordinatorIdentity.data.role,
    };
  }, patientId);
  const volunteerCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "medice_session",
  );
  expect(alertNotice.notification).toMatchObject({
    title: "Palia",
    body: "Hay una actualización. Inicia sesión para consultar la información.",
  });
  expect(alertNotice.alertPage.items).toBe(1);
  expect(alertNotice.alertPage.limit).toBe(1);
  expect(alertNotice.alertPage.total).toBeGreaterThanOrEqual(1);
  expect(alertNotice.alertPage.nextCursor).toBe(
    alertNotice.alertPage.total > 1 ? "1" : null,
  );
  expect(JSON.stringify(alertNotice.notification)).not.toContain(
    "Paciente de prueba API",
  );
  expect(alertNotice.globalStatsStatus).toBe(200);
  expect(alertNotice.personalStatsStatus).toBe(200);
  expect(alertNotice.unassignedFollowUpStatus).toBe(201);
  expect(alertNotice.idempotentReplayStatus).toBe(200);
  expect(alertNotice.conflictingReplayStatus).toBe(409);
  expect(alertNotice.durationStatuses).toEqual([201, 201, 422, 422, 422, 422]);
  expect(alertNotice.defaultDurations).toEqual([
    { status: 201, duration: 120 },
    { status: 201, duration: 60 },
  ]);
  expect(alertNotice.missingGoogleRequestMarkerStatus).toBe(400);
  expect(alertNotice.coordinatorRemoveStatus).toBe(403);
  expect(alertNotice.coordinatorDeleteAdminStatus).toBe(403);
  expect(alertNotice.volunteerArchiveHospitalStatus).toBe(403);
  expect(alertNotice.coordinatorArchiveHospitalStatus).toBe(200);
  expect(alertNotice.coordinatorRestoreHospitalStatus).toBe(200);
  expect(alertNotice.archivedHospitalVisible).toBe(true);
  expect(alertNotice.archivedHospitalInActiveList).toBe(false);
  expect(alertNotice.volunteerEditPatientStatus).toBe(403);
  expect(alertNotice.coordinatorEditPatientStatus).toBe(200);
  expect(alertNotice.staleCoordinatorEditStatus).toBe(409);
  expect(alertNotice.editConflictAddress).toBe(
    "Dirección actualizada por coordinación",
  );
  expect(alertNotice.editConflictCaregiverRelation).toBe("Hija");
  expect(alertNotice.assignedVolunteerRole).toBe("coordinator");
  await page.reload();
  await page.getByRole("button", { name: "Pacientes" }).first().click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();
  await page.getByRole("button", { name: "Registrar Seguimiento" }).click();
  await page.context().setOffline(true);
  await page
    .getByPlaceholder(/Describa el estado de ánimo, fatiga/)
    .fill("Seguimiento offline de coordinadora asignada.");
  await page
    .getByPlaceholder(/Describa detalladamente las acciones tomadas/)
    .fill("Sincronización offline con rol coordinador.");
  await page.getByRole("button", { name: "Guardar Seguimiento" }).click();
  await expect(page.getByText("Pendiente de sincronización")).toBeVisible();
  await capture(page, "41-coordinator-offline-queued.png");
  await page.context().setOffline(false);
  await page.getByRole("button", { name: "Configuración" }).first().click();
  await page.getByRole("button", { name: "Centro de Sincronización" }).click();
  await expect(page.getByText("Cola local (0)")).toBeVisible({ timeout: 15000 });
  await capture(page, "42-coordinator-offline-synced.png");
  const readerAllowlistStatus = await page.evaluate(async () => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    return (
      await fetch("/api/coordinator/allowed-users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify({ email: "archived-reader@medice.test" }),
      })
    ).status;
  });
  expect([201, 409]).toContain(readerAllowlistStatus);
  await page.evaluate(async () => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const response = await fetch("/api/auth/dev/bypass", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        email: "archived-reader@medice.test",
        name: "Voluntario lector",
      }),
    });
    if (!response.ok)
      throw new Error(`unassigned volunteer sign in failed: ${response.status}`);
  });
  await page.reload();
  const readerIdentity = await page.evaluate(async () => {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    }).then((result) => result.json());
    return { role: response.data.role, userId: response.data.user.id };
  });
  expect(readerIdentity.role).toBe("volunteer");
  await page.getByRole("button", { name: "Pacientes" }).first().click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();
  await page.getByRole("button", { name: "Registrar Seguimiento" }).click();
  await page.context().setOffline(true);
  await page
    .getByPlaceholder(/Describa el estado de ánimo, fatiga/)
    .fill("Este seguimiento no debe entrar en la cola local.");
  await page
    .getByPlaceholder(/Describa detalladamente las acciones tomadas/)
    .fill("La ficha no está asignada ni cacheada.");
  await page.getByRole("button", { name: "Guardar Seguimiento" }).click();
  await expect(
    page.getByText(
      /Error al guardar: Para guardar sin conexión, primero abrí la ficha de un paciente que tengas asignado\./,
    ),
  ).toBeVisible();
  const unassignedOfflineQueue = await page.evaluate(async (userId) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("palia-offline-v1", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const items = await new Promise((resolve, reject) => {
      const transaction = database.transaction("outbox", "readonly");
      const request = transaction
        .objectStore("outbox")
        .index("userId")
        .getAll(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return items.length;
  }, readerIdentity.userId);
  expect(unassignedOfflineQueue).toBe(0);
  await page.context().setOffline(false);
  await page.evaluate(async () => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    await fetch("/api/auth/dev/bypass", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({ email: "admin@medice.test", name: "Admin de prueba" }),
    });
  });
  await page.reload();
  await page.evaluate(async () => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    await fetch("/api/auth/dev/bypass", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        email: "admin@medice.test",
        name: "Admin de prueba",
      }),
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "Pacientes" }).first().click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();
  await expect(page.getByText("Detalle clínico confidencial")).toBeVisible();
  await capture(page, "21-alert-active.png");
  page.once("dialog", (dialog) => dialog.accept("Resolución de prueba"));
  const resolveResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/alerts/${alertNotice.alertId}/resolve`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Resolver alerta" }).click();
  expect((await resolveResponsePromise).status()).toBe(200);
  await expect(page.getByText("Resuelta — Resolución de prueba")).toBeVisible();
  await capture(page, "22-alert-resolved.png");
  await page.getByRole("button", { name: "Activar Alerta" }).click();
  const alertDialog = page.getByRole("dialog", {
    name: "Activar Alerta Clínica",
  });
  await alertDialog
    .getByLabel("Motivo de la Alerta")
    .selectOption("Dolor No Controlado");
  await alertDialog
    .getByLabel("Observaciones Clínicas")
    .fill("Alerta registrada desde el formulario.");
  await capture(page, "25-alert-form.png");
  const createAlertResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/patients/${patientId}/alerts`) &&
      response.request().method() === "POST",
  );
  await alertDialog.getByRole("button", { name: "Activar Alerta" }).click();
  expect((await createAlertResponsePromise).status()).toBe(201);
  await expect(
    page.getByText("Alerta registrada desde el formulario."),
  ).toBeVisible();
  await capture(page, "26-alert-created-from-form.png");
  page.once("dialog", (dialog) => dialog.accept("Cierre de prueba"));
  const secondResolvePromise = page.waitForResponse(
    (response) =>
      /\/api\/alerts\/.+\/resolve/.test(response.url()) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Resolver alerta" }).click();
  expect((await secondResolvePromise).status()).toBe(200);
  await expect(page.getByText("Resuelta — Cierre de prueba")).toBeVisible();
  await capture(page, "27-alert-form-resolved.png");

  await page.setViewportSize({ width: 1440, height: 1900 });
  await page.getByRole("button", { name: "Imprimir Historial" }).click();
  const alertReport = page.locator("#print-preview-modal-root");
  await expect(alertReport).toContainText("4. Historial de alertas clínicas");
  await expect(alertReport).toContainText("Detalle clínico confidencial");
  await expect(alertReport).toContainText("Nota: Resolución de prueba");
  await expect(alertReport).toContainText("Nota: Cierre de prueba");
  await expect(alertReport).toContainText("Admin de prueba");
  await capture(page, "32-print-alert-history.png");
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Imprimir / Guardar PDF" }),
  ).toBeHidden();
  await expect(page.getByRole("button", { name: "Editar ficha" })).toBeHidden();
  await page.locator("#print-preview-modal-root").screenshot({
    path: path.join(screenshots, "33-print-document-with-alerts.png"),
  });
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1000 });

  const archiveResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/patients/${patientId}/archive`) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Archivar paciente" }).click();
  expect((await archiveResponsePromise).status()).toBe(200);
  await page
    .getByRole("button", { name: /Pacientes/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Archivados" }).click();
  await expect(
    page.getByRole("button", { name: "Archivados" }),
  ).toHaveAttribute("aria-pressed", "true");
  const archivedPatient = await page.evaluate(
    async (id) =>
      (await fetch(`/api/patients/${id}`, { credentials: "include" })).json(),
    patientId,
  );
  expect(archivedPatient.data.archived_at).toBeTruthy();
  await expect(
    page.getByText("Paciente de prueba API", { exact: true }),
  ).toBeVisible();
  await capture(page, "12-archived-patient.png");
  const restoreStatus = await page.evaluate(async (id) => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    return (
      await fetch(`/api/patients/${id}/restore`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": csrf },
      })
    ).status;
  }, patientId);
  expect(restoreStatus).toBe(403);
  const archivedRoleAccess = await page.evaluate(async (id) => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const signIn = (email, name) =>
      fetch("/api/auth/dev/bypass", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify({ email, name }),
      });
    const adminLogin = await signIn("admin@medice.test", "Admin de prueba");
    if (!adminLogin.ok)
      throw new Error(`admin sign in failed: ${adminLogin.status}`);
    const adminRead = await fetch(`/api/patients/${id}`, {
      credentials: "include",
    }).then((response) => response.json());
    const adminRestore = await fetch(`/api/patients/${id}/restore`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": csrf },
    });
    const allowReader = await fetch("/api/coordinator/allowed-users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        email: "archived-reader@medice.test",
      }),
    });
    if (![201, 409].includes(allowReader.status))
      throw new Error(`reader allow-list failed: ${allowReader.status}`);
    const readerLogin = await signIn(
      "archived-reader@medice.test",
      "Voluntario lector",
    );
    if (!readerLogin.ok)
      throw new Error(`reader sign in failed: ${readerLogin.status}`);
    const volunteerRead = await fetch(`/api/patients/${id}`, {
      credentials: "include",
    }).then((response) => response.json());
    const volunteerRestore = await fetch(`/api/patients/${id}/restore`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": csrf },
    });
    const coordinatorLogin = await signIn(
      "volunteer@medice.test",
      "Coordinadora de prueba",
    );
    if (!coordinatorLogin.ok)
      throw new Error(`coordinator sign in failed: ${coordinatorLogin.status}`);
    const coordinatorRead = await fetch(`/api/patients/${id}`, {
      credentials: "include",
    }).then((response) => response.json());
    const coordinatorRestore = await fetch(`/api/patients/${id}/restore`, {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRF-Token": csrf },
    });
    const returnToAdmin = await signIn("admin@medice.test", "Admin de prueba");
    if (!returnToAdmin.ok)
      throw new Error(`admin reentry failed: ${returnToAdmin.status}`);
    return {
      adminRead: adminRead.data.archived_at,
      volunteerRead: volunteerRead.data.archived_at,
      coordinatorRead: coordinatorRead.data.archived_at,
      volunteerRestoreStatus: volunteerRestore.status,
      adminRestoreStatus: adminRestore.status,
      coordinatorRestoreStatus: coordinatorRestore.status,
    };
  }, patientId);
  expect(archivedRoleAccess.adminRead).toBeTruthy();
  expect(archivedRoleAccess.volunteerRead).toBeTruthy();
  expect(archivedRoleAccess.coordinatorRead).toBeTruthy();
  expect(archivedRoleAccess.volunteerRestoreStatus).toBe(403);
  expect(archivedRoleAccess.adminRestoreStatus).toBe(403);
  expect(archivedRoleAccess.coordinatorRestoreStatus).toBe(200);

  await page
    .getByRole("button", { name: /Administración/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Invitaciones y Accesos" }).click();
  await expect(
    page.getByText("volunteer@medice.test", { exact: true }),
  ).toBeVisible();
  const bootstrapAdminRow = page
    .getByRole("row")
    .filter({ hasText: "matiasbaiges@gmail.com" });
  await expect(
    bootstrapAdminRow.getByText("Administrador", { exact: true }),
  ).toBeVisible();
  await capture(page, "19-admin-allowlist.png");
  await page
    .getByRole("button", { name: "Quitar acceso a volunteer@medice.test" })
    .click();
  await expect(
    page.getByText("volunteer@medice.test", { exact: true }),
  ).toHaveCount(0);
  await capture(page, "20-admin-allowlist-revoked.png");
  const volunteerContext = await browser.newContext();
  const revokedCsrfCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "medice_csrf",
  );
  await volunteerContext.addCookies([volunteerCookie, revokedCsrfCookie]);
  const revokedResponse = await volunteerContext.request.get(
    new URL("/api/auth/me", frontendOrigin).toString(),
  );
  expect(revokedResponse.status()).toBe(401);
  const revokedWriteResponse = await volunteerContext.request.post(
    new URL(`/api/patients/${patientId}/follow-ups`, frontendOrigin).toString(),
    {
      headers: {
        Origin: frontendOrigin,
        "X-CSRF-Token": revokedCsrfCookie.value,
      },
      data: {
        clientMutationId: `revoked-${crypto.randomUUID()}`,
        occurredAt: new Date().toISOString(),
        contactType: "in_person",
        durationMinutes: 15,
        symptoms: {},
        symptomObservations: "",
        socialRisk: {},
        equipmentNeeds: [],
        equipmentOther: "",
        interventions: "",
      },
    },
  );
  expect(revokedWriteResponse.status()).toBe(401);
  const revokedPage = await volunteerContext.newPage();
  await revokedPage.goto("/");
  await expect(
    revokedPage.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  const retainedAfterRevocation = await revokedPage.evaluate(async (ownerId) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("palia-offline-v1", 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("patients"))
          db.createObjectStore("patients", { keyPath: ["userId", "id"] });
        if (!db.objectStoreNames.contains("profiles"))
          db.createObjectStore("profiles", { keyPath: "id" });
        if (!db.objectStoreNames.contains("outbox")) {
          const store = db.createObjectStore("outbox", {
            keyPath: ["userId", "id"],
          });
          store.createIndex("userId", "userId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const queuedId = `revoked-pending-${crypto.randomUUID()}`;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        ["profiles", "outbox"],
        "readwrite",
      );
      transaction.objectStore("profiles").put({
        id: ownerId,
        name: "Voluntario revocado",
        role: "volunteer",
        savedAt: Date.now(),
      });
      transaction.objectStore("outbox").put({
        id: queuedId,
        userId: ownerId,
        patientId: "revoked-patient",
        payload: { clientMutationId: queuedId },
        status: "pending",
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastError: null,
      });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
    return queuedId;
  }, alertNotice.volunteerId);
  await revokedPage.reload();
  await expect(
    revokedPage.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  const retainedQueue = await revokedPage.evaluate(async (ownerId) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("palia-offline-v1", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const queued = await new Promise((resolve, reject) => {
      const transaction = database.transaction("outbox", "readonly");
      const request = transaction
        .objectStore("outbox")
        .index("userId")
        .getAll(ownerId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return queued.map((item) => ({ id: item.id, status: item.status }));
  }, alertNotice.volunteerId);
  expect(retainedQueue).toEqual([
    { id: retainedAfterRevocation, status: "pending" },
  ]);
  await revokedPage.close();
  await volunteerContext.close();

  await context.grantPermissions(["notifications"]);
  await page.getByRole("button", { name: "Configuración" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuración de Palia" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Habilitar push" }).click();
  await expect(page.getByText("Estado actual: granted")).toBeVisible();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "notificaciones push no están configuradas" }),
  ).toBeVisible();
  await capture(page, "13-push-unconfigured.png");

  await page.getByRole("button", { name: "Preferencias de Usuario" }).click();
  await expect(
    page.getByRole("heading", { name: "Mi perfil de voluntariado" }),
  ).toBeVisible();
  await page.getByLabel("Teléfono").fill("+54 11 5555 1212");
  await page
    .getByLabel("Especialidad y disponibilidad")
    .fill("Acompañamiento comunitario · tardes");
  await page.getByLabel("Trayectoria").fill("Dos años de voluntariado");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Perfil guardado." }),
  ).toBeVisible();
  await expect(page.getByLabel("Especialidad y disponibilidad")).toHaveValue(
    "Acompañamiento comunitario · tardes",
  );
  await expect(
    page.getByText(/Pacientes asignados: 1 · Rol: admin/i),
  ).toBeVisible();
  await capture(page, "28-volunteer-profile.png");
  const profileGuards = await page.evaluate(async () => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const patchProfile = (body) =>
      fetch("/api/users/me/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
        body: JSON.stringify(body),
      });
    const partialUpdate = await patchProfile({ phone: "+54 11 5555 1212" });
    const protectedField = await patchProfile({ role: "coordinator" });
    const wrongType = await patchProfile({ phone: { value: "not a string" } });
    const tooLong = await patchProfile({ tenure: "x".repeat(241) });
    const unsafeImage = await patchProfile({
      avatarUrl: "javascript:alert(1)",
    });
    const auth = await fetch("/api/auth/me", { credentials: "include" }).then(
      (response) => response.json(),
    );
    const profile = await fetch("/api/users/me/profile", {
      credentials: "include",
    }).then((response) => response.json());
    const bootstrap = await fetch("/api/bootstrap", {
      credentials: "include",
    }).then((response) => response.json());
    return {
      statuses: [
        protectedField.status,
        wrongType.status,
        tooLong.status,
        unsafeImage.status,
      ],
      partialStatus: partialUpdate.status,
      role: auth.data.role,
      profile: profile.data,
      bootstrapProfile: bootstrap.data.profile,
    };
  });
  expect(profileGuards.statuses).toEqual([422, 422, 422, 422]);
  expect(profileGuards.partialStatus).toBe(200);
  expect(profileGuards.role).toBe("admin");
  expect(profileGuards.profile, JSON.stringify(profileGuards)).toMatchObject({
    phone: "+54 11 5555 1212",
    specialty_availability: "Acompañamiento comunitario · tardes",
    tenure: "Dos años de voluntariado",
  });
  expect(
    profileGuards.bootstrapProfile,
    JSON.stringify(profileGuards),
  ).toMatchObject({
    phone: "+54 11 5555 1212",
    specialty_availability: "Acompañamiento comunitario · tardes",
    tenure: "Dos años de voluntariado",
  });
  await capture(page, "29-profile-validation.png");
  const isolationSeed = await page.evaluate(
    async ({ otherUserId, patientId }) => {
      const auth = await fetch("/api/auth/me", { credentials: "include" }).then(
        (response) => response.json(),
      );
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open("palia-offline-v1", 2);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const sharedId = `offline-isolation-${crypto.randomUUID()}`;
      const item = {
        id: sharedId,
        userId: auth.data.user.id,
        patientId: "offline-isolation-patient",
        payload: {
          clientMutationId: crypto.randomUUID(),
          occurredAt: new Date().toISOString(),
          contactType: "in_person",
          durationMinutes: 120,
        },
        status: "pending",
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastError: null,
      };
      const reentryId = `offline-reentry-${crypto.randomUUID()}`;
      const occurredAt = new Date().toISOString();
      const reentryItem = {
        id: reentryId,
        userId: auth.data.user.id,
        patientId,
        payload: {
          clientMutationId: reentryId,
          occurredAt,
          contactType: "in_person",
          durationMinutes: 15,
          symptoms: {},
          symptomObservations: "",
          socialRisk: {},
          equipmentNeeds: [],
          equipmentOther: "",
          interventions: "",
        },
        status: "pending",
        attempts: 0,
        createdAt: new Date().toISOString(),
        lastError: null,
      };
      await new Promise((resolve, reject) => {
        const transaction = database.transaction("outbox", "readwrite");
        const outbox = transaction.objectStore("outbox");
        outbox.put(item);
        outbox.put({ ...item, userId: otherUserId });
        outbox.put(reentryItem);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      return {
        userId: auth.data.user.id,
        id: sharedId,
        reentryId,
        occurredAt,
      };
    },
    { otherUserId: alertNotice.volunteerId, patientId },
  );
  await page.getByRole("button", { name: "Cerrar Sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  expect(
    (await context.cookies()).some((cookie) => cookie.name === "medice_csrf"),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Acceso de prueba voluntario" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Configuración de Palia" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Configuración" }).click();
  await page.getByRole("button", { name: "Centro de Sincronización" }).click();
  await expect(page.getByText("Cola local (1)")).toBeVisible();
  const isolationState = await page.evaluate(async (previousUserId) => {
    const auth = await fetch("/api/auth/me", { credentials: "include" }).then(
      (response) => response.json(),
    );
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open("palia-offline-v1", 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = (storeName, operation) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, "readonly");
        const request = operation(transaction.objectStore(storeName));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const previousQueue = await read("outbox", (store) =>
      store.index("userId").getAll(previousUserId),
    );
    const activeQueue = await read("outbox", (store) =>
      store.index("userId").getAll(auth.data.user.id),
    );
    const previousIdentity = await read("profiles", (store) =>
      store.get(previousUserId),
    );
    const previousPatients = await read("patients", (store) =>
      store.getAll(
        IDBKeyRange.bound([previousUserId, ""], [previousUserId, "\uffff"]),
      ),
    );
    database.close();
    return {
      previousQueue: previousQueue.length,
      activeQueue: activeQueue.length,
      previousQueueIds: previousQueue.map((item) => item.id).sort(),
      activeQueueId: activeQueue[0]?.id,
      previousIdentity: Boolean(previousIdentity),
      previousPatients: previousPatients.length,
    };
  }, isolationSeed.userId);
  expect(isolationState).toEqual({
    previousQueue: 2,
    activeQueue: 1,
    previousQueueIds: [isolationSeed.id, isolationSeed.reentryId].sort(),
    activeQueueId: isolationSeed.id,
    previousIdentity: false,
    previousPatients: 0,
  });
  await capture(page, "38-offline-account-isolation.png");
  await page.getByRole("button", { name: "Cerrar Sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Acceso de prueba admin" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuración de Palia" }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(async (ownerId) => {
        const database = await new Promise((resolve, reject) => {
          const request = indexedDB.open("palia-offline-v1");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const queued = await new Promise((resolve, reject) => {
          const transaction = database.transaction("outbox", "readonly");
          const request = transaction
            .objectStore("outbox")
            .index("userId")
            .getAll(ownerId);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        database.close();
        return queued.map((item) => item.id);
      }, isolationSeed.userId),
    )
    .not.toContain(isolationSeed.reentryId);
  const reentryFollowUps = await page.evaluate(
    async (id) =>
      (
        await fetch(`/api/patients/${id}/follow-ups`, {
          credentials: "include",
        }).then((response) => response.json())
      ).data,
    patientId,
  );
  expect(
    reentryFollowUps.some(
      (followUp) => followUp.occurred_at === isolationSeed.occurredAt,
    ),
  ).toBe(true);

  const googleAuthResults = await page.evaluate(async () => {
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const codeFor = (claims) =>
      `test-google:${btoa(JSON.stringify(claims)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;
    const authenticate = (claims) =>
      fetch("/api/auth/google", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
          "X-Requested-With": "XmlHttpRequest",
        },
        body: JSON.stringify({ authCode: codeFor(claims) }),
      });
    const allowed = await authenticate({
      email: "MatiasBaiges@gmail.com",
      name: "Matias Test",
      sub: "google-test-matias",
    });
    const allowedBody = await allowed.json();
    const current = await fetch("/api/auth/me", {
      credentials: "include",
    }).then((response) => response.json());
    const denied = await authenticate({
      email: "unknown@medice.test",
      name: "Unknown",
      sub: "google-test-unknown",
    });
    const audit = await fetch("/api/admin/audit-events?limit=500", {
      credentials: "include",
    }).then((response) => response.json());
    return {
      allowedStatus: allowed.status,
      role: current.data.role,
      normalizedEmail: current.data.user.email,
      deniedStatus: denied.status,
      auditEvents: audit.events,
    };
  });
  expect(googleAuthResults).toMatchObject({
    allowedStatus: 200,
    role: "admin",
    normalizedEmail: "matiasbaiges@gmail.com",
    deniedStatus: 403,
  });
  const auditJson = JSON.stringify(googleAuthResults.auditEvents);
  expect(googleAuthResults.auditEvents).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ action: "patient.updated", entity_type: "patient" }),
      expect.objectContaining({ action: "patient.created", entity_type: "patient" }),
      expect.objectContaining({ action: "follow_up.created", entity_type: "follow_up" }),
      expect.objectContaining({ action: "alert.created", entity_type: "alert" }),
      expect.objectContaining({ action: "alert.resolved", entity_type: "alert" }),
      expect.objectContaining({ action: "user.role_updated", entity_type: "user" }),
      expect.objectContaining({ action: "access.allowlist_added", entity_type: "allowlist" }),
    ]),
  );
  expect(auditJson).not.toContain("Diagnóstico de prueba");
  expect(auditJson).not.toContain("Detalle clínico confidencial");
  expect(auditJson).not.toContain("10.234.567");

  await page.goto("/");
  await page.locator(".user-profile-menu").click();
  await page
    .locator(".profile-popover")
    .getByRole("button", { name: /Cerrar Sesión/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?alertId=${encodeURIComponent(alertNotice.alertId)}`);
  await expect(
    page.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Acceso de prueba admin" }).click();
  await expect(
    page.getByRole("heading", { name: "Paciente de prueba API" }),
  ).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  const mobileActionWidths = await page
    .locator(".patient-detail-actions > .btn")
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width));
  expect(mobileActionWidths.length).toBeGreaterThanOrEqual(4);
  expect(Math.min(...mobileActionWidths)).toBeGreaterThanOrEqual(320);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "53-mobile-push-alert-destination.png");
});
