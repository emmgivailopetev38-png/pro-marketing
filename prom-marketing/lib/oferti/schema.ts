/** Zod схемите на офертите — общи за API-то (Хермес) и за формите в админа и /ekip. */
import { z } from "zod";

export const itemSchema = z.object({
  key: z.string().trim().min(1),
  title: z.string().trim().max(160).optional(),
  subtitle: z.string().max(300).optional(),
  bullets: z.array(z.string().max(300)).max(10).optional(),
  outcome: z.string().max(400).optional(),
  not_included: z.array(z.string().max(200)).max(6).optional(),
  price: z.number().min(0).nullable().optional(),
  unit: z.enum(["еднократно", "/мес"]).optional(),
  setup_price: z.number().min(0).nullable().optional(),
  setup_label: z.string().max(120).optional(),
  qty: z.number().int().positive().max(20).optional(),
  note: z.string().max(400).optional(),
  /** само при items_mode = "merge": true маха реда с този key от офертата */
  remove: z.boolean().optional(),
});

/** Свободен раздел в офертата: заглавие + текст и/или точки. */
export const sectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  text: z.string().max(1500).optional(),
  bullets: z.array(z.string().max(300)).max(12).optional(),
});

export const contentSchema = z
  .object({
    greeting: z.enum(["ti", "vie"]).optional(),
    seller: z.enum(["georgi", "ivailo"]).optional(),
    intro: z.string().max(1200).optional(),
    pain: z.string().max(1200).optional(),
    outcome: z.string().max(600).optional(),
    next_steps: z.array(z.string().max(300)).max(8).optional(),
    terms: z.array(z.string().max(300)).max(10).optional(),
    ps: z.string().max(400).optional(),
  })
  .partial();

export const buildSchema = z.object({
  id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  client_email: z.string().email().optional(),
  client_name: z.string().trim().max(120).optional(),
  client_company: z.string().trim().max(160).optional(),
  template_key: z.string().trim().max(60).optional(),
  /** заглавието на офертата на ръка; "" = обратно към сглобеното от модулите */
  title: z.string().trim().max(200).optional(),
  items: z.array(itemSchema).max(12).optional(),
  /**
   * replace (по подразбиране) — items е целият списък редове;
   * merge — само поправки по key върху редовете на съществуващата оферта (цената и останалото се пазят,
   * неспоменатите редове остават, нов key се добавя, remove:true маха)
   */
  items_mode: z.enum(["replace", "merge"]).optional(),
  /** кратък вариант: само ключове от каталога */
  moduli: z.array(z.string().trim().min(1)).max(12).optional(),
  greeting: z.enum(["ti", "vie"]).optional(),
  seller: z.enum(["georgi", "ivailo"]).optional(),
  intro: z.string().max(1200).optional(),
  pain: z.string().max(1200).optional(),
  outcome: z.string().max(600).optional(),
  next_steps: z.array(z.string().max(300)).max(8).optional(),
  terms: z.array(z.string().max(300)).max(10).optional(),
  ps: z.string().max(400).optional(),
  /**
   * Модули „за сравнение“ (напр. другите нива): показват се с цената и съдържанието си, но НЕ влизат в сумата.
   * [] маха сравнението; без полето — пази се досегашното.
   */
  alternatives: z.array(itemSchema).max(4).optional(),
  /** изречението над сравнението (иначе се сглобява само) */
  alternatives_note: z.string().max(400).optional(),
  /** раздел „Кой е Ивайло Петев“ — стандартният текст с числата от CRM-а и линковете към успехите и видеата */
  about: z.boolean().optional(),
  /** свободни раздели — за всичко, което не се побира в другите полета; [] ги маха */
  sections: z.array(sectionSchema).max(4).optional(),
  discount: z.number().min(0).nullable().optional(),
  discount_note: z.string().max(200).optional(),
  valid_days: z.number().int().min(1).max(90).optional(),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  vat_mode: z.enum(["incl", "excl", "none"]).optional(),
  notes: z.string().max(2000).optional(),
  created_by: z.string().trim().max(60).optional(),
});
export type BuildPayload = z.infer<typeof buildSchema>;

export const templateSchema = z.object({
  key: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(1000).optional(),
  items: z.array(itemSchema).max(12).optional(),
  content: contentSchema.optional(),
  vat_mode: z.enum(["incl", "excl", "none"]).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  created_by: z.string().trim().max(60).optional(),
  /** true → връща стандартния вариант от каталога */
  reset: z.boolean().optional(),
});
export type TemplatePayload = z.infer<typeof templateSchema>;

/** „a@x.bg, b@y.bg“ или ["a@x.bg","b@y.bg"] → ["a@x.bg","b@y.bg"] (без празни, малки букви). */
export function emailList(v: unknown): unknown {
  if (v === undefined || v === null || v === "") return undefined;
  const parts = (Array.isArray(v) ? v : [v]).flatMap((x) => String(x ?? "").split(/[,;\s]+/));
  const out = Array.from(new Set(parts.map((x) => x.trim().toLowerCase()).filter(Boolean)));
  return out.length > 0 ? out : undefined;
}
const emails = z.preprocess(emailList, z.array(z.string().email()).max(10).optional());

export const sendSchema = z.object({
  id: z.string().uuid(),
  /** един или няколко получатели (списък или „a@x.bg, b@y.bg“); без него — имейлът от картона */
  to: emails,
  /** копие (CC) — виждат се от всички */
  cc: emails,
  /** скрито копие (BCC) */
  bcc: emails,
  /** true (по подразбиране) → скрито копие до продавача и до Ивайло, за да имат изпратеното писмо */
  copy_team: z.boolean().optional(),
  /** обръщението на ред 1 вместо „Здравейте, <име>!“ — напр. „Здравейте, Даниел и Мирослава!“ */
  greeting: z.string().trim().max(160).optional(),
  subject: z.string().trim().max(200).optional(),
  /** уводът на имейла вместо стандартния; линкът, редовете и подписът се добавят сами */
  text: z.string().max(4000).optional(),
  /** без approved → само preview; с approved=true → тръгва (след изричното „да“ на човека) */
  approved: z.boolean().optional(),
  created_by: z.string().trim().max(60).optional(),
});

/** Имената на полетата на човешки — за грешките към продавача и асистента. */
const FIELD_BG: Record<string, string> = {
  title: "заглавието",
  intro: "уводът",
  pain: "„Това чухме от теб“",
  outcome: "резултатът",
  ps: "P.S.",
  next_steps: "стъпките",
  terms: "условията",
  items: "редовете",
  alternatives: "модулите за сравнение",
  alternatives_note: "изречението над сравнението",
  sections: "свободните раздели",
  notes: "вътрешната бележка",
  bullets: "точките",
  text: "текстът",
  note: "бележката по реда",
  subtitle: "подзаглавието",
  discount_note: "причината за отстъпката",
  client_name: "името",
  client_company: "фирмата",
  client_email: "имейлът",
  contact_id: "contact_id",
};

type IssueLike = { code?: string; path: PropertyKey[]; message: string; maximum?: unknown; minimum?: unknown; origin?: unknown; type?: unknown };

function valueAt(raw: unknown, path: PropertyKey[]): unknown {
  let cur: unknown = raw;
  for (const k of path) {
    if (cur === null || cur === undefined) return undefined;
    cur = (cur as Record<PropertyKey, unknown>)[k];
  }
  return cur;
}

/**
 * Грешките от проверката на човешки: „P.S. (ps): най-много 400 знака, а са 2 656“.
 * Без това асистентът получава само „Invalid payload“ и не знае какво да оправи (11.11.2026 — офертата за трите нива).
 */
export function describeIssues(issues: IssueLike[], raw?: unknown): string[] {
  return issues.map((i) => {
    const path = i.path.map((k) => String(k));
    const last = [...path].reverse().find((k) => !/^\d+$/.test(k)) ?? "";
    const name = FIELD_BG[last] ? `${FIELD_BG[last]} (${path.join(".")})` : path.join(".") || "данните";
    const val = valueAt(raw, i.path);
    const kind = String(i.origin ?? i.type ?? (Array.isArray(val) ? "array" : typeof val));
    if (i.code === "too_big" && typeof i.maximum === "number") {
      if (kind === "string") return `${name}: най-много ${i.maximum} знака${typeof val === "string" ? `, а са ${val.length}` : ""} — съкрати го или го премести в свободен раздел (sections)`;
      if (kind === "array") return `${name}: най-много ${i.maximum} на брой${Array.isArray(val) ? `, а са ${val.length}` : ""}`;
      return `${name}: най-много ${i.maximum}`;
    }
    if (i.code === "too_small" && typeof i.minimum === "number") {
      return kind === "string" ? `${name}: не може да е празно` : `${name}: най-малко ${i.minimum}`;
    }
    if (i.code === "invalid_type") return `${name}: липсва или е от грешен вид`;
    return `${name}: ${i.message}`;
  });
}
