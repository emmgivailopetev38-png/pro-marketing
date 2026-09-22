import { describe, expect, it } from "vitest";
import { amountFor, dedupeKey, monthlyDue, periodOf, ruleFor, totalsFor, type CommissionRule } from "./commissions-rules";

const RULES: CommissionRule[] = [
  { id: "r1", service_type: "marketing", label: "10 %", kind: "percent", value: 10, basis: "monthly_fee", role: null, active: true },
  { id: "r2", service_type: "website", label: "150", kind: "fixed", value: 150, basis: "deal", role: null, active: true },
  { id: "r3", service_type: "crm_build", label: "200", kind: "fixed", value: 200, basis: "deal", role: null, active: true },
  { id: "r4", service_type: "crm_build", label: "5 % сетър", kind: "percent", value: 5, basis: "deal", role: "setter", active: true },
  { id: "r5", service_type: "training", label: "старо", kind: "fixed", value: 999, basis: "deal", role: null, active: false },
];

describe("commissions-rules", () => {
  it("уговорката: 200 € на проект, 150 € на сайт, 10 % от месечната такса", () => {
    expect(amountFor(ruleFor(RULES, "crm_build")!, 2900)).toBe(200);
    expect(amountFor(ruleFor(RULES, "website")!, 1200)).toBe(150);
    expect(amountFor(ruleFor(RULES, "marketing")!, 690)).toBe(69);
    expect(amountFor(ruleFor(RULES, "marketing")!, 333.33)).toBe(33.33);
  });

  it("правило по роля надделява, неактивните не се броят", () => {
    expect(ruleFor(RULES, "crm_build", "setter")?.id).toBe("r4");
    expect(ruleFor(RULES, "crm_build", "sales")?.id).toBe("r3");
    expect(ruleFor(RULES, "training")).toBeNull();
  });

  it("ключът пази от двойно начисляване; месечните носят месеца", () => {
    expect(dedupeKey({ memberId: "m", contactId: "c", serviceType: "website" })).toBe("m:c:website");
    expect(dedupeKey({ memberId: "m", contactId: null, serviceType: "website" })).toBe("m:no-contact:website");
    expect(dedupeKey({ memberId: "m", contactId: "c", serviceType: "marketing", period: "2026-09" })).toBe("m:c:marketing:2026-09");
    expect(periodOf(new Date("2026-09-30T22:30:00Z"))).toBe("2026-10"); // 01:30 на 1 октомври в София
  });

  it("сборовете: отменените не влизат", () => {
    const t = totalsFor([
      { member_id: "m", amount: 200, status: "due", period: null, created_at: "" },
      { member_id: "m", amount: 69, status: "paid", period: "2026-09", created_at: "" },
      { member_id: "m", amount: 50, status: "cancelled", period: null, created_at: "" },
    ]);
    expect(t).toEqual({ due: 200, approved: 0, paid: 69, total: 269 });
  });

  it("месечните: само активни услуги с отговорник, от вида реклами/поддръжка, в месеца", () => {
    const owners = new Map<string, string | null>([
      ["c1", "sales1"],
      ["c2", null],
    ]);
    const due = monthlyDue(
      [
        { id: "s1", contact_id: "c1", service_type: "ads", amount: 350, active: true, started_at: "2026-09-01", ended_at: null },
        { id: "s2", contact_id: "c2", service_type: "ads", amount: 350, active: true, started_at: null, ended_at: null },
        { id: "s3", contact_id: "c1", service_type: "gps", amount: 100, active: true, started_at: null, ended_at: null },
        { id: "s4", contact_id: "c1", service_type: "maintenance", amount: 150, active: true, started_at: "2026-10-01", ended_at: null },
        { id: "s5", contact_id: "c1", service_type: "maintenance", amount: 150, active: true, started_at: null, ended_at: "2026-08-31" },
      ],
      owners,
      "2026-09"
    );
    expect(due).toEqual([{ serviceId: "s1", contactId: "c1", memberId: "sales1", base: 350, serviceType: "marketing" }]);
  });
});
