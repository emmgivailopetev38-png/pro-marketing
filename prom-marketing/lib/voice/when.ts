/**
 * „Другата седмица във вторник в три" → истинска дата.
 *
 * Защо изобщо съществува: моделът в ElevenLabs понякога връща ISO дата, но много
 * често подава българската фраза както я е чул. Ако тя се подаде на `new Date()`,
 * излиза `Invalid Date` и напомнянето мълчаливо изчезва — най-скъпата грешка в
 * гласов CRM, защото човекът е СИГУРЕН, че си го е записал.
 *
 * Часовете се смятат по СОФИЙСКО стенно време. Vercel върви на UTC; без това
 * „утре в 10" се записва като 13:00 през лятото.
 */

const TZ = "Europe/Sofia";

/** Отместването на Европа/София спрямо UTC за дадения момент, в минути. */
function tzOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

/** Софийско стенно време (y, m, d, h, min) → истинският UTC момент. */
export function fromSofia(y: number, m: number, d: number, h = 0, min = 0): Date {
  const naive = Date.UTC(y, m - 1, d, h, min);
  // Две минавания: първото познава отместването, второто го оправя, ако
  // сме паднали точно в нощта на смяната на времето.
  const first = new Date(naive - tzOffsetMinutes(new Date(naive)) * 60000);
  return new Date(naive - tzOffsetMinutes(first) * 60000);
}

/** Днешната дата по софийски календар, а не по UTC. */
export function sofiaToday(now = new Date()): { y: number; m: number; d: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = p.split("-").map(Number);
  return { y, m, d };
}

const NUMBER_WORDS: Record<string, number> = {
  един: 1, една: 1, едно: 1, "1": 1,
  два: 2, две: 2, "2": 2,
  три: 3, "3": 3,
  четири: 4, "4": 4,
  пет: 5, "5": 5,
  шест: 6, "6": 6,
  седем: 7, "7": 7,
  осем: 8, "8": 8,
  девет: 9, "9": 9,
  десет: 10, "10": 10,
  единайсет: 11, единадесет: 11, "11": 11,
  дванайсет: 12, дванадесет: 12, "12": 12,
};

const WEEKDAYS: Record<string, number> = {
  неделя: 0,
  понеделник: 1,
  вторник: 2,
  сряда: 3,
  четвъртък: 4,
  петък: 5,
  събота: 6,
};

const MONTHS: Record<string, number> = {
  януари: 1, февруари: 2, март: 3, април: 4, май: 5, юни: 6,
  юли: 7, август: 8, септември: 9, октомври: 10, ноември: 11, декември: 12,
};

export interface ParsedWhen {
  /** Моментът в UTC — това влиза в базата. */
  date: Date;
  /** Дали е казан и час. Ако не е, часът е сложен по подразбиране. */
  hasTime: boolean;
}

/**
 * Разбира ISO низ или българска фраза. Връща null, когато нищо не е разпознато —
 * извикващият тогава НЕ записва дата, вместо да запише 1970 година.
 *
 * @param defaultHour часът, когато е казан само ден (10:00 за срещи, 9:00 за напомняния)
 */
export function parseWhen(raw: string, opts?: { now?: Date; defaultHour?: number }): ParsedWhen | null {
  const now = opts?.now ?? new Date();
  const defaultHour = opts?.defaultHour ?? 10;
  const text = raw.trim().toLowerCase();
  if (!text) return null;

  // 1. Истински ISO — най-честият случай, когато моделът се справи.
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[t ](\d{1,2}):(\d{2}))?/);
  if (iso) {
    const hasTime = !!iso[4];
    // Изрична зона („Z", „+03:00") значи, че моментът вече е абсолютен.
    // Без зона „2026-08-26T15:00" е софийско стенно време, не UTC.
    if (/(z|[+-]\d{2}:?\d{2})$/i.test(text)) {
      const d = new Date(text);
      if (!Number.isNaN(d.getTime())) return { date: d, hasTime };
    }
    const d = fromSofia(+iso[1], +iso[2], +iso[3], iso[4] ? +iso[4] : defaultHour, iso[5] ? +iso[5] : 0);
    if (!Number.isNaN(d.getTime())) return { date: d, hasTime };
  }

  const today = sofiaToday(now);
  const base = new Date(Date.UTC(today.y, today.m - 1, today.d));
  const shift = (days: number) => {
    const d = new Date(base.getTime() + days * 86400000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  };

  let day: { y: number; m: number; d: number } | null = null;
  /** Изрязва се от текста преди търсенето на час — иначе „15.09" се чете като 15:09. */
  let dateText = "";

  // 2. „15.09" / „15.09.2026" / „15 септември"
  const named = text.match(
    new RegExp(`(\\d{1,2})\\s*-?\\s*(?:ти|ви|ри|ми|ни)?\\s+(${Object.keys(MONTHS).join("|")})`)
  );
  const dotted = text.match(/(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?/);
  if (named) {
    const month = MONTHS[named[2]];
    const dd = Number(named[1]);
    let year = today.y;
    // Месец, който вече е минал, значи следващата година — иначе срещата пада в миналото.
    if (month < today.m || (month === today.m && dd < today.d)) year += 1;
    day = { y: year, m: month, d: dd };
    dateText = named[0];
  } else if (dotted) {
    const dd = Number(dotted[1]);
    const mm = Number(dotted[2]);
    let year = dotted[3] ? Number(dotted[3]) : today.y;
    if (year < 100) year += 2000;
    if (!dotted[3] && (mm < today.m || (mm === today.m && dd < today.d))) year += 1;
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      day = { y: year, m: mm, d: dd };
      dateText = dotted[0];
    }
  }

  const time = parseTime(dateText ? text.replace(dateText, " ") : text);

  // 3. Относителни думи. ⚠️ БЕЗ \b — в JavaScript „\w" е само латиница, значи
  //    „\bднес" никога не съвпада с кирилица. Затова границите са явни: word().
  if (!day) {
    if (word(text, "днес") || word(text, "сега")) day = shift(0);
    else if (word(text, "вдругиден")) day = shift(2);
    else if (word(text, "утре")) day = shift(1);
    // Миналото се разпознава нарочно: „вчера" при среща почти винаги значи
    // чута накриво дата, а извикващият може да откаже само ако види минал час.
    else if (word(text, "вчера")) day = shift(-1);
    else if (/онзи\s+ден/.test(text)) day = shift(-2);
    else {
      const after = text.match(/след\s+(\S+)\s*(ден|дни|дена|седмица|седмици|месец|месеца)/);
      if (after) {
        const parsed = NUMBER_WORDS[after[1]] ?? Number(after[1]);
        const count = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
        const unit = after[2];
        if (unit.startsWith("ден") || unit.startsWith("дни") || unit.startsWith("дена")) day = shift(count);
        else if (unit.startsWith("седмиц")) day = shift(count * 7);
        else {
          const moved = new Date(Date.UTC(today.y, today.m - 1 + count, today.d));
          day = { y: moved.getUTCFullYear(), m: moved.getUTCMonth() + 1, d: moved.getUTCDate() };
        }
      } else if (/след\s+(седмица|месец)/.test(text)) {
        day = /месец/.test(text) ? monthAhead(today) : shift(7);
      }
    }
  }

  // 4. Ден от седмицата — „във вторник", „другия петък"
  if (!day) {
    const nextWeek = /(друг|следващ|идва)\S*\s+седмиц/.test(text);
    const toMonday = ((1 - base.getUTCDay() + 7) % 7) || 7;
    const wd = Object.keys(WEEKDAYS).find((name) => text.includes(name));
    if (wd) {
      if (nextWeek) {
        // „другата седмица във вторник" е вторникът СЛЕД понеделника на
        // следващата седмица, а не утрешният вторник.
        day = shift(toMonday + ((WEEKDAYS[wd] - 1 + 7) % 7));
      } else {
        const delta = (WEEKDAYS[wd] - base.getUTCDay() + 7) % 7;
        // „във вторник", казано във вторник, значи СЛЕДВАЩИЯ вторник.
        day = shift(delta === 0 ? 7 : delta);
      }
    } else if (nextWeek) {
      day = shift(toMonday); // „другата седмица" без ден = понеделник
    }
  }

  if (!day) {
    return time ? { date: fromSofia(today.y, today.m, today.d, time.h, time.min), hasTime: true } : null;
  }

  return {
    date: fromSofia(day.y, day.m, day.d, time?.h ?? defaultHour, time?.min ?? 0),
    hasTime: !!time,
  };
}

function monthAhead(t: { y: number; m: number; d: number }) {
  const moved = new Date(Date.UTC(t.y, t.m, t.d));
  return { y: moved.getUTCFullYear(), m: moved.getUTCMonth() + 1, d: moved.getUTCDate() };
}

/** Цяла дума на кирилица — „\b" не работи за нея в JavaScript. */
function word(text: string, w: string): boolean {
  return new RegExp(`(^|[^а-яА-Я])${w}([^а-яА-Я]|$)`).test(text);
}

function parseTime(text: string): { h: number; min: number } | null {
  // „в 15:30", „15.30 ч"
  const hhmm = text.match(/(\d{1,2})[:.](\d{2})\s*(?:ч|часа|часът)?(?![\d])/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const min = Number(hhmm[2]);
    // 15.30 може да е и дата (15 март). Час е само ако минутите са валидни
    // и след точката НЕ следва още една дата-група.
    if (h <= 23 && min <= 59 && !/(\d{1,2})[.\/](\d{1,2})[.\/]/.test(text)) return applyDaypart(text, h, min);
  }

  // „в три часа", „в 15 часа", „в 9". Търси се ВСЯКО „в …", защото в
  // „в петък в три" първото съвпадение е ден, не час — и спре ли се на него,
  // срещата пада в 14:00 по подразбиране вместо в 15:00.
  for (const m of text.matchAll(/в\s+([а-я]+|\d{1,2})\s*(?:часа|часът|час|ч)?/g)) {
    const h = NUMBER_WORDS[m[1]] ?? Number(m[1]);
    if (Number.isFinite(h) && h >= 0 && h <= 23) {
      const half = /и\s+половина/.test(text) ? 30 : 0;
      return applyDaypart(text, h, half);
    }
  }

  if (text.includes("сутринта")) return { h: 9, min: 0 };
  if (text.includes("обяд")) return { h: 12, min: 0 };
  if (text.includes("следобед")) return { h: 14, min: 0 };
  if (text.includes("вечерта")) return { h: 18, min: 0 };
  return null;
}

/**
 * „в три следобед" е 15:00, не 3:00. Без това правило половината срещи,
 * уговорени по телефона, падат посред нощ.
 */
function applyDaypart(text: string, h: number, min: number): { h: number; min: number } {
  if (text.includes("сутринта") || text.includes("през нощта")) return { h, min };
  if (h < 12 && (text.includes("следобед") || text.includes("вечерта"))) return { h: h + 12, min };
  // Работен ден: „в 4" почти винаги значи 16:00, не 4 сутринта.
  if (h >= 1 && h <= 7) return { h: h + 12, min };
  return { h, min };
}

/** „вторник, 26 август, 15:00" — за изречението, което агентът чете на глас. */
export function speakDate(date: Date, withTime = true): string {
  return new Intl.DateTimeFormat("bg-BG", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}
