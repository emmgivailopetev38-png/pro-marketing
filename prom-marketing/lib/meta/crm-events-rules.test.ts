import { describe, expect, it } from "vitest";
import {
  CRM_CUSTOM_DATA,
  DEFAULT_CRON_STAGES,
  MAX_ATTEMPTS,
  crmEventId,
  crmEventsMode,
  crmUserData,
  cronStages,
  eventIdFromLedgerKey,
  isWonTrace,
  ledgerKey,
  matchBookings,
  metaPhone,
  planCrmEvents,
  rawLeadServerEvent,
  retryCandidates,
  stageServerEvent,
  stalePending,
  validLeadId,
  type ActivityRow,
  type BookingRow,
  type ContactInfo,
  type CrmStage,
  type LeadRef,
  type LedgerRow,
} from "./crm-events-rules";

const NOW = new Date("2026-10-06T12:00:00.000Z");
const L1 = "1640270130884641";
const L2 = "1640270130884642";
const L3 = "1640270130884643";

const contact = (id: string, over: Partial<ContactInfo> = {}): ContactInfo => ({
  id,
  stage: "discovery",
  email: `${id}@example.com`,
  phone: "+359888123456",
  full_name: "Иван Петров",
  ...over,
});

const act = (contact_id: string, activity_type: string, created_at: string, over: Partial<ActivityRow> = {}): ActivityRow => ({
  contact_id,
  activity_type,
  title: null,
  created_at,
  created_by: "Димитър",
  metadata: null,
  ...over,
});

function plan(input: {
  leads: LeadRef[];
  contacts: ContactInfo[];
  activities?: ActivityRow[];
  bookings?: BookingRow[];
  claimed?: string[];
  stages?: CrmStage[];
}) {
  return planCrmEvents({
    leads: input.leads,
    contacts: input.contacts,
    activities: input.activities ?? [],
    bookings: input.bookings ?? [],
    alreadyClaimed: new Set(input.claimed ?? []),
    stages: input.stages ?? DEFAULT_CRON_STAGES,
    now: NOW,
  });
}

describe("режимът и етапите", () => {
  it("по подразбиране е изключено; dry и 1 се разпознават", () => {
    expect(crmEventsMode(undefined)).toBe("off");
    expect(crmEventsMode("")).toBe("off");
    expect(crmEventsMode("0")).toBe("off");
    expect(crmEventsMode("false")).toBe("off");
    expect(crmEventsMode("dry")).toBe("dry");
    expect(crmEventsMode(" DRY ")).toBe("dry");
    expect(crmEventsMode("1")).toBe("live");
    expect(crmEventsMode("on")).toBe("live");
    expect(crmEventsMode("live")).toBe("live");
  });

  it("кронът праща среща и спечелен; квалифициран — само ако е поискан", () => {
    expect(cronStages(undefined)).toEqual(["meeting", "won"]);
    expect(cronStages("qualified, meeting,won")).toEqual(["qualified", "meeting", "won"]);
    expect(cronStages("meeting")).toEqual(["meeting"]);
    // „lead“ не е за крона (праща го webhook-ът), боклукът пада към подразбирането
    expect(cronStages("lead")).toEqual(DEFAULT_CRON_STAGES);
    expect(cronStages("xyz")).toEqual(DEFAULT_CRON_STAGES);
  });

  it("id-тата: Lead пази id-то на webhook-а, етапите са по лийд", () => {
    expect(crmEventId("lead", L1)).toBe(`metalead_${L1}`);
    expect(crmEventId("meeting", L1)).toBe(`crm_meeting_${L1}`);
    expect(eventIdFromLedgerKey(ledgerKey(`crm_won_${L1}`))).toBe(`crm_won_${L1}`);
    expect(eventIdFromLedgerKey("lead_reminder:x:1")).toBeNull();
  });

  it("lead_id: само цифри", () => {
    expect(validLeadId(L1)).toBe(true);
    expect(validLeadId("12345678901234567")).toBe(true);
    expect(validLeadId("abc")).toBe(false);
    expect(validLeadId("")).toBe(false);
    expect(validLeadId(null)).toBe(false);
  });
});

describe("хората", () => {
  it("телефонът е с кода на страната, без водещи нули", () => {
    expect(metaPhone("0888 123 456")).toBe("359888123456");
    expect(metaPhone("+359 88 812 3456")).toBe("359888123456");
    expect(metaPhone("00359888123456")).toBe("359888123456");
    expect(metaPhone("888123456")).toBe("359888123456");
    expect(metaPhone("+44 7700 900123")).toBe("447700900123");
    expect(metaPhone("0044 7700 900123")).toBe("447700900123");
    expect(metaPhone("12")).toBeNull();
    expect(metaPhone(null)).toBeNull();
  });

  it("user_data: lead_id + имейл/телефон/име; празният имейл от екипа не се праща", () => {
    const u = crmUserData(contact("c1", { email: "Bez-Imeil@promarketing.pw", phone: "0888 123 456", full_name: "Мария Иванова Петрова" }), L1);
    expect(u).toEqual({
      email: null,
      phone: "359888123456",
      firstName: "Мария",
      lastName: "Иванова Петрова",
      country: "bg",
      external_id: "c1",
      lead_id: L1,
    });
    expect(crmUserData(contact("c2", { email: " Ivan@Example.com " }), L1).email).toBe("ivan@example.com");
  });

  it("CRM събитието за етап е system_generated с event_source crm", () => {
    const [e] = plan({
      leads: [{ contactId: "c1", metaLeadId: L1, leadTime: "2026-10-01T09:00:00.000Z" }],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.000Z")],
    }).events;
    const s = stageServerEvent(e, contact("c1"));
    expect(s.action_source).toBe("system_generated");
    expect(s.event_name).toBe("Meeting Booked");
    expect(s.event_id).toBe(`crm_meeting_${L1}`);
    expect(s.custom_data).toEqual({ event_source: "crm", lead_event_source: "Pro Marketing CRM" });
    expect(s.user_data?.lead_id).toBe(L1);
  });

  it("суровият лийд: името и id-то на webhook-а + CRM полетата", () => {
    const s = rawLeadServerEvent({
      leadgenId: L1,
      createdTime: "2026-10-05T20:05:15+0000",
      contactId: "c1",
      email: "a@b.bg",
      phone: "+359888123456",
      fullName: "Иван",
      adId: "ad1",
      campaignId: "camp1",
    });
    expect(s.event_name).toBe("Lead");
    expect(s.event_id).toBe(`metalead_${L1}`);
    expect(s.action_source).toBe("system_generated");
    expect(s.event_time).toBe(Math.floor(Date.parse("2026-10-05T20:05:15Z") / 1000));
    expect(s.custom_data).toEqual({ lead_source: "meta_instant_form", ad_id: "ad1", campaign_id: "camp1", ...CRM_CUSTOM_DATA });
    expect(s.user_data).toMatchObject({ lead_id: L1, phone: "359888123456", email: "a@b.bg", external_id: "c1" });
  });
});

describe("следите", () => {
  it("спечелен: плащане, фактура, договор, смяна на етапа към won", () => {
    expect(isWonTrace({ activity_type: "payment_received", title: null, metadata: null })).toBe(true);
    expect(isWonTrace({ activity_type: "invoice", title: null, metadata: null })).toBe(true);
    expect(isWonTrace({ activity_type: "contract_signed", title: null, metadata: null })).toBe(true);
    expect(isWonTrace({ activity_type: "stage_change", title: "Етап: offer_sent → won", metadata: { to: "won" } })).toBe(true);
    // админът пише само заглавие, без metadata.to
    expect(isWonTrace({ activity_type: "stage_change", title: "Статус: negotiating → won", metadata: null })).toBe(true);
    expect(isWonTrace({ activity_type: "stage_change", title: "Статус: lead → contacted", metadata: null })).toBe(false);
    expect(isWonTrace({ activity_type: "offer_created", title: null, metadata: null })).toBe(false);
  });

  it("резервациите се връзват по имейл или по последните 9 цифри; празният имейл не връзва", () => {
    const contacts = [contact("c1", { email: null, phone: "0888 123 456" }), contact("c2", { email: "x@y.bg", phone: null })];
    const m = matchBookings(contacts, [
      { attendee_email: "bez-imeil@promarketing.pw", attendee_phone: "+359 888 123 456", status: "accepted", created_at: "2026-10-02T10:00:00.000Z" },
      { attendee_email: "X@Y.bg", attendee_phone: null, status: "pending", created_at: "2026-10-02T11:00:00.000Z" },
      { attendee_email: "bez-imeil@promarketing.pw", attendee_phone: "0899 000 000", status: "accepted", created_at: "2026-10-02T12:00:00.000Z" },
    ]);
    expect(m.get("c1")?.length).toBe(1);
    expect(m.get("c2")?.length).toBe(1);
    expect([...m.values()].flat().length).toBe(2);
  });
});

describe("планът", () => {
  const lead = (contactId: string, metaLeadId: string, leadTime: string): LeadRef => ({ contactId, metaLeadId, leadTime });

  it("записаната среща тръгва с времето, когато е записана — не с часа на срещата", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.000Z", { metadata: { outcome: "meeting" } })],
    });
    expect(p.events).toHaveLength(1);
    expect(p.events[0]).toMatchObject({
      stage: "meeting",
      eventId: `crm_meeting_${L1}`,
      eventName: "Meeting Booked",
      eventTime: Date.parse("2026-10-02T10:00:00.000Z") / 1000,
      contactId: "c1",
      metaLeadId: L1,
    });
  });

  it("само първата среща — втората не е нов етап", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-03T10:00:00.000Z"), act("c1", "meeting", "2026-10-02T10:00:00.000Z", { created_by: "hermes" })],
    });
    expect(p.events).toHaveLength(1);
    expect(p.events[0].eventTime).toBe(Date.parse("2026-10-02T10:00:00.000Z") / 1000);
    expect(p.events[0].source).toBe("meeting · hermes");
  });

  it("по-стара от 7 дни → не се праща (Meta я изхвърля)", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-09-25T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-09-28T10:00:00.000Z")],
    });
    expect(p.events).toHaveLength(0);
    expect(p.skipped).toEqual([{ stage: "meeting", contactId: "c1", metaLeadId: L1, reason: "too_old" }]);
  });

  it("след 28-дневния прозорец → не се праща", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-09-03T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.000Z")],
    });
    expect(p.events).toHaveLength(0);
    expect(p.skipped[0].reason).toBe("after_window");
  });

  it("среща отпреди лийда не се брои", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-03T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-01T10:00:00.000Z")],
    });
    expect(p.events).toHaveLength(0);
    expect(p.skipped).toHaveLength(0);
  });

  it("попълнил формата втори път → срещата е на новия лийд, не на стария", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-09-20T09:00:00.000Z"), lead("c1", L2, "2026-10-02T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-03T10:00:00.000Z")],
    });
    expect(p.events.map((e) => e.metaLeadId)).toEqual([L2]);
  });

  it("вече пратеното не тръгва пак", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.000Z")],
      claimed: [`crm_meeting_${L1}`],
    });
    expect(p.events).toHaveLength(0);
    expect(p.alreadySent).toBe(1);
  });

  it("резервация без активност (Cal.com, синхронът) също е среща; отменената — не", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z"), lead("c2", L2, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1", { email: null, phone: "0888 111 222" }), contact("c2", { email: "c2@x.bg" })],
      bookings: [
        { attendee_email: "bez-imeil@promarketing.pw", attendee_phone: "+359888111222", status: "accepted", created_at: "2026-10-02T08:00:00.000Z" },
        { attendee_email: "c2@x.bg", attendee_phone: null, status: "cancelled", created_at: "2026-10-02T08:00:00.000Z" },
      ],
    });
    expect(p.events.map((e) => e.contactId)).toEqual(["c1"]);
    expect(p.events[0].source).toBe("booking · accepted");
  });

  it("Cal.com активност „booking“: отменената не е среща", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [
        act("c1", "booking", "2026-10-02T08:00:00.000Z", { created_by: null, metadata: { status: "cancelled", trigger: "BOOKING_CANCELLED" } }),
      ],
    });
    expect(p.events).toHaveLength(0);
    const ok = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "booking", "2026-10-02T08:00:00.000Z", { created_by: null, metadata: { status: "accepted", trigger: "BOOKING_CREATED" } })],
    });
    expect(ok.events).toHaveLength(1);
  });

  it("спечелен: картонът е won и има следа с дата след лийда", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-09-20T09:00:00.000Z")],
      contacts: [contact("c1", { stage: "won" })],
      activities: [act("c1", "invoice", "2026-10-03T10:00:00.000Z", { created_by: "hermes" }), act("c1", "payment_received", "2026-10-04T10:00:00.000Z", { created_by: "hermes" })],
    });
    const won = p.events.filter((e) => e.stage === "won");
    expect(won).toHaveLength(1);
    expect(won[0]).toMatchObject({ eventName: "Won", eventId: `crm_won_${L1}`, eventTime: Date.parse("2026-10-03T10:00:00.000Z") / 1000 });
  });

  it("спечелен без следа → не се праща, а се казва в отчета", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-09-30T09:00:00.000Z")],
      contacts: [contact("c1", { stage: "won" })],
    });
    expect(p.events).toHaveLength(0);
    expect(p.skipped).toEqual([{ stage: "won", contactId: "c1", metaLeadId: L1, reason: "won_no_date" }]);
  });

  it("фактура без етап won не е „спечелен“; стар клиент, попълнил формата пак — също не", () => {
    const notWon = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1", { stage: "offer_sent" })],
      activities: [act("c1", "invoice", "2026-10-03T10:00:00.000Z")],
    });
    expect(notWon.events).toHaveLength(0);
    const oldClient = plan({
      leads: [lead("c1", L1, "2026-10-03T09:00:00.000Z")],
      contacts: [contact("c1", { stage: "won" })],
      activities: [act("c1", "payment_received", "2026-10-01T10:00:00.000Z")],
    });
    expect(oldClient.events).toHaveLength(0);
    expect(oldClient.skipped).toHaveLength(0);
  });

  it("квалифициран (по желание): първият истински разговор; „не вдига“ и автоматиките не се броят", () => {
    const leads = [lead("c1", L1, "2026-10-01T09:00:00.000Z")];
    const activities = [
      act("c1", "call", "2026-10-01T10:00:00.000Z", { metadata: { outcome: "no_answer", team: true } }),
      act("c1", "call", "2026-10-01T11:00:00.000Z", { created_by: "hermes" }),
      act("c1", "call", "2026-10-01T12:00:00.000Z", { metadata: { outcome: "callback", team: true } }),
      act("c1", "meeting", "2026-10-02T10:00:00.000Z"),
    ];
    expect(plan({ leads, contacts: [contact("c1")], activities }).events.map((e) => e.stage)).toEqual(["meeting"]);
    const p = plan({ leads, contacts: [contact("c1")], activities, stages: ["qualified", "meeting", "won"] });
    expect(p.events.map((e) => [e.stage, e.eventName])).toEqual([
      ["qualified", "Qualified Lead"],
      ["meeting", "Meeting Booked"],
    ]);
    expect(p.events[0].eventTime).toBe(Date.parse("2026-10-01T12:00:00.000Z") / 1000);
  });

  it("квалифициран без разговор преди срещата → в момента на срещата", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.000Z")],
      stages: ["qualified"],
    });
    expect(p.events).toHaveLength(1);
    expect(p.events[0]).toMatchObject({ stage: "qualified", eventTime: Date.parse("2026-10-02T10:00:00.000Z") / 1000 });
  });

  it("времето е винаги СЛЕД лийда, дори в същата секунда", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-02T10:00:00.100Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.900Z")],
    });
    expect(p.events[0].eventTime).toBe(Math.floor(Date.parse("2026-10-02T10:00:00.100Z") / 1000) + 1);
  });

  it("лийд без валиден lead_id и изтрит картон се пропускат", () => {
    const p = plan({
      leads: [lead("c1", "abc", "2026-10-01T09:00:00.000Z"), lead("gone", L3, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1")],
      activities: [act("c1", "meeting", "2026-10-02T10:00:00.000Z"), act("gone", "meeting", "2026-10-02T10:00:00.000Z")],
    });
    expect(p.events).toHaveLength(0);
    expect(p.skipped.map((s) => s.reason).sort()).toEqual(["invalid_lead_id", "invalid_lead_id", "no_contact", "no_contact"]);
  });

  it("събитията са подредени по време", () => {
    const p = plan({
      leads: [lead("c1", L1, "2026-10-01T09:00:00.000Z"), lead("c2", L2, "2026-10-01T09:00:00.000Z")],
      contacts: [contact("c1"), contact("c2")],
      activities: [act("c1", "meeting", "2026-10-04T10:00:00.000Z"), act("c2", "meeting", "2026-10-02T10:00:00.000Z")],
    });
    expect(p.events.map((e) => e.contactId)).toEqual(["c2", "c1"]);
  });
});

describe("дневникът", () => {
  const row = (over: Partial<LedgerRow> & { detail?: Record<string, unknown> }): LedgerRow => ({
    id: "r1",
    idempotency_key: ledgerKey(`crm_meeting_${L1}`),
    status: "failed",
    created_at: "2026-10-05T10:00:00.000Z",
    ...over,
    detail: {
      state: "rejected",
      event_time: Math.floor(Date.parse("2026-10-05T10:00:00.000Z") / 1000),
      payload: { event_name: "Meeting Booked" },
      attempts: 1,
      last_attempt_at: "2026-10-05T10:00:00.000Z",
      ...(over.detail ?? {}),
    },
  });

  it("пак се праща само изрично отказаното, не по-често от 6 ч и до 7 дни", () => {
    expect(retryCandidates([row({})], NOW)).toHaveLength(1);
    // без отговор или прекъснато — може вече да е стигнало, не се повтаря
    expect(retryCandidates([row({ detail: { state: "unknown" } })], NOW)).toHaveLength(0);
    expect(retryCandidates([row({ detail: { state: "pending" } })], NOW)).toHaveLength(0);
    expect(retryCandidates([row({ status: "success", detail: { state: "sent" } })], NOW)).toHaveLength(0);
    expect(retryCandidates([row({ detail: { last_attempt_at: "2026-10-06T08:00:00.000Z" } })], NOW)).toHaveLength(0);
    expect(retryCandidates([row({ detail: { attempts: MAX_ATTEMPTS } })], NOW)).toHaveLength(0);
    expect(retryCandidates([row({ detail: { event_time: Math.floor(Date.parse("2026-09-28T10:00:00.000Z") / 1000) } })], NOW)).toHaveLength(0);
  });

  it("прекъснатите пращания се броят за проверка", () => {
    expect(stalePending([row({ detail: { state: "pending" } }), row({ created_at: "2026-10-06T11:55:00.000Z", detail: { state: "pending" } })], NOW)).toBe(1);
  });
});
