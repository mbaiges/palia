import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

async function loadServiceWorker() {
  const source = await readFile(
    new URL("../../public/sw.js", import.meta.url),
    "utf8",
  );
  const listeners = new Map();
  const notifications = [];
  const openedWindows = [];
  const scope = {
    addEventListener: (name, listener) => listeners.set(name, listener),
    registration: {
      showNotification: async (...args) => notifications.push(args),
    },
  };
  runInNewContext(source, {
    self: scope,
    clients: { openWindow: async (url) => openedWindows.push(url) },
    URL,
  });
  return { listeners, notifications, openedWindows };
}

test("service worker leaves API requests network-only", async () => {
  const { listeners } = await loadServiceWorker();
  let intercepted = false;
  listeners.get("fetch")({
    request: { url: "https://palia.example/api/bootstrap", mode: "cors" },
    respondWith: () => {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false);
});

test("push content stays generic even when payload contains clinical text", async () => {
  const { listeners, notifications } = await loadServiceWorker();
  let waited;
  listeners.get("push")({
    data: {
      json: () => ({
        title: "Paciente: nombre confidencial",
        body: "Diagnóstico clínico confidencial",
        data: {
          alertId: "alert-123",
          notificationId: "notification-123",
          patientName: "Nombre confidencial",
        },
      }),
    },
    waitUntil: (promise) => {
      waited = promise;
    },
  });
  await waited;
  assert.equal(notifications[0][0], "Palia");
  assert.equal(
    notifications[0][1].body,
    "Hay una actualización. Inicia sesión para consultar la información.",
  );
  assert.deepEqual(JSON.parse(JSON.stringify(notifications[0][1].data)), {
    notificationId: "notification-123",
    alertId: "alert-123",
  });
  assert.equal(
    JSON.stringify(notifications[0]).includes("confidencial"),
    false,
  );
});

test("notification click opens the app with the alert id only", async () => {
  const { listeners, openedWindows } = await loadServiceWorker();
  let waited;
  listeners.get("notificationclick")({
    notification: {
      data: { alertId: "alert-123", patientName: "private" },
      close() {},
    },
    waitUntil: (promise) => {
      waited = promise;
    },
  });
  await waited;
  assert.deepEqual(openedWindows, ["/?alertId=alert-123"]);
});
