import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Само стъпката към Meta (CAPI) в webhook-а: при изключен CAPI_CRM_EVENTS
 * тръгва същото събитие „Lead“ като досега; при CAPI_CRM_EVENTS=1 — CRM
 * версията през дневника. Записът на лийда в CRM-а е същият и в двата случая.
 */

const inserted = vi.hoisted(() => ({ rows: [] as Array<{ table: string; row: Record<string, unknown> }> }));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: null, error: null }),
        single: async () => ({ data: { id: "contact-1" }, error: null }),
        insert: (row: Record<string, unknown>) => {
          inserted.rows.push({ table, row });
          return Object.assign(Promise.resolve({ data: null, error: null }), { select: () => q });
        },
        upsert: async (row: Record<string, unknown>) => {
          inserted.rows.push({ table, row });
          return { data: null, error: null };
        },
        update: () => q,
      };
      return q;
    },
  }),
}));

vi.mock("@/lib/meta/page-token", () => ({ getPageAccessToken: async () => ({ ok: true, token: "page-token", derived: true }) }));
vi.mock("@/lib/email/resend", () => ({ sendEmail: vi.fn(async () => ({ id: "x", error: null })) }));
vi.mock("@/lib/email/lead-sequence", () => ({ LEAD_SEQUENCE: [{ key: "s1" }], sendSequenceStep: vi.fn(async () => null) }));
vi.mock("@/lib/team/notify", () => ({ notifyTeamNewLead: vi.fn(async () => undefined) }));
vi.mock("@/lib/team/routing", () => ({ routeNewLead: vi.fn(async () => null) }));

const capi = vi.hoisted(() => ({ send: vi.fn(async () => ({ ok: true })) }));
vi.mock("@/lib/meta/conversions-api", () => ({ isCapiConfigured: () => true, sendCapiEvent: capi.send }));

const crm = vi.hoisted(() => ({ raw: vi.fn(async () => ({ outcome: "sent" })) }));
vi.mock("@/lib/meta/crm-events", () => ({ sendRawLeadCrmEvent: crm.raw }));

import { POST } from "./route";

const LEADGEN = "1640270130884641";
const SECRET = "app-secret";

function signed(body: unknown) {
  const raw = JSON.stringify(body);
  const sig = createHmac("sha256", SECRET).update(raw, "utf8").digest("hex");
  return new Request("https://promarketing.pw/api/webhooks/meta-leads", {
    method: "POST",
    headers: { "x-hub-signature-256": `sha256=${sig}`, "content-type": "application/json" },
    body: raw,
  });
}

const webhookBody = {
  object: "page",
  entry: [{ id: "106080979260944", changes: [{ field: "leadgen", value: { leadgen_id: LEADGEN, form_id: "form1" } }] }],
};

beforeEach(() => {
  inserted.rows = [];
  capi.send.mockClear();
  crm.raw.mockClear();
  vi.stubEnv("META_APP_SECRET", SECRET);
  vi.stubEnv("META_AUTO_WELCOME", "false");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: LEADGEN,
          created_time: "2026-10-06T09:00:00+0000",
          ad_id: "ad1",
          ad_name: "Реклама",
          campaign_id: "camp1",
          campaign_name: "Кампания",
          form_id: "form1",
          field_data: [
            { name: "full_name", values: ["Иван Петров"] },
            { name: "email", values: ["Ivan@Example.com"] },
            { name: "phone_number", values: ["+359888123456"] },
          ],
        }),
        { status: 200 }
      )
    )
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Meta webhook → CAPI", () => {
  it("по подразбиране: същото събитие Lead като досега, без CRM полетата", async () => {
    vi.stubEnv("CAPI_CRM_EVENTS", "");
    const res = await POST(signed(webhookBody));
    expect(res.status).toBe(200);
    expect(crm.raw).not.toHaveBeenCalled();
    expect(capi.send).toHaveBeenCalledTimes(1);
    expect(capi.send).toHaveBeenCalledWith({
      event_name: "Lead",
      event_id: `metalead_${LEADGEN}`,
      action_source: "system_generated",
      event_time: Math.floor(Date.parse("2026-10-06T09:00:00Z") / 1000),
      user_data: {
        email: "ivan@example.com",
        phone: "+359888123456",
        firstName: "Иван",
        lastName: "Петров",
        country: "bg",
        external_id: "contact-1",
        lead_id: LEADGEN,
      },
      custom_data: { lead_source: "meta_instant_form", ad_id: "ad1", campaign_id: "camp1" },
    });
    // лийдът е записан в CRM-а както винаги
    expect(inserted.rows.some((r) => r.table === "contact_activities" && r.row.activity_type === "meta_lead")).toBe(true);
  });

  it("CAPI_CRM_EVENTS=dry: webhook-ът пак праща стария Lead (dry е само за крона)", async () => {
    vi.stubEnv("CAPI_CRM_EVENTS", "dry");
    await POST(signed(webhookBody));
    expect(capi.send).toHaveBeenCalledTimes(1);
    expect(crm.raw).not.toHaveBeenCalled();
  });

  it("CAPI_CRM_EVENTS=1: Lead тръгва като CRM събитие през дневника, старото не тръгва", async () => {
    vi.stubEnv("CAPI_CRM_EVENTS", "1");
    await POST(signed(webhookBody));
    expect(capi.send).not.toHaveBeenCalled();
    expect(crm.raw).toHaveBeenCalledWith({
      leadgenId: LEADGEN,
      createdTime: "2026-10-06T09:00:00+0000",
      contactId: "contact-1",
      email: "ivan@example.com",
      phone: "+359888123456",
      fullName: "Иван Петров",
      adId: "ad1",
      campaignId: "camp1",
    });
    expect(inserted.rows.some((r) => r.table === "contact_activities" && r.row.activity_type === "meta_lead")).toBe(true);
  });
});
