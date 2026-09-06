import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Тефтерът на гласовия агент — колко минути е изговорил ВСЕКИ ЧОВЕК.
 *
 * `public-auth.ts` пази общия таван: колко разговора на ден и на месец да
 * поеме демото. Този файл пази нещо друго — че един човек няма да изяде
 * тавана сам. Двете се проверяват заедно и по този ред: първо личният, после
 * общият, защото на човек над личния си лимит се казва различно изречение.
 *
 * Как се брои: редът в `voice_sessions` се отваря, когато линията се отваря,
 * а истинската продължителност идва по-късно — от post-call webhook-а на
 * ElevenLabs. Между двете `seconds` е нула, затова има и таван на отворените
 * сесии за денонощие. Иначе десет натискания за минута минават, преди първото
 * да се е отчело.
 *
 * Идентичността е три неща наведнъж: имейл, телефон и отпечатък на IP.
 * Пише се `email OR phone OR ip`, за да не стига смяната само на едното.
 * Суров IP не се пази никъде — броенето работи и с sha256.
 */

/* ---------------------------------------------------------------- лимити */

function num(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export interface VoiceLimits {
  /** Таванът на един човек за трийсет дни, в секунди. */
  personSeconds: number;
  /** Най-дългият единичен разговор — таймерът в браузъра. */
  maxSessionSeconds: number;
  /** Кога агентът започва да приключва топло, вместо да го режем насред дума. */
  warnSeconds: number;
  /** Колко пъти на денонощие един и същ човек отваря линия. */
  sessionsPerDay: number;
  /** Същото, но по IP — за онзи, който сменя имейла на всяко натискане. */
  sessionsPerIpDay: number;
  /** Колко часа може да си запише един човек за трийсет дни. */
  bookingsPerPerson: number;
  /** Колко часа изобщо може да запише гласовият агент за едно денонощие. */
  bookingsPerDay: number;
}

export function voiceLimits(): VoiceLimits {
  const personSeconds = Math.round(num("PUBLIC_VOICE_PERSON_MINUTES", 10) * 60);
  const maxSessionSeconds = Math.min(personSeconds, num("PUBLIC_VOICE_MAX_SECONDS", 600));
  return {
    personSeconds,
    maxSessionSeconds,
    // По подразбиране минута и половина преди края: колкото да се каже
    // „да ти запиша ли часа" и да се стигне до отговор.
    warnSeconds: Math.min(num("PUBLIC_VOICE_WARN_SECONDS", 510), maxSessionSeconds - 30),
    sessionsPerDay: num("PUBLIC_VOICE_SESSIONS_PER_DAY", 3),
    sessionsPerIpDay: num("PUBLIC_VOICE_IP_SESSIONS_PER_DAY", 6),
    bookingsPerPerson: num("PUBLIC_VOICE_BOOKINGS_PER_PERSON", 2),
    bookingsPerDay: num("PUBLIC_VOICE_BOOKINGS_PER_DAY", 8),
  };
}

/* ------------------------------------------------------- идентичността */

export function normalizeEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
  // Плейсхолдърът от формата не е човек и не бива да събира минути на всички.
  if (e === "bez-imeil@promarketing.pw") return null;
  /**
   * Втора ограда около заявките: заявките ползват `.eq()`, което кодира
   * стойността, но адрес със запетая или кавичка не е адрес на български
   * бизнес, а опит. Отрязва се тук, а не по-надолу.
   */
  if (/[,()"\\]/.test(e)) return null;
  return e.slice(0, 160);
}

/**
 * Ключ на телефона: последните девет цифри.
 *
 * `0877399963`, `+359877399963` и `359 877 399 963` са един и същ номер и
 * трябва да са един и същ ред в тефтера — иначе таванът се заобикаля с
 * пренаписване на нулата отпред.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits.slice(-9);
}

export function hashIp(ip: string | null | undefined): string | null {
  const raw = (ip ?? "").trim();
  if (!raw) return null;
  return createHash("sha256").update(`pm-voice:${raw}`).digest("hex").slice(0, 32);
}

/** Първият адрес в `x-forwarded-for` е клиентът; останалите са прокситата. */
export function clientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip")?.trim() || null;
}

export interface Identity {
  email: string | null;
  phone_key: string | null;
  ip_hash: string | null;
}

export function identityOf(args: {
  email?: string | null;
  phone?: string | null;
  ip?: string | null;
}): Identity {
  return {
    email: normalizeEmail(args.email),
    phone_key: phoneKey(args.phone),
    ip_hash: hashIp(args.ip),
  };
}

/** Кои от трите колони изобщо има смисъл да се питат. */
function identityColumns(id: Identity): Array<[keyof Identity, string]> {
  const cols: Array<[keyof Identity, string]> = [];
  if (id.email) cols.push(["email", id.email]);
  if (id.phone_key) cols.push(["phone_key", id.phone_key]);
  if (id.ip_hash) cols.push(["ip_hash", id.ip_hash]);
  return cols;
}

/**
 * ⚠️ Три отделни заявки, а не един `or=(…)` — нарочно.
 *
 * `.or()` приема готов НИЗ и го пише в адреса както си е: там запетаята дели
 * условията, а скобите ги групират. Стойността влиза в този низ без нищо да
 * я екранира, тоест адрес със запетая би пренаписал въпроса към базата.
 * `.eq()` минава през кодирането на клиента и такъв въпрос не съществува.
 *
 * Цената са две допълнителни заявки на отворен разговор — по няколко на ден.
 */
async function rowsForIdentity(
  sb: ReturnType<typeof createServiceClient>,
  id: Identity,
  sinceISO: string
): Promise<VoiceSessionRow[]> {
  const cols = identityColumns(id);
  if (cols.length === 0) return [];

  const results = await Promise.all(
    cols.map(([col, value]) =>
      sb
        .from("voice_sessions")
        .select("id, seconds, opened_at, email, phone_key, ip_hash")
        .eq(col as string, value)
        .gte("opened_at", sinceISO)
        .limit(300)
    )
  );

  // Един и същ ред идва и по имейл, и по IP — слепва се по id.
  const byId = new Map<string, VoiceSessionRow>();
  for (const r of results) {
    if (r.error) throw new Error(r.error.message);
    for (const row of (r.data ?? []) as VoiceSessionRow[]) byId.set(String(row.id), row);
  }
  return [...byId.values()];
}

interface VoiceSessionRow {
  id: string;
  seconds: number | null;
  opened_at: string;
  email: string | null;
  phone_key: string | null;
  ip_hash: string | null;
}

/* ------------------------------------------------------------- четене */

export interface Usage {
  /** Изговорени секунди за последните трийсет дни. */
  usedSeconds: number;
  /** Колко му остават от личния таван. */
  remainingSeconds: number;
  /** Отворени линии за последното денонощие — по човек и по IP. */
  sessionsToday: number;
  ipSessionsToday: number;
  /** Броенето падна и пускаме разговора, без да знаем колко е останало. */
  blind: boolean;
}

const DAY_MS = 24 * 3600_000;
const MONTH_MS = 30 * DAY_MS;

export async function readUsage(id: Identity): Promise<Usage> {
  const limits = voiceLimits();
  const blank: Usage = {
    usedSeconds: 0,
    remainingSeconds: limits.personSeconds,
    sessionsToday: 0,
    ipSessionsToday: 0,
    blind: true,
  };

  if (identityColumns(id).length === 0) return blank;

  /**
   * Ако тефтерът мълчи, разговорът МИНАВА.
   *
   * Същата сделка като при общия таван: по-скъпо е да откажем на истински
   * клиент, отколкото да пуснем един разговор над лимита. Затова `blind`
   * се връща нагоре — така браузърът пак слага таймер, просто пълния.
   */
  try {
    const sb = createServiceClient();
    const since = new Date(Date.now() - MONTH_MS).toISOString();
    const dayAgo = new Date(Date.now() - DAY_MS).toISOString();

    const rows = await rowsForIdentity(sb, id, since);
    // Секундите се броят само по ЧОВЕК (имейл/телефон), не по IP: в един
    // офис или зад един мобилен оператор седят различни хора и чуждият
    // разговор не бива да изяжда твоите минути. IP-то ограничава само
    // колко пъти на ден изобщо се отваря линия оттам.
    const mine = rows.filter(
      (r) =>
        (id.email && r.email === id.email) ||
        (id.phone_key && r.phone_key === id.phone_key)
    );
    const usedSeconds = mine.reduce((n, r) => n + (Number(r.seconds) || 0), 0);

    const sessionsToday = mine.filter((r) => r.opened_at >= dayAgo).length;
    const ipSessionsToday = id.ip_hash
      ? rows.filter((r) => r.ip_hash === id.ip_hash && r.opened_at >= dayAgo).length
      : 0;

    return {
      usedSeconds,
      remainingSeconds: Math.max(0, limits.personSeconds - usedSeconds),
      sessionsToday,
      ipSessionsToday,
      blind: false,
    };
  } catch (err) {
    console.error("[voice/quota] тефтерът мълчи, пускам разговора", err);
    return blank;
  }
}

/* -------------------------------------------------------- отваряне */

export type OpenResult =
  | {
      ok: true;
      sessionKey: string;
      /** Колкото трае ТОЗИ разговор — остатъкът, но не повече от тавана. */
      seconds: number;
      warnAt: number;
      usage: Usage;
    }
  | { ok: false; reason: "minutes" | "sessions" | "ip"; spoken: string; usage: Usage };

/**
 * Отваря ред в тефтера и връща колко секунди има право да говори човекът.
 *
 * Изреченията са писани да се четат на екран от човек, който току-що е дал
 * телефона си. Никакво „превишихте квотата" — казва се какво е станало и
 * къде е следващата стъпка, защото това пак е клиент.
 */
export async function openVoiceSession(args: {
  email?: string | null;
  phone?: string | null;
  ip?: string | null;
  contactId?: string | null;
  channel?: string;
}): Promise<OpenResult> {
  const limits = voiceLimits();
  const id = identityOf(args);
  const usage = await readUsage(id);

  if (usage.remainingSeconds < 60) {
    return {
      ok: false,
      reason: "minutes",
      usage,
      spoken:
        "Изговорихте десетте безплатни минути с агента — благодарим, че го пробвахте докрай. " +
        "Оттук нататък е по-полезно да говорите с Ивайло: запазете си час от календара и той ще влезе с готови отговори за вашия случай.",
    };
  }
  if (usage.sessionsToday >= limits.sessionsPerDay) {
    return {
      ok: false,
      reason: "sessions",
      usage,
      spoken:
        "За днес отворихте демото достатъчно пъти. Утре е свободно отново — а ако искате да продължим сериозно, запазете си час с Ивайло от календара.",
    };
  }
  if (usage.ipSessionsToday >= limits.sessionsPerIpDay) {
    return {
      ok: false,
      reason: "ip",
      usage,
      spoken:
        "От тази мрежа демото е ползвано много пъти днес. Утре е свободно отново, а час с Ивайло можете да запазите и веднага от календара.",
    };
  }

  const seconds = Math.min(limits.maxSessionSeconds, usage.remainingSeconds);
  const sessionKey = `vs_${randomBytes(16).toString("hex")}`;

  try {
    const sb = createServiceClient();
    const { error } = await sb.from("voice_sessions").insert({
      session_key: sessionKey,
      contact_id: args.contactId ?? null,
      email: id.email,
      phone_key: id.phone_key,
      ip_hash: id.ip_hash,
      channel: args.channel ?? "sait",
    });
    if (error) console.error("[voice/quota] редът не се отвори", error.message);
  } catch (err) {
    // Пак не е причина да откажем разговор — просто този няма да се отчете.
    console.error("[voice/quota] редът не се отвори", err);
  }

  return {
    ok: true,
    sessionKey,
    seconds,
    warnAt: Math.max(30, Math.min(limits.warnSeconds, seconds - 30)),
    usage,
  };
}

/* -------------------------------------------------------- затваряне */

/**
 * Post-call webhook-ът казва колко е траял разговорът. Тук той се залепя за
 * реда, отворен при натискането на бутона.
 *
 * Търси се по `session_key` (подаден като динамична променлива и върнат
 * обратно от ElevenLabs). Ако го няма — по телефон и по имейл, най-скорошния
 * незатворен ред. По телефона `session_key` няма изобщо и това е единственият
 * път: там редът се създава сега, за да се брои и телефонният човек.
 */
export async function closeVoiceSession(args: {
  sessionKey?: string | null;
  conversationId: string;
  seconds: number;
  booked: boolean;
  email?: string | null;
  phone?: string | null;
  contactId?: string | null;
  channel?: string;
}): Promise<{ ok: boolean; matched: "key" | "identity" | "created" | null }> {
  const id = identityOf({ email: args.email, phone: args.phone });
  const seconds = Math.max(0, Math.round(args.seconds));
  const patch = {
    conversation_id: args.conversationId,
    seconds,
    booked: args.booked,
    ended_at: new Date().toISOString(),
    ...(args.contactId ? { contact_id: args.contactId } : {}),
  };

  try {
    const sb = createServiceClient();

    // Един разговор се отчита веднъж. ElevenLabs праща повторно.
    const { data: already } = await sb
      .from("voice_sessions")
      .select("id")
      .eq("conversation_id", args.conversationId)
      .maybeSingle();
    if (already) return { ok: true, matched: "key" };

    if (args.sessionKey) {
      const { data } = await sb
        .from("voice_sessions")
        .update(patch)
        .eq("session_key", args.sessionKey)
        .is("conversation_id", null)
        .select("id")
        .maybeSingle();
      if (data) return { ok: true, matched: "key" };
    }

    // Незатворен ред от последните три часа — по имейл или по телефон, но
    // НЕ по IP: webhook-ът идва от сървърите на ElevenLabs и адрес няма.
    for (const [col, value] of identityColumns({ ...id, ip_hash: null })) {
      const { data: open } = await sb
        .from("voice_sessions")
        .select("id")
        .eq(col as string, value)
        .is("conversation_id", null)
        .gte("opened_at", new Date(Date.now() - 3 * 3600_000).toISOString())
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (open) {
        await sb.from("voice_sessions").update(patch).eq("id", open.id);
        return { ok: true, matched: "identity" };
      }
    }

    // Обаждане по телефона: тефтер за него дотук няма. Създава се сега, за
    // да се брои и той срещу личния таван при следващото звънене.
    await sb.from("voice_sessions").insert({
      session_key: `vs_call_${args.conversationId.slice(0, 40)}`,
      contact_id: args.contactId ?? null,
      email: id.email,
      phone_key: id.phone_key,
      channel: args.channel ?? "telefon",
      ...patch,
    });
    return { ok: true, matched: "created" };
  } catch (err) {
    console.error("[voice/quota] затварянето падна", err);
    return { ok: false, matched: null };
  }
}

/**
 * Кой стои зад този ключ. Ползва се от `zapishi_chas`, за да се запише часът
 * на човека от формата, а не на онзи, когото агентът е бил убеден да напише.
 */
export async function identityForSessionKey(
  key: string | null | undefined
): Promise<{ email: string | null; phone: string | null; contactId: string | null } | null> {
  const k = (key ?? "").trim();
  if (!/^vs_[a-f0-9]{8,64}$/.test(k)) return null;
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("voice_sessions")
      .select("email, phone_key, contact_id, opened_at")
      .eq("session_key", k)
      .maybeSingle();
    if (!data) return null;
    // Ключ отпреди часове вече не е жив разговор.
    if (Date.now() - new Date(data.opened_at as string).getTime() > 6 * 3600_000) return null;

    /**
     * Телефонът се вади от картона, а не от тефтера. В `voice_sessions`
     * стоят само последните девет цифри — те стигат за броене, но не са
     * номер, на който Cal.com да прати потвърждение.
     */
    let phone: string | null = null;
    if (data.contact_id) {
      const { data: c } = await sb
        .from("contacts")
        .select("phone")
        .eq("id", data.contact_id as string)
        .maybeSingle();
      phone = (c?.phone as string | null) ?? null;
    }
    return { email: data.email, phone, contactId: data.contact_id };
  } catch {
    return null;
  }
}
