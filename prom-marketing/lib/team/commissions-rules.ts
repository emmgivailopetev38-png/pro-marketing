/**
 * Комисионните — чистата сметка.
 *
 * Уговорката (22.09.2026): 200 € на затворен проект, 150 € на уебсайт,
 * 10 % от месечната такса при маркетинг/поддръжка — всеки месец, докато
 * клиентът плаща. Правилата са редове в `commission_rules`; тук е само
 * как от правило + основа излиза сума, и кой ключ пази от двойно начисляване.
 */

export interface CommissionRule {
  id: string;
  service_type: string;
  label: string;
  kind: "fixed" | "percent";
  value: number;
  basis: "deal" | "monthly_fee";
  role: string | null;
  active: boolean;
}

export const COMMISSION_STATUS_LABEL: Record<string, string> = {
  due: "дължима",
  approved: "одобрена",
  paid: "платена",
  cancelled: "отменена",
};

export const COMMISSION_STATUS_COLOR: Record<string, string> = {
  due: "#facc15",
  approved: "#06b6d4",
  paid: "#22c55e",
  cancelled: "#64748b",
};

/** Първото активно правило за вида услуга; ролята стеснява, ако е зададена. */
export function ruleFor(rules: CommissionRule[], serviceType: string, role?: string | null): CommissionRule | null {
  const active = rules.filter((r) => r.active && r.service_type === serviceType);
  const byRole = role ? active.find((r) => r.role === role) : undefined;
  return byRole ?? active.find((r) => !r.role) ?? active[0] ?? null;
}

/**
 * Правилото за месечното начисление — само „от месечната такса“. Правило по роля
 * с основа „сделка“ значи, че ролята няма месечна комисионна: продавачът взима
 * 10 % от затворената сделка веднъж (Ивайло, 26.09.2026), не всеки месец.
 */
export function monthlyRuleFor(rules: CommissionRule[], serviceType: string, role?: string | null): CommissionRule | null {
  const rule = ruleFor(rules, serviceType, role);
  return rule && rule.basis === "monthly_fee" ? rule : null;
}

/** Сумата по правилото: фиксирана или процент от основата, закръглена до цент. */
export function amountFor(rule: Pick<CommissionRule, "kind" | "value">, base: number | null | undefined): number {
  if (rule.kind === "fixed") return round2(Number(rule.value) || 0);
  const b = Number(base) || 0;
  return round2((b * (Number(rule.value) || 0)) / 100);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Ключът срещу двойно начисляване: еднократните — по човек, картон и вид;
 * месечните — плюс месеца. Повторно натискане на „Спечелен“ не прави втора
 * комисионна.
 */
export function dedupeKey(args: { memberId: string; contactId: string | null; serviceType: string; period?: string | null }): string {
  const c = args.contactId ?? "no-contact";
  return args.period ? `${args.memberId}:${c}:${args.serviceType}:${args.period}` : `${args.memberId}:${c}:${args.serviceType}`;
}

/** „2026-09“ за месечните начисления, в София. */
export function periodOf(d: Date = new Date(), tz = "Europe/Sofia"): string {
  return d.toLocaleDateString("sv-SE", { timeZone: tz }).slice(0, 7);
}

export interface CommissionLite {
  member_id: string;
  amount: number;
  status: string;
  period: string | null;
  created_at: string;
}

/** Сборове за човек: дължимо, одобрено, платено, общо. */
export function totalsFor(rows: CommissionLite[]) {
  const t = { due: 0, approved: 0, paid: 0, total: 0 };
  for (const r of rows) {
    const a = Number(r.amount) || 0;
    if (r.status === "cancelled") continue;
    if (r.status === "due") t.due += a;
    else if (r.status === "approved") t.approved += a;
    else if (r.status === "paid") t.paid += a;
    t.total += a;
  }
  return { due: round2(t.due), approved: round2(t.approved), paid: round2(t.paid), total: round2(t.total) };
}

/** Месечните услуги, за които се дължи комисионна за дадения месец. */
export function monthlyDue(
  services: Array<{ id: string; contact_id: string | null; service_type: string; amount: number; active: boolean; started_at: string | null; ended_at: string | null }>,
  ownerByContact: Map<string, string | null>,
  period: string
): Array<{ serviceId: string; contactId: string; memberId: string; base: number; serviceType: "marketing" | "crm_support" }> {
  const out: Array<{ serviceId: string; contactId: string; memberId: string; base: number; serviceType: "marketing" | "crm_support" }> = [];
  const monthStart = `${period}-01`;
  for (const s of services) {
    if (!s.active || !s.contact_id) continue;
    if (s.started_at && s.started_at.slice(0, 7) > period) continue;
    if (s.ended_at && s.ended_at < monthStart) continue;
    const member = ownerByContact.get(s.contact_id);
    if (!member) continue;
    const kind: "marketing" | "crm_support" | null =
      s.service_type === "ads" ? "marketing" : s.service_type === "maintenance" || s.service_type === "crm" ? "crm_support" : null;
    if (!kind) continue;
    out.push({ serviceId: s.id, contactId: s.contact_id, memberId: member, base: Number(s.amount) || 0, serviceType: kind });
  }
  return out;
}
