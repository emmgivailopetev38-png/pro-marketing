/**
 * Коя среща е за клоузъра (Ивайло, 01.11.2026, по телефона): „новите срещи са за Георги,
 * фолоуъпите тази седмица ги записваме за мен“. Чисти правила, без база — тестват се сами.
 *
 * Първа среща = човекът още няма проведена среща с нас и картонът не е минал към оферта/преговори.
 * Фолоуъп = втора среща, уточняване, оферта, демо след разговор → остава при Ивайло,
 * клоузърът не получава картона и не се кани.
 *
 * Ивайло, 03.11.2026: „хора, които аз съм говорил с тях, дал съм оферта — не му ги пиши на Жорката
 * в системата“. Затова етапите и записите са истинските от CRM-а (`presentation_sent`, `offer_sent`,
 * `offer_created`…) — с измислените `proposal`/`offer` човек с оферта минаваше за „първа среща“.
 */

export type PriorActivity = { activity_type: string; occurred_at: string };

/** Етапи, след които срещата е продължение, не първи разговор (CONTACT_STAGES + старите имена). */
export const FOLLOWUP_STAGES: ReadonlySet<string> = new Set(["presentation_sent", "offer_sent", "negotiating", "won", "lost", "proposal", "client"]);

/** Записи, които сами по себе си значат „вече сме говорили по същество“ — оферта, презентация, пари. */
export const FOLLOWUP_ACTIVITY_TYPES: ReadonlySet<string> = new Set([
  "offer_created",
  "offer_sent",
  "offer_ready",
  "presentation_sent",
  "payment_received",
  "offer",
  "invoice",
  "payment",
]);

export function isFirstMeeting(args: { stage?: string | null; activities: PriorActivity[]; hasOffer?: boolean; now?: Date }): boolean {
  const now = (args.now ?? new Date()).getTime();
  if (args.hasOffer) return false;
  if (args.stage && FOLLOWUP_STAGES.has(args.stage)) return false;
  for (const a of args.activities) {
    if (FOLLOWUP_ACTIVITY_TYPES.has(a.activity_type)) return false;
    // Минала среща (вече проведена) = фолоуъп. Бъдещата е тази, която току-що се записва.
    if (a.activity_type === "meeting") {
      const t = new Date(a.occurred_at).getTime();
      if (Number.isFinite(t) && t < now) return false;
    }
  }
  return true;
}

// ── Повече от един клоузър (24.11.2026: Георги + клоузърът от RevStream) ─────

/** От кога се броят срещите за честното редуване между клоузърите. */
export const CLOSER_ROTATION_FROM = "2026-11-24T00:00:00Z";

export interface CloserLite {
  id: string;
  created_at?: string | null;
}

/** Клоузърите в реда на влизане — първият е „по подразбиране“ (на него е събитието в Cal.com и Ели). */
export function sortClosers<T extends CloserLite>(closers: T[]): T[] {
  return [...closers].sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "") || a.id.localeCompare(b.id));
}

/**
 * На кого е следващата среща, записана от човек (сетъра): на клоузъра с най-малко
 * получени срещи от началото на редуването. Така Ели (която записва само при
 * клоузъра по подразбиране) не изкривява сметката — другият наваксва от срещите
 * на сетъра и двамата получават поравно шансове. При равенство — който е чакал
 * по-дълго (не е последният получил), после редът на влизане.
 */
export function pickCloser<T extends CloserLite>(
  closers: T[],
  counts: ReadonlyMap<string, number>,
  lastId?: string | null
): T | null {
  const pool = sortClosers(closers);
  if (pool.length === 0) return null;
  let best = pool[0];
  for (const c of pool.slice(1)) {
    const a = counts.get(c.id) ?? 0;
    const b = counts.get(best.id) ?? 0;
    if (a < b || (a === b && best.id === lastId)) best = c;
  }
  return best;
}

/**
 * Кой води срещата, която човек от екипа записва сега:
 * 1) картонът вече има клоузър → той (човекът не се прехвърля между клоузъри);
 * 2) записва я самият клоузър → негова е;
 * 3) сетърът изрично е избрал клоузър → той;
 * 4) иначе — честното редуване (pickCloser).
 */
export function closerForBooking<T extends CloserLite>(args: {
  closers: T[];
  ownerId?: string | null;
  actorId?: string | null;
  wantedId?: string | null;
  counts: ReadonlyMap<string, number>;
  lastId?: string | null;
}): T | null {
  const byId = (id?: string | null) => (id ? args.closers.find((c) => c.id === id) ?? null : null);
  return byId(args.ownerId) ?? byId(args.actorId) ?? byId(args.wantedId) ?? pickCloser(args.closers, args.counts, args.lastId);
}
