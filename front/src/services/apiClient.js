const configuredBase = (import.meta.env?.VITE_API_BASE_URL || "").replace(
  /\/$/,
  "",
);
const API_BASE = !configuredBase
  ? "/api"
  : configuredBase === "/api" || configuredBase.endsWith("/api")
    ? configuredBase
    : `${configuredBase}/api`;

export class ApiError extends Error {
  constructor(status, payload) {
    super(
      payload?.message || payload?.error || `API request failed (${status})`,
    );
    this.name = "ApiError";
    this.status = status;
    this.code = payload?.errorCode || payload?.error_code;
    this.payload = payload;
  }
}

function camelKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize);
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        camelKey(key),
        camelize(item),
      ]),
    );
  }
  return value;
}

let csrfTokenPromise;

async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_BASE}/auth/csrf`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new ApiError(response.status, body);
        return body.token;
      })
      .catch((error) => {
        csrfTokenPromise = undefined;
        throw error;
      });
  }
  return csrfTokenPromise;
}

export function resetCsrfToken() {
  csrfTokenPromise = undefined;
}

export async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body !== undefined && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method))
    headers.set("X-CSRF-Token", await getCsrfToken());
  const response = await fetch(
    `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...options,
      method,
      headers,
      credentials: "include",
      body:
        options.body === undefined || typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith("/auth/"))
    window.dispatchEvent(new CustomEvent("medice:unauthorized"));
  if (!response.ok) throw new ApiError(response.status, camelize(payload));
  return camelize(payload);
}

export const api = {
  auth: {
    me: () => request("/auth/me"),
    google: (authCode) =>
      request("/auth/google", {
        method: "POST",
        headers: { "X-Requested-With": "XmlHttpRequest" },
        body: { authCode },
      }),
    devBypass: (email, name) =>
      request("/auth/dev/bypass", { method: "POST", body: { email, name } }),
    signOut: () =>
      request("/auth/signout", { method: "POST" }).finally(resetCsrfToken),
  },
  bootstrap: () => request("/bootstrap"),
  patients: {
    list: (params = {}) => request(`/patients?${new URLSearchParams(params)}`),
    get: (id) => request(`/patients/${encodeURIComponent(id)}`),
    create: (body) => request("/patients", { method: "POST", body }),
    update: (id, body) =>
      request(`/patients/${encodeURIComponent(id)}`, { method: "PATCH", body }),
    archive: (id) =>
      request(`/patients/${encodeURIComponent(id)}/archive`, {
        method: "POST",
        body: {},
      }),
    restore: (id) =>
      request(`/patients/${encodeURIComponent(id)}/restore`, {
        method: "POST",
        body: {},
      }),
    assign: (id, volunteerIds) =>
      request(`/patients/${encodeURIComponent(id)}/assignments`, {
        method: "PUT",
        body: { volunteerIds },
      }),
    followUps: (id) =>
      request(`/patients/${encodeURIComponent(id)}/follow-ups`),
    createFollowUp: (id, body) =>
      request(`/patients/${encodeURIComponent(id)}/follow-ups`, {
        method: "POST",
        body,
      }),
    createAlert: (id, body) =>
      request(`/patients/${encodeURIComponent(id)}/alerts`, {
        method: "POST",
        body,
      }),
  },
  alerts: {
    list: (params = {}) => request(`/alerts?${new URLSearchParams(params)}`),
    resolve: (id, note) =>
      request(`/alerts/${encodeURIComponent(id)}/resolve`, {
        method: "POST",
        body: { note },
      }),
  },
  hospitals: {
    list: (includeArchived = false) =>
      request(`/hospitals?includeArchived=${includeArchived}`),
    create: (body) => request("/hospitals", { method: "POST", body }),
    update: (id, body) =>
      request(`/hospitals/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body,
      }),
    archive: (id) =>
      request(`/hospitals/${encodeURIComponent(id)}/archive`, {
        method: "POST",
        body: {},
      }),
    restore: (id) =>
      request(`/hospitals/${encodeURIComponent(id)}/restore`, {
        method: "POST",
        body: {},
      }),
  },
  volunteers: {
    list: (q = "") =>
      request(`/volunteers${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    updateProfile: (body) =>
      request("/users/me/profile", { method: "PATCH", body }),
  },
  access: {
    list: () => request("/coordinator/allowed-users"),
    addVolunteer: (email) =>
      request("/coordinator/allowed-users", {
        method: "POST",
        body: { email },
      }),
    remove: (email) =>
      request(`/admin/settings/allowed_users/${encodeURIComponent(email)}`, {
        method: "DELETE",
      }),
  },
  stats: {
    mine: (params = {}) => request(`/stats/me?${new URLSearchParams(params)}`),
    global: (params = {}) =>
      request(`/stats/global?${new URLSearchParams(params)}`),
  },
  push: {
    vapidPublicKey: () => request("/push/vapid-public"),
    subscribe: (subscription) =>
      request("/push/subscribe", { method: "POST", body: { subscription } }),
    unsubscribe: (endpoint) =>
      request("/push/subscribe", { method: "DELETE", body: { endpoint } }),
  },
};
