// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parsePostCall, signElevenLabs } from "@/lib/voice/postcall";

const mocks = vi.hoisted(() => ({
  update: vi.fn(), eq: vi.fn(), in: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(),
  crm: vi.fn(), quota: vi.fn(), email: vi.fn(), telegram: vi.fn(), after: vi.fn(),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ from: () => ({ update: mocks.update }) }),
}));
vi.mock("@/lib/contacts/repository", () => ({ upsertContactAndLog: mocks.crm }));
vi.mock("@/lib/voice/quota", () => ({ closeVoiceSession: mocks.quota }));
vi.mock("@/lib/email/resend", () => ({ sendEmail: mocks.email }));
vi.mock("@/lib/notifications/telegram", () => ({ sendTelegram: mocks.telegram }));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()), after: mocks.after,
}));

import { POST } from "@/app/api/webhooks/elevenlabs/route";
import { closeTreningSession } from "./postcall";

const sessionId = "a1234567-1234-4123-8123-123456789abc";
const secret = "test-webhook-secret";
function payload(agentId = "trainer") {
  return {
    type: "post_call_transcription",
    data: {
      agent_id: agentId, conversation_id: "conversation-test",
      metadata: { call_duration_secs: 37 },
      analysis: { transcript_summary: "Тестов разговор", call_successful: "success" },
      transcript: [{ role: "agent", message: "Тест", time_in_call_secs: 0 }],
      conversation_initiation_client_data: {
        dynamic_variables: { sesia: sessionId, imeil: "test@example.com" },
      },
    },
  };
}
function request(body: unknown, signed = true) {
  const raw = JSON.stringify(body);
  return new Request("http://localhost/api/webhooks/elevenlabs", {
    method: "POST", body: raw,
    headers: signed ? { "elevenlabs-signature": signElevenLabs(raw, secret, Math.floor(Date.now() / 1000)) } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("ELEVENLABS_WEBHOOK_SECRET", secret);
  vi.stubEnv("ELEVENLABS_TRAINER_AGENT_ID", "trainer");
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ in: mocks.in });
  mocks.in.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.maybeSingle.mockResolvedValue({ data: { id: sessionId }, error: null });
  mocks.crm.mockResolvedValue({ contact_id: "contact-test", activity_id: null });
  mocks.quota.mockResolvedValue(undefined);
});

describe("trainer webhook isolation", () => {
  it("verifies the signature before storing anything", async () => {
    const response = await POST(request(payload(), false));
    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.crm).not.toHaveBeenCalled();
  });

  it("stores the complete trainer data and skips CRM, quota and notifications even with contact identity", async () => {
    const body = payload();
    const response = await POST(request(body));
    expect(await response.json()).toEqual({ ok: true, trening: true });
    expect(mocks.update).toHaveBeenCalledWith({
      transcript: body.data.transcript, analiz: body.data.analysis,
      prodalzhitelnost_sek: 37, conversation_id: "conversation-test", zavarshena: true,
    });
    expect(mocks.eq).toHaveBeenCalledWith("id", sessionId);
    expect(mocks.in).toHaveBeenCalledWith("rejim", ["uchi", "izpit", "rolya"]);
    for (const fn of [mocks.crm, mocks.quota, mocks.email, mocks.telegram, mocks.after]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it("returns an error for unknown sessions without falling into CRM", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await POST(request(payload()))).status).toBe(404);
    expect(mocks.crm).not.toHaveBeenCalled();
  });

  it("allows webhook retries on database failure without CRM side effects", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });
    expect((await POST(request(payload()))).status).toBe(500);
    expect(mocks.crm).not.toHaveBeenCalled();
  });

  it("rejects missing session keys before querying the database", async () => {
    const body = payload();
    body.data.conversation_initiation_client_data.dynamic_variables.sesia = "";
    const event = parsePostCall(body)!;
    expect(await closeTreningSession(event, body)).toMatchObject({ ok: false, status: 400 });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("preserves the existing CRM path for other agents", async () => {
    const response = await POST(request(payload("crm-agent")));
    expect(response.status).toBe(200);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.crm).toHaveBeenCalledOnce();
    expect(mocks.quota).toHaveBeenCalledOnce();
    expect(mocks.after).toHaveBeenCalledOnce();
  });
});
