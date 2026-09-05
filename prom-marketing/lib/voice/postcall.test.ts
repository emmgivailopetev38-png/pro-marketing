import { describe, it, expect } from "vitest";
import {
  contactEmail,
  contactPhone,
  describeCall,
  parsePostCall,
  signElevenLabs,
  verifyElevenLabsSignature,
} from "./postcall";

const SECRET = "wsec_test_123";

function sample(over: Record<string, unknown> = {}) {
  return {
    type: "post_call_transcription",
    event_timestamp: 1788600000,
    data: {
      agent_id: "agent_4401m0fym8eqfeebgfqx4jnwqreg",
      conversation_id: "conv_abc123",
      status: "done",
      transcript: [
        { role: "agent", message: "Здравей, Иван. С какво се занимаваш?", time_in_call_secs: 0 },
        { role: "user", message: "Имам сервиз за климатици, губим обаждания.", time_in_call_secs: 6 },
        {
          role: "agent",
          message: "Записах те за вторник в 11:00.",
          time_in_call_secs: 95,
          tool_calls: [{ tool_name: "zapishi_chas", params_as_json: "{}" }],
          tool_results: [{ tool_name: "zapishi_chas", is_error: false, result_value: "{\"ok\":true}" }],
        },
      ],
      metadata: { start_time_unix_secs: 1788599880, call_duration_secs: 131, ...((over.metadata as object) ?? {}) },
      analysis: { transcript_summary: "Иван има сервиз за климатици и губи обаждания; записа си час за вторник.", call_successful: "success" },
      conversation_initiation_client_data: {
        dynamic_variables: { ime: "Иван Петров", imeil: "ivan@example.bg", telefon: "0888123456", deynost: "Сервиз", kanal: "sait" },
      },
      ...over,
    },
  };
}

describe("подписът на ElevenLabs", () => {
  it("приема правилно подписано тяло", () => {
    const body = JSON.stringify(sample());
    const now = 1788600000 * 1000;
    const header = signElevenLabs(body, SECRET, 1788600000);
    expect(verifyElevenLabsSignature(body, header, SECRET, now)).toEqual({ ok: true });
  });

  it("отхвърля друг секрет, променено тяло и стар подпис", () => {
    const body = JSON.stringify(sample());
    const now = 1788600000 * 1000;
    const header = signElevenLabs(body, SECRET, 1788600000);
    expect(verifyElevenLabsSignature(body, header, "друг", now)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyElevenLabsSignature(body + " ", header, SECRET, now)).toEqual({ ok: false, reason: "mismatch" });
    expect(verifyElevenLabsSignature(body, header, SECRET, now + 31 * 60 * 1000)).toEqual({ ok: false, reason: "expired" });
    expect(verifyElevenLabsSignature(body, null, SECRET, now)).toEqual({ ok: false, reason: "missing_header" });
    expect(verifyElevenLabsSignature(body, "nonsense", SECRET, now)).toEqual({ ok: false, reason: "bad_format" });
    expect(verifyElevenLabsSignature(body, header, "", now)).toEqual({ ok: false, reason: "no_secret" });
  });
});

describe("разборът на разговора", () => {
  it("вади кой, колко, какво и дали е записан час", () => {
    const ev = parsePostCall(sample())!;
    expect(ev.conversationId).toBe("conv_abc123");
    expect(ev.durationSecs).toBe(131);
    expect(ev.booked).toBe(true);
    expect(ev.channel).toBe("sait");
    expect(ev.summary).toContain("климатици");
    expect(contactEmail(ev)).toBe("ivan@example.bg");
    expect(contactPhone(ev)).toBe("0888123456");
    expect(ev.transcript).toHaveLength(3);
    expect(ev.startedAt.toISOString()).toBe(new Date(1788599880 * 1000).toISOString());
  });

  it(`телефонно обаждане: номерът идва от линията, каналът е „telefon"`, () => {
    const ev = parsePostCall(
      sample({
        metadata: { phone_call: { direction: "inbound", external_number: "+359888123456", agent_number: "+14754269084" } },
        conversation_initiation_client_data: { dynamic_variables: { system__caller_id: "+359888123456" } },
      })
    )!;
    expect(ev.channel).toBe("telefon");
    expect(ev.callerNumber).toBe("+359888123456");
    expect(contactPhone(ev)).toBe("+359888123456");
    expect(contactEmail(ev)).toBe(null);
  });

  it("плейсхолдърът за липсващ имейл не е имейл", () => {
    const ev = parsePostCall(sample({ conversation_initiation_client_data: { dynamic_variables: { imeil: "bez-imeil@promarketing.pw", telefon: "0888" } } }))!;
    expect(contactEmail(ev)).toBe(null);
  });

  it("неуспешна резервация не се брои за записан час", () => {
    const s = sample();
    (s.data.transcript[2] as Record<string, unknown>).tool_results = [{ tool_name: "zapishi_chas", is_error: true }];
    expect(parsePostCall(s)!.booked).toBe(false);
  });

  it("аудио събитията и боклукът се подминават", () => {
    expect(parsePostCall({ type: "post_call_audio", data: { conversation_id: "x", full_audio: "…" } })).toBe(null);
    expect(parsePostCall(null)).toBe(null);
    expect(parsePostCall({ type: "post_call_transcription", data: {} })).toBe(null);
  });

  it("активността носи резюмето първо и транскрипта отдолу", () => {
    const { title, body, minutes } = describeCall(parsePostCall(sample())!);
    expect(minutes).toBe(2);
    expect(title).toContain("2 мин");
    expect(title).toContain("записа си час");
    expect(body.indexOf("климатици")).toBeLessThan(body.indexOf("— Транскрипт —"));
    expect(body).toContain("Клиент: Имам сервиз за климатици");
    expect(body).toContain("Агент: Записах те");
  });
});
