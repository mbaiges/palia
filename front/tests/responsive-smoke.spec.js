import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const artifacts = path.resolve(
  process.cwd(),
  "../e2e/artifacts/screenshots/api-front-separation",
);
const capture = async (page, name) => {
  fs.mkdirSync(artifacts, { recursive: true });
  await page.screenshot({ path: path.join(artifacts, name), fullPage: true });
};

async function signInAsAdmin(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await page.getByRole("button", { name: "Acceso de prueba admin" }).click();
  await expect(
    page.getByRole("heading", {
      name: /Buenos días|Buenas tardes|Buenas noches/i,
    }),
  ).toBeVisible();
  const seededPatient = await page.evaluate(async () => {
    const patients = await fetch("/api/patients", {
      credentials: "include",
    }).then((response) => response.json());
    if (
      patients.data.some((patient) => patient.name === "Paciente de prueba API")
    )
      return false;
    const csrf = decodeURIComponent(
      document.cookie
        .split("; ")
        .find((item) => item.startsWith("medice_csrf="))
        ?.split("=")[1] ?? "",
    );
    const response = await fetch("/api/patients", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
      body: JSON.stringify({
        name: "Paciente de prueba API",
        dni: "9988776655",
        dob: "1950-01-02",
        address: "Calle de prueba 123, Quilmes",
        diagnosis: "Diagnóstico de prueba",
        hospitalId: null,
        complexSituation: false,
        caregiver: {
          name: "Cuidadora de prueba",
          relation: "Familiar/Otro",
          phone: "+54 11 4444 5555",
          livesWithPatient: false,
          burdenLevel: "Bajo",
        },
      }),
    });
    if (response.status !== 201)
      throw new Error(`responsive patient seed failed: ${response.status}`);
    return true;
  });
  if (seededPatient) {
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: /Buenos días|Buenas tardes|Buenas noches/i,
      }),
    ).toBeVisible();
  }
}

test("mobile directory and offline settings fit compact phone viewport", async ({
  page,
}) => {
  await signInAsAdmin(page, 390, 844);
  await page
    .getByRole("button", { name: /Directorio|Pacientes/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Directorio de Pacientes" }),
  ).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeVisible();
  const patientSearch = page.getByPlaceholder("Buscar por nombre o DNI...");
  await patientSearch.fill("Paciente de prueba API");
  await expect(
    page.getByText("Paciente de prueba API", { exact: true }),
  ).toBeVisible();
  await patientSearch.fill("999999999999");
  await expect(
    page.getByText("Paciente de prueba API", { exact: true }),
  ).toHaveCount(0);
  await patientSearch.clear();
  await page.getByRole("button", { name: "Estables" }).click();
  await expect(
    page.getByText("Paciente de prueba API", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Todos" }).click();
  await page.getByText("Paciente de prueba API", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Paciente de prueba API" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "39-mobile-patient-detail.png");
  await page.getByRole("button", { name: "Registrar Seguimiento" }).click();
  await expect(
    page.getByRole("heading", { name: "Registro Clínico de Seguimiento" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "40-mobile-follow-up-form.png");
  await page.getByRole("button", { name: "Cancelar y Salir" }).click();
  await page.getByRole("button", { name: "Activar Alerta" }).click();
  const mobileAlertDialog = page.getByRole("dialog", {
    name: "Activar Alerta Clínica",
  });
  await expect(mobileAlertDialog).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "45-mobile-alert-modal.png");
  await mobileAlertDialog.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Imprimir Historial" }).click();
  await expect(page.getByText("Vista Previa de Impresión")).toBeVisible();
  expect(
    await page.evaluate(() => {
      const toolbar = document.querySelector(".print-preview-toolbar-actions");
      const close = toolbar?.querySelector("button:first-child")?.getBoundingClientRect();
      const print = toolbar?.querySelector("button:last-child")?.getBoundingClientRect();
      const report = document.querySelector("#print-preview-modal-root");
      return Boolean(
        close && print && close.right <= print.left + 1 && report &&
        report.scrollWidth <= report.clientWidth + 1 &&
        getComputedStyle(document.querySelector(".print-preview-data-grid")).gridTemplateColumns.split(" ").length === 1,
      );
    }),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "46-mobile-print-preview.png");
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.getByRole("button", { name: "Volver al listado" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "14-mobile-directory.png");

  await page.locator(".user-profile-menu").click();
  await page.getByRole("button", { name: "Configuración" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuración de Palia" }),
  ).toBeVisible();
  const settingsDescription = page.getByText(
    "Gestione las preferencias de la aplicación, la sincronización offline y accesos.",
  );
  await expect(settingsDescription).toBeVisible();
  expect(
    await settingsDescription.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Centro de Sincronización" }).click();
  await expect(page.getByText("Estado de red:")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "15-mobile-offline-settings.png");

  await page.getByRole("button", { name: "Stats" }).click();
  await expect(
    page.getByRole("heading", { name: "Estadísticas e impacto" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "35-mobile-stats.png");
  await page.locator("#monthly-activity-chart").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", { name: "Actividad mensual" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Actividad semanal" }),
  ).toBeVisible();
  await capture(page, "36-mobile-stats-charts.png");
  await page.locator(".bar-chart--weekly").scrollIntoViewIfNeeded();
  await capture(page, "37-mobile-weekly-chart.png");
});

test("narrow phone login and shell render without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 344, height: 882 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Portal de Acompañamiento" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "16-narrow-mobile-login.png");
  await page.getByRole("button", { name: "Acceso de prueba admin" }).click();
  await expect(page.locator(".mobile-nav")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "17-narrow-mobile-shell.png");
});

test("mobile volunteer community and administration remain usable", async ({
  page,
}) => {
  await signInAsAdmin(page, 390, 844);
  await page.getByRole("button", { name: "Notificaciones" }).click();
  const notificationPopover = page.locator(".notification-popover").first();
  await expect(notificationPopover).toBeVisible();
  await expect(notificationPopover).toHaveCSS("opacity", "1");
  const notificationBox = await notificationPopover.boundingBox();
  expect(notificationBox.x).toBeGreaterThanOrEqual(0);
  expect(notificationBox.x + notificationBox.width).toBeLessThanOrEqual(390);
  await capture(page, "54-mobile-notification-popover.png");
  await page.getByRole("button", { name: "Notificaciones" }).click();
  await page.locator(".user-profile-menu").click();
  const profilePopover = page.locator(".profile-popover");
  await expect(profilePopover).toBeVisible();
  await expect(profilePopover).toHaveCSS("opacity", "1");
  const profilePopoverBox = await profilePopover.boundingBox();
  expect(profilePopoverBox.x).toBeGreaterThanOrEqual(0);
  expect(profilePopoverBox.x + profilePopoverBox.width).toBeLessThanOrEqual(390);
  await capture(page, "55-mobile-profile-popover.png");
  await page.locator(".user-profile-menu").click();
  await page.getByRole("button", { name: "Voluntariado" }).click();
  await expect(
    page.getByRole("heading", { name: "Comunidad de Voluntarios" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  const volunteerSearch = page.getByPlaceholder("Buscar voluntario...");
  await volunteerSearch.fill("Admin de prueba");
  await expect(page.getByText("Admin de prueba", { exact: true })).toBeVisible();
  await volunteerSearch.fill("voluntario que no existe");
  await expect(page.getByText("No se encontraron voluntarios.")).toBeVisible();
  await volunteerSearch.clear();
  await capture(page, "47-mobile-volunteer-community.png");

  await page.locator(".mobile-nav-item").filter({ hasText: "Admin" }).click();
  await expect(
    page.getByRole("heading", { name: "Panel de Administración" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "48-mobile-administration-assignments.png");
  const hospitalHeading = page.getByRole("heading", {
    name: "Centros de Salud de Derivación",
  });
  await hospitalHeading.scrollIntoViewIfNeeded();
  const addHospital = page.getByRole("button", { name: "Agregar Hospital" });
  await addHospital.scrollIntoViewIfNeeded();
  await expect(addHospital).toBeVisible();
  const addHospitalBox = await addHospital.boundingBox();
  const adminMobileNavBox = await page.locator(".mobile-nav").boundingBox();
  expect(addHospitalBox.y + addHospitalBox.height).toBeLessThanOrEqual(
    adminMobileNavBox.y + 1,
  );
  await capture(page, "52-mobile-administration-hospitals.png");
  const accessTab = page.getByRole("button", { name: "Invitaciones y Accesos" });
  await accessTab.click();
  await expect(accessTab).toHaveClass(/btn-primary/);
  const assignmentTab = page.getByRole("button", {
    name: "Asignación y Centros",
  });
  await expect(assignmentTab).toHaveClass(/btn-tertiary/);
  const themeColor = (token) =>
    page.evaluate((name) => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = `var(${name})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    }, token);
  const expectedPrimaryBackground = await themeColor("--color-primary");
  const expectedSurfaceBackground = await themeColor(
    "--color-surface-container",
  );
  await expect
    .poll(() =>
      accessTab.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .toBe(expectedPrimaryBackground);
  await expect
    .poll(() =>
      assignmentTab.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    )
    .toBe(expectedSurfaceBackground);
  const [activeTabBackground, inactiveTabBackground] = await Promise.all([
    accessTab.evaluate((element) => getComputedStyle(element).backgroundColor),
    assignmentTab.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ]);
  expect(activeTabBackground).not.toBe(inactiveTabBackground);
  await expect(
    page.getByRole("heading", { name: "Autorizar voluntario" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "49-mobile-administration-access.png");
  await page.locator(".mobile-nav-item").filter({ hasText: "Perfil" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuración de Palia" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await capture(page, "50-mobile-volunteer-profile.png");
  const saveProfile = page.getByRole("button", { name: "Guardar perfil" });
  await expect(saveProfile).toBeVisible();
  await saveProfile.scrollIntoViewIfNeeded();
  const saveProfileBox = await saveProfile.boundingBox();
  const mobileNavBox = await page.locator(".mobile-nav").boundingBox();
  expect(saveProfileBox.y + saveProfileBox.height).toBeLessThanOrEqual(
    mobileNavBox.y + 1,
  );
  await capture(page, "51-mobile-profile-save.png");
});
