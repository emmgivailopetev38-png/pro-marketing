/**
 * „Пак остави данни“ — човек, който ВЕЧЕ има картон, попълва формата отново.
 *
 * До 07.10.2026 такъв лийд не стигаше до опашката: „🆕 Нови“ са само картони
 * без нито един опит, в етап lead и от последните 90 дни. Който веднъж е бил
 * звънян (не вдигна, „не се интересува“), е в етап „contacted“/„lost“ или е
 * влязъл преди 90 дни, оставаше невидим — Димитър получаваше писмо „нов човек
 * за звънене“, а картата я нямаше. За 45 дни такива бяха 21 от 286 лийда; поне
 * петима не получиха нито едно обаждане след новата заявка.
 *
 * Сега такъв картон получава маркер `team_assigned` с вид `relead` и излиза
 * най-горе в „🆕 Нови“, докато екипът не звънне веднъж след него.
 *
 * НЕ се дава: клиент (won) · картон при продавач (owner_id) · човек на Ивайло
 * (Академията, говорил с него, среща в календара му — ivailo-rules.ts) · картон
 * в тръбата на Ивайло (среща, оферта, преговори) · без телефон · картон, който
 * и без това е в „🆕 Нови“. Чисти правила, без база.
 */

/** Видът на маркера `team_assigned` за повторна заявка. */
export const RELEAD_KIND = "relead";

/** „🆕 Нови“ са картоните от последните толкова дни — същото число като в queue.ts. */
export const FRESH_WINDOW_DAYS = 90;

/** Етапите, от които повторната заявка отива при екипа. Останалите са в тръбата на Ивайло. */
const OPEN_STAGES = new Set(["lead", "contacted", "lost"]);

export interface ReLeadInput {
  stage: string | null | undefined;
  /** contacts.owner_id — картонът е при продавач */
  ownerId: string | null | undefined;
  createdAt: string | null | undefined;
  hasPhone: boolean;
  /** опитите за контакт в картона (call / meeting / viber_sent), от когото и да е */
  attempts: number;
  /** човек на Ивайло по ivailo-rules.ts */
  ivailo: boolean;
  now: Date;
}

export type ReLeadSkip = "won" | "owner" | "ivailo" | "pipeline" | "no_phone" | "already_fresh";

export type ReLeadVerdict = { give: true } | { give: false; why: ReLeadSkip };

export function reLeadVerdict(i: ReLeadInput): ReLeadVerdict {
  const stage = i.stage ?? "lead";
  if (stage === "won") return { give: false, why: "won" };
  if (i.ownerId) return { give: false, why: "owner" };
  if (i.ivailo) return { give: false, why: "ivailo" };
  if (!OPEN_STAGES.has(stage)) return { give: false, why: "pipeline" };
  if (!i.hasPhone) return { give: false, why: "no_phone" };
  const created = i.createdAt ? new Date(i.createdAt).getTime() : NaN;
  const inWindow = Number.isFinite(created) && i.now.getTime() - created <= FRESH_WINDOW_DAYS * 86_400_000;
  if (stage === "lead" && i.attempts === 0 && inWindow) return { give: false, why: "already_fresh" };
  return { give: true };
}

/** Какво пише на картата: защо е пак тук. */
export function reLeadReason(offerLabel: string | null | undefined, adName: string | null | undefined): string {
  const what = [offerLabel, adName ? `реклама „${adName}“` : null].filter(Boolean).join(" · ");
  return `🔁 Пак остави данни${what ? ` · ${what}` : ""} — звънни като на нов лийд.`;
}
