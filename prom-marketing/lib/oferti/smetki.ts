/**
 * Чистата логика на офертите — без база и без мрежа, за да се тества.
 * Сумите: „еднократно“ (вкл. внедряванията) и „месечно“ се показват отделно;
 * отстъпката пада върху еднократното (ако няма такова — върху месечното);
 * стойността за CRM-а (amount_gross) е за първата година = еднократно + 12 × месечно.
 */
import {
  MODULE_BY_KEY,
  SELLERS,
  type GreetingForm,
  type OfferContent,
  type OfferItem,
  type OfferModule,
  type SellerKey,
  type VatMode,
} from "./katalog";

export function isToken(s: string): boolean {
  return /^[a-z2-9]{8,16}$/.test(s);
}

/** 6900 → „6 900 €“; 0,4 → „0,40 €“. */
export function fmtEur(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const whole = Math.round(n * 100) / 100;
  const hasCents = Math.abs(whole - Math.round(whole)) > 0.004;
  const s = (hasCents ? whole.toFixed(2) : String(Math.round(whole))).replace(".", ",");
  const [int, dec] = s.split(",");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped}${dec ? "," + dec : ""} €`;
}

/** „500 €/мес“, „1 000 € еднократно“ — наклонената черта се лепи към сумата. */
export function withUnit(amount: string, unit: string | null | undefined): string {
  const u = (unit ?? "").trim();
  if (!u) return amount;
  return u.startsWith("/") ? `${amount}${u}` : `${amount} ${u}`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface Totals {
  one_time: number;
  monthly: number;
  discount: number;
  one_time_after: number;
  monthly_after: number;
  /** стойността за CRM-а: първата година */
  year_value: number;
  net: number;
  vat: number;
  gross: number;
  vat_mode: VatMode;
}

export function totals(items: OfferItem[], discount: number | null | undefined, vatMode: VatMode): Totals {
  let one_time = 0;
  let monthly = 0;
  for (const it of items) {
    const qty = it.qty && it.qty > 0 ? it.qty : 1;
    const price = it.price ?? 0;
    if (it.unit === "/мес") monthly += price * qty;
    else one_time += price * qty;
    if (it.setup_price) one_time += it.setup_price;
  }
  const d = Math.max(0, discount ?? 0);
  const one_time_after = one_time > 0 ? Math.max(0, one_time - d) : 0;
  const monthly_after = one_time > 0 ? monthly : Math.max(0, monthly - d);
  const year_value = round2(one_time_after + 12 * monthly_after);
  let net: number;
  let vat: number;
  let gross: number;
  if (vatMode === "incl") {
    gross = year_value;
    net = round2(gross / 1.2);
    vat = round2(gross - net);
  } else if (vatMode === "excl") {
    net = year_value;
    vat = round2(net * 0.2);
    gross = round2(net + vat);
  } else {
    net = year_value;
    vat = 0;
    gross = year_value;
  }
  return {
    one_time: round2(one_time),
    monthly: round2(monthly),
    discount: round2(d),
    one_time_after: round2(one_time_after),
    monthly_after: round2(monthly_after),
    year_value,
    net,
    vat,
    gross,
    vat_mode: vatMode,
  };
}

/** Ред от модул + поправките за човека (цена, заглавие, точки, бележка…). */
export function itemFromModule(mod: OfferModule, o: Partial<OfferItem> = {}): OfferItem {
  const base: OfferItem = {
    key: mod.key,
    title: mod.title,
    subtitle: mod.subtitle,
    bullets: [...mod.bullets],
    outcome: mod.outcome,
    not_included: mod.not_included ? [...mod.not_included] : undefined,
    price: mod.price,
    unit: mod.unit,
    setup_price: mod.setup_price ?? null,
    setup_label: mod.setup_label,
    installments: mod.installments ? mod.installments.map((i) => ({ ...i })) : undefined,
    qty: 1,
    tint: mod.tint,
  };
  const out: OfferItem = { ...base };
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (k === "bullets" && Array.isArray(v) && v.length === 0) continue;
    (out as unknown as Record<string, unknown>)[k] = v;
  }
  if (o.price !== undefined && o.price !== null && o.price !== mod.price) {
    // сменена цена → вноските от стълбата вече не важат
    out.installments = o.installments ?? undefined;
  }
  return out;
}

export interface ItemInput {
  key: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  outcome?: string;
  not_included?: string[];
  price?: number | null;
  unit?: "еднократно" | "/мес";
  setup_price?: number | null;
  setup_label?: string;
  qty?: number;
  note?: string;
  /** само при items_mode = "merge": маха реда с този key */
  remove?: boolean;
}

/** Сглобява редовете: модул от каталога (+ поправки) или свободен ред. Връща грешките на човешки. */
export function buildItems(inputs: ItemInput[]): { items: OfferItem[]; errors: string[] } {
  const items: OfferItem[] = [];
  const errors: string[] = [];
  for (const inp of inputs) {
    const mod = MODULE_BY_KEY[inp.key];
    if (!mod) {
      errors.push(`непознат модул „${inp.key}“`);
      continue;
    }
    const it = itemFromModule(mod, {
      title: inp.title,
      subtitle: inp.subtitle,
      bullets: inp.bullets,
      outcome: inp.outcome,
      not_included: inp.not_included,
      price: inp.price ?? undefined,
      unit: inp.unit,
      setup_price: inp.setup_price ?? undefined,
      setup_label: inp.setup_label,
      qty: inp.qty,
      note: inp.note,
    });
    if (mod.key === "custom" && (!inp.title || !inp.title.trim())) {
      errors.push("свободният ред иска заглавие");
      continue;
    }
    if (it.price === null || it.price === undefined) {
      errors.push(`„${it.title}“ няма цена — цената за този човек я дава Ивайло`);
      continue;
    }
    if (it.price < 0) {
      errors.push(`„${it.title}“ има отрицателна цена`);
      continue;
    }
    items.push(it);
  }
  if (items.length === 0 && errors.length === 0) errors.push("офертата няма нито един ред");
  return { items, errors };
}

function definedOnly<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null)) as Partial<T>;
}

/**
 * Поправки по key върху съществуващите редове (09.11.2026): същият key → сливане (цената и всичко
 * неказано се пази), нов key → добавя се, remove:true → махa се; неспоменатите редове остават.
 * Повтарящ се key (два реда „custom“) се хваща по ред на появяване.
 */
export function mergeItems(base: ItemInput[], patches: ItemInput[]): ItemInput[] {
  const merged: ItemInput[] = base.map((b) => ({ ...b }));
  const used = new Set<number>();
  const removed = new Set<number>();
  for (const patch of patches) {
    const idx = merged.findIndex((b, k) => b.key === patch.key && !used.has(k));
    if (idx >= 0) {
      used.add(idx);
      if (patch.remove) removed.add(idx);
      else merged[idx] = { ...merged[idx], ...definedOnly(patch) };
    } else if (!patch.remove) {
      merged.push({ ...patch });
      used.add(merged.length - 1);
    }
  }
  return merged.filter((_, k) => !removed.has(k)).map((x) => {
    const rest = { ...x };
    delete rest.remove;
    return rest;
  });
}

/**
 * Името, както се пише в документ: „даниел вучев“ / „ДАНИЕЛ ВУЧЕВ“ → „Даниел Вучев“ (09.11.2026).
 * Лийдовете от Meta често са с малки букви; смесено изписване („МакДоналд“) се оставя както е.
 */
export function niceName(full: string | null | undefined): string {
  const s = (full ?? "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  const letters = s.replace(/[^\p{L}]/gu, "");
  if (!letters) return s;
  const allLower = letters === letters.toLowerCase();
  const allUpper = letters === letters.toUpperCase() && letters.length > 3;
  if (!allLower && !allUpper) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s\-‑'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Фирмата: изцяло с малки букви („cafemag.bg“) → с главна първа буква („Cafemag.bg“); иначе както е. */
export function niceCompany(company: string | null | undefined): string {
  const s = (company ?? "").trim();
  if (!s) return "";
  const letters = s.replace(/[^\p{L}]/gu, "");
  if (!letters || letters !== letters.toLowerCase()) return s;
  return s[0].toUpperCase() + s.slice(1);
}

export function firstName(full: string | null | undefined): string {
  const s = niceName(full);
  if (!s) return "";
  return s.split(/\s+/)[0];
}

export function greeting(form: GreetingForm, name: string | null | undefined): string {
  const f = firstName(name);
  if (form === "vie") return f ? `Здравейте, ${f}!` : "Здравейте!";
  return f ? `Здравей, ${f}!` : "Здравей!";
}

/** Заглавието на офертата за CRM-а и имейла: „Ниво II · Пари с AI + Ели · гласов AI агент“. */
export function offerTitle(items: OfferItem[], custom?: string | null): string {
  const c = (custom ?? "").trim();
  if (c) return c;
  const names = items.map((i) => i.title.trim()).filter(Boolean);
  if (names.length === 0) return "Оферта";
  if (names.length <= 2) return names.join(" + ");
  // три кратки реда се събират изцяло („Гласов агент + Имейл и чат агент + Поддръжка“), иначе „+ още N“
  const all = names.join(" + ");
  if (names.length === 3 && all.length <= 90) return all;
  return `${names[0]} + ${names[1]} + още ${names.length - 2}`;
}

/** Един ред на модул — за имейла и за Telegram: „Ниво II · Пари с AI — 6 900 € еднократно“. */
export function summaryLines(items: OfferItem[]): string[] {
  return items.map((i) => {
    const qty = i.qty && i.qty > 1 ? ` × ${i.qty}` : "";
    const price = i.price === null || i.price === undefined ? "цена по договорка" : withUnit(`${fmtEur(i.price)}${qty}`, i.unit);
    const setup = i.setup_price ? ` + ${fmtEur(i.setup_price)} ${i.setup_label ?? "внедряване"}` : "";
    return `${i.title} — ${price}${setup}`;
  });
}

/** „{име}“, „{фирма}“, „{продавач}“, „{дата}“ в текстовете на шаблоните. */
export function fill(
  text: string,
  ctx: { name?: string | null; company?: string | null; seller?: SellerKey; date?: string | null }
): string {
  const name = firstName(ctx.name) || "теб";
  const company = (ctx.company ?? "").trim() || (ctx.name ?? "").trim() || "твоя бизнес";
  const seller = ctx.seller ? SELLERS[ctx.seller].first : "нас";
  const date = ctx.date ?? "";
  return text
    .replaceAll("{име}", name)
    .replaceAll("{фирма}", company)
    .replaceAll("{продавач}", seller)
    .replaceAll("{дата}", date);
}

export function fillAll(
  content: OfferContent,
  ctx: { name?: string | null; company?: string | null; seller?: SellerKey; date?: string | null }
): OfferContent {
  const f = (s?: string) => (s ? fill(s, ctx) : s);
  return {
    ...content,
    intro: f(content.intro),
    pain: f(content.pain),
    outcome: f(content.outcome),
    ps: f(content.ps),
    next_steps: (content.next_steps ?? []).map((s) => fill(s, ctx)),
    terms: (content.terms ?? []).map((s) => fill(s, ctx)),
  };
}

/** Датата по софийско време: „20.11.2026“. */
export function fmtDateBg(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" })
    .format(d)
    .replace(/\s*г\.$/, "");
}

/** Днес + N дни като YYYY-MM-DD (софийско време). */
export function validUntilIso(days: number, now = new Date()): string {
  const d = new Date(now.getTime() + Math.max(1, days) * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts;
}

/** Номерът на офертата за документа: „2026-017“. */
export function offerNumber(number: number | null | undefined, createdAt: string | null | undefined): string {
  const year = createdAt ? new Date(createdAt).getUTCFullYear() : new Date().getUTCFullYear();
  return `${year}-${String(number ?? 0).padStart(3, "0")}`;
}

const LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a",
  ь: "y", ю: "yu", я: "ya",
};

/** Име на файл за PDF-а: „Лъчезар Генов“ → „Lachezar-Genov“. */
export function latin(s: string): string {
  const out = [...s.toLowerCase()].map((ch) => LAT[ch] ?? ch).join("");
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("-");
}

export function pdfFilename(clientName: string | null | undefined, company?: string | null): string {
  const who = latin((company || clientName || "klient").trim()) || "Klient";
  return `ProMarketing-Oferta-${who}.pdf`;
}
