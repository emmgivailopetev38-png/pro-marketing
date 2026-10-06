import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const run = vi.hoisted(() => vi.fn());
vi.mock("@/lib/meta/crm-events", () => ({ runCrmEvents: run }));

const capi = vi.hoisted(() => ({ configured: true }));
vi.mock("@/lib/meta/conversions-api", () => ({ isCapiConfigured: () => capi.configured }));

import { GET } from "./route";

const report = (over: Record<string, unknown> = {}) => ({
  ok: true,
  mode: "dry",
  leads: 3,
  planned: 1,
  sent: 0,
  rejected: 0,
  alreadySent: 0,
  skipped: {},
  retried: { tried: 0, sent: 0 },
  errors: [],
  ...over,
});

function req(path = "/api/cron/meta-crm-events", token?: string) {
  return new Request(`https://promarketing.pw${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
}

beforeEach(() => {
  run.mockReset();
  run.mockResolvedValue(report());
  capi.configured = true;
  vi.stubEnv("CRON_SECRET", "cron-secret");
  vi.stubEnv("INTERNAL_SEND_TOKEN", "manual-token");
  vi.stubEnv("CAPI_CRM_EVENTS", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/cron/meta-crm-events", () => {
  it("без токен → 401, дори ако CRON_SECRET липсва", async () => {
    expect((await GET(req())).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req("/api/cron/meta-crm-events", "wrong"))).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("по подразбиране е изключено — кронът не прави нищо", async () => {
    const res = await GET(req(undefined, "cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, skipped: "disabled" });
    expect(run).not.toHaveBeenCalled();
  });

  it("без пиксел/токен за CAPI — нищо", async () => {
    vi.stubEnv("CAPI_CRM_EVENTS", "1");
    capi.configured = false;
    expect(await (await GET(req(undefined, "cron-secret"))).json()).toMatchObject({ skipped: "capi_not_configured" });
    expect(run).not.toHaveBeenCalled();
  });

  it("CAPI_CRM_EVENTS=dry → само смята", async () => {
    vi.stubEnv("CAPI_CRM_EVENTS", "dry");
    await GET(req(undefined, "cron-secret"));
    expect(run).toHaveBeenCalledWith({ mode: "dry", testEventCode: null });
  });

  it("CAPI_CRM_EVENTS=1 → праща; при грешка отговаря с 500", async () => {
    vi.stubEnv("CAPI_CRM_EVENTS", "1");
    run.mockResolvedValue(report({ ok: false, mode: "live", rejected: 1 }));
    const res = await GET(req(undefined, "cron-secret"));
    expect(run).toHaveBeenCalledWith({ mode: "live", testEventCode: null });
    expect(res.status).toBe(500);
  });

  it("ръчно ?dry=1 работи и при изключено — нищо не праща", async () => {
    await GET(req("/api/cron/meta-crm-events?dry=1", "manual-token"));
    expect(run).toHaveBeenCalledWith({ mode: "dry", testEventCode: null });
  });

  it("?test=<код> само ръчно и само когато не е изключено", async () => {
    await GET(req("/api/cron/meta-crm-events?test=TEST1", "manual-token"));
    expect(run).not.toHaveBeenCalled();

    vi.stubEnv("CAPI_CRM_EVENTS", "dry");
    await GET(req("/api/cron/meta-crm-events?test=TEST1", "manual-token"));
    expect(run).toHaveBeenLastCalledWith({ mode: "test", testEventCode: "TEST1" });

    // от крона (CRON_SECRET) параметърът не важи
    vi.stubEnv("CAPI_CRM_EVENTS", "1");
    await GET(req("/api/cron/meta-crm-events?test=TEST1", "cron-secret"));
    expect(run).toHaveBeenLastCalledWith({ mode: "live", testEventCode: null });
  });
});
