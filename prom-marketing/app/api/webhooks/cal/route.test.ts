import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "node:crypto";

const upsertMock = vi.fn().mockResolvedValue({ error: null });
const insertMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "bookings") return { upsert: upsertMock };
      if (table === "cal_webhook_log") return { insert: insertMock };
      throw new Error("unknown table");
    },
  }),
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
});
