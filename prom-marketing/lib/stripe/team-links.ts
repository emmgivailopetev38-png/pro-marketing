/**
 * Линковете за плащане, които екипът по продажбите праща на клиента (24.11.2026).
 *
 * Публични Stripe Payment Links за програмата „Пари с AI“ — 3 900 € с ДДС: пълна
 * сума, първа вноска 75 % / 50 % и депозит 25 %. Не са тайна: това са адресите,
 * които и без това стигат до клиента. Направени са в таблото на Stripe
 * (Pro Marketing LTD; еднократно, EUR, събират име и телефон).
 *
 * Клоузърът копира линка от картата на човека: имейлът му е попълнен, а
 * `client_reference_id` носи картона — по него плащането се познава в Stripe
 * (и от webhook-а, когато сайтът получи ключ).
 */
export interface TeamPayLink {
  key: "100" | "75" | "50" | "25";
  label: string;
  /** сумата с ДДС, в евро */
  amountEur: number;
  /** колко остава след това плащане */
  restEur: number;
  url: string;
}

export const PROGRAM_PRICE_EUR = 3900;

export const TEAM_PAY_LINKS: readonly TeamPayLink[] = [
  { key: "100", label: "Пълна сума", amountEur: 3900, restEur: 0, url: "https://buy.stripe.com/3cI4gzePp9mI9hv9Is53O0q" },
  { key: "75", label: "Първа вноска 75 %", amountEur: 2925, restEur: 975, url: "https://buy.stripe.com/00w00j9v5aqMgJX7Ak53O0r" },
  { key: "50", label: "Първа вноска 50 %", amountEur: 1950, restEur: 1950, url: "https://buy.stripe.com/7sY9ATcHhgPa65j7Ak53O0s" },
  { key: "25", label: "Депозит 25 %", amountEur: 975, restEur: 2925, url: "https://buy.stripe.com/3cI9ATgXxfL6gJXcUE53O0t" },
];

/** Знакът пред картона в `client_reference_id` — различава линка на екипа от този на гласовия агент. */
export const TEAM_REF_PREFIX = "ekip_";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Линкът за този човек: с попълнен имейл и с картона му като референция. */
export function teamPayUrl(link: Pick<TeamPayLink, "url">, who: { contactId?: string | null; email?: string | null }): string {
  const u = new URL(link.url);
  const email = (who.email ?? "").trim().toLowerCase();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && !email.startsWith("bez-imeil@")) u.searchParams.set("prefilled_email", email);
  if (who.contactId && UUID_RE.test(who.contactId)) u.searchParams.set("client_reference_id", `${TEAM_REF_PREFIX}${who.contactId}`);
  return u.toString();
}

/** Картонът от референцията на плащането; null, ако линкът не е на екипа. */
export function contactFromTeamRef(ref: string | null | undefined): string | null {
  if (!ref || !ref.startsWith(TEAM_REF_PREFIX)) return null;
  const id = ref.slice(TEAM_REF_PREFIX.length);
  return UUID_RE.test(id) ? id.toLowerCase() : null;
}
