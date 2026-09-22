/**
 * Личните финанси на физическото лице — чистите правила.
 *
 * Фирмата има `expenses` (с `is_personal` за лична покупка през фирмата) и
 * плащания/фактури. Тук са парите на самия Ивайло: приходи и разходи по
 * категории. Страницата ги показва месец по месец и до тях — фирмата за
 * същия месец, за да се вижда „човек“ и „фирма“ поотделно.
 */

export const PF_KINDS = ["income", "expense"] as const;
export type PfKind = (typeof PF_KINDS)[number];

export const PF_INCOME_CATEGORIES = ["salary", "dividend", "freelance", "rent", "other"] as const;
export const PF_EXPENSE_CATEGORIES = [
  "home",
  "food",
  "car",
  "transport",
  "health",
  "family",
  "education",
  "subscriptions",
  "clothes",
  "fun",
  "loans",
  "savings",
  "taxes",
  "other",
] as const;

export const PF_CATEGORY_LABEL: Record<string, string> = {
  salary: "Заплата от фирмата",
  dividend: "Дивидент",
  freelance: "Хонорар / друга работа",
  rent: "Наем (получен)",
  home: "Дом · наем, ток, вода, интернет",
  food: "Храна",
  car: "Кола · гориво, ремонт, застраховка",
  transport: "Транспорт",
  health: "Здраве",
  family: "Семейство",
  education: "Обучение, книги, курсове",
  subscriptions: "Абонаменти (лични)",
  clothes: "Дрехи",
  fun: "Излизане, почивка",
  loans: "Кредити, вноски",
  savings: "Спестяване, инвестиции",
  taxes: "Данъци и осигуровки (лични)",
  other: "Друго",
};

export interface PfRow {
  id: string;
  kind: PfKind;
  category: string;
  description: string | null;
  amount: number;
  currency: string;
  occurred_on: string;
  recurring: boolean;
  note: string | null;
}

export function isPfKind(v: unknown): v is PfKind {
  return v === "income" || v === "expense";
}

export function categoriesFor(kind: PfKind): readonly string[] {
  return kind === "income" ? PF_INCOME_CATEGORIES : PF_EXPENSE_CATEGORIES;
}

export function monthKey(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export interface MonthTotals {
  month: string;
  income: number;
  expense: number;
  net: number;
  byCategory: Array<{ category: string; kind: PfKind; amount: number }>;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Сборове за месец: приход, разход, остатък и по категории (най-големите първи). */
export function monthTotals(rows: PfRow[], month: string): MonthTotals {
  const inMonth = rows.filter((r) => monthKey(r.occurred_on) === month);
  const cat = new Map<string, { category: string; kind: PfKind; amount: number }>();
  let income = 0;
  let expense = 0;
  for (const r of inMonth) {
    const a = Number(r.amount) || 0;
    if (r.kind === "income") income += a;
    else expense += a;
    const k = `${r.kind}:${r.category}`;
    const c = cat.get(k) ?? { category: r.category, kind: r.kind, amount: 0 };
    c.amount += a;
    cat.set(k, c);
  }
  return {
    month,
    income: r2(income),
    expense: r2(expense),
    net: r2(income - expense),
    byCategory: [...cat.values()].map((c) => ({ ...c, amount: r2(c.amount) })).sort((a, b) => b.amount - a.amount),
  };
}

/** Последните N месеца, най-новият последен — за стълбчетата. */
export function lastMonths(n: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export interface ImportedRow {
  kind: PfKind;
  category: string;
  description: string;
  amount: number;
  occurred_on: string;
  recurring: boolean;
}

/**
 * Внос от текст — един ред = един запис. Приема формата от бележките на
 * Ивайло, колкото и разхвърляна да е:
 *   „22.09.2026; наем; 450“ · „2026-09-22 | храна | 120,50 | лично“ ·
 *   „+ заплата 2000 01.09“ · „кола гориво 80“ (дата = днешна)
 * Знак „+“ или дума от приходните категории → приход; иначе разход.
 * Категорията се познава по ключови думи; непозната → „other“.
 */
export function parseImport(text: string, today: string = new Date().toISOString().slice(0, 10)): ImportedRow[] {
  const out: ImportedRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    let kind: PfKind = "expense";
    let rest = line;
    if (rest.startsWith("+")) {
      kind = "income";
      rest = rest.slice(1).trim();
    } else if (rest.startsWith("-")) {
      rest = rest.slice(1).trim();
    }
    // Дата: дд.мм.гггг или гггг-мм-дд, където и да е на реда.
    let occurred_on = today;
    const d1 = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(rest);
    const d2 = /(\d{4})-(\d{2})-(\d{2})/.exec(rest);
    if (d1) {
      occurred_on = `${d1[3]}-${d1[2].padStart(2, "0")}-${d1[1].padStart(2, "0")}`;
      rest = rest.replace(d1[0], " ");
    } else if (d2) {
      occurred_on = d2[0];
      rest = rest.replace(d2[0], " ");
    }
    // Сума: последното число на реда (с , или .).
    const nums = [...rest.matchAll(/(?<![\d.,])(\d{1,3}(?:[  ]\d{3})*|\d+)(?:[.,](\d{1,2}))?(?![\d])/g)];
    if (nums.length === 0) continue;
    const m = nums[nums.length - 1];
    const amount = Number(`${m[1].replace(/[  ]/g, "")}.${m[2] ?? "0"}`);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    rest = rest.slice(0, m.index) + rest.slice((m.index ?? 0) + m[0].length);
    // Без \b — в JavaScript то не познава кирилица.
    const recurring = /(?:^|[\s;|,])(?:всеки месец|месечно|recurring|ежемесечно)(?=$|[\s;|,])/i.test(rest);
    rest = rest.replace(/(^|[\s;|,])(?:всеки месец|месечно|recurring|ежемесечно|лично|лв\.?|лева|€|eur|евро)(?=$|[\s;|,])/gi, "$1 ");
    const description = rest
      .replace(/[;|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const category = guessCategory(description, kind);
    if (kind === "expense" && (PF_INCOME_CATEGORIES as readonly string[]).includes(category)) kind = "income";
    out.push({ kind, category, description, amount: Math.round(amount * 100) / 100, occurred_on, recurring });
  }
  return out;
}

const KEYWORDS: Array<{ category: string; re: RegExp }> = [
  { category: "salary", re: /заплат|salary/i },
  { category: "dividend", re: /дивиден/i },
  { category: "freelance", re: /хонорар|фрийланс|freelance|поръчка/i },
  { category: "rent", re: /наем получ|получен наем/i },
  { category: "home", re: /наем|ток|вода|интернет|парно|газ|жилищ|квартир|домашн/i },
  { category: "food", re: /храна|магазин|ресторант|кафе|лидл|билла|кауфланд|доставк/i },
  { category: "car", re: /кола|гориво|бензин|дизел|застраховк|винетк|сервиз|гум/i },
  { category: "transport", re: /транспорт|такси|автобус|влак|самолет|билет/i },
  { category: "health", re: /здрав|лекар|зъбо|аптек|лекарств|фитнес/i },
  { category: "family", re: /семей|дете|деца|подарък|родител/i },
  { category: "education", re: /обучен|курс|книг|skool|учебн/i },
  { category: "subscriptions", re: /абонамент|netflix|spotify|icloud|youtube|chatgpt|claude|gemini/i },
  { category: "clothes", re: /дрех|обувк/i },
  { category: "fun", re: /излизан|почивк|кино|бар|игр|пътуван/i },
  { category: "loans", re: /кредит|вноск|лизинг|заем/i },
  { category: "savings", re: /спест|инвест|депозит/i },
  { category: "taxes", re: /данъц|осигур|ддс|нап\b/i },
];

export function guessCategory(text: string, kind: PfKind): string {
  for (const k of KEYWORDS) {
    if (k.re.test(text)) {
      if (kind === "income" && !(PF_INCOME_CATEGORIES as readonly string[]).includes(k.category)) continue;
      return k.category;
    }
  }
  return "other";
}
