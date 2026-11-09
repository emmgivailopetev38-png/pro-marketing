/**
 * 🇪🇺 Евро проекти — чистата логика (без база): списъците със стойности,
 * zod схемите за API-то, срокът и сортирането, какво е ново/променено при
 * upsert. Ползва се от API-то, страницата /admin/finansirane и картона.
 */
import { z } from "zod";

// ── стойностите ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "bg_es_fondove",
  "pvu",
  "az",
  "dfz_psp",
  "es_direktno",
  "trangranichni",
  "finansovi_instrumenti",
  "drugi",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  bg_es_fondove: "ЕС фондове (БГ програми)",
  pvu: "ПВУ",
  az: "Агенция по заетостта",
  dfz_psp: "ДФЗ · СПРЗСР",
  es_direktno: "ЕС директно",
  trangranichni: "Трансгранични",
  finansovi_instrumenti: "Финансови инструменти",
  drugi: "Други",
};

export const PROGRAM_STATUSES = ["open", "upcoming", "rolling", "closed"] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const PROGRAM_STATUS_LABEL: Record<ProgramStatus, string> = {
  open: "Отворена",
  upcoming: "Предстои",
  rolling: "Постоянно отворена",
  closed: "Затворена",
};

export const OUR_ROLES = ["kandidat", "izpalnitel", "partnior", "konsultant"] as const;
export type OurRole = (typeof OUR_ROLES)[number];

export const OUR_ROLE_LABEL: Record<OurRole, string> = {
  kandidat: "Кандидат",
  izpalnitel: "Изпълнител",
  partnior: "Партньор",
  konsultant: "Консултант",
};

export const MATCH_STATUSES = ["nov", "kazano", "interes", "kandidatstva", "spechelen", "ne"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  nov: "Нов",
  kazano: "Казано",
  interes: "Интерес",
  kandidatstva: "Кандидатства",
  spechelen: "Спечелен",
  ne: "Не",
};

export const ACTIVE_STATUSES: readonly ProgramStatus[] = ["open", "upcoming", "rolling"];

/** Срок до толкова дни → червено. */
export const URGENT_DAYS = 30;

// ── zod: програмата ─────────────────────────────────────────────────────────

const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}/, "дата YYYY-MM-DD")
  .transform((s) => s.slice(0, 10))
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "невалидна дата");

const text = (max: number) => z.string().trim().max(max).nullable().optional();

const sourceSchema = z.union([
  z.string().trim().max(1000),
  z.object({ title: z.string().trim().max(300).optional(), url: z.string().trim().max(1000), date: z.string().max(40).optional() }).loose(),
]);

export const programInputSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9_.-]*$/, "key: латиница, малки букви, цифри, _ . -"),
  name: z.string().trim().min(2).max(300).optional(),
  category: z.enum(CATEGORIES).nullable().optional(),
  operator: text(300),
  program: text(300),
  url: z.string().trim().max(1000).regex(/^https?:\/\//, "url: http(s)://…").nullable().optional(),
  status: z.enum(PROGRAM_STATUSES).optional(),
  open_date: dateStr.nullable().optional(),
  deadline: dateStr.nullable().optional(),
  deadline_note: text(500),
  budget_text: text(500),
  grant_text: text(500),
  beneficiaries: text(2000),
  eligible_costs: text(3000),
  our_role: z.enum(OUR_ROLES).nullable().optional(),
  our_services: z.array(z.string().trim().min(1).max(160)).max(30).nullable().optional(),
  client_profile: text(2000),
  for_us: z.boolean().optional(),
  for_us_reason: text(2000),
  priority: z.number().int().min(1).max(5).optional(),
  notes: text(5000),
  sources: z.array(sourceSchema).max(50).optional(),
  last_checked_at: z.iso.datetime({ offset: true }).optional(),
});
export type ProgramInput = z.infer<typeof programInputSchema>;

/** Едно, масив (до 100) или `{ programs: [...] }`. */
export const programPayloadSchema = z
  .union([
    programInputSchema.transform((p) => [p]),
    z.array(programInputSchema).min(1).max(100),
    z.object({ programs: z.array(programInputSchema).min(1).max(100) }).transform((o) => o.programs),
  ]);

// ── zod: съвпадението ───────────────────────────────────────────────────────

export const matchInputSchema = z.object({
  program_key: z.string().trim().min(2).max(80),
  contact_id: z.guid(),
  fit: z.number().int().min(0).max(100).nullable().optional(),
  role: text(200),
  reason: text(2000),
  next_step: text(1000),
});
export type MatchInput = z.infer<typeof matchInputSchema>;

/** Масив до 500 (или `{ matches: [...] }`). */
export const matchPayloadSchema = z.union([
  z.array(matchInputSchema).min(1).max(500),
  z.object({ matches: z.array(matchInputSchema).min(1).max(500) }).transform((o) => o.matches),
]);

export const matchStatusSchema = z.enum(MATCH_STATUSES);

// ── срокът ──────────────────────────────────────────────────────────────────

/** Днешната дата в София като YYYY-MM-DD. */
export function todaySofia(now: Date = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Sofia" });
}

/** Дни от днес до срока (0 = днес, отрицателно = минал); null без срок. */
export function daysUntil(deadline: string | null | undefined, today: string): number | null {
  if (!deadline) return null;
  const a = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${deadline.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export type DeadlineTone = "none" | "past" | "urgent" | "ok";

export function deadlineTone(deadline: string | null | undefined, today: string): DeadlineTone {
  const d = daysUntil(deadline, today);
  if (d === null) return "none";
  if (d < 0) return "past";
  if (d <= URGENT_DAYS) return "urgent";
  return "ok";
}

/** „след 12 дни“ / „днес“ / „изтече преди 3 дни“. */
export function deadlineText(deadline: string | null | undefined, today: string): string {
  const d = daysUntil(deadline, today);
  if (d === null) return "без срок";
  if (d === 0) return "днес";
  if (d === 1) return "утре";
  if (d > 0) return `след ${d} дни`;
  return `изтече преди ${-d} ${d === -1 ? "ден" : "дни"}`;
}

// ── сортирането ─────────────────────────────────────────────────────────────

export type SortableProgram = {
  key: string;
  name: string;
  status: string;
  deadline: string | null;
  priority: number | null;
};

const STATUS_ORDER: Record<string, number> = { open: 0, rolling: 1, upcoming: 2, closed: 3 };

/**
 * Активните първо (отворена → постоянна → предстои → затворена); вътре —
 * по срок (най-близкият първо, без срок най-отзад), после по приоритет (1 първо), после по име.
 * Изтеклите срокове при активните отиват след бъдещите.
 */
export function comparePrograms(a: SortableProgram, b: SortableProgram, today: string): number {
  const sa = STATUS_ORDER[a.status] ?? 9;
  const sb = STATUS_ORDER[b.status] ?? 9;
  if (sa !== sb) return sa - sb;
  const da = daysUntil(a.deadline, today);
  const db = daysUntil(b.deadline, today);
  const rank = (d: number | null) => (d === null ? 2 : d < 0 ? 1 : 0);
  if (rank(da) !== rank(db)) return rank(da) - rank(db);
  if (da !== null && db !== null && da !== db) return da - db;
  const pa = a.priority ?? 3;
  const pb = b.priority ?? 3;
  if (pa !== pb) return pa - pb;
  return a.name.localeCompare(b.name, "bg");
}

export function sortPrograms<T extends SortableProgram>(rows: T[], today: string): T[] {
  return [...rows].sort((a, b) => comparePrograms(a, b, today));
}

/** Лентата горе: активните със срок, по срок (изтеклите — не). */
export function deadlineStrip<T extends SortableProgram>(rows: T[], today: string): T[] {
  return rows
    .filter((r) => (ACTIVE_STATUSES as readonly string[]).includes(r.status))
    .filter((r) => {
      const d = daysUntil(r.deadline, today);
      return d !== null && d >= 0;
    })
    .sort((a, b) => (daysUntil(a.deadline, today) ?? 0) - (daysUntil(b.deadline, today) ?? 0) || (a.priority ?? 3) - (b.priority ?? 3));
}

// ── upsert: какво е ново и какво се е сменило ───────────────────────────────

export type ProgramSnapshot = { key: string; status: string; deadline: string | null };

export type ProgramChange = {
  key: string;
  status?: { from: string; to: string };
  deadline?: { from: string | null; to: string | null };
};

/** Сменил ли се е статусът или срокът (сравнява само подадените полета). */
export function programChange(prev: ProgramSnapshot, next: ProgramInput): ProgramChange | null {
  const out: ProgramChange = { key: prev.key };
  if (next.status !== undefined && next.status !== prev.status) out.status = { from: prev.status, to: next.status };
  if (next.deadline !== undefined && (next.deadline ?? null) !== (prev.deadline ?? null)) {
    out.deadline = { from: prev.deadline ?? null, to: next.deadline ?? null };
  }
  return out.status || out.deadline ? out : null;
}

/** Последният със същия ключ печели (задачата може да прати дубликат). */
export function dedupeBy<T>(rows: T[], keyOf: (r: T) => string): T[] {
  const m = new Map<string, T>();
  for (const r of rows) {
    const k = keyOf(r);
    m.delete(k);
    m.set(k, r);
  }
  return Array.from(m.values());
}

/** Само подадените полета (undefined отпада) — да не се трият данни при частичен upsert. */
export function definedOnly<T extends Record<string, unknown>>(row: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(row)) if (v !== undefined) (out as Record<string, unknown>)[k] = v;
  return out;
}

/**
 * Групи с еднакви колони — PostgREST при upsert на масив попълва липсващите
 * колони с null, затова всяка група върви отделно.
 */
export function groupByColumns<T extends Record<string, unknown>>(rows: T[]): T[][] {
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const sig = Object.keys(r).sort().join(",");
    const g = groups.get(sig);
    if (g) g.push(r);
    else groups.set(sig, [r]);
  }
  return Array.from(groups.values());
}

/** Програмата → ред за базата (без undefined; last_checked_at = сега, ако не е подаден). */
export function programRow(p: ProgramInput, nowIso: string): Record<string, unknown> {
  return definedOnly({ ...p, last_checked_at: p.last_checked_at ?? nowIso });
}

/** Съвпадението → ред за базата. `status` нарочно го няма — той е на Ивайло. */
export function matchRow(m: MatchInput, programId: string): Record<string, unknown> {
  const { program_key: _k, ...rest } = m;
  void _k;
  return definedOnly({ ...rest, program_id: programId });
}

export function matchKey(programId: string, contactId: string): string {
  return `${programId}:${contactId.toLowerCase()}`;
}

// ── броене ──────────────────────────────────────────────────────────────────

export type MatchCounts = Record<MatchStatus, number> & { total: number };

export function emptyCounts(): MatchCounts {
  return { total: 0, nov: 0, kazano: 0, interes: 0, kandidatstva: 0, spechelen: 0, ne: 0 };
}

export function countMatches(rows: { program_id: string; status: string }[]): Map<string, MatchCounts> {
  const out = new Map<string, MatchCounts>();
  for (const r of rows) {
    const c = out.get(r.program_id) ?? emptyCounts();
    c.total += 1;
    if ((MATCH_STATUSES as readonly string[]).includes(r.status)) c[r.status as MatchStatus] += 1;
    out.set(r.program_id, c);
  }
  return out;
}
