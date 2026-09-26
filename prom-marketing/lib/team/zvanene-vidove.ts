/**
 * Подкатегориите на „Звънене“ — по думите на Димитър (23.09.2026): една графа
 * с всичко беше „доста пренаселена, особено на телефон“.
 *
 * Четири изгледа, по един екран работа наведнъж:
 *   🆕 Първо обаждане · 🔁 За повторно · 🤝 От Ивайло · 💜 Срещите
 *
 * Отказалите срещата и неявилите се влизат при „за повторно“ — на тях също се
 * звъни повторно и то днес. За да не се изгубят, страницата показва червена
 * лента с линк към тях на всеки друг изглед (`urgent` по-долу).
 *
 * Чисти правила, без база — тестват се.
 */

export const ZVANENE_VIEWS = ["novi", "povtorno", "ivailo", "sreshti", "studeni"] as const;
export type ZvaneneView = (typeof ZVANENE_VIEWS)[number];

/** Входът /ekip без параметър: новите за първи разговор — основната работа. */
export const ZVANENE_DEFAULT: ZvaneneView = "novi";

export const ZVANENE_LABEL: Record<ZvaneneView, string> = {
  novi: "🆕 Първо обаждане",
  povtorno: "🔁 За повторно",
  ivailo: "🤝 От Ивайло",
  sreshti: "💜 Срещите",
  studeni: "❄️ Студени",
};

/** Какво значи изгледът — един ред под табовете, за да няма гадаене. */
export const ZVANENE_HINT: Record<ZvaneneView, string> = {
  novi: "Хора, на които никой още не е звънял. Най-новите най-горе — те са най-топли.",
  povtorno: "Всички, на които се звъни втори път: отказали срещата, неявили се, обещано чуване за днес и тези, които не вдигнаха.",
  ivailo: "Картони, които Ивайло е дал на екипа. Влизаш с повода „преди време говорихте с Ивайло…“ и търсиш час.",
  sreshti: "Съобщенията по Viber за предстоящите срещи и списъкът с уговорените часове.",
  studeni: "Фирми от проучването, които не са ни търсили. Целта е среща с Ивайло, не продажба. Първо обещаните обаждания, после новите — София първа.",
};

export interface ZvaneneCounts {
  fresh: number;
  cancelled: number;
  noshow: number;
  retry: number;
  waiting: number;
  given: number;
  /** съобщения за срещите, които чакат да бъдат пратени */
  msgsDue: number;
  /** предстоящи уговорени срещи */
  booked: number;
  /** студените за звънене сега: дошлите за повторно + новите (виж prospects-rules.ts) */
  studeni?: number;
}

export interface ZvaneneTab {
  view: ZvaneneView;
  href: string;
  label: string;
  /** числото на таба — колко карти/реда има вътре */
  count: number;
  /** колко от тях горят днес (червен бадж): отказали + неявили се, съобщения за пращане */
  urgent: number;
}

/** „?vid=povtorno“ → изгледът; непознато или липсващо → подразбиране. */
export function parseZvaneneView(raw: string | string[] | undefined | null): ZvaneneView {
  const v = (Array.isArray(raw) ? raw[0] : raw ?? "").trim();
  return (ZVANENE_VIEWS as readonly string[]).includes(v) ? (v as ZvaneneView) : ZVANENE_DEFAULT;
}

/** Линкът на изгледа — подразбиране без параметър, за да е чист адресът. */
export function zvaneneHref(view: ZvaneneView): string {
  return view === ZVANENE_DEFAULT ? "/ekip" : `/ekip?vid=${view}`;
}

/**
 * Табовете с числата им, в реда, по който Димитър ги изброи. „Студени“ излиза
 * последен и само при човек, на когото Ивайло е дал студени фирми.
 */
export function zvaneneTabs(c: ZvaneneCounts, active?: ZvaneneView): ZvaneneTab[] {
  const count: Record<ZvaneneView, number> = {
    novi: c.fresh,
    povtorno: c.cancelled + c.noshow + c.retry + c.waiting,
    ivailo: c.given,
    sreshti: c.booked,
    studeni: c.studeni ?? 0,
  };
  const urgent: Record<ZvaneneView, number> = {
    novi: 0,
    povtorno: c.cancelled + c.noshow,
    ivailo: 0,
    sreshti: c.msgsDue,
    studeni: 0,
  };
  const views = ZVANENE_VIEWS.filter((v) => v !== "studeni" || count.studeni > 0 || active === "studeni");
  return views.map((view) => ({
    view,
    href: zvaneneHref(view),
    label: ZVANENE_LABEL[view],
    count: count[view],
    urgent: urgent[view],
  }));
}

/**
 * Червената лента „звънни им днес“ на всеки изглед освен самия „за повторно“:
 * отказаната и пропуснатата среща не бива да чакат втори клик, за да се видят.
 */
export function urgentBanner(view: ZvaneneView, c: Pick<ZvaneneCounts, "cancelled" | "noshow">): string | null {
  if (view === "povtorno") return null;
  const total = c.cancelled + c.noshow;
  if (total === 0) return null;
  const parts = [
    c.cancelled > 0 ? `${c.cancelled} отказаха срещата` : null,
    c.noshow > 0 ? `${c.noshow} не се явиха` : null,
  ].filter(Boolean);
  return `${parts.join(" · ")} — звънни им днес`;
}
