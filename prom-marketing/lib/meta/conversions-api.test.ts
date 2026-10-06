import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

type Mod = typeof import("./conversions-api");

/** Модулът чете env при зареждане — затова се зарежда наново за всеки тест. */
async function load(env: Record<string, string | undefined>): Promise<Mod> {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, v);
  }
  return import("./conversions-api");
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const ENV = { NEXT_PUBLIC_META_PIXEL_ID: "1290600103200240", META_CAPI_TOKEN: "tok", META_CAPI_TEST_EVENT_CODE: undefined };

function okResponse(body: unknown = { events_received: 1, fbtrace_id: "x" }) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

describe("buildCapiEvent", () => {
  it("хешира личните данни, lead_id остава както е, празните полета ги няма", async () => {
    const m = await load(ENV);
    const e = m.buildCapiEvent({
      event_name: "Lead",
      event_time: 1700000000,
      event_id: "metalead_1",
      action_source: "system_generated",
      user_data: { email: " Ivan@Example.com ", phone: "+359 888 123 456", lead_id: "1640270130884641" },
      custom_data: { event_source: "crm" },
    });
    expect(e).toEqual({
      event_name: "Lead",
      event_time: 1700000000,
      action_source: "system_generated",
      event_id: "metalead_1",
      event_source_url: undefined,
      user_data: { em: [sha("ivan@example.com")], ph: [sha("359888123456")], lead_id: "1640270130884641" },
      custom_data: { event_source: "crm" },
    });
  });
});

describe("sendCapiEvent (старият път)", () => {
  it("праща същото тяло като досега: lead_id като текст, без тестов код", async () => {
    const m = await load(ENV);
    fetchMock.mockResolvedValue(okResponse());
    const r = await m.sendCapiEvent({ event_name: "Lead", event_time: 1700000000, action_source: "system_generated", user_data: { lead_id: "1640270130884641" } });
    expect(r.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://graph.facebook.com/v23.0/1290600103200240/events?access_token=tok");
    const body = JSON.parse(String(init.body));
    expect(body.test_event_code).toBeUndefined();
    expect(body.data[0].user_data.lead_id).toBe("1640270130884641");
  });

  it("без пиксел или токен не праща нищо", async () => {
    const m = await load({ NEXT_PUBLIC_META_PIXEL_ID: undefined, META_CAPI_TOKEN: undefined });
    const r = await m.sendCapiEvent({ event_name: "Lead" });
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("postCapiEvents", () => {
  it("numericLeadId: lead_id е JSON число и не губи цифри (17 цифри)", async () => {
    const m = await load(ENV);
    fetchMock.mockResolvedValue(okResponse());
    await m.postCapiEvents([{ event_name: "Won", user_data: { lead_id: "12345678901234567" } }], { numericLeadId: true });
    const raw = String(fetchMock.mock.calls[0][1].body);
    expect(raw).toContain('"lead_id":12345678901234567');
    expect(raw).not.toContain('"lead_id":"');
  });

  it("тестовият код отива в заявката", async () => {
    const m = await load(ENV);
    fetchMock.mockResolvedValue(okResponse());
    await m.postCapiEvents([{ event_name: "Lead" }], { testEventCode: "TEST123" });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).test_event_code).toBe("TEST123");
  });

  it("отказ от Meta → rejected (със статус); без отговор → network", async () => {
    const m = await load(ENV);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Invalid parameter" } }), { status: 400 }));
    const bad = await m.postCapiEvents([{ event_name: "Lead" }]);
    expect(bad).toMatchObject({ ok: false, status: 400 });
    expect(bad.network).toBeUndefined();
    expect(bad.error).toContain("Invalid parameter");

    fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
    const lost = await m.postCapiEvents([{ event_name: "Lead" }]);
    expect(lost).toMatchObject({ ok: false, network: true, error: "ECONNRESET" });

    fetchMock.mockResolvedValueOnce(new Response("<html>502</html>", { status: 502 }));
    const html = await m.postCapiEvents([{ event_name: "Lead" }]);
    expect(html).toMatchObject({ ok: false, status: 502 });
    expect(html.network).toBeUndefined();
  });

  it("leadIdAsJsonNumber не пипа други полета", async () => {
    const m = await load(ENV);
    expect(m.leadIdAsJsonNumber('{"lead_id":"123","event_id":"crm_meeting_123"}')).toBe('{"lead_id":123,"event_id":"crm_meeting_123"}');
  });
});
