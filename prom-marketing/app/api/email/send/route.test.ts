import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  createClient: vi.fn(),
  sendEmail: vi.fn(),
  upsertContactAndLog: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: m.createClient,
}));
vi.mock("@/lib/email/resend", () => ({
  sendEmail: m.sendEmail,
}));
vi.mock("@/lib/contacts/repository", () => ({
  upsertContactAndLog: m.upsertContactAndLog,
}));

import { POST } from "./route";

function request(token: string, approved?: boolean, to = "client@example.com") {
  return new Request("https://example.com/api/email/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      to,
      subject: "Test",
      text: "Message",
      replyTo: "owner@example.com",
      approved,
    }),
  });
}

describe("POST /api/email/send bearer auth", () => {
  beforeEach(() => {
    process.env.INTERNAL_SEND_TOKEN = "internal-token";
    process.env.HERMES_API_TOKEN = "hermes-token";
    process.env.ALLOWED_ADMIN_EMAILS = "owner@example.com";
    m.createClient.mockReset();
    m.sendEmail.mockReset();
    m.upsertContactAndLog.mockReset();
    m.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });
    m.sendEmail.mockResolvedValue({ id: "resend-1", error: null });
    m.upsertContactAndLog.mockResolvedValue({ contact_id: "contact-1", activity_id: "activity-1", error: null });
  });

  it("accepts HERMES_API_TOKEN when the client send is explicitly approved", async () => {
    const response = await POST(request("hermes-token", true));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, id: "resend-1", replyTo: "owner@example.com" });
    expect(m.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@example.com",
        subject: "Test",
        text: "Message",
        replyTo: "owner@example.com",
      })
    );
  });

  it("continues to accept INTERNAL_SEND_TOKEN", async () => {
    const response = await POST(request("internal-token", true));

    expect(response.status).toBe(200);
    expect(m.sendEmail).toHaveBeenCalledOnce();
  });

  it("allows an owner preview without approved:true", async () => {
    const response = await POST(request("hermes-token", undefined, "owner@example.com"));

    expect(response.status).toBe(200);
    expect(m.sendEmail).toHaveBeenCalledOnce();
  });

  it("keeps the approval interlock for external recipients", async () => {
    const response = await POST(request("hermes-token"));

    expect(response.status).toBe(403);
    expect(m.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid bearer token", async () => {
    const response = await POST(request("wrong-token", true));

    expect(response.status).toBe(403);
    expect(m.sendEmail).not.toHaveBeenCalled();
  });
});
