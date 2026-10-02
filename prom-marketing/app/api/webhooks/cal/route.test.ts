import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

const upsertMock = vi.fn().mockResolvedValue({ error: null });
const insertMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn();
const db = vi.hoisted(() => ({ bookings: [] as Array<Record<string, unknown>> }));

/**
 * `bookings`: upsert (както досега) + четене/обновяване за отмяна и преместване
 * (lib/cal/booking-changes.ts) върху редовете в `db.bookings`.
 */
function bookingsTable() {
  const filters: Array<(r: Record<string, unknown>) => boolean> = [];
  let patch: Record<string, unknown> | null = null;
  let single = false;
  const read = (r: Record<string, unknown>, col: string): unknown => {
    if (!col.includes("->>")) return r[col];
    const [json, key] = col.split("->>");
    return ((r[json] ?? {}) as Record<string, unknown>)[key];
  };
  const run = () => {
    const hits = db.bookings.filter((r) => filters.every((f) => f(r)));
    if (patch) {
      for (const r of hits) updateMock(r.id, patch);
      return { data: null, error: null };
    }
    return { data: single ? (hits[0] ?? null) : hits, error: null };
  };
  const q = {
    upsert: upsertMock,
    select: () => q,
    update: (p: Record<string, unknown>) => ((patch = p), q),
    eq: (c: string, v: unknown) => (filters.push((r) => read(r, c) === v), q),
    gte: (c: string, v: string) => (filters.push((r) => String(read(r, c)) >= v), q),
    lte: (c: string, v: string) => (filters.push((r) => String(read(r, c)) <= v), q),
    limit: () => q,
    maybeSingle: () => ((single = true), Promise.resolve(run())),
    then: (ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) => Promise.resolve(run()).then(ok, bad),
  };
  return q;
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "bookings") return bookingsTable();
      if (table === "cal_webhook_log") return { insert: insertMock };
      throw new Error("unknown table");
    },
  }),
}));

const cancelled = vi.hoisted(() => ({ handle: vi.fn(async () => {}) }));
vi.mock("@/lib/team/cancelled", () => ({ handleCancelledBooking: cancelled.handle }));

vi.mock("@/lib/meta/conversions-api", () => ({
  isCapiConfigured: () => false,
  sendCapiEvent: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/contacts/repository", () => ({
  upsertContactAndLog: vi.fn().mockResolvedValue({ id: "contact-1" }),
}));

process.env.CAL_WEBHOOK_SECRET = "test-secret-123";

import { POST } from "./route";

const validPayload = {
  triggerEvent: "BOOKING_CREATED",
  payload: {
    uid: "abc-123",
    startTime: "2026-06-01T10:00:00.000Z",
    endTime: "2026-06-01T10:30:00.000Z",
    attendees: [{ name: "Иван Иванов", email: "ivan@example.com" }],
    responses: { phone: "+359888123456" },
  },
};

function sign(body: string) {
  return crypto.createHmac("sha256", "test-secret-123").update(body).digest("hex");
}

function makeRequest(body: string, signature: string | null) {
  const headers = new Headers();
  if (signature !== null) headers.set("x-cal-signature-256", signature);
  return new Request("https://example.com/api/webhooks/cal", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/webhooks/cal", () => {
  beforeEach(() => {
    upsertMock.mockClear();
    insertMock.mockClear();
    updateMock.mockClear();
    cancelled.handle.mockClear();
    db.bookings = [];
    // Замисленият път на BOOKING_CREATED (ред + контакт + CAPI) — пуска се с ключа.
    process.env.CAL_PROCESS_CREATED = "1";
  });

  it("upserts booking on valid signature + payload", async () => {
    const body = JSON.stringify(validPayload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledOnce();
    const arg = upsertMock.mock.calls[0][0];
    expect(arg.cal_booking_id).toBe("abc-123");
    expect(arg.attendee_email).toBe("ivan@example.com");
    expect(arg.attendee_phone).toBe("+359888123456");
    expect(arg.duration_minutes).toBe(30);
  });

  it("returns 401 on invalid signature", async () => {
    const body = JSON.stringify(validPayload);
    const res = await POST(makeRequest(body, "deadbeef"));
    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("returns 400 on schema-invalid payload", async () => {
    const body = JSON.stringify({ foo: "bar" });
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("returns 401 when signature header missing", async () => {
    const body = JSON.stringify(validPayload);
    const res = await POST(makeRequest(body, null));
    expect(res.status).toBe(401);
  });

  it("extracts custom booking question answers into typed columns", async () => {
    const payload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "qa-789",
        startTime: "2026-06-02T10:00:00.000Z",
        endTime: "2026-06-02T10:30:00.000Z",
        attendees: [{ name: "Мария", email: "maria@example.com" }],
        responses: {
          phone: "+359888000000",
          business: "Онлайн магазин за козметика",
          automation_goal: "Искам да автоматизирам отговорите в Messenger",
          services_interested: ["AI чат агенти за поддръжка и продажби", "Email / SMS автоматизация"],
          timeline: "До 1 месец",
        },
      },
    };
    const body = JSON.stringify(payload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    const arg = upsertMock.mock.calls[0][0];
    expect(arg.business).toBe("Онлайн магазин за козметика");
    expect(arg.automation_goal).toBe("Искам да автоматизирам отговорите в Messenger");
    expect(arg.services_interested).toEqual([
      "AI чат агенти за поддръжка и продажби",
      "Email / SMS автоматизация",
    ]);
    expect(arg.timeline).toBe("До 1 месец");
  });

  it("extracts Google Meet URL from metadata.videoCallUrl", async () => {
    const payload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "meet-001",
        startTime: "2026-06-03T10:00:00.000Z",
        endTime: "2026-06-03T10:30:00.000Z",
        attendees: [{ name: "Петър", email: "petar@example.com" }],
        metadata: { videoCallUrl: "https://meet.google.com/abc-defg-hij" },
        location: "integrations:google:meet",
      },
    };
    const body = JSON.stringify(payload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    const arg = upsertMock.mock.calls[0][0];
    expect(arg.meeting_url).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("falls back to raw URL in location when metadata is empty", async () => {
    const payload = {
      triggerEvent: "BOOKING_CREATED",
      payload: {
        uid: "fallback-001",
        startTime: "2026-06-04T10:00:00.000Z",
        endTime: "2026-06-04T10:30:00.000Z",
        attendees: [{ name: "Анна", email: "anna@example.com" }],
        location: "https://app.cal.com/video/somecallid",
      },
    };
    const body = JSON.stringify(payload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    const arg = upsertMock.mock.calls[0][0];
    expect(arg.meeting_url).toBe("https://app.cal.com/video/somecallid");
  });

  it("returns null meeting_url when no URL is present", async () => {
    const body = JSON.stringify(validPayload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    const arg = upsertMock.mock.calls[0][0];
    expect(arg.meeting_url).toBeNull();
  });

  it("skips unknown trigger events with 200 (no upsert)", async () => {
    const payload = {
      triggerEvent: "MEETING_ENDED",
      payload: {
        uid: "ignore-1",
        startTime: "2026-06-01T10:00:00.000Z",
        endTime: "2026-06-01T10:30:00.000Z",
        attendees: [{ name: "x", email: "x@example.com" }],
      },
    };
    const body = JSON.stringify(payload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(upsertMock).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("BOOKING_CREATED без CAL_PROCESS_CREATED=1 се записва в дневника, но не прави ред (CAPI чака решение)", async () => {
    delete process.env.CAL_PROCESS_CREATED;
    const body = JSON.stringify(validPayload);
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(upsertMock).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledOnce();
    expect(String(insertMock.mock.calls[0][0].error)).toMatch(/^held:/);
  });
});

describe("отмяна и преместване през Cal.com (01.10.2026)", () => {
  beforeEach(() => {
    upsertMock.mockClear();
    insertMock.mockClear();
    updateMock.mockClear();
    cancelled.handle.mockClear();
    db.bookings = [];
    delete process.env.CAL_PROCESS_CREATED;
  });

  const event = (trigger: string, extra: Record<string, unknown> = {}) => ({
    triggerEvent: trigger,
    payload: { ...validPayload.payload, cancellationReason: null, ...extra },
  });

  it("`cancellationReason: null` вече не чупи схемата; срещата от синхрона се намира по човек + час и се отменя", async () => {
    db.bookings = [
      {
        id: "sync-row",
        cal_booking_id: "manual:2026-06-01T10:00:ivan@example.com",
        status: "accepted",
        scheduled_at: "2026-06-01T10:00:00.000Z",
        attendee_email: "ivan@example.com",
        attendee_phone: "0888 123 456",
        meeting_url: null,
        raw_payload: { source: "hermes" },
      },
    ];
    const body = JSON.stringify(event("BOOKING_CANCELLED", { status: "CANCELLED" }));
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(upsertMock).not.toHaveBeenCalled(); // не прави втори, отменен ред до живия
    expect(updateMock).toHaveBeenCalledOnce();
    expect(updateMock.mock.calls[0][0]).toBe("sync-row");
    expect(updateMock.mock.calls[0][1].status).toBe("cancelled");
    expect(cancelled.handle).toHaveBeenCalledOnce();
  });

  it("вече отменена (преместена) среща не вдига „отказа срещата“ втори път", async () => {
    db.bookings = [
      {
        id: "moved-row",
        cal_booking_id: "abc-123",
        status: "cancelled",
        scheduled_at: "2026-06-01T10:00:00.000Z",
        attendee_email: "ivan@example.com",
        attendee_phone: null,
        meeting_url: null,
        raw_payload: { moved_to: { at: "2026-06-03T10:00:00.000Z" } },
      },
    ];
    const body = JSON.stringify(event("BOOKING_CANCELLED"));
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(updateMock.mock.calls[0][1].status).toBeUndefined();
    expect(cancelled.handle).not.toHaveBeenCalled();
  });

  it("преместване без ред в CRM-а прави ЖИВ ред в новия час — не „rescheduled“, който напомнянията не виждат", async () => {
    const body = JSON.stringify(event("BOOKING_RESCHEDULED", { uid: "new-uid", rescheduleUid: "old-uid" }));
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledOnce();
    expect(upsertMock.mock.calls[0][0].status).toBe("confirmed");
    expect(upsertMock.mock.calls[0][0].cal_booking_id).toBe("new-uid");
  });

  it("преместване на среща от екипа — същият ред, новият час", async () => {
    db.bookings = [
      {
        id: "ekip-row",
        cal_booking_id: "old-uid",
        status: "accepted",
        scheduled_at: "2026-05-30T09:00:00.000Z",
        attendee_email: "ivan@example.com",
        attendee_phone: "+359888123456",
        meeting_url: null,
        raw_payload: { source: "ekip", notes: "Записа: Димитър" },
      },
    ];
    const body = JSON.stringify(event("BOOKING_RESCHEDULED", { uid: "new-uid", rescheduleUid: "old-uid" }));
    const res = await POST(makeRequest(body, sign(body)));
    expect(res.status).toBe(200);
    expect(upsertMock).not.toHaveBeenCalled();
    const [id, patch] = updateMock.mock.calls[0];
    expect(id).toBe("ekip-row");
    expect(patch.scheduled_at).toBe("2026-06-01T10:00:00.000Z");
    expect(patch.status).toBe("accepted");
    expect(patch.raw_payload.source).toBe("ekip");
    expect(patch.raw_payload.notes).toBe("Записа: Димитър");
    expect(cancelled.handle).not.toHaveBeenCalled();
  });
});
