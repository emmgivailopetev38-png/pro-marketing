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
 * Линковете, които се решават в последния момент (видеото, трейлърите, Viber
 * клубът, Cal.com събитието, подаръкът), могат да се дадат и през Vercel env —
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
 * свързан с проекта pro-marketing.
 */
const BLOB = "https://zb1apeiptqxi1vj7.public.blob.vercel-storage.com";

/**
 * ФИЛМЪТ НЕ е с адрес в кода (репото е публично — филмът би изтекъл преди
 * прожекцията). Качва се в Blob със случаен суфикс (scripts/kino-video.sh или
 * двигателят), а сървърът го намира по префикса (lib/kino/film-source.ts) и
 * го дава на залата чак когато вратите отворят (19:25).
 *  - film  — истинският филм (продукцията): kino/film/valnata-film-…;
 *  - draft — черновите за прегледа на Ивайло (САМО Vercel preview / локално):
 *            kino/film/chernova-v2-…, -v3-… — печели най-новата качена версия,
 *            без промяна в кода; draftPin („v2“) заковава конкретна.
 */
export const KINO_BLOB_PREFIX = {
  film: "kino/film/valnata-film-",
  draft: "kino/film/chernova-",
  draftPin: null as string | null,
};

/**
 * Резервната проба: тийзърът (1:10) — ако черновата я няма в Blob. Само в
 * прегледа (локално и Vercel preview), в продукцията никога. Локално може и
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
   * ЕДНА прожекция (решение на Ивайло, 06.10): петък, 16.10.2026, 19:30 —
   * изцяло автоматична, записан филм с въпросите след него (до 1 час).
   * БЕЗ повторение: закъснелият влиза в текущата минута, а след края в
   * залата остава само поканата (трите бутона, заявката, календарът) — до
   * затварянето на записването. Часовете са с изричната зона на София:
   * +03:00 до 25.10 (лятно часово време) — за да не зависят от сървъра.
   */
  screening: {
    id: "premiera-2026-10-16",
    premiereISO: "2026-10-16T19:30:00+03:00",
    /** „Фоайето отваря вратите“ — 19:25: започва отброяването на екрана. */
    doorsOpenMinutes: 5,
    /**
     * Записването в първия поток затваря: нд 18.10, 23:59 (филмът казва
     * „записването затваря на датата под филма“). След това плащат само
     * платилите капаро („доплати“ след срещата, пон–чт) и хората след разговор.
     */
    closeISO: "2026-10-18T23:59:00+03:00",
  },

  /**
   * Потоците: първият започва в понеделник, 19.10 (записването в него
   * затваря със screening.closeISO), после — нов всеки месец, в същия
   * пореден понеделник на месеца (19.10 е третият → 16.11, 21.12…), по
   * `seats` места. Записването във всеки следващ затваря в неделя преди него.
   * ⚠ ЧЕРНОВА — чака Ивайло: датата на първия и ритъмът (everyMonths).
   */
  cohorts: {
    firstStartDate: "2026-10-19",
    everyMonths: 1,
  },

  /**
   * Файлът на прожекцията — точките от двигателя (05 Продукция/glavi/
   * tochki-zala-v2.json: 17 парчета, слепени без ново кодиране; началата са
   * сборът от дължините им, вътрешните моменти — от timeline.json на парчето).
   * Черновата v2 от 06.10 (46:21,6):
   *   0:00 „Добре дошли“ → 2:22 гл. 0 … гл. 11 → 33:20 „Твоето число“ →
   *   38:32 надписите (трите бутона) → 39:32 „Ето ни отново“ → 41:17 въпросите
   *   → 45:36 „Лека вечер“ → 45:53 сцената с подаръка → 46:06 „Вземи
   *   подаръка ↓“ → 46:21 край.
   * ⚠ При нов монтаж — числата от новия tochki-zala-*.json (README, раздел 10).
   */
  film: {
    /** Целият файл: „Добре дошли“, филмът, надписите, въпросите и подаръкът. */
    durationSec: 2781.6,
    /** Началото на самия филм (гл. 0) — след „Добре дошли“ (glava-predi). */
    filmStartSec: 142,
    /** Надписите — точно тук изплуват трите бутона. Не по-рано. */
    offerAtSec: 2312.5,
    /** „Ето ни отново“ — Ивайло на бюрото (glava-otnovo). */
    againAtSec: 2372.5,
    /** „Въпроси след прожекцията“ — записаните отговори (glava-12). */
    qaAtSec: 2477,
    /** „Лека вечер“ (glava-leka). */
    goodnightAtSec: 2736.7,
    /** Сцената с подаръка (glava-13). */
    giftSceneAtSec: 2753.8,
    /** „За теб — подарък · Вземи подаръка ↓“ — отключва се за изгледалите. */
    postCreditsAtSec: 2766.2,
    chapters: [
      { n: 0, title: "Седни удобно", startSec: 142 },
      { n: 1, title: "Това е вторник", startSec: 226.4 },
      { n: 2, title: "Човекът, който не беше програмист", startSec: 396.9 },
      { n: 3, title: "Правец", startSec: 525.9 },
      { n: 4, title: "Осем цяло и петдесет и пет", startSec: 645.5 },
      { n: 5, title: "Мария", startSec: 701.9 },
      { n: 6, title: "Една сутрин след две години", startSec: 870.8 },
      { n: 7, title: "Трите истини", startSec: 1011.5 },
      { n: 8, title: "Пренавиване", startSec: 1377 },
      { n: 9, title: "Тази вечер", startSec: 1543.8 },
      { n: 10, title: "Как е направен този филм", startSec: 2017.7 },
      { n: 11, title: "Част втора", startSec: 2063.8 },
    ] as KinoChapter[],
    /** Главата, в която е поканата — стигането дотук е отделен етап в CRM-а. */
    offerChapter: 11,
    /**
     * Сцена 9.7 „Твоето число“ (стрелката към полето). Оттук под филма излиза
     * „Колко часа седмично ти отиват в повтаряща се работа?“.
     */
    numberAtSec: 2000.7,
  },

  /**
   * Резервен източник за филма, ако в Blob няма „kino/film/valnata-film-…“:
   * NEXT_PUBLIC_KINO_FILM (.mp4, .m3u8 или YouTube). Без нищо залата върви
   * „на сухо“ — главите излизат като надписи по истинското време. Истинският
   * източник се решава на сървъра (lib/kino/film-source.ts).
   */
  video: parseVideoSource(process.env.NEXT_PUBLIC_KINO_FILM),
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
   * срокът на записването (screening.closeISO).
   */
  // ✓ Ивайло, 06.10: 1 900 € · 3 вноски × 650 € · капаро 100 € (приспада се изцяло)
  prices: {
    full: 1900,
    installment: 650,
    installments: 3,
    deposit: 100,
  },

  // ✓ Ивайло, 06.10: 30 места във всеки поток (заради живите срещи)
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

  /**
   * „Формулата“ (Роля + Цел + Контекст + Формат) — PDF за ВСИЧКИ: под филма от
   * глава 9 („Шаблоните с формулата са под филма“), след филма и в писмото
   * след края. Публичен файл във Vercel Blob.
   */
  formula: {
    title: "Формулата: Роля + Цел + Контекст + Формат",
    body: "Как да възложиш задача на AI — и да получиш готова работа, а не общи приказки. Шаблонът и примерите от филма.",
    url: `${BLOB}/kino/podaraci/formulata.pdf`,
    /** от началото на глава 9 („Тази вечер“) */
    fromSec: 1543.8,
  },

  /**
   * Подаръкът след надписите — „30 готови поръчки към AI“ (PDF). Само за
   * изгледалите: линкът НЕ е в кода (репото е публично) — сървърът го намира
   * в Blob store-а по префикс (lib/kino/gift.ts) и пренасочва към него едва
   * след отключването (/api/kino/gift).
   */
  bonus: {
    title: "30 готови поръчки към AI за твоя бизнес",
    body: "Копираш, сменяш оцветеното в [скоби] с твоите факти — и получаваш чернова, която можеш да пратиш. Подредени по бизнеси.",
    /** Пътят в Blob store-а (файлът е със случаен суфикс — адресът не се познава). */
    blobPrefix: "kino/podaraci/30-poruchki-za-ai",
    /** Колко от филма (по минути) трябва да е изгледано, за да се отключи. */
    minWatchedRatio: 0.5,
  },

  /** Адресът на сайта — БЕЗ www (www пренасочва и чупи webhooks/Authorization). */
  site: "https://promarketing.pw",
} as const;

export type KinoConfig = typeof KINO;

/** Източникът в CRM-а за новите картони от фунията. */
export const KINO_SOURCE = "kino-valnata";
