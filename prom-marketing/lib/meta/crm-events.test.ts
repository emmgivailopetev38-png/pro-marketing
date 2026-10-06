import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;

/**
 * Малка база в паметта — само веригите, които ползва crm-events.ts:
 * select/eq/gte/in/order/range (четене на страници), insert().select().single()
 * с уникален idempotency_key (както индексът в automation_events) и update().eq().
 */
const db = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
  failRead: null as string | null,
  failInsert: false,
  seq: 0,
}));

function table(name: string) {
  const filters: Array<(r: Row) => boolean> = [];
  let patch: Row | null = null;
  let window: [number, number] | null = null;
  const rows = () => (db.tables[name] ??= []);
  const run = () => {
    if (patch) {
      for (const r of rows().filter((x) => filters.every((f) => f(x)))) Object.assign(r, patch);
      return { data: null, error: null };
    }
    if (db.failRead === name) return { data: null, error: { message: `${name} read failed` } };
    let hits = rows().filter((x) => filters.every((f) => f(x)));
    if (window) hits = hits.slice(window[0], window[1] + 1);
    return { data: hits.map((r) => ({ ...r })), error: null };
  };
  const q = {
    select: () => q,
    eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
    gte: (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), q),
    in: (c: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[c])), q),
    order: () => q,
    range: (a: number, b: number) => ((window = [a, b]), q),
    update: (p: Row) => ((patch = p), q),
    insert: (row: Row) => ({
      select: () => ({
        single: async () => {
          if (db.failInsert) return { data: null, error: { code: "42P01", message: "relation does not exist" } };
          if (row.idempotency_key && rows().some((r) => r.idempotency_key === row.idempotency_key)) {
            return { data: null, error: { code: "23505", message: "duplicate key value" } };
          }
          const id = `row_${++db.seq}`;
          rows().push({ id, created_at: new Date().toISOString(), ...row });
          return { data: { id }, error: null };
        },
      }),
    }),
    then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve(run()).then(ok, bad),
  };
  return q;
}

vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ from: (t: string) => table(t) }) }));

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/meta/conversions-api", async (orig) => ({
  ...(await orig<typeof import("@/lib/meta/conversions-api")>()),
  isCapiConfigured: () => true,
  postCapiEvents: post,
}));

const telegram = vi.hoisted(() => vi.fn(async () => true));
vi.mock("@/lib/notifications/telegram", () => ({ sendTelegram: telegram }));

import { LEDGER_EVENT_TYPE, runCrmEvents, sendRawLeadCrmEvent } from "./crm-events";

const L1 = "1640270130884641";
const NOW = new Date("2026-10-06T12:00:00.000Z");

function seed() {
  db.tables = {
    contact_activities: [
      { id: "a1", contact_id: "c1", activity_type: "meta_lead", title: "Meta lead", occurred_at: "2026-10-01T09:00:00.000Z", created_at: "2026-10-01T09:00:05.000Z", created_by: "meta_webhook", metadata: { meta_lead_id: L1 } },
      { id: "a2", contact_id: "c1", activity_type: "meeting", title: "Среща", occurred_at: "2026-10-08T10:00:00.000Z", created_at: "2026-10-02T10:00:00.000Z", created_by: "Димитър", metadata: { outcome: "meeting" } },
    ],
    contacts: [{ id: "c1", stage: "discovery", email: "ivan@example.com", phone: "0888 123 456", full_name: "Иван Петров" }],
    bookings: [],
    automation_events: [],
  };
}

const ledger = () => db.tables.automation_events.filter((r) => r.event_type === LEDGER_EVENT_TYPE);

beforeEach(() => {
  db.failRead = null;
  db.failInsert = false;
  post.mockReset();
  telegram.mockClear();
  seed();
});

describe("runCrmEvents", () => {
  it("dry: казва какво би тръгнало, нищо не праща и нищо не записва", async () => {
    const r = await runCrmEvents({ mode: "dry", now: NOW, stages: ["meeting", "won"] });
    expect(r.ok).toBe(true);
    expect(r.leads).toBe(1);
    expect(r.planned).toBe(1);
    expect(r.events[0]).toMatchObject({ stage: "meeting", event_name: "Meeting Booked", meta_lead_id: L1, event_time: "2026-10-02T10:00:00.000Z" });
    expect(post).not.toHaveBeenCalled();
    expect(ledger()).toHaveLength(0);
  });

  it("live: праща веднъж, записва в automation_events; второ пускане не праща пак", async () => {
    post.mockResolvedValue({ ok: true, status: 200, data: { events_received: 1 } });
    const r = await runCrmEvents({ mode: "live", now: NOW, stages: ["meeting", "won"] });
    expect(r.sent).toBe(1);
    expect(post).toHaveBeenCalledTimes(1);
    const [events, opts] = post.mock.calls[0];
    expect(opts).toMatchObject({ numericLeadId: true });
    expect(events[0]).toMatchObject({
      event_name: "Meeting Booked",
      event_id: `crm_meeting_${L1}`,
      action_source: "system_generated",
      event_time: Date.parse("2026-10-02T10:00:00.000Z") / 1000,
      custom_data: { event_source: "crm", lead_event_source: "Pro Marketing CRM" },
    });
    expect(events[0].user_data.lead_id).toBe(L1);
    expect(events[0].user_data.em).toHaveLength(1);
    expect(ledger()).toHaveLength(1);
    expect(ledger()[0]).toMatchObject({ status: "success", idempotency_key: `capi-crm:crm_meeting_${L1}`, related_contact_id: "c1" });
    expect((ledger()[0].detail as Row).state).toBe("sent");

    const again = await runCrmEvents({ mode: "live", now: NOW, stages: ["meeting", "won"] });
    expect(again.sent).toBe(0);
    expect(again.alreadySent).toBe(1);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("live: ако редът в дневника вече го има (друго пускане), не праща", async () => {
    db.tables.automation_events.push({ id: "old", event_type: "other", idempotency_key: `capi-crm:crm_meeting_${L1}`, created_at: "2026-01-01T00:00:00.000Z" });
    const r = await runCrmEvents({ mode: "live", now: NOW, stages: ["meeting"] });
    expect(r.duplicates).toBe(1);
    expect(post).not.toHaveBeenCalled();
  });

  it("live: дневникът не се чете → нищо не тръгва", async () => {
    db.failRead = "automation_events";
    const r = await runCrmEvents({ mode: "live", now: NOW, stages: ["meeting"] });
    expect(r.ok).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it("отказ от Meta: записва се, идва известие, а след 6 ч се праща пак същото", async () => {
    post.mockResolvedValueOnce({ ok: false, status: 400, error: '{"error":{"message":"Invalid OAuth access token"}}' });
    const r = await runCrmEvents({ mode: "live", now: NOW, stages: ["meeting"] });
    expect(r.rejected).toBe(1);
    expect(r.ok).toBe(false);
    expect(telegram).toHaveBeenCalledTimes(1);
    expect(ledger()[0]).toMatchObject({ status: "failed" });
    expect(ledger()[0].detail).toMatchObject({ state: "rejected", attempts: 1, http_status: 400 });

    // 2 часа по-късно — още е рано за нов опит
    await runCrmEvents({ mode: "live", now: new Date(NOW.getTime() + 2 * 3_600_000), stages: ["meeting"] });
    expect(post).toHaveBeenCalledTimes(1);

    post.mockResolvedValueOnce({ ok: true, status: 200, data: { events_received: 1 } });
    const later = await runCrmEvents({ mode: "live", now: new Date(NOW.getTime() + 7 * 3_600_000), stages: ["meeting"] });
    expect(later.retried).toEqual({ tried: 1, sent: 1 });
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][0][0]).toEqual(post.mock.calls[0][0][0]);
    expect(ledger()[0]).toMatchObject({ status: "success" });
    expect(ledger()[0].detail).toMatchObject({ state: "sent", attempts: 2 });
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  it("без отговор от Meta → „unknown“ и не се повтаря само (може вече да е стигнало)", async () => {
    post.mockResolvedValueOnce({ ok: false, network: true, error: "ECONNRESET" });
    const r = await runCrmEvents({ mode: "live", now: NOW, stages: ["meeting"] });
    expect(r.unknown).toBe(1);
    await runCrmEvents({ mode: "live", now: new Date(NOW.getTime() + 24 * 3_600_000), stages: ["meeting"] });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("test: праща с тестовия код и НЕ записва — истинското пращане после не е засегнато", async () => {
    post.mockResolvedValue({ ok: true, status: 200, data: { events_received: 1 } });
    const r = await runCrmEvents({ mode: "test", testEventCode: "TEST42", now: NOW, stages: ["meeting"] });
    expect(r.sent).toBe(2);
    expect(post.mock.calls.map((c) => c[1].testEventCode)).toEqual(["TEST42", "TEST42"]);
    expect(post.mock.calls.map((c) => c[0][0].event_name)).toEqual(["Lead", "Meeting Booked"]);
    expect(ledger()).toHaveLength(0);
  });
});

describe("sendRawLeadCrmEvent (webhook-ът в режим live)", () => {
  const input = { leadgenId: L1, createdTime: "2026-10-06T11:00:00+0000", contactId: "c1", email: "ivan@example.com", phone: "+359888123456", fullName: "Иван", adId: "ad1", campaignId: "cmp1" };

  it("Lead като CRM събитие, записан; повторна доставка от Meta не праща второ", async () => {
    post.mockResolvedValue({ ok: true, status: 200, data: { events_received: 1 } });
    expect((await sendRawLeadCrmEvent(input)).outcome).toBe("sent");
    const ev = post.mock.calls[0][0][0];
    expect(ev).toMatchObject({ event_name: "Lead", event_id: `metalead_${L1}`, action_source: "system_generated" });
    expect(ev.custom_data).toMatchObject({ event_source: "crm", lead_event_source: "Pro Marketing CRM", lead_source: "meta_instant_form" });
    expect(ledger()[0]).toMatchObject({ status: "success", idempotency_key: `capi-crm:metalead_${L1}` });

    expect((await sendRawLeadCrmEvent(input)).outcome).toBe("duplicate");
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("дневникът не приема запис → праща веднъж без запис, за да не се изгуби лийдът", async () => {
    db.failInsert = true;
    post.mockResolvedValue({ ok: true, status: 200, data: { events_received: 1 } });
    expect((await sendRawLeadCrmEvent(input)).outcome).toBe("sent_unrecorded");
    expect(post).toHaveBeenCalledTimes(1);
  });
});
