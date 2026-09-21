import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ApiError, request, resetCsrfToken } from "./apiClient.js";

const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  resetCsrfToken();
});

describe("apiClient", () => {
  it("sends same-origin credentials and JSON on API requests", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return Response.json({ patient_id: "p1" });
    };

    const result = await request("/patients");

    assert.equal(calls[0].url, "/api/patients");
    assert.equal(calls[0].options.credentials, "include");
    assert.equal(calls[0].options.method, "GET");
    assert.equal(calls[0].options.headers.get("Accept"), "application/json");
    assert.deepEqual(result, { patientId: "p1" });
  });

  it("fetches CSRF once and sends it with JSON mutations", async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return url.endsWith("/auth/csrf")
        ? Response.json({ token: "csrf-test" })
        : Response.json({ ok: true }, { status: 201 });
    };

    await request("/patients", { method: "POST", body: { first_name: "Ada" } });
    await request("/patients", { method: "POST", body: { first_name: "Lin" } });

    assert.equal(
      calls.filter((call) => call.url.endsWith("/auth/csrf")).length,
      1,
    );
    const mutation = calls[1].options;
    assert.equal(mutation.credentials, "include");
    assert.equal(mutation.headers.get("X-CSRF-Token"), "csrf-test");
    assert.equal(mutation.headers.get("Content-Type"), "application/json");
    assert.equal(mutation.body, JSON.stringify({ first_name: "Ada" }));
  });

  it("normalizes nested API data and exposes stable HTTP errors", async () => {
    globalThis.fetch = async () =>
      Response.json(
        { error_code: "VALIDATION", details: [{ field_name: "patient_name" }] },
        { status: 422 },
      );

    await assert.rejects(request("/patients"), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.equal(error.code, "VALIDATION");
      assert.deepEqual(error.payload, {
        errorCode: "VALIDATION",
        details: [{ fieldName: "patient_name" }],
      });
      return true;
    });
  });

  it("signals expired authenticated sessions without swallowing the response", async () => {
    const events = [];
    globalThis.window = {
      dispatchEvent: (event) => events.push(event.type),
    };
    globalThis.fetch = async () =>
      Response.json({ error: "Expired" }, { status: 401 });

    await assert.rejects(request("/bootstrap"), { status: 401 });
    assert.deepEqual(events, ["medice:unauthorized"]);
  });
});
