import { describe, expect, it } from "vitest";
import {
  REVSTREAM_TERMS,
  canManage,
  dealSplit,
  feeInstallment,
  feeRemaining,
  isSalesTeam,
  phoneKey9,
  seesMoneyOf,
  statementTotals,
  type DealRow,
} from "./manager-rules";

const T = REVSTREAM_TERMS;

describe("нивата на достъп", () => {
  const manager = { kind: "member" as const, member: { id: "m", role: "manager" as const, org: "revstream" } };
  const closer = { kind: "member" as const, member: { id: "c", role: "sales" as const, org: "revstream" } };

  it("таблото отварят само собственикът и мениджърът", () => {
    expect(canManage({ kind: "owner" })).toBe(true);
    expect(canManage(manager)).toBe(true);
    expect(canManage(closer)).toBe(false);
  });

  it("мениджърът вижда парите само на своите хора", () => {
    expect(seesMoneyOf(manager, { org: "revstream" })).toBe(true);
    expect(seesMoneyOf(manager, { org: "promarketing" })).toBe(false);
    expect(seesMoneyOf(manager, { org: null })).toBe(false);
    expect(seesMoneyOf(closer, { org: "revstream" })).toBe(false);
    expect(seesMoneyOf({ kind: "owner" }, { org: null })).toBe(true);
  });

  it("екипът по продажбите са активните сетъри и клоузъри", () => {
    expect(isSalesTeam({ role: "setter", active: true })).toBe(true);
    expect(isSalesTeam({ role: "sales", active: true })).toBe(true);
    expect(isSalesTeam({ role: "sales", active: false })).toBe(false);
    expect(isSalesTeam({ role: "manager", active: true })).toBe(false);
    expect(isSalesTeam({ role: "delivery", active: true })).toBe(false);
  });
});

describe("сметката по договора с RevStream", () => {
  it("3 900 € с ДДС → основа 3 250 → 162,50 + 325 + 325", () => {
    const s = dealSplit(3900, T, { setter: true, closer: true });
    expect(s).toEqual({ base: 3250, setter: 162.5, closer: 325, management: 325, total: 812.5 });
  });

  it("затворена от наш клоузър → без техния процент за клоузър", () => {
    const s = dealSplit(3900, T, { setter: true, closer: false });
    expect(s.closer).toBe(0);
    expect(s.total).toBe(487.5);
  });

  it("без никакъв техен принос → нищо", () => {
    expect(dealSplit(3900, T, { setter: false, closer: false }).total).toBe(0);
  });

  it("еднократното: 1 000 на старта, после по 500 от сделка до 3 750", () => {
    expect(feeInstallment(1, T)).toBe(500);
    expect(feeInstallment(7, T)).toBe(500);
    expect(feeInstallment(8, T)).toBe(250);
    expect(feeInstallment(9, T)).toBe(0);
    expect(feeRemaining(0, T)).toBe(3750);
    expect(feeRemaining(8, T)).toBe(0);
  });

  it("сборът за месеца", () => {
    const row = (n: number): DealRow => ({
      contactId: String(n),
      name: "x",
      wonAt: "2026-12-01T10:00:00Z",
      amount: 3900,
      setterName: "s",
      closerName: "c",
      split: dealSplit(3900, T, { setter: true, closer: true }),
      installment: feeInstallment(n, T),
    });
    const t = statementTotals([row(1), row(2)], T);
    expect(t.deals).toBe(2);
    expect(t.base).toBe(6500);
    expect(t.installments).toBe(1000);
    expect(t.due).toBe(2625);
    expect(t.feeRemaining).toBe(2750);
  });
});

describe("phoneKey9", () => {
  it("свежда +359 и 0 до едни и същи 9 цифри", () => {
    expect(phoneKey9("+359 888 123 456")).toBe("888123456");
    expect(phoneKey9("0888123456")).toBe("888123456");
    expect(phoneKey9("12")).toBeNull();
  });
});
