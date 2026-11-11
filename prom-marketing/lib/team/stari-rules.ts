/**
 * „🗂 Стари и топли“ в /ekip — хората, които не са в никой списък на екипа.
 *
 * Ивайло, 11.11.2026: „всички, с които Ели не е успяла да запише среща, да
 * излизат при нас — мен и Георги… той да им звъни, да записва срещи, както и аз
 * да имам достъп, да мога да му помагам — и стари, и топли, за да имаме
 * организирано звънене и да не пропуснем някой клиент“.
 *
 * Дотогава „Звънене“ показваше само новите без нито един опит, обещаните
 * чувания на екипа и дадените от Ивайло. Всичко останало — звънян веднъж от
 * Ивайло без отговор, писано без отговор, говорил преди месец с екипа, стар
 * лийд — стоеше само на /admin/zvanene, която Георги не вижда. На 11.11 това
 * бяха около 250 души.
 *
 * Купчините са същите като на /admin/zvanene (lib/zvanene/rules.ts), за да
 * гледат двамата едно и също. Разликата е кой НЕ излиза тук:
 *   · вече е в друг изглед на опашката (нови, за повторно, от Ивайло…);
 *   · човек на Ивайло (говорил с него, среща в календара му, Академията,
 *     махнат от звъненето — ivailo-rules.ts), освен ако картонът е с водещ от
 *     екипа: тогава Ивайло сам го е дал и той е на екипа;
 *   · сделка на Ивайло — има оферта или е на етап презентация/оферта/преговори и
 *     никой от екипа не го води (Ивайло, 03.11.2026: „хора, които аз съм пратил
 *     оферта и сме говорили — не му ги давай“). Знаците в ivailo-rules.ts не
 *     хващат оферта, пратена без записан разговор (Full House, 11.11);
 *   · картон с водещ друг човек от екипа;
 *   · има насрочено чуване за друг ден — ще излезе в деня си;
 *   · последната му заявка е отпреди септември 2026. Ивайло, 11.11.2026: „добави
 *     само последните — не някакви супер стари… говорим за лийдове, откогато
 *     сме започнали менторската при Георги (Асенов) от септември; всички преди
 *     това не ми трябват“. Картон с водещ от екипа е изключение: той е даден
 *     изрично (топлите от 05.11) и излиза независимо от датата.
 *
 * Чисти правила, без база — тестват се. Базата е в stari.ts.
 */
import { dayKey } from "@/lib/contacts/followup";
import type { ZvRow } from "@/lib/zvanene/rules";

/**
 * От кога са „последните“: началото на менторската при Георги Асенов — септември
 * 2026 (01.09.2026, 00:00 в София). По-старите заявки остават само на
 * /admin/zvanene при Ивайло.
 */
export const STARI_OT = "2026-08-31T21:00:00Z";

/** Колко карти от купчина излизат на екрана наведнъж — следващите идват, щом тези минат. */
export const STARI_NA_EKRAN = 25;

export type StariPile = "topli" | "pisano" | "stari";

export const STARI_TITLE: Record<StariPile, string> = {
  topli: "🔥 Топли",
  pisano: "✉️ Писано или звънено, без разговор",
  stari: "🗂 По-стари",
};

export const STARI_HINT: Record<StariPile, string> = {
  topli: "Вече сме говорили и има интерес, оферта или уговорка. Влизаш с последното от бележките и търсиш следваща стъпка.",
  pisano: "Писали сме или сме звънели, но разговор няма. Едно обаждане днес решава дали са живи.",
  stari: "Лийдове от септември насам, с които разговорът не е стигнал до среща. Най-новите най-горе; каквото е обещано за днес или е просрочено, е първо.",
};

export interface StariContact {
  id: string;
  owner_id: string | null;
  next_followup_at: string | null;
}

export interface StariInput {
  /** редовете от classify() в lib/zvanene/rules.ts, вече подредени */
  rows: ZvRow[];
  contacts: Map<string, StariContact>;
  /** картоните, които вече са в друг изглед на опашката */
  inQueue: Set<string>;
  /** хора на Ивайло по ivailo-rules.ts */
  ivailos: Set<string>;
  /** хората от екипа — картон с водещ от екипа е на екипа, дори да е говорил с Ивайло */
  teamIds: Set<string>;
  /** чия опашка се гледа; null = собственикът, вижда всички */
  viewerId: string | null;
  now: Date;
  /** от кога са „последните“ (ISO); без него — STARI_OT */
  since?: string;
}

export type StariPiles = Record<StariPile, ZvRow[]>;

/** В коя купчина на екипа е редът. „Нов“, който не е в „Първо обаждане“, е опитван без разговор. */
export function stariPileOf(row: Pick<ZvRow, "kat">): StariPile {
  if (row.kat === "topal") return "topli";
  if (row.kat === "star") return "stari";
  return "pisano";
}

/** Насрочено за ден след днешния (по София) — ще излезе тогава, не сега. */
export function scheduledLater(nextFollowupAt: string | null | undefined, now: Date): boolean {
  if (!nextFollowupAt) return false;
  return dayKey(nextFollowupAt) > dayKey(now);
}

/** Етапите, в които човекът е в сделка: презентация, оферта, преговори. */
const DEAL_STAGES: ReadonlySet<string> = new Set(["presentation_sent", "offer_sent", "negotiating"]);

/** Сделка: има оферта или е стигнал до презентация/оферта/преговори. Без водещ от екипа тя е на Ивайло. */
export function isDeal(row: Pick<ZvRow, "stage" | "oferta">): boolean {
  return row.oferta || DEAL_STAGES.has(row.stage);
}

/** Последната заявка на човека е от „последните“ — от септември 2026 насам. */
export function recentEnough(leadAt: string | null | undefined, since: string = STARI_OT): boolean {
  const t = leadAt ? new Date(leadAt).getTime() : NaN;
  return Number.isFinite(t) && t >= new Date(since).getTime();
}

/** Излиза ли човекът в „Стари и топли“ на този, който гледа. */
export function showsInStari(row: Pick<ZvRow, "id" | "lead_at" | "stage" | "oferta">, i: Omit<StariInput, "rows">): boolean {
  if (i.inQueue.has(row.id)) return false;
  const c = i.contacts.get(row.id);
  const owner = c?.owner_id ?? null;
  if (owner && i.teamIds.has(owner)) {
    // Води го човек от екипа (даден е изрично): вижда го той и собственикът, независимо от датата.
    if (i.viewerId && owner !== i.viewerId) return false;
  } else {
    if (i.ivailos.has(row.id)) return false;
    if (isDeal(row)) return false;
    if (!recentEnough(row.lead_at, i.since)) return false;
  }
  return !scheduledLater(c?.next_followup_at, i.now);
}

/** Трите купчини на екипа, в реда на /admin/zvanene (обещаното за днес и просроченото — най-горе). */
export function teamStari(i: StariInput): StariPiles {
  const out: StariPiles = { topli: [], pisano: [], stari: [] };
  for (const row of i.rows) {
    if (!showsInStari(row, i)) continue;
    out[stariPileOf(row)].push(row);
  }
  return out;
}

/** Заглавието на купчината: „🔥 Топли · 31 · на екрана първите 25“. */
export function stariHeading(pile: StariPile, total: number, shown: number): string {
  return `${STARI_TITLE[pile]} · ${total}${total > shown ? ` · на екрана първите ${shown}` : ""}`;
}
