import { describe, it, expect } from "vitest";
import {
  contactEmail,
  contactPhone,
  describeCall,
  inboundInfo,
  isOwnNumber,
  outboundInfo,
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

describe("входящото на 0876", () => {
  const inbound = (phone: string, collected: Record<string, unknown>) =>
    parsePostCall(
      sample({
        agent_id: "agent_vhodyasht",
        transcript: [{ role: "agent", message: "Здравейте, Ели съм.", time_in_call_secs: 0 }],
        metadata: { phone_call: { external_number: phone } },
        analysis: {
          transcript_summary: "Пита за къщата.",
          call_successful: "success",
          data_collection_results: Object.fromEntries(Object.entries(collected).map(([k, v]) => [k, { data_collection_id: k, value: v }])),
        },
        conversation_initiation_client_data: { dynamic_variables: {} },
      })
    )!;

  it("номерът на звъннал, повод и „обади се“ от Data collection", () => {
    const ev = inbound("+359888111222", { ime: "Петър", povod: "за къщата в Белцов", obadi_se: true, koga_udobno: "след пет" });
    const info = inboundInfo(ev);
    expect(info).toMatchObject({ phone: "+359888111222", name: "Петър", povod: "за къщата в Белцов", obadiSe: true, koga: "след пет" });
    const d = describeCall(ev, info);
    expect(d.title).toContain("📲 Входящо на 0876 · за къщата в Белцов");
    expect(d.title).toContain("📞 да му се обади Ивайло");
  });

  it("пренасочено с номера на Ивайло → взима казания на глас, не прави картон на Ивайло", () => {
    expect(isOwnNumber("+359876447159")).toBe(true);
    expect(isOwnNumber("0877 399 963")).toBe(true);
    expect(isOwnNumber("+359888111222")).toBe(false);
    const ev = inbound("+359876447159", { povod: "клиент", telefon_za_vrazka: "0899 123 456", obadi_se: "true" });
    expect(inboundInfo(ev).phone).toBe("+359899123456");
    const hidden = inbound("+359876447159", { povod: "лично" });
    expect(inboundInfo(hidden).phone).toBeNull();
  });
});

describe("обещанията от изходящото на Ели", () => {
  const noBooking = [
    { role: "agent", message: "Здравейте, Благой! Един бърз въпрос — става ли?", time_in_call_secs: 0 },
    { role: "user", message: "Не, утре в единайсет.", time_in_call_secs: 4 },
  ];
  const collected = (fields: Record<string, unknown>) => ({
    data_collection_results: Object.fromEntries(Object.entries(fields).map(([k, value]) => [k, { value }])),
  });

  it("„звъннете ми утре в единайсет“ → кога, с думите на човека", () => {
    const ev = parsePostCall(sample({ transcript: noBooking, analysis: collected({ obadi_se_koga: "утре в 11", ne_tarsete: false, rezultat: "obadi_se" }) }))!;
    expect(ev.booked).toBe(false);
    expect(outboundInfo(ev)).toEqual({ callbackWhen: "утре в 11", doNotCall: false, outcome: "obadi_se" });
  });

  it("„не ме търсете“ и празните думи на модела", () => {
    const ev = parsePostCall(sample({ transcript: noBooking, analysis: collected({ obadi_se_koga: "няма", ne_tarsete: "true", rezultat: "ne_tarsete" }) }))!;
    expect(outboundInfo(ev)).toEqual({ callbackWhen: null, doNotCall: true, outcome: "ne_tarsete" });
    const none = parsePostCall(sample({ transcript: noBooking, analysis: collected({ obadi_se_koga: "null", ne_tarsete: "false" }) }))!;
    expect(outboundInfo(none)).toEqual({ callbackWhen: null, doNotCall: false, outcome: null });
  });

  it("записан час → няма обещание за обаждане, дори моделът да е написал нещо", () => {
    const ev = parsePostCall(sample({ analysis: collected({ obadi_se_koga: "утре", rezultat: "zapisan_chas" }) }))!;
    expect(ev.booked).toBe(true);
    expect(outboundInfo(ev).callbackWhen).toBeNull();
  });
});

describe("гласова поща", () => {
  it("системният инструмент voicemail_detection → не е говорил човек, заглавието го казва", () => {
    const transcript = [
      { role: "agent", message: "Здравейте, Благой! Ели съм, от Про Маркетинг…", time_in_call_secs: 0 },
      { role: "user", message: "Здравейте, в момента не мога да се обадя, оставете съобщение след сигнала.", time_in_call_secs: 5 },
      { role: "agent", message: "", time_in_call_secs: 12, tool_calls: [{ tool_name: "voicemail_detection", params_as_json: "{}" }] },
    ];
    const ev = parsePostCall(sample({ transcript, metadata: { call_duration_secs: 38 } }))!;
    expect(ev.voicemail).toBe(true);
    expect(ev.booked).toBe(false);
    expect(describeCall(ev).title).toMatch(/^📼 Гласова поща/);
  });

  it("причина за край с voicemail от ElevenLabs — също гласова поща; обикновен разговор — не", () => {
    expect(parsePostCall(sample({ metadata: { termination_reason: "voicemail_detected" } }))!.voicemail).toBe(true);
    expect(parsePostCall(sample())!.voicemail).toBe(false);
    expect(describeCall(parsePostCall(sample())!).title).toMatch(/^🎙️ Разговор/);
  });
});
