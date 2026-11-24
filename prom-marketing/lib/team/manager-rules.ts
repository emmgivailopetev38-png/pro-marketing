/**
 * Таблото на мениджъра на продажбите — чистите правила (24.11.2026, RevStream).
 *
 * Нивата на достъп:
 *   1. сетър      — своята опашка за звънене и своите числа;
 *   2. клоузър    — своите хора, срещи и числа;
 *   3. мениджър   — целият екип по продажбите: хора, срещи, числа, сделки;
 *   4. собственик — всичко.
 * Мениджърът вижда РАБОТАТА на всички сетъри и клоузъри (за да ги сравнява и обучава),
 * но ПАРИТЕ само на своите хора (същият `org`): уговорката на нашия клоузър с Ивайло
 * не е за външен човек. Не вижда цени, оферти, проекти, финанси и другите клиенти.
 */
import { orgOf, type TeamMember, type TeamRole } from "./types";

/** Ролите, които са „екипът по продажбите“. */
export const SALES_TEAM_ROLES: ReadonlySet<TeamRole> = new Set<TeamRole>(["setter", "sales"]);

export function isSalesTeam(m: Pick<TeamMember, "role" | "active">): boolean {
  return m.active && SALES_TEAM_ROLES.has(m.role);
}

export type Viewer = { kind: "owner" } | { kind: "member"; member: Pick<TeamMember, "id" | "role" | "org"> };

/** Може ли да отвори таблото: собственикът и мениджърът. */
export function canManage(v: Viewer): boolean {
  return v.kind === "owner" || v.member.role === "manager";
}

/** Вижда ли парите (комисионни, сделки по договора) на този човек. */
export function seesMoneyOf(v: Viewer, person: Pick<TeamMember, "org">): boolean {
  if (v.kind === "owner") return true;
  return v.member.role === "manager" && orgOf(v.member) === orgOf(person);
}

// ── Договорът с партньора: кой колко взима от една сделка ────────────────────

export interface PartnerTerms {
  org: string;
  label: string;
  /** от кога важат (ISO) — сделки преди това не са по договора */
  from: string;
  setterPct: number;
  closerPct: number;
  /** възнаграждението за управление, % от сумата без ДДС */
  managementPct: number;
  /** еднократното възнаграждение за набирането: общо, платено на старта и на части от всяка сделка */
  feeTotal: number;
  feeUpfront: number;
  feePerDeal: number;
  /** ДДС в цената към клиента — сумите по договора са върху сумата БЕЗ ДДС */
  vatRate: number;
}

/**
 * RevStream Consortium LLC — договорът, подписан на 24.11.2026:
 * сетър 5 % + клоузър 10 % + управление 10 % от сумата без ДДС, само върху получени пари;
 * 4 750 € за набирането: 1 000 € на старта + 3 750 € на части по 500 € от всяка платена сделка.
 */
export const REVSTREAM_TERMS: PartnerTerms = {
  org: "revstream",
  label: "RevStream",
  from: "2026-11-24T00:00:00Z",
  setterPct: 5,
  closerPct: 10,
  managementPct: 10,
  feeTotal: 4750,
  feeUpfront: 1000,
  feePerDeal: 500,
  vatRate: 0.2,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface DealSplit {
  /** сумата без ДДС — основата на всички проценти */
  base: number;
  setter: number;
  closer: number;
  management: number;
  /** общо комисионни към партньора за тази сделка (без вноската по еднократното) */
  total: number;
}

/**
 * Сметката за една сделка. `amountWithVat` е сумата, която клиентът плаща (с ДДС).
 * Процент се дължи само за ролята, която партньорът наистина е изпълнил: ако срещата
 * е затворена от наш клоузър, „клоузър“ е 0; ако никой техен сетър не е звънял — „сетър“ е 0.
 */
export function dealSplit(amountWithVat: number, t: PartnerTerms, did: { setter: boolean; closer: boolean }): DealSplit {
  const amount = Number(amountWithVat) || 0;
  const base = round2(amount / (1 + t.vatRate));
  const setter = did.setter ? round2((base * t.setterPct) / 100) : 0;
  const closer = did.closer ? round2((base * t.closerPct) / 100) : 0;
  const management = did.setter || did.closer ? round2((base * t.managementPct) / 100) : 0;
  return { base, setter, closer, management, total: round2(setter + closer + management) };
}

/** Вноската по еднократното възнаграждение от поредната платена сделка (1-ва, 2-ра…). */
export function feeInstallment(dealNumber: number, t: PartnerTerms): number {
  const remainingBefore = t.feeTotal - t.feeUpfront - (dealNumber - 1) * t.feePerDeal;
  return Math.max(0, Math.min(t.feePerDeal, remainingBefore));
}

/** Колко остава от еднократното след N платени сделки (стартовата вноска се брои за платена отделно). */
export function feeRemaining(deals: number, t: PartnerTerms): number {
  return Math.max(0, t.feeTotal - t.feeUpfront - deals * t.feePerDeal);
}

export interface DealRow {
  contactId: string;
  name: string;
  wonAt: string;
  amount: number;
  setterName: string | null;
  closerName: string | null;
  split: DealSplit;
  installment: number;
}

export interface StatementTotals {
  deals: number;
  amount: number;
  base: number;
  setter: number;
  closer: number;
  management: number;
  installments: number;
  /** всичко към партньора: комисионни + вноските по еднократното */
  due: number;
  feeRemaining: number;
}

export function statementTotals(rows: DealRow[], t: PartnerTerms): StatementTotals {
  const sum = (pick: (r: DealRow) => number) => round2(rows.reduce((s, r) => s + pick(r), 0));
  const installments = sum((r) => r.installment);
  const commissions = sum((r) => r.split.total);
  return {
    deals: rows.length,
    amount: sum((r) => r.amount),
    base: sum((r) => r.split.base),
    setter: sum((r) => r.split.setter),
    closer: sum((r) => r.split.closer),
    management: sum((r) => r.split.management),
    installments,
    due: round2(commissions + installments),
    feeRemaining: feeRemaining(rows.length, t),
  };
}

/** Последните 9 цифри на телефона — по тях срещата намира картона. */
export function phoneKey9(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
}
