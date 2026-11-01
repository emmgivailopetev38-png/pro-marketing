/**
 * Коя среща е за клоузъра (Ивайло, 01.11.2026, по телефона): „новите срещи са за Георги,
 * фолоуъпите тази седмица ги записваме за мен“. Чисти правила, без база — тестват се сами.
 *
 * Първа среща = човекът още няма проведена среща с нас и картонът не е минал към оферта/преговори.
 * Фолоуъп = втора среща, уточняване, оферта, демо след разговор → остава при Ивайло,
 * клоузърът не получава картона и не се кани.
 */

export type PriorActivity = { activity_type: string; occurred_at: string };

/** Етапи, след които срещата е продължение, не първи разговор. */
export const FOLLOWUP_STAGES: ReadonlySet<string> = new Set(["proposal", "negotiating", "won", "client", "lost"]);

/** Записи, които сами по себе си значат „вече сме говорили по същество“. */
export const FOLLOWUP_ACTIVITY_TYPES: ReadonlySet<string> = new Set(["offer", "offer_sent", "invoice", "payment"]);

export function isFirstMeeting(args: { stage?: string | null; activities: PriorActivity[]; now?: Date }): boolean {
  const now = (args.now ?? new Date()).getTime();
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
