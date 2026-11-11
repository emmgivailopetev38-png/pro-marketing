/**
 * Моделът за показване на една оферта — общ за PDF-а, страницата и имейла.
 * Всичко, което клиентът вижда, минава оттук: попълнени текстове, суми, продавач.
 */
import { ABOUT, SELLERS, SITE, VAT_MODE_LABEL, type OfferContent, type OfferItem, type OfferSection, type Seller, type VatMode } from "./katalog";
import {
  compareNote,
  compareTable,
  compareTitle,
  fillAll,
  fmtDateBg,
  fmtEur,
  greeting,
  niceCompany,
  niceName,
  offerNumber,
  pdfFilename,
  totals,
  withUnit,
  type CompareTable,
  type Totals,
} from "./smetki";
import { kamVie, kamVieAll } from "./vie";

export interface OfferContactLite {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: string | null;
}

export interface OfferFull {
  id: string;
  number: number | null;
  token: string | null;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: string;
  amount_net: number | null;
  amount_gross: number | null;
  vat_amount: number | null;
  currency: string;
  sent_at: string | null;
  valid_until: string | null;
  accepted_at: string | null;
  url: string | null;
  source: string;
  notes: string | null;
  template_key: string | null;
  items: OfferItem[];
  content: OfferContent;
  discount: number | null;
  discount_note: string | null;
  vat_mode: VatMode;
  owner_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  contact: OfferContactLite | null;
}

export interface OfferView {
  offer: OfferFull;
  seller: Seller;
  clientName: string;
  clientCompany: string;
  /** „За Funky 360“ / „За Лъчезар Генов“ */
  forLine: string;
  greeting: string;
  content: OfferContent;
  /** редовете за показване — при „Вие“ текстовете от каталога са превърнати в учтива форма */
  items: OfferItem[];
  totals: Totals;
  number: string;
  date: string;
  validUntil: string;
  vatLine: string;
  url: string;
  pdfUrl: string;
  pdfFilename: string;
  hasInstallments: boolean;
  /** „6 × 1 211 € · 12 × 632 € · 24 × 344 €“ по модул с вноски */
  installmentLines: { title: string; line: string }[];
  /** модулите „за сравнение“ (не влизат в сумата) — при „Вие“ в учтива форма */
  alternatives: OfferItem[];
  /** разделът „за сравнение“: заглавие, изречение, таблица (ако модулите имат факти) — или null */
  compare: { title: string; note: string; table: CompareTable | null } | null;
  /** свободните раздели */
  sections: OfferSection[];
  /** „Кой е Ивайло Петев“ — или null */
  about: typeof ABOUT | null;
}

export function offerUrl(token: string): string {
  return `${SITE}/oferta/${token}`;
}

export function viewModel(offer: OfferFull): OfferView {
  const seller = SELLERS[offer.content?.seller ?? "ivailo"] ?? SELLERS.ivailo;
  const clientName = niceName(offer.content?.client_name ?? offer.contact?.full_name ?? "");
  const clientCompany = niceCompany(offer.content?.client_company ?? offer.contact?.company ?? "");
  const validUntil = fmtDateBg(offer.valid_until);
  const vie = (offer.content?.greeting ?? "ti") === "vie";
  const filled = fillAll(
    {
      greeting: offer.content?.greeting ?? "ti",
      seller: seller.key,
      client_name: clientName,
      client_company: clientCompany,
      intro: offer.content?.intro,
      pain: offer.content?.pain,
      outcome: offer.content?.outcome,
      ps: offer.content?.ps,
      next_steps: offer.content?.next_steps ?? [],
      terms: offer.content?.terms ?? [],
      alternatives_note: offer.content?.alternatives_note,
      sections: offer.content?.sections,
      about: offer.content?.about,
    },
    { name: clientName, company: clientCompany, seller: seller.key, date: validUntil }
  );
  const content: OfferContent = vie
    ? {
        ...filled,
        intro: filled.intro ? kamVie(filled.intro) : filled.intro,
        pain: filled.pain ? kamVie(filled.pain) : filled.pain,
        outcome: filled.outcome ? kamVie(filled.outcome) : filled.outcome,
        ps: filled.ps ? kamVie(filled.ps) : filled.ps,
        next_steps: kamVieAll(filled.next_steps) ?? [],
        terms: kamVieAll(filled.terms) ?? [],
        alternatives_note: filled.alternatives_note ? kamVie(filled.alternatives_note) : filled.alternatives_note,
        sections: filled.sections?.map((sec) => ({
          title: kamVie(sec.title),
          ...(sec.text ? { text: kamVie(sec.text) } : {}),
          ...(sec.bullets ? { bullets: kamVieAll(sec.bullets) ?? [] } : {}),
        })),
      }
    : filled;
  // шаблоните пишат „P.S. …“ в самия текст, а страницата и PDF-ът слагат „P.S.“ пред него → без двойно
  if (content.ps) content.ps = content.ps.replace(/^\s*P\.\s*S\.\s*/i, "");
  const polite = (i: OfferItem): OfferItem =>
    vie
      ? {
          ...i,
          title: kamVie(i.title),
          subtitle: i.subtitle ? kamVie(i.subtitle) : i.subtitle,
          bullets: kamVieAll(i.bullets) ?? [],
          outcome: i.outcome ? kamVie(i.outcome) : i.outcome,
          not_included: kamVieAll(i.not_included),
          note: i.note ? kamVie(i.note) : i.note,
          setup_label: i.setup_label ? kamVie(i.setup_label) : i.setup_label,
        }
      : i;
  const items: OfferItem[] = (offer.items ?? []).map(polite);
  const rawAlternatives = offer.content?.alternatives ?? [];
  const alternatives: OfferItem[] = rawAlternatives.map(polite);
  let compare: OfferView["compare"] = null;
  if (alternatives.length > 0) {
    const table = compareTable(items, alternatives);
    compare = {
      title: compareTitle(offer.items ?? [], rawAlternatives),
      note: content.alternatives_note || compareNote(items, content.greeting),
      table: table && vie ? { columns: table.columns, rows: table.rows.map((r) => ({ label: r.label, values: r.values.map((x) => kamVie(x)) })) } : table,
    };
  }
  const t = totals(offer.items ?? [], offer.discount, offer.vat_mode ?? "incl");
  const token = offer.token ?? "";
  const url = token ? offerUrl(token) : (offer.url ?? SITE);
  const withInst = items.filter((i) => i.installments && i.installments.length > 0);
  return {
    offer,
    seller,
    clientName,
    clientCompany,
    forLine: clientCompany && clientName ? `${clientName} · ${clientCompany}` : clientCompany || clientName || (vie ? "Вас" : "теб"),
    greeting: greeting(content.greeting, clientName),
    content,
    items,
    totals: t,
    number: offerNumber(offer.number, offer.created_at),
    date: fmtDateBg(offer.created_at),
    validUntil,
    vatLine: VAT_MODE_LABEL[offer.vat_mode ?? "incl"],
    url,
    pdfUrl: `${url}/pdf`,
    pdfFilename: pdfFilename(clientName, clientCompany),
    hasInstallments: withInst.length > 0,
    installmentLines: withInst.map((i) => ({
      title: i.title,
      line: (i.installments ?? []).map((x) => `${x.term.replace(/\s*мес\.?/, "")} × ${fmtEur(x.monthly)}`).join(" · "),
    })),
    alternatives,
    compare,
    sections: content.sections ?? [],
    about: offer.content?.about ? ABOUT : null,
  };
}

/** Кратко описание за Telegram/CRM: редовете + общото. */
export function shortSummary(v: OfferView): string {
  const rows = v.items.map((i) => {
    const setup = i.setup_price ? ` + ${fmtEur(i.setup_price)} внедряване` : "";
    return `• ${i.title} — ${withUnit(fmtEur(i.price), i.unit)}${setup}`;
  });
  const tot: string[] = [];
  if (v.totals.one_time_after > 0) tot.push(`еднократно ${fmtEur(v.totals.one_time_after)}`);
  if (v.totals.monthly_after > 0) tot.push(`месечно ${fmtEur(v.totals.monthly_after)}`);
  if (v.totals.discount > 0) tot.push(`отстъпка ${fmtEur(v.totals.discount)}`);
  const extra: string[] = [];
  if (v.alternatives.length > 0) {
    extra.push(`За сравнение (не влизат в сумата): ${v.alternatives.map((i) => `${i.title} — ${withUnit(fmtEur(i.price), i.unit)}`).join("; ")}`);
  }
  if (v.sections.length > 0) extra.push(`Раздели: ${v.sections.map((x) => x.title).join("; ")}`);
  if (v.about) extra.push(`Раздел „${v.about.title}“: да`);
  return [
    ...rows,
    `Общо: ${tot.join(" · ") || "—"} (${v.vatLine ? v.vatLine.replace(/\.$/, "").replace(/^Всички/, "всички").replace(/^Цените/, "цените") : "без ред за ДДС"})`,
    ...extra,
    `Валидна до ${v.validUntil}`,
  ].join("\n");
}
