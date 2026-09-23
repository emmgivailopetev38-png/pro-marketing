import { describe, expect, it } from "vitest";
import { costPer, countFunnel, groupFunnel, isHuman, perPerson, traceLeads, weekKey, type KActivity, type KLead } from "./konversii";

const NOW = new Date("2026-09-22T07:00:00Z");

const leads: KLead[] = [
  { id: "a", source: "meta_lead", created_at: "2026-09-15T08:00:00Z", stage: "discovery", owner_id: null },
  { id: "b", source: "meta_lead", created_at: "2026-09-15T09:00:00Z", stage: "lost", owner_id: null },
  { id: "c", source: "website_form", created_at: "2026-09-16T09:00:00Z", stage: "won", owner_id: "s1" },
  { id: "d", source: "meta_lead", created_at: "2026-09-17T09:00:00Z", stage: "lead", owner_id: null },
];

const acts: KActivity[] = [
  // a: Димитър звъни (не вдига), после говорят и записва среща
  { contact_id: "a", activity_type: "call", occurred_at: "2026-09-15T08:30:00Z", created_by: "Димитър", metadata: { outcome: "no_answer" } },
  { contact_id: "a", activity_type: "call", occurred_at: "2026-09-15T11:00:00Z", created_by: "Димитър", metadata: { outcome: "meeting" } },
  { contact_id: "a", activity_type: "meeting", occurred_at: "2026-09-18T09:00:00Z", created_by: "Димитър", metadata: { outcome: "meeting" } },
  // b: само поредицата и едно „не се интересува“
  { contact_id: "b", activity_type: "email_sent", occurred_at: "2026-09-15T09:05:00Z", created_by: "lead_sequence", metadata: null },
  { contact_id: "b", activity_type: "call", occurred_at: "2026-09-16T09:00:00Z", created_by: "Димитър", metadata: { outcome: "not_interested" } },
  // c: Ивайло говори, оферта, спечелен
  { contact_id: "c", activity_type: "call", occurred_at: "2026-09-16T10:00:00Z", created_by: "ivailo", metadata: null },
  { contact_id: "c", activity_type: "offer_sent", occurred_at: "2026-09-17T10:00:00Z", created_by: "hermes", metadata: null },
];

describe("konversii", () => {
  it("автоматиките не са хора", () => {
    expect(isHuman("Димитър")).toBe(true);
    expect(isHuman("ivailo")).toBe(true);
    expect(isHuman("lead_sequence")).toBe(false);
    expect(isHuman(null)).toBe(false);
  });

  it("следата на лийда: докоснат → говорил → среща → проведена → оферта → спечелен", () => {
    const t = traceLeads(leads, acts, [{ contact_id: "c", scheduled_at: "2026-09-17T08:00:00Z", status: "completed" }], NOW);
    const a = t.find((x) => x.id === "a")!;
    expect(a).toMatchObject({ touched: true, talked: true, meeting: true, held: true, offer: false, won: false });
    expect(a.firstTouchBy).toBe("Димитър");
    expect(a.firstTouchAt).toBe("2026-09-15T08:30:00Z");
    const b = t.find((x) => x.id === "b")!;
    expect(b).toMatchObject({ touched: true, talked: false, meeting: false, lost: true });
    const c = t.find((x) => x.id === "c")!;
    expect(c).toMatchObject({ touched: true, talked: true, meeting: true, held: true, offer: true, won: true });
    const d = t.find((x) => x.id === "d")!;
    expect(d.touched).toBe(false);
    expect(countFunnel(t)).toEqual({ leads: 4, touched: 3, talked: 2, meetings: 2, held: 2, offers: 1, won: 1, lost: 1 });
  });

  it("по източник и по седмица", () => {
    const t = traceLeads(leads, acts, [], NOW);
    const bySource = groupFunnel(t, (x) => x.source);
    expect(bySource[0]).toMatchObject({ key: "meta_lead", funnel: { leads: 3, touched: 2 } });
    expect(weekKey("2026-09-22T07:00:00Z")).toBe("2026-09-21");
    expect(weekKey("2026-09-20T22:30:00Z")).toBe("2026-09-21"); // 01:30 в понеделник, София
  });

  it("кой колко е свършил", () => {
    const t = traceLeads(leads, acts, [], NOW);
    const p = perPerson(t, acts, new Set(leads.map((l) => l.id)));
    const d = p.find((x) => x.name === "Димитър")!;
    // a: 30 мин · b: 1440 мин → медиана 735
    expect(d).toMatchObject({ calls: 3, talked: 2, meetingsBooked: 1, firstTouches: 2, medianMinutesToTouch: 735 });
    const i = p.find((x) => x.name === "ivailo")!;
    expect(i).toMatchObject({ calls: 1, talked: 1, firstTouches: 1 });
  });

  it("цена на лийд/среща/клиент", () => {
    expect(costPer(300, { leads: 100, touched: 0, talked: 40, meetings: 10, held: 0, offers: 0, won: 2, lost: 0 })).toEqual({
      lead: 3,
      talked: 7.5,
      meeting: 30,
      won: 150,
    });
    expect(costPer(0, { leads: 10, touched: 0, talked: 0, meetings: 0, held: 0, offers: 0, won: 0, lost: 0 }).lead).toBeNull();
  });
});
