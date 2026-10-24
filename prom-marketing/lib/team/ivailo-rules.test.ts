import { describe, expect, it } from "vitest";
import {
  AKADEMIA_SOURCE,
  claimLabel,
  indexBookings,
  isAkademiaMessage,
  isAkademiaSignal,
  isIvailoTalk,
  ivailoClaim,
  type BookingRef,
  type ContactRef,
  type SignalRow,
} from "./ivailo-rules";

const NOW = new Date("2026-10-06T12:00:00Z");
const team = { team: true, team_member_id: "m1", team_member_slug: "dimitar" };

function act(activity_type: string, occurred_at: string, title: string, extra: Partial<SignalRow> = {}): SignalRow {
  return { contact_id: "c", activity_type, title, occurred_at, created_by: "hermes", metadata: {}, ...extra };
}

function booking(id: string, scheduled_at: string, status: string, who: { email?: string | null; phone?: string | null }, created_at?: string): BookingRef {
  return { id, status, scheduled_at, created_at: created_at ?? null, attendee_email: who.email ?? null, attendee_phone: who.phone ?? null };
}

const person: ContactRef = { id: "c", email: "ivan@abv.bg", phone: "+359888111222", source: "meta_lead", created_at: "2026-09-20T10:00:00Z" };

describe("Академията", () => {
  it("заявката през формата на сайта е знак (Катерина Чолакова, 02.10)", () => {
    const form = act("website_form", "2026-10-02T13:23:52Z", "Изпрати форма от уебсайта", {
      created_by: "website",
      body: "Фирма/дейност: психолог\nСъобщение: Академия · Заявка за достъп\nКатерина Чолакова, …: Чака отключване",
      metadata: { message: "Академия · Заявка за достъп\nКатерина Чолакова…" },
    });
    expect(isAkademiaSignal(form)).toBe(true);
    expect(ivailoClaim(person, [form], [], { now: NOW })).toMatchObject({ why: "akademia" });
  });

  it("картон с източник „akademia“ е на Ивайло и без активности", () => {
    expect(ivailoClaim({ ...person, source: AKADEMIA_SOURCE }, [], [], { now: NOW })?.why).toBe("akademia");
  });

  it("записът от самата Академия и бележката на Клод са знак", () => {
    expect(isAkademiaSignal(act("note", "2026-10-05T08:09:49Z", "Академия · нов член", { created_by: "akademia" }))).toBe(true);
    expect(isAkademiaSignal(act("note", "2026-10-05T08:09:49Z", "Регистрира се в Академията — чака отключване", { created_by: "claude" }))).toBe(true);
  });

  it("бележка на екипа „иска Академията“ НЕ прави човека член", () => {
    expect(isAkademiaSignal(act("note", "2026-10-05T08:09:49Z", "Иска Академията", { created_by: "Димитър", metadata: team }))).toBe(false);
  });

  it("обикновена форма от сайта не е Академия", () => {
    const form = act("website_form", "2026-10-02T13:23:52Z", "Изпрати форма от уебсайта", { body: "Съобщение: Искам сайт" });
    expect(isAkademiaSignal(form)).toBe(false);
    expect(isAkademiaMessage("Академия · Заявка за достъп")).toBe(true);
    expect(isAkademiaMessage("Искам сайт за академия по танци")).toBe(false);
  });
});

describe("разговор с Ивайло", () => {
  it("записаният разговор е знак, „нямаше разговор“ не е", () => {
    expect(isIvailoTalk(act("call", "2026-09-10T12:23:00Z", "📞 Разговор с Ивайло · Говорихме · 10.09.2026", { created_by: "ivailo" }))).toBe(true);
    expect(isIvailoTalk(act("call", "2026-10-06T09:00:00Z", "📞 Разговор · 4 мин · звъня ти", { created_by: "claude" }))).toBe(true);
    expect(isIvailoTalk(act("call", "2026-09-02T13:00:00Z", "Звъннах · не вдига"))).toBe(false);
    expect(isIvailoTalk(act("call", "2026-09-08T09:30:00Z", "📵 Звъннах · телефонът е изключен или извън покритие"))).toBe(false);
    expect(isIvailoTalk(act("call", "2026-10-06T09:00:00Z", "📲 Пропуснато обаждане от Иван", { created_by: "claude" }))).toBe(false);
    expect(isIvailoTalk(act("call", "2026-10-06T09:00:00Z", "📞 Не вдигна", { created_by: "claude" }))).toBe(false);
    expect(isIvailoTalk(act("call", "2026-08-21T08:06:00Z", "Остави съобщение", { created_by: "ivailo", metadata: { outcome: "voicemail" } }))).toBe(false);
  });

  it("разговорът на Димитър не е разговор с Ивайло", () => {
    expect(isIvailoTalk(act("call", "2026-10-05T13:20:00Z", "Говорихме · без среща засега", { created_by: "Димитър", metadata: { ...team, outcome: "talked" } }))).toBe(false);
  });

  it("говорил с Ивайло → човек на Ивайло", () => {
    const rows = [act("call", "2026-09-10T12:23:00Z", "📞 Разговор с Ивайло · Говорихме", { created_by: "ivailo" })];
    expect(ivailoClaim(person, rows, [], { now: NOW })).toMatchObject({ why: "talked", reason: "🤝 говорил е с Ивайло" });
  });
});

describe("изричното „дай на екипа“ от Ивайло", () => {
  const talk = act("call", "2026-09-10T12:23:00Z", "📞 Разговор с Ивайло · Говорихме", { created_by: "ivailo" });
  const give = (at: string, kind = "given"): SignalRow =>
    act("team_assigned", at, "🤝 Дадено на Димитър за звънене", { created_by: "Ивайло", metadata: { kind, to_team: true } });

  it("дадено СЛЕД разговора — остава при екипа (хората от 17.09)", () => {
    expect(ivailoClaim(person, [talk, give("2026-09-17T12:25:26Z")], [], { now: NOW })).toBeNull();
  });

  it("стар маркер без вид (отпреди 22.09) също е изрично даване", () => {
    const old = act("team_assigned", "2026-09-17T12:25:26Z", "🤝", { created_by: "Ивайло", metadata: { to_team: true } });
    expect(ivailoClaim(person, [talk, old], [], { now: NOW })).toBeNull();
  });

  it("говорили СЛЕД даването — пак е на Ивайло", () => {
    const later = act("call", "2026-09-20T09:00:00Z", "📞 Разговор · 6 мин", { created_by: "claude" });
    expect(ivailoClaim(person, [talk, give("2026-09-17T12:25:26Z"), later], [], { now: NOW })?.why).toBe("talked");
  });

  it("„не се яви“ и „отказа срещата“ не са изрично даване", () => {
    const noshowBooking = booking("b1", "2026-10-01T10:00:00Z", "no_show", { phone: "0888111222" }, "2026-09-29T09:00:00Z");
    expect(ivailoClaim(person, [give("2026-10-02T04:41:27Z", "noshow")], [noshowBooking], { now: NOW })?.why).toBe("meeting");
  });
});

describe("среща в календара на Ивайло", () => {
  it("предстояща среща (друг формат на телефона) → човек на Ивайло, надписът казва кога", () => {
    const b = booking("b1", "2026-10-08T13:15:00Z", "accepted", { phone: "0888 111 222" }, "2026-10-05T18:00:00Z");
    const c = ivailoClaim(person, [], [b], { now: NOW });
    expect(c).toMatchObject({ why: "meeting", meetingAt: "2026-10-08T13:15:00Z" });
    expect(c?.reason).toMatch(/^📅 има среща с Ивайло · /);
  });

  it("проведена или „не се яви“ → човек на Ивайло (Subay, 01.10)", () => {
    const rows = [
      act("meeting", "2026-10-01T12:30:00Z", "Среща · чт 01.10, 15:30 · записа Димитър", {
        created_by: "Димитър",
        metadata: { ...team, outcome: "meeting", booking_id: "b-subay" },
      }),
    ];
    // Срещата на екипа се намира и по id, дори имейлът в срещата да е друг.
    const b = booking("b-subay", "2026-10-01T10:00:00Z", "no_show", { email: "drug@abv.bg" }, "2026-09-30T13:00:00Z");
    expect(ivailoClaim(person, rows, indexBookings([b]), { now: NOW })?.why).toBe("meeting");
  });

  it("отменена преди часа → не е стояла в календара, остава за екипа (❌ Отказаха срещата)", () => {
    const b = booking("b1", "2026-10-07T09:00:00Z", "cancelled", { email: "ivan@abv.bg" });
    expect(ivailoClaim(person, [], [b], { now: NOW })).toBeNull();
  });

  it("среща на друг човек не се брои", () => {
    const b = booking("b1", "2026-10-07T09:00:00Z", "accepted", { email: "drug@abv.bg", phone: "0899000111" });
    expect(ivailoClaim(person, [], [b], { now: NOW })).toBeNull();
  });

  it("за напомнянето: само знаци отпреди днес и без самата среща", () => {
    const upcoming = booking("b2", "2026-10-07T09:00:00Z", "accepted", { email: "ivan@abv.bg" });
    const past = booking("b0", "2026-09-25T09:00:00Z", "completed", { email: "ivan@abv.bg" });
    const opts = { now: NOW, before: NOW, ignoreBookingId: "b2" };
    expect(ivailoClaim(person, [], [upcoming], opts)).toBeNull();
    expect(ivailoClaim(person, [], [upcoming, past], opts)?.why).toBe("meeting");
  });

  it("срещата, записана от Хермес напред във времето, не е знак за напомнянето ѝ", () => {
    const hermes = act("meeting", "2026-10-07T09:00:00Z", "Среща", { created_by: "hermes" });
    expect(ivailoClaim(person, [hermes], [], { now: NOW, before: NOW })).toBeNull();
    expect(ivailoClaim(person, [hermes], [], { now: NOW })?.why).toBe("meeting");
  });
});

describe("надписът", () => {
  it("Академията е по-силна от срещата; надписът е за Димитър", () => {
    const b = booking("b1", "2026-10-08T13:15:00Z", "accepted", { email: "ivan@abv.bg" });
    const c = ivailoClaim({ ...person, source: AKADEMIA_SOURCE }, [], [b], { now: NOW });
    expect(c?.why).toBe("akademia");
    expect(c?.label).toBe("🎓 В Академията е — човек на Ивайло. Не му звъни.");
    expect(claimLabel("🤝 говорил е с Ивайло")).toBe("🤝 Говорил е с Ивайло — човек на Ивайло. Не му звъни.");
  });

  it("без нито един знак — на екипа е", () => {
    expect(ivailoClaim(person, [act("call", "2026-10-05T13:00:00Z", "Не вдигна", { created_by: "Димитър", metadata: { ...team, outcome: "no_answer" } })], [], { now: NOW })).toBeNull();
  });
});

describe("„пак остави данни“ (relead) не отнема човек от Ивайло", () => {
  it("маркерът от входа на лийда не е изричното „🤝 Дай на екипа“", () => {
    const talk = act("call", "2026-10-01T10:00:00Z", "📞 Разговор с Ивайло · Говорихме", { created_by: "ivailo" });
    const relead = act("team_assigned", "2026-10-06T10:00:00Z", "🔁 Пак остави данни · Димитър да звънне", {
      created_by: "meta_webhook",
      metadata: { kind: "relead", to_team: true },
    });
    expect(ivailoClaim(person, [talk, relead], [], { now: NOW })?.why).toBe("talked");
    // за сравнение: изричното даване от Ивайло след разговора го прави на екипа
    const given = act("team_assigned", "2026-10-06T10:00:00Z", "🤝 Дадено на Димитър", { created_by: "Ивайло", metadata: { kind: "given" } });
    expect(ivailoClaim(person, [talk, given], [], { now: NOW })).toBeNull();
  });
});
