/**
 * „ВЪЛНАТА · Онлайн кино“ — ЕДНО място за всичко, което се сменя.
 *
 * Страниците (/kino, /kino/bilet, /kino/zala, /kino/blagodarim), плащането,
 * напомнянията и таблото четат само оттук. Смени ли се дата, цена или линк —
 * сменя се тук и никъде другаде.
 *
 * ⚠ ЧЕРНОВА — чака Ивайло: всички цени, дати, капарото, местата, бонусът,
 * гаранцията и текстът на офертата. Нищо не тръгва на живо без неговото „давай“.
 *
 * Линковете, които се решават в последния момент (видеото, живата част, Viber
 * клубът, Cal.com събитието, бонусът), могат да се дадат и през Vercel env —
 * така не се пипа кодът. Без env стоят стойностите по-долу.
 */

/** Един вариант на прогресивното MP4 — плейърът избира по екрана и мрежата. */
export interface KinoVideoVariant {
  src: string;
  height: number;
}

export type KinoVideoSource =
  | { kind: "none" }
  | { kind: "mp4"; src: string; variants?: KinoVideoVariant[]; poster?: string | null }
  | { kind: "hls"; src: string; poster?: string | null }
  | { kind: "youtube"; id: string };

/**
 * Прогресивно MP4 от Vercel Blob (store „kino-video“): 1080p и 720p
 * (H.264 + AAC, `+faststart` — moov е в началото, Blob отговаря на Range
 * заявки, затова тръгва веднага и се превърта без HLS). Постерът е JPEG.
 * Без поне един вариант → null.
 */
export function blobVideo(b: { v1080: string | null; v720: string | null; poster: string | null }): KinoVideoSource | null {
  const variants: KinoVideoVariant[] = [];
  if (b.v1080) variants.push({ src: b.v1080, height: 1080 });
  if (b.v720) variants.push({ src: b.v720, height: 720 });
  if (!variants.length) return null;
  return { kind: "mp4", src: (b.v720 ?? b.v1080)!, variants, poster: b.poster };
}

/**
 * Vercel Blob store „kino-video“ (store_zb1ApEiPtQXi1Vj7 · fra1 · public),
 * свързан с проекта pro-marketing. Адресите са постоянни (без случаен суфикс).
 */
const BLOB = "https://zb1apeiptqxi1vj7.public.blob.vercel-storage.com";

/**
 * ⚠ ФИЛМЪТ — адресите след качването (scripts/kino-video.sh → папка kino/).
 * Сменят се тук и с това филмът е в залата за всички.
 */
const FILM_BLOB = {
  v1080: null as string | null,
  v720: null as string | null,
  poster: null as string | null,
};

/**
 * Пробата: тийзърът (1:10) в същия Blob store — 1080p, 720p и постер. Ползва
 * се САМО в прегледа (локално и Vercel preview), докато филмът още не е
 * качен; в продукцията никога (решава app/kino/zala/page.tsx). Локално може и
 * файл: NEXT_PUBLIC_KINO_FILM=/път/до/файл.mp4 (в public/, не се качва в git).
 */
const TEST_BLOB = {
  v1080: `${BLOB}/kino/teaser/valnata-teaser-v1-1080.mp4` as string | null,
  v720: `${BLOB}/kino/teaser/valnata-teaser-v1-720.mp4` as string | null,
  poster: `${BLOB}/kino/teaser/valnata-teaser-v1-poster.jpg` as string | null,
};
export const KINO_TEST_VIDEO: KinoVideoSource | null = blobVideo(TEST_BLOB);

export interface KinoChapter {
  /** 0…11 — номерът, както е в сценария. */
  n: number;
  title: string;
  /** Началото на главата във филма, в секунди. */
  startSec: number;
}

/**
 * Разчита адрес на видео: `.m3u8` → HLS (Bunny / Cloudflare Stream), YouTube
 * адрес или `youtube:<id>` → YouTube (unlisted), всичко друго → обикновен MP4.
 * Празно → няма видео (залата показва главите като надписи — за преглед).
 */
export function parseVideoSource(raw: string | null | undefined): KinoVideoSource {
  const v = (raw ?? "").trim();
  if (!v) return { kind: "none" };
  const yt = v.match(/^youtube:([\w-]{6,})$/i) ?? v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([\w-]{6,})/i);
  if (yt) return { kind: "youtube", id: yt[1] };
  if (/\.m3u8(\?|$)/i.test(v)) return { kind: "hls", src: v };
  return { kind: "mp4", src: v };
}

/**
 * ⚠ process.env.NEXT_PUBLIC_* се чете с ИЗРИЧНО име, никога с process.env[name]:
 * Next вгражда стойността в браузъра само при буквален достъп. С динамично име
 * сървърът вижда линка, браузърът — не, и React вдига hydration грешка.
 */
function clean(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

export const KINO = {
  slug: "valnata",
  title: "ВЪЛНАТА",
  subtitle: "Филм за изкуствения интелект и българския бизнес",
  tagline: "Веднъж вече я изпуснахме. Този път — не.",
  host: {
    name: "Ивайло Петев",
    role: "Основател на Pro Marketing",
    photo: "/images/ivailo/IMG_7318.jpeg",
    /**
     * ⚠ Истинските екрани за „Кой е Ивайло“ (CRM-ът, гласовият агент, Telegram
     * командата) — 2–3 снимки в public/images/kino/ и пътищата тук. Докато е
     * празно, секцията е само с текста и снимката.
     */
    screens: [] as Array<{ src: string; alt: string }>,
  },

  /**
   * Прожекцията. Часовете са с изричната зона на София: +03:00 до 25.10
   * (лятно часово време), +02:00 след това — за да не зависят от сървъра.
   * Решено от Ивайло на 06.10: премиера пт 16.10, 19:30; повторение и
   * записване в потока до нд 18.10, 23:59; разговорите — пон–чт след това.
   */
  screening: {
    id: "premiera-2026-10-16",
    premiereISO: "2026-10-16T19:30:00+03:00",
    /** „Фоайето отваря вратите“ — 19:25: започва отброяването на екрана. */
    doorsOpenMinutes: 5,
    /** Живата част след филма (Ивайло влиза с лицето си) — колко минути държим екрана ѝ. */
    liveMinutes: 20,
    /**
     * Истинският срок: тогава филмът сваля И самостоятелното записване в
     * потока („количката“) затваря. След него остават личните линкове за
     * плащане след разговор (/kino/plashtane) и платилите капаро.
     */
    replayUntilISO: "2026-10-18T23:59:00+03:00",
  },

  film: {
    // ⚠ ЧЕРНОВА — чака Ивайло: точните секунди идват от готовия монтаж (сега са по сценарий v2)
    /** Цялото видео, с надписите и сцената след тях. */
    durationSec: 44 * 60,
    /** Надписите — точно тук изплуват трите бутона. Не по-рано. */
    offerAtSec: 42 * 60,
    /** Сцената след надписите — отключва бонуса за изгледалите до края. */
    postCreditsAtSec: 43 * 60,
    chapters: [
      { n: 0, title: "Седни удобно", startSec: 0 },
      { n: 1, title: "Това е вторник", startSec: 2 * 60 + 40 },
      { n: 2, title: "Човекът, който не беше програмист", startSec: 6 * 60 + 30 },
      { n: 3, title: "Правец", startSec: 9 * 60 + 30 },
      { n: 4, title: "Осем цяло и петдесет и пет", startSec: 13 * 60 },
      { n: 5, title: "Мария", startSec: 14 * 60 + 50 },
      { n: 6, title: "Една сутрин след две години", startSec: 19 * 60 },
      { n: 7, title: "Трите истини", startSec: 23 * 60 },
      { n: 8, title: "Пренавиване", startSec: 28 * 60 + 30 },
      { n: 9, title: "Тази вечер", startSec: 32 * 60 + 30 },
      { n: 10, title: "Как е направен този филм", startSec: 36 * 60 + 30 },
      { n: 11, title: "Част втора", startSec: 38 * 60 },
    ] as KinoChapter[],
    /** Главата, в която е поканата — стигането дотук е отделен етап в CRM-а. */
    offerChapter: 11,
    /**
     * ⚠ ЧЕРНОВА — секундата на сцена 9.7 „Твоето число“ от готовия монтаж
     * (сценарий v2: краят на глава 9, точно преди глава 10). Оттук под филма
     * излиза полето „Колко часа седмично ти отиват в повтаряща се работа?“.
     */
    numberAtSec: 36 * 60 + 15,
  },

  /**
   * Филмът: Vercel Blob (решение на Ивайло, 06.10) — адресите са във FILM_BLOB
   * по-горе. Резервно: NEXT_PUBLIC_KINO_FILM (.mp4, .m3u8 или YouTube). Без
   * нищо залата върви „на сухо“ — главите излизат като надписи по истинското
   * време (а в прегледа — с тийзъра, KINO_TEST_VIDEO).
   */
  video: blobVideo(FILM_BLOB) ?? parseVideoSource(process.env.NEXT_PUBLIC_KINO_FILM),
  /** Трейлърът на афиша (без звук + бутон за звук). Същите формати. */
  trailer: parseVideoSource(process.env.NEXT_PUBLIC_KINO_TRAILER ?? process.env.NEXT_PUBLIC_KINO_TRAILER_1),
  /**
   * ⚠ Трите трейлъра за загряването (ден −5 / −3 / −1) — монтират се от филма.
   * Писмата водят към билета, където са вградени. Без адрес — не се показват.
   */
  trailers: [
    { id: "t1", title: "Възможността", source: parseVideoSource(process.env.NEXT_PUBLIC_KINO_TRAILER_1) },
    { id: "t2", title: "Как изглежда, когато го имаш", source: parseVideoSource(process.env.NEXT_PUBLIC_KINO_TRAILER_2) },
    { id: "t3", title: "Зад кулисите на филма", source: parseVideoSource(process.env.NEXT_PUBLIC_KINO_TRAILER_3) },
  ],
  /** ⚠ Живата част след филма — YouTube Live или друг линк. Без него залата казва, че Ивайло влиза веднага. */
  liveUrl: clean(process.env.NEXT_PUBLIC_KINO_LIVE_URL),

  /** ⚠ Viber общността „Кино клуб · ВЪЛНАТА“ — създава я Ивайло, линкът за покана идва тук. */
  viberClubUrl: clean(process.env.NEXT_PUBLIC_KINO_VIBER_URL),

  /**
   * ⚠ ЧЕРНОВА — чака Ивайло: разговорът „Искам първо да поговорим“ е 20 минути,
   * пон–чт. Такова събитие в Cal.com още НЯМА — дотогава води към общата
   * консултация. Създава ли се (напр. promarketing/kino-20) → NEXT_PUBLIC_KINO_CAL_LINK.
   */
  cal: {
    link: clean(process.env.NEXT_PUBLIC_KINO_CAL_LINK) ?? "promarketing/consultation",
    minutes: 20,
  },

  /**
   * Цените са КРАЙНИ, С ДДС (фирмата е по ДДС). В евро. Една цена — без
   * „премиерна“ (решение на Ивайло, 06.10). Спешността е честна: 30 места и
   * срокът на записването (replayUntilISO).
   */
  prices: {
    full: 1900,
    // ⚠ ЧЕРНОВА — чака Ивайло: вноската (3 × 650 € = 1 950 €)
    installment: 650,
    installments: 3,
    // ⚠ ЧЕРНОВА — чака Ивайло + юрист: капарото (100 €, приспада се; връща ли се)
    deposit: 100,
  },

  // ✓ Ивайло, 06.10: 30 места (заради живите срещи)
  seats: 30,

  /** Поканата — името и стекът. Цената идва чак след стека. */
  program: {
    // ⚠ ЧЕРНОВА — чака Ивайло: името на програмата
    name: "AI потокът на Pro Marketing",
    short: "потока",
    /**
     * ✓ Съдържанието — потвърдено от Ивайло (06.10): точно тези четири неща.
     * (Описанията под тях са ⚠ чернова — без числа, които остаряват.)
     */
    stack: [
      { title: "Академията на Pro Marketing", body: "Всички нива — от първите стъпки с AI до собствените агенти. Кратки видео уроци, в твоето темпо." },
      { title: "12 седмици живи групови срещи", body: "Носиш своя бизнес — движим го заедно, седмица след седмица." },
      { title: "Готови агенти и шаблони", body: "За запитвания, оферти, отчети и публикации — пренасяш ги в бизнеса си, вместо да почваш от празен лист." },
      { title: "„AI картата на бизнеса ти“", body: "Личен разговор, в който я чертаем заедно: къде AI ще ти върне време и пари — и в какъв ред." },
    ],
    /** ✓ Гаранцията — думите на Ивайло (06.10); точните условия влизат в общите условия (юрист). */
    guarantee: "Минеш ли първите 4 седмици, направиш задачите и нямаш работещ AI служител — връщаме парите.",
    // ⚠ ЧЕРНОВА — чака Ивайло: сравнението с цената на агенция
    anchor: "Една агенция у нас взема между 1 500 и 3 000 € за един-единствен AI агент.",
  },

  /** Бонусът след надписите. */
  bonus: {
    // ⚠ ЧЕРНОВА — глава 0 обещава подарък след надписите; какъв е — чака Ивайло (заглавие, текст, линк)
    title: "Подаръкът ти",
    body: "За хората, които останаха до края.",
    /**
     * Линкът към подаръка — САМО на сървъра (KINO_BONUS_URL, без NEXT_PUBLIC):
     * не стига до браузъра, докато залата не го отключи за човека.
     */
    url: (process.env.KINO_BONUS_URL ?? "").trim() || null,
    /** Колко от филма (по минути) трябва да е изгледано, за да се отключи. */
    minWatchedRatio: 0.5,
  },

  /** Адресът на сайта — БЕЗ www (www пренасочва и чупи webhooks/Authorization). */
  site: "https://promarketing.pw",
} as const;

export type KinoConfig = typeof KINO;

/** Източникът в CRM-а за новите картони от фунията. */
export const KINO_SOURCE = "kino-valnata";
