import { describe, it, expect } from "vitest";
import {
  companyFromEmail,
  isOfferActivity,
  minStageFromActivities,
  parseEurAmount,
  planContactFixes,
  planOfferFromActivities,
  type ActivityLike,
  type ContactLike,
} from "./consistency-rules";

const NOW = new Date("2026-09-05T09:00:00Z");
const act = (activity_type: string, occurred_at: string, title = "", body = ""): ActivityLike => ({
  id: `${activity_type}-${occurred_at}`,
  activity_type,
  title,
  body,
  occurred_at,
});
const contact = (over: Partial<ContactLike> = {}): ContactLike => ({
  id: "c1",
  full_name: "Иван",
  email: "ivan@gmail.com",
  phone: "0888",
  company: null,
  stage: "lead",
  followup_status: null,
  next_followup_at: null,
  last_heard_from_at: null,
  deal_value_eur: null,
  ...over,
});

describe("фирмата от домейна", () => {
  it("фирмен домейн → домейнът; публична поща → нищо", () => {
    expect(companyFromEmail("office@tus-bg.com")).toBe("tus-bg.com");
    expect(companyFromEmail("Ivan@ABV.bg")).toBe(null);
    expect(companyFromEmail("x@gmail.com")).toBe(null);
    expect(companyFromEmail("x@mail.firma.bg")).toBe("firma.bg");
    expect(companyFromEmail(null)).toBe(null);
    expect(companyFromEmail("без-имейл")).toBe(null);
  });
});

describe("сумата от текста на офертата", () => {
  it("чете български записи и взима сделката, не абонамента", () => {
    expect(parseEurAmount("Изпратена оферта · 3 000 €")).toBe(3000);
    expect(parseEurAmount("890 € еднократно · 4 работни дни")).toBe(890);
    expect(parseEurAmount("AI агент: 800 € + 80 €/мес")).toBe(800);
    expect(parseEurAmount("1 500 + 1 500 € за програмата")).toBe(1500);
    expect(parseEurAmount("€ 2 400 внедряване, 290 €/мес")).toBe(2400);
    expect(parseEurAmount("Оферта без сума")).toBe(null);
    expect(parseEurAmount("12,78 € книга")).toBe(null); // под 100 € не е сделка
  });
});

describe("кое е оферта", () => {
  it(`offer_sent винаги; ръчен имейл с „оферта" в заглавието — да; поредицата — никога`, () => {
    expect(isOfferActivity(act("offer_sent", "2026-09-01T10:00:00Z"))).toBe(true);
    expect(isOfferActivity(act("email_sent", "2026-09-01T10:00:00Z", "📤 ИЗПРАТЕНА ОФЕРТА · „За чантите“"))).toBe(true);
    expect(isOfferActivity(act("email_sent", "2026-09-01T10:00:00Z", "Поредица · Оставям ти вратата отворена"))).toBe(false);
    expect(isOfferActivity(act("email_sent", "2026-09-01T10:00:00Z", "Ето сайта и живото демо"))).toBe(false);
    expect(isOfferActivity(act("offer_ready", "2026-09-01T10:00:00Z", "Готова оферта · НЕ Е ИЗПРАТЕНА"))).toBe(false);
  });

  it("етапът следва от случилото се", () => {
    expect(minStageFromActivities([act("call", "2026-09-01T10:00:00Z")])).toBe("contacted");
    expect(minStageFromActivities([act("email_sent", "2026-09-01T10:00:00Z", "ИЗПРАТЕНА ОФЕРТА · X")])).toBe("offer_sent");
    expect(minStageFromActivities([act("contract_sent", "2026-09-01T10:00:00Z")])).toBe("negotiating");
    expect(minStageFromActivities([act("payment_received", "2026-09-01T10:00:00Z")])).toBe("won");
    expect(minStageFromActivities([act("note", "2026-09-01T10:00:00Z")])).toBe(null);
  });
});

describe("планът за един картон", () => {
  it("lead с обаждане и изпратена оферта → offer_sent, стойност от текста, статус не се пипа", () => {
    const acts = [
      act("call", "2026-09-01T10:00:00Z", "Вдигна"),
      act("email_sent", "2026-09-02T10:00:00Z", "📤 ИЗПРАТЕНА ОФЕРТА · „Три нива“", "Токът 490 € · Доверието 890 € · Машината 1 690 €"),
    ];
    const fixes = planContactFixes(contact({ followup_status: "sent_offer" }), acts, [], [], NOW);
    expect(fixes.find((f) => f.field === "stage")?.to).toBe("offer_sent");
    expect(fixes.find((f) => f.field === "deal_value_eur")?.to).toBe(1690);
    expect(fixes.find((f) => f.field === "followup_status")).toBeUndefined();
  });

  it(`спечеленият губи „да се обади" и напомнянето, и взима стойността от фактурите`, () => {
    const fixes = planContactFixes(
      contact({ stage: "won", followup_status: "needs_call", next_followup_at: "2026-09-01T10:00:00Z" }),
      [],
      [],
      [{ amount_gross: 350, amount_net: 291.67, status: "paid" }],
      NOW
    );
    expect(fixes.map((f) => f.field).sort()).toEqual(["deal_value_eur", "followup_status", "next_followup_at"]);
    expect(fixes.find((f) => f.field === "deal_value_eur")?.to).toBe(350);
  });

  it(`изпълненото напомняне се маха; срещата слага „чут"`, () => {
    const acts = [act("meeting", "2026-09-03T08:00:00Z", "Среща")];
    const fixes = planContactFixes(contact({ stage: "contacted", next_followup_at: "2026-09-02T09:00:00Z" }), acts, [], [], NOW);
    expect(fixes.find((f) => f.field === "next_followup_at")?.to).toBe(null);
    expect(fixes.find((f) => f.field === "last_heard_from_at")?.to).toBe("2026-09-03T08:00:00Z");
  });

  it("неизпълнено напомняне остава — нищо не се измисля", () => {
    const acts = [act("call", "2026-09-01T10:00:00Z", "не вдига")];
    const fixes = planContactFixes(contact({ stage: "contacted", next_followup_at: "2026-09-03T09:00:00Z" }), acts, [], [], NOW);
    expect(fixes.find((f) => f.field === "next_followup_at")).toBeUndefined();
  });

  it(`само писано → статус „изпратен имейл"; фирмен имейл → фирма`, () => {
    const acts = [act("email_sent", "2026-09-01T10:00:00Z", "Поредица · Ето ти демотата")];
    const fixes = planContactFixes(contact({ email: "office@tus-bg.com" }), acts, [], [], NOW);
    expect(fixes.find((f) => f.field === "followup_status")?.to).toBe("sent_email");
    expect(fixes.find((f) => f.field === "company")?.to).toBe("tus-bg.com");
    expect(fixes.find((f) => f.field === "stage")).toBeUndefined();
  });

  it("загубеният не се мести напред, дори да има оферта", () => {
    const acts = [act("offer_sent", "2026-09-01T10:00:00Z", "Оферта")];
    const fixes = planContactFixes(contact({ stage: "lost", followup_status: "not_interested" }), acts, [], [], NOW);
    expect(fixes.find((f) => f.field === "stage")).toBeUndefined();
  });

  it("верният картон няма корекции", () => {
    const acts = [act("call", "2026-09-01T10:00:00Z")];
    const fixes = planContactFixes(contact({ stage: "contacted", followup_status: "needs_call", company: "X", deal_value_eur: 500 }), acts, [], [], NOW);
    expect(fixes).toEqual([]);
  });
});

describe("оферта от изпратения имейл", () => {
  it(`прави запис за секцията „Оферти", ако няма такъв`, () => {
    const acts = [
      act("email_sent", "2026-09-02T10:00:00Z", "📤 ИЗПРАТЕНА ОФЕРТА · „За чантите — 5-6 часа на модел е проблемът“", "800 € агент + 80 €/мес"),
    ];
    const o = planOfferFromActivities(acts, 0)!;
    expect(o.title).toBe("„За чантите — 5-6 часа на модел е проблемът“");
    expect(o.amount).toBe(800);
    expect(o.sent_at).toBe("2026-09-02T10:00:00Z");
    expect(planOfferFromActivities(acts, 1)).toBe(null);
    expect(planOfferFromActivities([act("call", "2026-09-02T10:00:00Z")], 0)).toBe(null);
  });
});
