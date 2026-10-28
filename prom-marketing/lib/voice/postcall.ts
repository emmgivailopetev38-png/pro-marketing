/**
 * Разборът на post-call webhook-а от ElevenLabs — какво е казано по телефона
 * или през бутона, кой е човекът и как това влиза в картона му.
 *
 * Без "server-only": подписът и разборът се тестват на чист текст. Записът
 * в базата и писмото до Ивайло са в `app/api/webhooks/elevenlabs/route.ts`.
 *
 * Подписът е по схемата на ElevenLabs (същата като в тяхното SDK):
 *   заглавка `elevenlabs-signature: t=<unix секунди>,v0=<hex>`
 *   където `v0 = HMAC-SHA256(secret, `${t}.${rawBody}`)`, а `t` е до 30 минути
 *   назад. Проверено срещу `constructEvent` в elevenlabs-js на 05.09.2026.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_MS = 30 * 60 * 1000;

export function verifyElevenLabsSignature(
  rawBody: string,
  header: string | null | undefined,
  secret: string,
  nowMs: number = Date.now()
): { ok: true } | { ok: false; reason: string } {
  if (!secret) return { ok: false, reason: "no_secret" };
  if (!header) return { ok: false, reason: "missing_header" };

  const parts = header.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v0 = parts.find((p) => p.startsWith("v0="))?.slice(3);
  if (!t || !v0) return { ok: false, reason: "bad_format" };

  const ts = Number(t);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  if (nowMs - ts * 1000 > TOLERANCE_MS) return { ok: false, reason: "expired" };

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v0);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "mismatch" };
  return { ok: true };
}

/** За тестове и за ръчна проверка: подпис, който ElevenLabs би сложил. */
export function signElevenLabs(rawBody: string, secret: string, tsSeconds: number): string {
  const v0 = createHmac("sha256", secret).update(`${tsSeconds}.${rawBody}`).digest("hex");
  return `t=${tsSeconds},v0=${v0}`;
}

export interface TranscriptLine {
  role: "agent" | "user" | string;
  message: string;
  /** Секунди от началото на разговора. */
  at: number | null;
}

export interface PostCallEvent {
  conversationId: string;
  agentId: string | null;
  status: string | null;
  /** Кога е започнал разговорът. */
  startedAt: Date;
  durationSecs: number;
  summary: string | null;
  /** „success" / „failure" / „unknown" по преценка на ElevenLabs. */
  callSuccessful: string | null;
  transcript: TranscriptLine[];
  /** Какво подадохме от формата на сайта: ime, imeil, telefon, deynost, kanal. */
  dynamic: Record<string, string>;
  /** Номерът на обаждащия се, когато разговорът е по телефона. */
  callerNumber: string | null;
  /** Агентът е извикал `zapishi_chas` и то не е върнало грешка. */
  booked: boolean;
  /** „telefon" при истинско обаждане, „sait" при бутона. */
  channel: "telefon" | "sait";
  /** Полетата от „Data collection“ на агента (входящият на 0876: ime, povod, obadi_se…). */
  collected: Record<string, string>;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Разбира събитието `post_call_transcription`. Всичко друго (аудио, неуспешно
 * набиране) връща `null` — маршрутът им отговаря 200 и не прави нищо.
 */
export function parsePostCall(payload: unknown): PostCallEvent | null {
  const root = obj(payload);
  if (root.type !== "post_call_transcription") return null;
  const data = obj(root.data);
  const conversationId = str(data.conversation_id);
  if (!conversationId) return null;

  const metadata = obj(data.metadata);
  const analysis = obj(data.analysis);
  const init = obj(data.conversation_initiation_client_data);
  const dynRaw = obj(init.dynamic_variables);
  const dynamic: Record<string, string> = {};
  for (const [k, v] of Object.entries(dynRaw)) {
    if (typeof v === "string" || typeof v === "number") dynamic[k] = String(v);
  }

  const startSecs = num(metadata.start_time_unix_secs) ?? num(root.event_timestamp) ?? Math.floor(Date.now() / 1000);
  const durationSecs = num(metadata.call_duration_secs) ?? 0;

  const transcript: TranscriptLine[] = [];
  let booked = false;
  const rawTranscript = Array.isArray(data.transcript) ? data.transcript : [];
  for (const item of rawTranscript) {
    const line = obj(item);
    const role = str(line.role) ?? "unknown";
    const message = str(line.message);
    if (message) transcript.push({ role, message, at: num(line.time_in_call_secs) });

    // Резервация: инструментът е извикан и резултатът му не е грешка.
    const calls = Array.isArray(line.tool_calls) ? line.tool_calls : [];
    const results = Array.isArray(line.tool_results) ? line.tool_results : [];
    const toolName = (x: unknown) => str(obj(x).tool_name) ?? str(obj(x).name) ?? "";
    const calledBooking = calls.some((c) => toolName(c) === "zapishi_chas");
    const failedBooking = results.some((r) => toolName(r) === "zapishi_chas" && obj(r).is_error === true);
    const okBooking = results.some((r) => toolName(r) === "zapishi_chas" && obj(r).is_error !== true);
    if ((calledBooking && !failedBooking) || okBooking) booked = true;
  }

  const collected: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(analysis.data_collection_results))) {
    const val = obj(v).value;
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      const t = String(val).trim();
      if (t) collected[k] = t;
    }
  }

  const phoneCall = obj(metadata.phone_call);
  const callerNumber =
    str(phoneCall.external_number) ??
    str(phoneCall.caller_number) ??
    str(dynamic.system__caller_id) ??
    null;

  return {
    conversationId,
    agentId: str(data.agent_id),
    status: str(data.status),
    startedAt: new Date(startSecs * 1000),
    durationSecs,
    summary: str(analysis.transcript_summary),
    callSuccessful: str(analysis.call_successful),
    transcript,
    dynamic,
    callerNumber,
    booked,
    channel: callerNumber ? "telefon" : "sait",
    collected,
  };
}

/**
 * Номерата на Ивайло. Пренасочен от Yettel разговор може да пристигне с
 * неговия номер вместо с номера на човека — тогава номерът не е на човека
 * и не бива да прави картон „Ивайло Петев“ от всеки звъннал.
 */
const OWN_KEYS = new Set(["876447159", "877399963"]);

export function isOwnNumber(n: string | null | undefined): boolean {
  const d = (n ?? "").replace(/\D/g, "");
  return d.length >= 9 && OWN_KEYS.has(d.slice(-9));
}

export interface InboundInfo {
  phone: string | null;
  name: string | null;
  povod: string | null;
  kategoria: string | null;
  obadiSe: boolean;
  koga: string | null;
}

/** Входящ разговор на 0876 (агентът „Ели — входящ“): кой, за какво, да се обади ли Ивайло. */
export function inboundInfo(ev: PostCallEvent): InboundInfo {
  const c = ev.collected;
  const caller = ev.callerNumber && !isOwnNumber(ev.callerNumber) && /\d{6}/.test(ev.callerNumber) ? ev.callerNumber : null;
  const saidDigits = (c.telefon_za_vrazka ?? "").replace(/\D/g, "");
  const said = saidDigits.length >= 9 && !isOwnNumber(saidDigits) ? (saidDigits.startsWith("359") ? `+${saidDigits}` : `+359${saidDigits.slice(-9)}`) : null;
  return {
    phone: caller ?? said,
    name: c.ime ?? null,
    povod: c.povod ?? null,
    kategoria: c.kategoria ?? null,
    obadiSe: /^(true|1|да|yes)$/i.test(c.obadi_se ?? ""),
    koga: c.koga_udobno ?? null,
  };
}

/** Плейсхолдърът, който формата подава, когато няма имейл — не е адрес на човек. */
export const NO_EMAIL = "bez-imeil@promarketing.pw";

/** Имейлът на човека, ако е истински. */
export function contactEmail(ev: PostCallEvent): string | null {
  const e = str(ev.dynamic.imeil)?.toLowerCase() ?? null;
  if (!e || e === NO_EMAIL || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return null;
  return e;
}

/** Телефонът на човека — от формата или от линията. */
export function contactPhone(ev: PostCallEvent): string | null {
  return str(ev.dynamic.telefon) ?? ev.callerNumber;
}

/** Името — от формата; по телефона агентът обикновено го пита и то остава в транскрипта, но там не гадаем. */
export function contactName(ev: PostCallEvent): string | null {
  return str(ev.dynamic.ime);
}

const ROLE_LABEL: Record<string, string> = { agent: "Агент", user: "Клиент" };

/**
 * Заглавието и тялото на активността в картона.
 *
 * Резюмето стои първо — то е, което Ивайло чете. Транскриптът е под него,
 * дума по дума, защото „какво са си говорили" е точно въпросът, на който
 * трябва да може да се отговори от картона, без да се влиза в ElevenLabs.
 */
export function describeCall(ev: PostCallEvent, inbound: InboundInfo | null = null): { title: string; body: string; minutes: number } {
  const minutes = Math.max(1, Math.round(ev.durationSecs / 60));
  const where = ev.channel === "telefon" ? "по телефона" : "от сайта";
  const title = inbound
    ? `📲 Входящо на 0876 · ${inbound.povod ? inbound.povod.slice(0, 90) : "без повод"} · ${minutes} мин${
        ev.booked ? " · записа си час" : inbound.obadiSe ? " · 📞 да му се обади Ивайло" : ""
      }`
    : `🎙️ Разговор с гласовия агент ${where} · ${minutes} мин${ev.booked ? " · записа си час" : ""}`;

  const parts: string[] = [];
  if (ev.summary) parts.push(ev.summary);
  else parts.push("(ElevenLabs не върна резюме)");
  if (inbound) {
    const f: string[] = [];
    if (inbound.name) f.push(`Име: ${inbound.name}`);
    if (inbound.povod) f.push(`Повод: ${inbound.povod}`);
    if (inbound.kategoria) f.push(`Вид: ${inbound.kategoria}`);
    if (inbound.koga) f.push(`Удобно: ${inbound.koga}`);
    if (!inbound.phone) f.push("⚠️ Номерът не дойде (скрит или пренасочен с номера на Ивайло)");
    if (f.length) parts.push(f.join(" · "));
  }

  const facts: string[] = [];
  if (ev.callerNumber) facts.push(`Номер: ${ev.callerNumber}`);
  if (ev.dynamic.deynost) facts.push(`Дейност: ${ev.dynamic.deynost}`);
  if (ev.callSuccessful) facts.push(`Оценка на ElevenLabs: ${ev.callSuccessful}`);
  if (facts.length) parts.push(facts.join(" · "));

  if (ev.transcript.length) {
    const lines = ev.transcript.map((l) => `${ROLE_LABEL[l.role] ?? l.role}: ${l.message}`);
    let text = lines.join("\n");
    // 6 000 знака режеха 8–11-минутните разговори наполовина (видяно 28.10.2026);
    // 15 минути говор са ~15–20 хил. знака, затова таванът е с резерв.
    if (text.length > 30000) text = text.slice(0, 30000) + "\n…";
    parts.push(`— Транскрипт —\n${text}`);
  }

  return { title, body: parts.join("\n\n"), minutes };
}
