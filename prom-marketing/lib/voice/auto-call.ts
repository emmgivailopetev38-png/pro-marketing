import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegram } from "@/lib/notifications/telegram";
import { checkAgentCredits } from "./credits";
import { outboundApiKey, placeOutboundCall } from "./outbound";
import {
  AUTO_LOG_TYPE,
  DEFAULT_OPTIONS,
  decide,
  inCallWindow,
  orderCalls,
  phoneKey,
  sofiaDay,
  type AcAct,
  type AcCall,
  type AcContact,
  type AcOptions,
} from "./auto-call-rules";

/**
 * Ели звъни сама — новите лийдове и неявилите се (правилата: auto-call-rules.ts).
 *
 * Пуска се от Vercel Cron на всеки 15 минути (`/api/cron/voice-auto`) и на
 * ръка през `/api/voice/outbound`. Всяко набиране:
 *   1. първо се „заключва“ в `automation_events` с ключ човек+повод+опит —
 *      две паралелни пускания не могат да наберат един човек два пъти;
 *   2. после ElevenLabs → Twilio набира от 0876 447 159;
 *   3. в картона влиза ред „📞 Ели звъни · нов лийд · опит 1/2“.
 * Разговорът сам идва после през post-call webhook-а (voice_call).
 *
 * Спирачки — три, и всяка спира тихо:
 *   • `VOICE_AUTO_CALLS=off` във Vercel (иска redeploy);
 *   • ключ без деплой: POST /api/voice/outbound {"action":"pause"} →
 *     събитие `voice_auto_switch` (последното печели);
 *   • дневен таван (`VOICE_AUTO_DAILY_MAX`, по подразбиране 8) и кредитите в
 *     ElevenLabs (под `VOICE_AUTO_MIN_CREDITS`, по подразбиране 12 000 —
 *     пазят се за входящите на 0876).
 */

export const ELI_AGENT_ID = process.env.ELI_AGENT_ID?.trim() || "agent_9201m6101a2efy6btw7qgnbr1dve";
/** +359 876 447 159 — Verified Caller ID в Twilio, внесен в ElevenLabs. */
export const ELI_PHONE_NUMBER_ID = process.env.ELI_PHONE_NUMBER_ID?.trim() || "phnum_9101m60zjnvhenh81a15gwqd892s";

const SWITCH_EVENT = "voice_auto_switch";
const DIAL_EVENT = "voice_auto_dial";
const PER_RUN_MAX = 2;

function intEnv(name: string, def: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

export function dailyMax(): number {
  return intEnv("VOICE_AUTO_DAILY_MAX", 8);
}

function skipPhones(): Set<string> {
  const raw = process.env.VOICE_AUTO_SKIP ?? "";
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((x) => phoneKey(x))
      .filter(Boolean)
  );
}

export function autoOptions(): AcOptions {
  return {
    ...DEFAULT_OPTIONS,
    eliAgentId: ELI_AGENT_ID,
    newDelayMin: intEnv("VOICE_AUTO_NEW_DELAY_MIN", DEFAULT_OPTIONS.newDelayMin),
    maxAttempts: intEnv("VOICE_AUTO_MAX_ATTEMPTS", DEFAULT_OPTIONS.maxAttempts),
    skipPhones: skipPhones(),
  };
}

/** Последното превключване печели; няма ли — включено. */
export async function readSwitch(): Promise<{ on: boolean; at: string | null; by: string | null }> {
  if ((process.env.VOICE_AUTO_CALLS ?? "on").toLowerCase() === "off") return { on: false, at: null, by: "VOICE_AUTO_CALLS=off" };
  const sb = createServiceClient();
  const { data } = await sb
    .from("automation_events")
    .select("detail, created_at")
    .eq("event_type", SWITCH_EVENT)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return { on: true, at: null, by: null };
  const d = (data.detail ?? {}) as { on?: boolean; by?: string };
  return { on: d.on !== false, at: String(data.created_at), by: d.by ?? null };
}

export async function writeSwitch(on: boolean, by: string): Promise<void> {
  const sb = createServiceClient();
  await sb.from("automation_events").insert({
    event_type: SWITCH_EVENT,
    status: "success",
    summary: on ? "▶️ Ели звъни сама — включено" : "⏸ Ели звъни сама — спряно",
    detail: { on, by },
  });
}

/** Оставащите кредити в ElevenLabs; null = не се вижда (ключът няма право „User“). */
export async function creditsLeft(): Promise<number | null> {
  const key = outboundApiKey();
  if (!key) return null;
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const s = (await res.json()) as { character_count?: number; character_limit?: number };
    if (typeof s.character_count !== "number" || typeof s.character_limit !== "number") return null;
    return s.character_limit - s.character_count;
  } catch {
    return null;
  }
}

async function dialsToday(now: Date): Promise<number> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - 26 * 3600_000).toISOString();
  const { data } = await sb
    .from("automation_events")
    .select("created_at, status")
    .eq("event_type", DIAL_EVENT)
    .gte("created_at", since);
  const today = sofiaDay(now);
  return (data ?? []).filter((r) => r.status === "success" && sofiaDay(String(r.created_at)) === today).length;
}

/** Кандидатите: нови лийдове (5 дни) и неявилите се (7 дни) — после правилата. */
export async function findCandidates(now: Date, opts: AcOptions): Promise<{ calls: AcCall[]; skipped: { id: string; name: string | null; why: string }[] }> {
  const sb = createServiceClient();
  const sinceNew = new Date(now.getTime() - opts.newMaxAgeDays * 86_400_000).toISOString();
  const sinceNoshow = new Date(now.getTime() - opts.noshowMaxAgeDays * 86_400_000).toISOString();

  const [{ data: leads }, { data: noshows }] = await Promise.all([
    sb.from("contact_activities").select("contact_id").in("activity_type", ["meta_lead", "website_form"]).gte("occurred_at", sinceNew).limit(500),
    sb.from("contact_activities").select("contact_id").eq("activity_type", "note").eq("metadata->>kind", "noshow").gte("occurred_at", sinceNoshow).limit(200),
  ]);
  const ids = Array.from(new Set([...(leads ?? []), ...(noshows ?? [])].map((r) => String(r.contact_id))));
  if (ids.length === 0) return { calls: [], skipped: [] };

  const [{ data: contacts }, { data: acts }, { data: bookings }] = await Promise.all([
    sb
      .from("contacts")
      .select("id, full_name, phone, email, stage, followup_status, business, company, last_heard_from_at")
      .in("id", ids),
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, title, body, occurred_at, created_by, metadata")
      .in("contact_id", ids)
      .order("occurred_at", { ascending: false })
      .limit(5000),
    sb
      .from("bookings")
      .select("attendee_email, attendee_phone, scheduled_at, status")
      .gt("scheduled_at", now.toISOString())
      .in("status", ["accepted", "pending"]),
  ]);

  const futureEmails = new Set((bookings ?? []).map((b) => String(b.attendee_email ?? "").toLowerCase()).filter(Boolean));
  const futurePhones = new Set((bookings ?? []).map((b) => phoneKey(b.attendee_phone as string | null)).filter(Boolean));
  const byContact = new Map<string, AcAct[]>();
  for (const a of acts ?? []) {
    const k = String(a.contact_id);
    if (!byContact.has(k)) byContact.set(k, []);
    byContact.get(k)!.push(a as unknown as AcAct);
  }

  const calls: AcCall[] = [];
  const skipped: { id: string; name: string | null; why: string }[] = [];
  for (const c of (contacts ?? []) as AcContact[]) {
    const email = (c.email ?? "").toLowerCase();
    const future = (email && futureEmails.has(email)) || (phoneKey(c.phone) && futurePhones.has(phoneKey(c.phone)));
    const d = decide(c, byContact.get(c.id) ?? [], Boolean(future), now, opts);
    if ("call" in d) calls.push(d.call);
    else skipped.push({ id: c.id, name: c.full_name, why: d.skip });
  }
  return { calls: orderCalls(calls), skipped };
}

export interface AutoRunResult {
  ok: boolean;
  state: "off" | "outside_hours" | "no_key" | "credits" | "cap" | "ran";
  detail?: string;
  dialed: { contactId: string; reason: string; attempt: number; ok: boolean; error?: string }[];
  candidates: number;
  today: number;
  cap: number;
  credits: number | null;
}

/** Една обиколка. `dryRun` само показва кого би набрала. `force` пренебрегва часовете (ръчна проба). */
export async function runAutoCalls(args: { now?: Date; dryRun?: boolean; force?: boolean; onlyContactId?: string } = {}): Promise<AutoRunResult & { preview?: AcCall[]; skipped?: { id: string; name: string | null; why: string }[] }> {
  const now = args.now ?? new Date();
  const cap = dailyMax();
  const base = { dialed: [], candidates: 0, today: 0, cap, credits: null as number | null };

  const sw = await readSwitch();
  if (!sw.on && !args.dryRun) return { ok: true, state: "off", detail: sw.by ?? undefined, ...base };
  if (!args.force && !inCallWindow(now) && !args.dryRun) return { ok: true, state: "outside_hours", ...base };
  if (!outboundApiKey()) return { ok: false, state: "no_key", detail: "ELEVENLABS_API_KEY липсва във Vercel", ...base };

  const opts = autoOptions();
  const { calls, skipped } = await findCandidates(now, opts);
  const picked = args.onlyContactId ? calls.filter((c) => c.contactId === args.onlyContactId) : calls;
  const today = await dialsToday(now);
  const credits = await creditsLeft();
  const res = { ...base, candidates: picked.length, today, credits };
  if (args.dryRun) return { ok: true, state: "ran", ...res, preview: picked, skipped };

  const minCredits = intEnv("VOICE_AUTO_MIN_CREDITS", 12_000);
  if (credits !== null && credits < minCredits) {
    return { ok: true, state: "credits", detail: `останаха ${credits} кредита (< ${minCredits})`, ...res };
  }
  const health = await checkAgentCredits(ELI_AGENT_ID);
  if (health.state === "out") return { ok: true, state: "credits", detail: "последният разговор падна от квота", ...res };
  if (today >= cap) return { ok: true, state: "cap", detail: `${today}/${cap} днес`, ...res };

  const room = Math.min(PER_RUN_MAX, cap - today);
  const sb = createServiceClient();
  const dialed: AutoRunResult["dialed"] = [];
  for (const call of picked.slice(0, room)) {
    // Заключването: един ключ = едно набиране, дори при две паралелни пускания.
    // С деня вътре: паднало набиране (ElevenLabs/Twilio грешка) се пробва пак утре.
    const key = `voice-auto:${call.contactId}:${call.reason}:${call.triggerAt.slice(0, 16)}:${call.attempt}:${sofiaDay(now)}`;
    const { data: claim, error: claimErr } = await sb
      .from("automation_events")
      .insert({
        event_type: DIAL_EVENT,
        status: "skipped",
        related_contact_id: call.contactId,
        idempotency_key: key,
        summary: `📞 Ели звъни · ${call.reason === "nov" ? "нов лийд" : "неявил се"} · опит ${call.attempt}`,
        detail: { reason: call.reason, attempt: call.attempt, to: call.toNumber },
      })
      .select("id")
      .maybeSingle();
    if (claimErr || !claim) continue; // друго пускане вече го е взело

    const r = await placeOutboundCall({
      toNumber: call.toNumber,
      variables: call.variables,
      agentId: ELI_AGENT_ID,
      phoneNumberId: ELI_PHONE_NUMBER_ID,
    });
    const okCall = r.ok;
    const err = r.ok ? undefined : `${r.reason}${r.detail ? ` ${r.detail}` : ""}`;
    await sb
      .from("automation_events")
      .update({
        status: okCall ? "success" : "failed",
        detail: {
          reason: call.reason,
          attempt: call.attempt,
          to: call.toNumber,
          conversation_id: r.ok ? r.conversationId : null,
          error: err ?? null,
        },
      })
      .eq("id", claim.id);

    if (okCall) {
      const label = call.reason === "nov" ? "нов лийд" : "не се яви на срещата";
      await sb.from("contact_activities").insert({
        contact_id: call.contactId,
        activity_type: AUTO_LOG_TYPE,
        title: `📞 Ели звъни сама · ${label} · опит ${call.attempt}/${opts.maxAttempts}`,
        body: `Автоматично обаждане от 0876 447 159 (агентът „Ели“). Разговорът влиза в картона, щом приключи. ${
          call.attempt < opts.maxAttempts ? "Не вдигне ли — още един опит в следващ работен ден." : "Това е последният автоматичен опит."
        }`,
        occurred_at: new Date().toISOString(),
        created_by: "eli_auto",
        metadata: {
          kind: "eli_auto",
          reason: call.reason,
          attempt: call.attempt,
          trigger_at: call.triggerAt,
          conversation_id: r.ok ? r.conversationId : null,
          dedupe_key: key,
        },
      });
    }
    dialed.push({ contactId: call.contactId, reason: call.reason, attempt: call.attempt, ok: okCall, error: err });
  }

  const failed = dialed.filter((d) => !d.ok);
  if (failed.length) {
    await sendTelegram(
      `⚠️ Ели не можа да набере ${failed.length} души: ${failed
        .map((f) => (f.error ?? "").slice(0, 120).replace(/</g, "&lt;"))
        .join(" · ")}`
    );
  }
  return { ok: true, state: "ran", ...res, today: today + dialed.filter((d) => d.ok).length, dialed };
}
