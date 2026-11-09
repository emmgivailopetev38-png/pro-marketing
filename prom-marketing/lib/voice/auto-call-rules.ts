/**
 * Ели звъни сама (28.10.2026). Ивайло: „Като звънне някой — да вдига агентът.
 * Следене на срещи, follow-up-и — да им звъни: който не се е явил на среща;
 * който се е явил / с когото вече сме говорили — за него няма проблем.“
 *
 * Тук е само преценката — без мрежа и без база, за да се тества. Кой влиза:
 *   🆕 нов лийд от формата (Meta / сайта) — няколко минути след заявката;
 *   🙈 неявил се на среща — за нов час.
 * Кой НЕ влиза: говорил с Ивайло (разговор, среща, оферта), писал ни сам
 * (Viber/WhatsApp/имейл — там вече тече разговор), отказал, с бъдеща среща,
 * клиент, вдигнал на Ели (тогава поема Ивайло по резюмето). Най-много два
 * опита на човек, в различни дни.
 *
 * Часовете (Ивайло, 28.10.2026 следобед): „след като влезе нов лийд, да му
 * звъни веднага за записване на срещата, докато са максимално топли… от девет
 * до към шест следобед“ → пон–пт 09:00–17:50, ~2 мин след заявката; лийд
 * извън часовете — в началото на следващия работен ден. Петък се звъни (Ели
 * записва час за следващата седмица — свободните часове идват от календара).
 * 02.11.2026: най-рано 08:30. 09.11.2026 (Ивайло): „да звъни до 17:00“ →
 * пон–пт 08:30–17:00; след 17:00 не започва ново обаждане (и фолоуъпът).
 */

export const TZ = "Europe/Sofia";

export type AutoReason = "nov" | "noshow";

export const AUTO_LOG_TYPE = "voice_outbound";

/**
 * Номерът, който хората виждат, когато Ели звъни, и на който тя вдига, ако звъннат обратно
 * (Twilio +1 509 351 1914 → входящата Ели). От 09.11.2026; дотогава 0876 447 159, но от
 * чужбина операторите го подменят с чужд американски номер.
 */
export const ELI_CALLER_NUMBER = "+1 509 351 1914";

export interface AcContact {
  id: string;
  /** Източникът на картона — Академията и трейдинга не са за Ели. */
  source?: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  stage: string | null;
  followup_status: string | null;
  business: string | null;
  company: string | null;
  last_heard_from_at: string | null;
}

export interface AcAct {
  activity_type: string;
  title: string | null;
  body?: string | null;
  occurred_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AcOptions {
  /** Изходящият агент на Ели — неговите разговори се броят за опити. */
  eliAgentId: string;
  /** Минути след заявката, преди първото обаждане. */
  newDelayMin: number;
  /** Колко дни назад гледаме за нов лийд (петък–неделя чакат до понеделник). */
  newMaxAgeDays: number;
  noshowMaxAgeDays: number;
  /** Опити при нов лийд — в различни дни. */
  maxAttempts: number;
  /**
   * Опити при неявил се (Ивайло, 06.11.2026: „които не се явят — Георги ги
   * отбелязва и Ели пак им звъни, да не ги пуска“): веднага, на другия ден и
   * после през `noshowGapDays`, докато запише час или човекът каже „не“.
   */
  noshowMaxAttempts: number;
  /** Дни пауза между опитите от третия нататък и след разговор без час. */
  noshowGapDays: number;
  /** Последните 9 цифри на номера, на които никога не звъним. */
  skipPhones: Set<string>;
  /**
   * Meta лийд форми, чиито лийдове НЕ са за Ели (08.11.2026: формата „ПОКРАЙ
   * РАБОТАТА“ — хора на заплата, не фирми; Ели v4.2 не записва не-фирми, затова
   * тях ги звъни човек — Георги). Живата стойност: VOICE_AUTO_SKIP_FORMS.
   */
  skipForms?: Set<string>;
}

export const DEFAULT_OPTIONS: Omit<AcOptions, "eliAgentId" | "skipPhones"> = {
  newDelayMin: 2,
  newMaxAgeDays: 5,
  noshowMaxAgeDays: 7,
  maxAttempts: 2,
  noshowMaxAttempts: 4,
  noshowGapDays: 2,
};

export interface AcCall {
  contactId: string;
  reason: AutoReason;
  attempt: number;
  /** Таванът за този повод — за надписа „опит 2/4“. */
  maxAttempts: number;
  toNumber: string;
  triggerAt: string;
  variables: Record<string, string>;
  /** Meta лийдът (metadata.meta_lead_id) — за отговорите от формата при профилирани форми. */
  metaLeadId?: string | null;
  formProfile?: FormProfile | null;
}

export type AcDecision = { call: AcCall } | { skip: string };

/**
 * Профил на разговора по Meta лийд форма. 08.11.2026 — „ПОКРАЙ РАБОТАТА“: хора на
 * нормална работа, които искат още един доход с AI (аудиторията на Йончев). Не са
 * фирми — Ели не ги отпраща, а записва двайсет-минутния разговор с Георги.
 */
export interface FormProfile {
  kanal: string;
  zayavka: string;
  povod: string;
  vhod: string;
  profil: string;
  /** ключ на въпроса → етикет; ключ на опцията → текст (Meta връща ключовете) */
  answers: Record<string, { label: string; options: Record<string, string> }>;
}
/**
 * 08.11.2026 — „AI обучение, платено от държавата“: проект „Специфични умения за
 * работната сила“ на Агенцията по заетостта (ПРЧР 2021–2027), срок 16.11.2026, 16:00.
 * Една и съща цел за Meta формата и за формата на /obuchenie-az — различни са
 * само поводът (реклама ↔ сайт) и откъде е дошъл човекът.
 */
const AZ_OBUCHENIE_ZAYAVKA =
  "безплатен разговор за AI обучението на екипа ви, платено от държавата (проект на Агенцията по заетостта)";
const AZ_OBUCHENIE_PROFIL =
  "ФИРМА/РАБОТОДАТЕЛ, който иска безплатно AI обучение за екипа си по проект „Специфични умения за работната сила“ на Агенцията по заетостта. Държавата възстановява 100 % — до 1 278 € на човек и до 15 338 € на фирма; срок за заявление 16.11.2026, 16:00; ние пишем заявлението, той подписва с КЕП и праща през ССЕВ. Допустими: служители на трудов договор от 4 часа или договор за управление, самоосигуряващи се собственици; не: граждански договори, общини, училища, първично земеделие; без публично финансирано обучение през 2026. Цел на разговора: потвърди броя служители на трудов договор и дали имат КЕП, обясни трите стъпки (звъним → ние пишем заявлението → той подписва с КЕП и праща) и запиши 20-минутен разговор с Георги ОЩЕ ТАЗИ СЕДМИЦА — срокът е 16.11. Не обещавай одобрение (решава Агенцията). Не говори за цена — за фирмата при одобрение е 0 €.";
/**
 * `vhod` е последното изречение от шаблона на Ели („{{pozdrav}} Ели съм, от Про
 * Маркетинг — {{povod}}. … {{vhod}}“) — затова е въпрос, а откъде е дошъл
 * човекът („рекламата „AI обучение, платено от държавата“…“) стои в профила.
 */
const AZ_OBUCHENIE_VHOD = "Два бързи въпроса и ви намирам удобен час — става ли?";
/** Формата на promarketing.pw/obuchenie-az — `metadata.form_id` на website_form активността. */
export const OBUCHENIE_AZ_WEB_FORM = "sait-obuchenie-az";

export const FORM_PROFILES: Record<string, FormProfile> = {
  "3062805607239108": {
    kanal: "pokrai_rabotata",
    zayavka: "безплатния двайсет-минутен разговор — как да започнете с AI покрай работата",
    povod: "по заявката ви от рекламата „Покрай работата“, за безплатния двайсет-минутен разговор как да започнете с AI покрай работата",
    vhod: "Един-два въпроса и ви намирам удобен час — става ли?",
    profil: "ЧОВЕК НА ЗАПЛАТА, НЕ ФИРМА (рекламата „Покрай работата“): иска още един доход с AI покрай работата; разговорът с Георги е двайсет минути — честно откъде да започне; не го отпращаш като „не е бизнес“.",
    answers: {
      situacia: { label: "Къде е сега", options: { rabota: "на работа е и иска още един доход покрай нея", biznes: "има малък бизнес и иска да го автоматизира", start: "търси с какво да започне / още учи" } },
      vreme: { label: "Време седмично", options: { h2_5: "2–5 часа", h5_10: "5–10 часа", h10: "над 10 часа" } },
      cel: { label: "Цел", options: { ucha: "да научи AI и автоматизации", uslugi: "да прави AI системи за фирми срещу заплащане", svoe: "да автоматизира своя идея или бизнес" } },
    },
  },
  // 08.11.2026 — Meta лийд формата „AI обучение, платено от държавата“ (Агенция по заетостта, срок 16.11).
  "2625101691244588": {
    kanal: "az_obuchenie",
    zayavka: AZ_OBUCHENIE_ZAYAVKA,
    povod: "по заявката ви от рекламата за AI обучението на екипа, платено от държавата — за две минути да проверим дали фирмата ви е допустима и как подаваме заявлението до шестнайсети ноември",
    vhod: AZ_OBUCHENIE_VHOD,
    profil: `Дошъл от рекламата „AI обучение, платено от държавата“ (Агенция по заетостта, срок 16.11). ${AZ_OBUCHENIE_PROFIL}`,
    answers: {
      sluzhiteli: {
        label: "Служители на трудов договор",
        options: {
          sam: "само собственикът (самоосигуряващ се / управител)",
          s2_5: "2–5 души на трудов договор",
          s6_15: "6–15 души",
          s16: "над 15 души",
        },
      },
      sfera: {
        label: "Сфера",
        options: {
          targovia: "търговия / онлайн магазин",
          uslugi: "услуги",
          horeca: "ресторант / хотел / туризъм",
          proizvodstvo: "производство / строителство / транспорт",
          drugo: "друго",
        },
      },
      kep: { label: "КЕП", options: { da: "има КЕП", ne: "няма КЕП", neznam: "не знае — счетоводителят" } },
    },
  },
  // Същото, но от страницата /obuchenie-az (броят служители е в бележката на картона, не в Meta).
  [OBUCHENIE_AZ_WEB_FORM]: {
    kanal: "az_obuchenie",
    zayavka: AZ_OBUCHENIE_ZAYAVKA,
    povod: "по заявката ви от сайта за AI обучението на екипа, платено от държавата — за две минути да проверим дали фирмата ви е допустима и как подаваме заявлението до шестнайсети ноември",
    vhod: AZ_OBUCHENIE_VHOD,
    profil: `Дошъл от страницата promarketing.pw/obuchenie-az (AI обучение, платено от държавата; Агенция по заетостта, срок 16.11). ${AZ_OBUCHENIE_PROFIL}`,
    answers: {},
  },
};
export function formProfileFor(formId: string | null | undefined): FormProfile | null {
  return formId ? FORM_PROFILES[String(formId)] ?? null : null;
}
/** „Къде е сега: на работа е…; Време седмично: 2–5 часа; Цел: …“ от field_data на Meta (стойностите са ключове на опциите). */
export function formAnswersSummary(profile: FormProfile, fieldData: Array<{ name?: string; values?: unknown[] }> | null | undefined): string {
  if (!fieldData?.length) return "";
  const parts: string[] = [];
  for (const [key, q] of Object.entries(profile.answers)) {
    const f = fieldData.find((x) => x.name === key);
    const v = f?.values?.[0];
    if (v == null) continue;
    const raw = String(v);
    parts.push(`${q.label}: ${q.options[raw] ?? raw}`);
  }
  return parts.join("; ");
}

const LEAD_TYPES = new Set(["meta_lead", "website_form"]);
/** Картони, на които Ели не звъни: курсистите от Академията и трейдинг фунията. */
const SKIP_SOURCES = new Set(["akademia", "trading_funnel"]);
const REPLY_TYPES = new Set(["viber_received", "whatsapp_received", "email_received", "email_reply"]);
const TALK_TYPES = new Set(["meeting", "meeting_outcome", "offer_sent", "presentation_sent"]);
const CLIENT_TYPES = new Set(["payment_received", "invoice", "project_created"]);
const NO_ANSWER = /(Не вдигна|не вдига|Заето|изключен|без отговор|Не отговаря|Пропусна|пропуснат|📵)/i;
const REFUSAL = /(Не се интересува|Не е заинтересован|Грешен номер|Несъществуващ номер|не звъни|не ме търсете|не търсете|не желае)/i;
/** Вдигнал на Ели: от толкова секунди нагоре е говорил човек, не гласова поща. */
const ANSWERED_SECS = 25;

const ms = (iso: string) => new Date(iso).getTime();

/** Последните 9 цифри — един и същ номер с +359, 0 или без. */
export function phoneKey(raw: string | null | undefined): string {
  const d = (raw ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : "";
}

/** Само български мобилни: +359 8x/9x. Чужди номера не набираме (цена, закон). */
export function bgMobileE164(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  let d = s.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("359")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  else if (s.startsWith("+")) return null;
  if (!/^[89]\d{8}$/.test(d)) return null;
  return `+359${d}`;
}

function sofiaParts(at: Date): { day: string; weekday: string; hour: number; minute: number } {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(at)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {});
  return { day: `${p.year}-${p.month}-${p.day}`, weekday: p.weekday, hour: Number(p.hour), minute: Number(p.minute) };
}

export function sofiaDay(at: Date | string): string {
  return sofiaParts(typeof at === "string" ? new Date(at) : at).day;
}

export interface CallWindow {
  days: string[];
  /** Минути от полунощ по София: първото и последното (без) начало на обаждане. */
  startMin: number;
  endMin: number;
}

/** Пон–пт 08:30–17:00 по София (Ивайло, 09.11.2026). VOICE_AUTO_HOURS в Vercel го надделява — там стои същото. */
export const DEFAULT_WINDOW: CallWindow = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  startMin: 8 * 60 + 30,
  endMin: 17 * 60,
};

export function inCallWindow(now: Date, win: CallWindow = DEFAULT_WINDOW): boolean {
  const p = sofiaParts(now);
  if (!win.days.includes(p.weekday)) return false;
  const min = p.hour * 60 + p.minute;
  return min >= win.startMin && min < win.endMin;
}

function meta(a: AcAct): Record<string, unknown> {
  return a.metadata && typeof a.metadata === "object" ? a.metadata : {};
}

function isEliCall(a: AcAct, eliAgentId: string): boolean {
  return a.activity_type === "voice_call" && meta(a).agent_id === eliAgentId;
}

function eliAnswered(a: AcAct): boolean {
  const m = meta(a);
  // Гласова поща: Ели може да остави 20-секундно съобщение — това не е вдигнал човек.
  if (m.voicemail === true) return false;
  const secs = typeof m.duration_secs === "number" ? m.duration_secs : 0;
  return secs >= ANSWERED_SECS && m.call_successful !== "failure";
}

/** Бележките от post-call webhook-а: обещано обаждане или „не ме търсете“ — Ели спира. */
function isPromiseOrStop(a: AcAct): boolean {
  if (a.activity_type !== "note") return false;
  const k = meta(a).kind;
  return k === "callback_promise" || k === "do_not_call";
}

/** Говорил ли е Ивайло (или екипът) с човека — разговор, среща, оферта. */
function isHumanTalk(a: AcAct): boolean {
  if (TALK_TYPES.has(a.activity_type)) return true;
  if (a.activity_type === "call") return !NO_ANSWER.test(a.title ?? "");
  return false;
}

function isRefusal(a: AcAct): boolean {
  if (a.activity_type !== "call" && a.activity_type !== "note") return false;
  return REFUSAL.test(a.title ?? "");
}

/**
 * Имена, при които буква по буква не стига — „ъ“, „ь“ и „я“ нямат свой латински
 * знак (Dimitar → Димитър, Petyo → Петьо, Nadia → Надя). Останалите минават по
 * правилата в `latinToCyrillic`.
 */
const NAME_DICT: Record<string, string> = {
  dimitar: "Димитър", petar: "Петър", aleksandar: "Александър", alexandar: "Александър", alexander: "Александър",
  lachezar: "Лъчезар", lachezara: "Лъчезара", krastyo: "Кръстьо", krasto: "Кръстьо", parvan: "Първан", galab: "Гълъб",
  valcho: "Вълчо", valko: "Вълко", sabi: "Съби", sabin: "Събин", stanko: "Станко", tsanko: "Цанко", tsanka: "Цанка",
  vania: "Ваня", vanya: "Ваня", tania: "Таня", tanya: "Таня", nadia: "Надя", nadya: "Надя", sonia: "Соня", sonya: "Соня",
  petia: "Петя", petya: "Петя", katia: "Катя", katya: "Катя", mitia: "Митя", zhenia: "Женя", jenia: "Женя", vasia: "Вася",
  jivko: "Живко", jordan: "Йордан", jordanka: "Йорданка", john: "Джон", george: "Георги", gosho: "Гошо",
  ivailo: "Ивайло", ivaylo: "Ивайло", iliq: "Илия", ilia: "Илия", maria: "Мария", nikolai: "Николай", andrei: "Андрей",
  sergei: "Сергей", matei: "Матей", mihail: "Михаил", mihael: "Михаел", michael: "Михаил", christo: "Христо",
  christina: "Христина", christian: "Кристиан", kristian: "Кристиан", stoian: "Стоян", boian: "Боян", julia: "Юлия",
  shteryo: "Щерьо", kolyo: "Кольо", kolio: "Кольо", gancho: "Ганчо", pencho: "Пенчо", penyo: "Пеньо", penio: "Пеньо",
  stoyo: "Стойо", lyuben: "Любен", luben: "Любен", lyubomir: "Любомир", lubomir: "Любомир", lyudmil: "Людмил", ludmil: "Людмил",
  lyudmila: "Людмила", ludmila: "Людмила", dessislava: "Десислава", dessy: "Деси", desi: "Деси", vesselin: "Веселин",
  vessela: "Весела", alex: "Алекс", niki: "Ники", nikki: "Ники", vicky: "Вики", vikki: "Вики", mimi: "Мими",
};

/** Двойки и тройки букви, които са една българска (редът е важен: „sht“ преди „sh“, „ya“ преди „ay“). */
const LAT_GROUPS: [RegExp, string][] = [
  [/shch/g, "щ"], [/sht/g, "щ"], [/zh/g, "ж"], [/ch/g, "ч"], [/sh/g, "ш"], [/ts/g, "ц"], [/tz/g, "ц"],
  [/yu/g, "ю"], [/iu/g, "ю"], [/ya/g, "я"], [/iya/g, "ия"], [/ia$/g, "ия"],
  [/(^|[aeiou])yo/g, "$1йо"], [/yo/g, "ьо"], [/(^|[aeiou])jo/g, "$1йо"],
  [/ay/g, "ай"], [/ey/g, "ей"], [/oy/g, "ой"], [/uy/g, "уй"], [/kh/g, "х"], [/ph/g, "ф"], [/th/g, "т"], [/ck/g, "к"],
];
const LAT_ONE: Record<string, string> = {
  a: "а", b: "б", c: "ц", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и", j: "й", k: "к", l: "л", m: "м",
  n: "н", o: "о", p: "п", q: "я", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "кс", y: "и", z: "з",
};

/**
 * Латинско име от Meta формата → на кирилица, за да го изговори Ели („Здравейте,
 * Elmer!“ се четеше буква по буква — 4 от 7 вдигнали на 03–05.11.2026). Име, което
 * не е само латински букви, се връща както е.
 */
export function latinToCyrillic(name: string): string {
  if (!/^[A-Za-z]+$/.test(name)) return name;
  const low = name.toLowerCase();
  const known = NAME_DICT[low];
  if (known) return known;
  let s = low;
  for (const [re, to] of LAT_GROUPS) s = s.replace(re, to);
  s = s.replace(/[a-z]/g, (ch) => LAT_ONE[ch] ?? ch);
  return s;
}

/** Първото име, ако прилича на име — иначе празно (Ели казва само „Здравейте!“). Латиница → кирилица. */
export function firstName(full: string | null | undefined): string {
  const t = (full ?? "").trim().split(/\s+/)[0] ?? "";
  if (t.length < 2 || /\d|@|\+/.test(t)) return "";
  const name = latinToCyrillic(t);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

const MONTHS = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
const WEEKDAYS: Record<string, string> = {
  Mon: "в понеделник",
  Tue: "във вторник",
  Wed: "в сряда",
  Thu: "в четвъртък",
  Fri: "в петък",
  Sat: "в събота",
  Sun: "в неделя",
};

/** „днес сутринта“, „вчера“, „в понеделник“, „на двайсет и първи октомври“ → кратко, за изговаряне. */
export function spokenWhen(iso: string, now: Date): string {
  const at = new Date(iso);
  const a = sofiaParts(at);
  const n = sofiaParts(now);
  if (a.day === n.day) {
    if (a.hour < 6) return "тази нощ";
    if (a.hour < 12) return "днес сутринта";
    return "днес";
  }
  const days = Math.round((Date.parse(n.day) - Date.parse(a.day)) / 86_400_000);
  if (days === 1) return a.hour >= 18 ? "вчера вечерта" : "вчера";
  if (days < 7) return WEEKDAYS[a.weekday] ?? "тези дни";
  const [, m, d] = a.day.split("-").map(Number);
  return `на ${d} ${MONTHS[m - 1]}`;
}

const HOUR_WORDS = [
  "нула", "един", "два", "три", "четири", "пет", "шест", "седем", "осем", "девет", "десет", "единайсет",
  "дванайсет", "тринайсет", "четиринайсет", "петнайсет", "шестнайсет", "седемнайсет", "осемнайсет",
  "деветнайсет", "двайсет", "двайсет и един", "двайсет и два", "двайсет и три",
];

/** „в петнайсет часа“, „в десет и половина“ — часът с думи, за първото изречение (то не минава през модела). */
export function spokenTime(iso: string): string {
  const p = sofiaParts(new Date(iso));
  const h = HOUR_WORDS[p.hour] ?? String(p.hour);
  if (p.minute === 0) return `в ${h} часа`;
  if (p.minute === 30) return `в ${h} и половина`;
  if (p.minute === 15) return `в ${h} и петнайсет`;
  if (p.minute === 45) return `в ${h} и четирийсет и пет`;
  return `в ${h} и ${p.minute}`;
}

/** Какво е поискал във формата — за „звъня по заявката ви за …“. */
export function zayavkaFrom(lead: AcAct | undefined): string {
  if (!lead) return "AI автоматизация";
  const offer = String(meta(lead).offer ?? "");
  const text = `${lead.title ?? ""} ${lead.body ?? ""}`;
  if (offer === "ai_odit" || /одит/i.test(text)) return "безплатен AI одит";
  if (offer === "marketing" || /Преглед на рекламата/i.test(text)) return "преглед на рекламата ви";
  if (offer === "reklama" || /От реклама/i.test(text)) return "повече клиенти от реклама с AI";
  if (offer === "narachnik" || /наръчник/i.test(text)) return "AI наръчника";
  if (offer === "kurs" || /курс/i.test(text)) return "безплатния курс по AI";
  if (lead.activity_type === "website_form") return "AI автоматизация — от сайта";
  return "AI автоматизация";
}

/**
 * Преценката за един човек. `acts` са всичките му активности (без значение
 * от реда), `hasFutureBooking` — записан час напред (по имейл или телефон).
 */
export function decide(
  c: AcContact,
  acts: AcAct[],
  hasFutureBooking: boolean,
  now: Date,
  opts: AcOptions
): AcDecision {
  const nowMs = now.getTime();
  const toNumber = bgMobileE164(c.phone);
  if (!toNumber) return { skip: "няма български мобилен" };
  if (opts.skipPhones.has(phoneKey(toNumber))) return { skip: "в списъка „не звъни“" };
  if (c.source && SKIP_SOURCES.has(c.source)) return { skip: `източник ${c.source}` };
  if (c.stage === "won" || c.stage === "lost") return { skip: `етап ${c.stage}` };
  if (c.followup_status === "not_interested") return { skip: "не се интересува" };
  if (hasFutureBooking) return { skip: "има записан час" };

  const past = acts.filter((a) => ms(a.occurred_at) <= nowMs).sort((x, y) => ms(y.occurred_at) - ms(x.occurred_at));
  if (acts.some((a) => a.activity_type === "meeting" && ms(a.occurred_at) > nowMs)) return { skip: "среща напред" };
  if (past.some((a) => CLIENT_TYPES.has(a.activity_type))) return { skip: "клиент" };
  if (past.some(isRefusal)) return { skip: "отказал" };

  // Поводът: най-новият неявил се (до 7 дни) печели пред лийда.
  const noshow = past.find(
    (a) => a.activity_type === "note" && meta(a).kind === "noshow" && nowMs - ms(a.occurred_at) <= opts.noshowMaxAgeDays * 86_400_000
  );
  const lead = past.find((a) => LEAD_TYPES.has(a.activity_type));
  let reason: AutoReason;
  let trigger: AcAct;
  if (noshow) {
    reason = "noshow";
    trigger = noshow;
  } else if (lead && nowMs - ms(lead.occurred_at) <= opts.newMaxAgeDays * 86_400_000) {
    reason = "nov";
    trigger = lead;
    const formId = meta(lead).form_id != null ? String(meta(lead).form_id) : null;
    if (formId && opts.skipForms?.has(formId)) return { skip: `форма ${formId} — звъни човек, не Ели` };
    if (nowMs - ms(lead.occurred_at) < opts.newDelayMin * 60_000) return { skip: "лийдът е от преди минути — след малко" };
  } else {
    return { skip: "няма повод (нов лийд или неявил се)" };
  }
  const triggerMs = ms(trigger.occurred_at);
  const missedAt = String(meta(trigger).missed_at ?? trigger.occurred_at);
  const missedBookingId = meta(trigger).missed_booking_id ? String(meta(trigger).missed_booking_id) : null;

  // Говорил ли е Ивайло с човека: при нов лийд — никога; при неявил се —
  // след пропуснатия час, или по-рано е имал проведена среща. Самата
  // пропусната среща също стои в картона като `meeting` (upsertBooking я
  // записва при резервацията) — тя не е проведена и не спира обаждането
  // (Стоян, 04.11.2026: Ели изобщо не му звънна заради този запис).
  if (reason === "nov" && past.some(isHumanTalk)) return { skip: "Ивайло вече е говорил с него" };
  if (reason === "noshow") {
    const missedMs = ms(missedAt);
    if (past.some((a) => ms(a.occurred_at) > triggerMs && isHumanTalk(a))) return { skip: "говорили след пропуснатия час" };
    const held = past.some((a) => {
      if (a.activity_type !== "meeting" && a.activity_type !== "meeting_outcome") return false;
      if (missedBookingId && String(meta(a).booking_id ?? "") === missedBookingId) return false;
      return ms(a.occurred_at) < missedMs - 60_000;
    });
    if (held) return { skip: "имал е проведена среща" };
  }
  if (c.last_heard_from_at && ms(c.last_heard_from_at) > triggerMs) return { skip: "чут след повода" };
  if (past.some((a) => REPLY_TYPES.has(a.activity_type) && ms(a.occurred_at) > triggerMs)) {
    return { skip: "писал ни е — тече разговор" };
  }

  // Опитите след повода: нашите записи за набиране и разговорите на Ели.
  const after = past.filter((a) => ms(a.occurred_at) >= triggerMs);
  const eliCalls = after.filter((a) => isEliCall(a, opts.eliAgentId));
  const answered = eliCalls.filter(eliAnswered);
  const maxAttempts = reason === "noshow" ? opts.noshowMaxAttempts : opts.maxAttempts;
  const gapMs = opts.noshowGapDays * 86_400_000;
  if (answered.length) {
    if (reason === "nov") return { skip: "вдигна на Ели — поема Ивайло" };
    // Неявил се, който е говорил с Ели, но без час: едно обаждане още след
    // паузата — освен ако е обещал кога да го потърсим или е казал „не“.
    if (after.some(isPromiseOrStop)) return { skip: "обеща обаждане или не иска — Ели спира" };
    if (answered.length >= 2) return { skip: "говори с Ели два пъти без час — стига" };
    const lastTalk = answered.map((a) => ms(a.occurred_at)).sort((x, y) => y - x)[0];
    if (nowMs - lastTalk < gapMs) return { skip: `говори с Ели без час — пауза ${opts.noshowGapDays} дни` };
  }
  const dials = after.filter((a) => a.activity_type === AUTO_LOG_TYPE);
  const attempts = Math.max(dials.length, eliCalls.length);
  if (attempts >= maxAttempts) return { skip: `${attempts} опита — стига` };
  const lastTry = [...dials, ...eliCalls].map((a) => a.occurred_at).sort().pop();
  if (lastTry && sofiaDay(lastTry) === sofiaDay(now)) return { skip: "днес вече е звъняно" };
  // Неявил се: веднага и на другия ден; оттам нататък през два дни, за да не е тормоз.
  if (reason === "noshow" && attempts >= 2 && lastTry && nowMs - ms(lastTry) < gapMs) {
    return { skip: `пауза ${opts.noshowGapDays} дни между опитите` };
  }

  const ime = firstName(c.full_name);
  const pozdrav = ime ? `Здравейте, ${ime}!` : "Здравейте!";
  const base = {
    pozdrav,
    ime,
    deynost: (c.business || c.company || "").trim(),
    imeil: (c.email ?? "").trim(),
    telefon: toNumber,
    sesia: "",
    minuti: "",
  };
  let variables: Record<string, string>;
  if (reason === "nov") {
    const when = spokenWhen(trigger.occurred_at, now);
    const leadFormId = lead && meta(lead).form_id != null ? String(meta(lead).form_id) : null;
    const prof = formProfileFor(leadFormId);
    const zayavka = prof ? prof.zayavka : zayavkaFrom(lead);
    // Форма от сайта (напр. /obuchenie-az): отговорите идват готови в metadata.answers_summary.
    const webAnswers = prof && lead && typeof meta(lead).answers_summary === "string" ? String(meta(lead).answers_summary).trim() : "";
    variables = {
      ...base,
      zayavka,
      data_zayavka: when,
      // Първото изречение на Ели е шаблон: „{{pozdrav}} Ели съм, от Про Маркетинг — {{povod}}. … {{vhod}}“.
      povod: prof ? prof.povod : `по заявката ви за ${zayavka}`,
      vhod: prof ? prof.vhod : "Един бърз въпрос и ви намирам удобен час — става ли?",
      istoriya: `Нова заявка от ${when}.${prof ? ` ${prof.profil}` : ""}${webAnswers ? ` Отговори във формата — ${webAnswers}.` : ""}${attempts ? " Втори опит — първия път не вдигна." : ""}`,
      kanal: prof ? prof.kanal : "izhodyasht",
    };
  } else {
    // С кого е била срещата — от бележката (клоузърът), иначе Ивайло.
    const who = String(meta(trigger).missed_with ?? "").trim() || "Ивайло";
    const whenAt = `${spokenWhen(missedAt, now)} ${spokenTime(missedAt)}`;
    variables = {
      ...base,
      zayavka: `срещата с ${who}`,
      data_zayavka: whenAt,
      povod: `за срещата с ${who} ${whenAt} — разминахме се`,
      vhod: "Звъня само да ви намеря нов удобен час — имате ли една минута?",
      istoriya: `Имаше записан час при ${who} ${whenAt} и не влезе — разминахме се. Целта: нов удобен час, без упрек.${
        attempts ? ` Опит ${attempts + 1}.` : ""
      }${answered.length ? " Вече говори с Ели веднъж и не записа час — този път леко, но до час." : ""}`,
      kanal: "propusnata_sreshta",
    };
  }

  const leadAct: AcAct | undefined = reason === "nov" ? lead : undefined;
  const leadMeta = leadAct ? meta(leadAct) : {};
  const metaLeadId = leadMeta.meta_lead_id != null ? String(leadMeta.meta_lead_id) : null;
  const formProfile = leadAct ? formProfileFor(leadMeta.form_id != null ? String(leadMeta.form_id) : null) : null;
  return {
    call: { contactId: c.id, reason, attempt: attempts + 1, maxAttempts, toNumber, triggerAt: trigger.occurred_at, variables, metaLeadId, formProfile },
  };
}

/** Ред на набиране: неявилите се първи (те вече са искали час), после най-новите лийдове. */
export function orderCalls(calls: AcCall[]): AcCall[] {
  return [...calls].sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === "noshow" ? -1 : 1;
    if (a.attempt !== b.attempt) return a.attempt - b.attempt;
    return ms(b.triggerAt) - ms(a.triggerAt);
  });
}
