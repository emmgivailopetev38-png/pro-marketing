import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTelegram } from "@/lib/notifications/telegram";
import { checkAgentCredits } from "./credits";
import { outboundApiKey, placeOutboundCall } from "./outbound";
import { AUTO_LOG_TYPE, bgMobileE164, inCallWindow, phoneKey, sofiaDay } from "./auto-call-rules";
import { ELI_AGENT_ID, ELI_PHONE_NUMBER_ID, callWindow, creditsLeft, readSwitch } from "./auto-call";

/**
 * Ели звъни по списък — персонален фолоуъп (29.10.2026, Ивайло: „обади се на
 * всички, с които сме водили преговори, пращали сме оферта или са искали да
 * пробват AI, но не са го видели“).
 *
 * Различно от `auto-call.ts`: там правилата избират КОГО; тук списъкът идва
 * отвън (Клод/Хермес го съставя с Bearer) и влиза в опашка
 * `automation_events.voice_followup_queue`. Кронът на 2 минути я изчерпва с
 * общите спирачки на Ели — работни часове, ключът „пауза“, кредитите в
 * ElevenLabs и дневен таван `VOICE_FOLLOWUP_DAILY_MAX` — така вълната не
 * зависи от отворен чат и не изгаря кредитите за входящите.
 *
 * Агентът може да е друг (отделен промпт за фолоуъп): `agent_upsert` го прави
 * от Ели по API с ключа във Vercel, за да не се носи ключът по Мака.
 */

export const FOLLOWUP_EVENT = "voice_followup_queue";
export const AGENT_EVENT = "voice_agent";
const API = "https://api.elevenlabs.io";
const PER_RUN_MAX = 2;

export interface FollowupItem {
  contact_id: string;
  to_number: string;
  agent_id?: string;
  povod: string;
  prio?: number;
  variables: Record<string, string>;
}

export interface QueuedRow {
  id: string;
  related_contact_id: string | null;
  detail: FollowupItem & { attempt?: number };
  created_at: string;
}

function intEnv(name: string, def: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def;
}

export function followupDailyMax(): number {
  return intEnv("VOICE_FOLLOWUP_DAILY_MAX", 40);
}

/** Един човек — една заявка за един повод; второ пускане на същия списък не го дублира. */
export function followupKey(contactId: string, povod: string): string {
  return `voice-followup:${contactId}:${povod.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 60)}`;
}

/** Кои от опашката да се наберат сега: по приоритет, после по ред на влизане, до мястото за деня. */
export function pickDue<T extends { prio?: number; created_at: string }>(
  pending: T[],
  args: { doneToday: number; cap: number; perRun?: number }
): T[] {
  const room = Math.max(0, Math.min(args.perRun ?? PER_RUN_MAX, args.cap - args.doneToday));
  return [...pending]
    .sort((a, b) => (a.prio ?? 50) - (b.prio ?? 50) || a.created_at.localeCompare(b.created_at))
    .slice(0, room);
}

/** Тялото на PATCH към ElevenLabs — само промптът и първото изречение, нищо друго не се пипа. */
export function agentPatchBody(args: { name?: string; prompt?: string; firstMessage?: string }): Record<string, unknown> {
  const agent: Record<string, unknown> = {};
  if (args.firstMessage !== undefined) agent.first_message = args.firstMessage;
  if (args.prompt !== undefined) agent.prompt = { prompt: args.prompt };
  const body: Record<string, unknown> = {};
  if (args.name) body.name = args.name;
  if (Object.keys(agent).length) body.conversation_config = { agent };
  return body;
}

export async function enqueueFollowups(items: FollowupItem[], by: string): Promise<{ queued: number; skipped: { contact_id: string; why: string }[] }> {
  const sb = createServiceClient();
  let queued = 0;
  const skipped: { contact_id: string; why: string }[] = [];
  for (const raw of items) {
    const to = bgMobileE164(raw.to_number);
    if (!to) {
      skipped.push({ contact_id: raw.contact_id, why: "не е български мобилен" });
      continue;
    }
    const item: FollowupItem = { ...raw, to_number: to, variables: { ...raw.variables, telefon: to } };
    const { error } = await sb.from("automation_events").insert({
      event_type: FOLLOWUP_EVENT,
      status: "pending",
      related_contact_id: item.contact_id,
      idempotency_key: followupKey(item.contact_id, item.povod),
      summary: `📞 Ели · фолоуъп · ${item.variables.ime || item.contact_id} · чака`,
      detail: { ...item, by },
    });
    if (error) skipped.push({ contact_id: item.contact_id, why: /duplicate|unique/i.test(error.message) ? "вече е в опашката" : error.message });
    else queued += 1;
  }
  return { queued, skipped };
}

export async function pendingFollowups(limit = 200): Promise<QueuedRow[]> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("automation_events")
    .select("id, related_contact_id, detail, created_at")
    .eq("event_type", FOLLOWUP_EVENT)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as unknown as QueuedRow[];
}

async function followupsToday(now: Date): Promise<number> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - 26 * 3600_000).toISOString();
  const { data } = await sb
    .from("automation_events")
    .select("created_at, status, detail")
    .eq("event_type", FOLLOWUP_EVENT)
    .gte("created_at", since);
  const today = sofiaDay(now);
  return (data ?? []).filter((r) => {
    const d = (r.detail ?? {}) as { dialed_at?: string };
    return r.status === "success" && d.dialed_at && sofiaDay(d.dialed_at) === today;
  }).length;
}

/** Човек с час напред не се набира — записал се е междувременно. */
async function hasFutureBooking(phone: string, now: Date): Promise<boolean> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("bookings")
    .select("attendee_phone, scheduled_at, status")
    .gt("scheduled_at", now.toISOString())
    .in("status", ["accepted", "pending"]);
  const k = phoneKey(phone);
  return (data ?? []).some((b) => phoneKey(b.attendee_phone as string | null) === k);
}

export interface FollowupRunResult {
  ok: boolean;
  state: "off" | "outside_hours" | "no_key" | "credits" | "cap" | "empty" | "ran";
  detail?: string;
  pending: number;
  today: number;
  cap: number;
  dialed: { contactId: string; ok: boolean; error?: string }[];
}

/** Една обиколка по опашката. `force` пренебрегва часовете (ръчна проба). */
export async function runFollowupQueue(args: { now?: Date; force?: boolean; max?: number } = {}): Promise<FollowupRunResult> {
  const now = args.now ?? new Date();
  const cap = followupDailyMax();
  const pending = await pendingFollowups();
  const base = { pending: pending.length, today: 0, cap, dialed: [] as FollowupRunResult["dialed"] };
  if (pending.length === 0) return { ok: true, state: "empty", ...base };

  const sw = await readSwitch();
  if (!sw.on) return { ok: true, state: "off", detail: sw.by ?? undefined, ...base };
  if (!args.force && !inCallWindow(now, callWindow())) return { ok: true, state: "outside_hours", ...base };
  if (!outboundApiKey()) return { ok: false, state: "no_key", detail: "ELEVENLABS_API_KEY липсва във Vercel", ...base };

  const today = await followupsToday(now);
  const credits = await creditsLeft();
  const minCredits = intEnv("VOICE_AUTO_MIN_CREDITS", 12_000);
  if (credits !== null && credits < minCredits) {
    return { ok: true, state: "credits", detail: `останаха ${credits} кредита (< ${minCredits})`, ...base, today };
  }
  if (today >= cap) return { ok: true, state: "cap", detail: `${today}/${cap} днес`, ...base, today };

  const due = pickDue(
    pending.map((r) => ({ ...r, prio: r.detail?.prio })),
    { doneToday: today, cap, perRun: args.max ?? PER_RUN_MAX }
  );
  const sb = createServiceClient();
  const dialed: FollowupRunResult["dialed"] = [];
  for (const row of due) {
    const item = row.detail;
    const agentId = item.agent_id || ELI_AGENT_ID;
    // Заключването: само този, който смени pending → dialing, набира.
    const { data: claim } = await sb
      .from("automation_events")
      .update({ status: "dialing", summary: `📞 Ели · фолоуъп · ${item.variables?.ime || item.contact_id} · набира` })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claim) continue;

    if (await hasFutureBooking(item.to_number, now)) {
      await sb.from("automation_events").update({ status: "skipped", summary: `⏭ Ели · фолоуъп · ${item.variables?.ime || ""} · вече има час`, detail: { ...item, skipped: "future_booking" } }).eq("id", row.id);
      continue;
    }
    const health = await checkAgentCredits(agentId);
    if (health.state === "out") {
      await sb.from("automation_events").update({ status: "pending" }).eq("id", row.id);
      return { ok: true, state: "credits", detail: "последният разговор падна от квота", ...base, today, dialed };
    }

    const r = await placeOutboundCall({
      toNumber: item.to_number,
      variables: item.variables,
      agentId,
      phoneNumberId: ELI_PHONE_NUMBER_ID,
    });
    const err = r.ok ? undefined : `${r.reason}${r.detail ? ` ${r.detail}` : ""}`;
    await sb
      .from("automation_events")
      .update({
        status: r.ok ? "success" : "failed",
        summary: `${r.ok ? "📞" : "⚠️"} Ели · фолоуъп · ${item.variables?.ime || item.contact_id} · ${r.ok ? "набрана" : "грешка"}`,
        detail: { ...item, dialed_at: new Date().toISOString(), conversation_id: r.ok ? r.conversationId : null, error: err ?? null },
      })
      .eq("id", row.id);

    if (r.ok) {
      await sb.from("contact_activities").insert({
        contact_id: item.contact_id,
        activity_type: AUTO_LOG_TYPE,
        title: `📞 Ели звъни · персонален фолоуъп · ${item.povod}`,
        body: `Обаждане от 0876 447 159 (агентът „Ели“, фолоуъп по поръчка на Ивайло от 29.10.2026): среща другата седмица или Ивайло да се обади. Разговорът влиза в картона, щом приключи.`,
        occurred_at: new Date().toISOString(),
        created_by: "eli_followup",
        metadata: { kind: "eli_followup", povod: item.povod, agent_id: agentId, conversation_id: r.conversationId, dedupe_key: followupKey(item.contact_id, item.povod) },
      });
    }
    dialed.push({ contactId: item.contact_id, ok: r.ok, error: err });
  }

  const failed = dialed.filter((d) => !d.ok);
  if (failed.length) {
    await sendTelegram(`⚠️ Ели (фолоуъп) не можа да набере ${failed.length}: ${failed.map((f) => (f.error ?? "").slice(0, 120).replace(/</g, "&lt;")).join(" · ")}`);
  }
  return { ok: true, state: "ran", ...base, pending: pending.length - due.length, today: today + dialed.filter((d) => d.ok).length, dialed };
}

/**
 * Агент за фолоуъпа: копие на Ели (duplicate) + собствен промпт и първо
 * изречение. Ключът `key` го намира при следващо пускане — тогава само PATCH.
 */
export async function upsertAgent(args: { key: string; name: string; prompt: string; firstMessage: string; sourceAgentId?: string }): Promise<
  { ok: true; agent_id: string; created: boolean; check: { name?: string; first_message?: string; prompt_head?: string; tools?: number } } | { ok: false; error: string }
> {
  const apiKey = outboundApiKey();
  if (!apiKey) return { ok: false, error: "ELEVENLABS_API_KEY липсва" };
  const headers = { "xi-api-key": apiKey, "Content-Type": "application/json" };
  const sb = createServiceClient();
  const { data: existing } = await sb
    .from("automation_events")
    .select("detail")
    .eq("event_type", AGENT_EVENT)
    .eq("idempotency_key", `voice-agent:${args.key}`)
    .maybeSingle();
  let agentId = ((existing?.detail ?? {}) as { agent_id?: string }).agent_id ?? null;
  let created = false;

  if (!agentId) {
    const src = args.sourceAgentId || ELI_AGENT_ID;
    const dup = await fetch(`${API}/v1/convai/agents/${encodeURIComponent(src)}/duplicate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: args.name }),
    });
    const dj = (await dup.json().catch(() => ({}))) as { agent_id?: string; detail?: unknown };
    if (!dup.ok || !dj.agent_id) return { ok: false, error: `duplicate ${dup.status} ${JSON.stringify(dj).slice(0, 300)}` };
    agentId = dj.agent_id;
    created = true;
    await sb.from("automation_events").insert({
      event_type: AGENT_EVENT,
      status: "success",
      idempotency_key: `voice-agent:${args.key}`,
      summary: `🤖 Агент „${args.name}“ създаден от Ели`,
      detail: { key: args.key, agent_id: agentId, source: src },
    });
  }

  const patch = await fetch(`${API}/v1/convai/agents/${encodeURIComponent(agentId)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(agentPatchBody({ name: args.name, prompt: args.prompt, firstMessage: args.firstMessage })),
  });
  if (!patch.ok) {
    const t = await patch.text().catch(() => "");
    return { ok: false, error: `patch ${patch.status} ${t.slice(0, 300)}` };
  }
  const got = await fetch(`${API}/v1/convai/agents/${encodeURIComponent(agentId)}`, { headers, cache: "no-store" });
  const g = (await got.json().catch(() => ({}))) as {
    name?: string;
    conversation_config?: { agent?: { first_message?: string; prompt?: { prompt?: string; tools?: unknown[]; tool_ids?: unknown[] } } };
  };
  const p = g.conversation_config?.agent?.prompt;
  return {
    ok: true,
    agent_id: agentId,
    created,
    check: {
      name: g.name,
      first_message: g.conversation_config?.agent?.first_message,
      prompt_head: p?.prompt?.slice(0, 160),
      tools: (p?.tool_ids?.length ?? 0) + (p?.tools?.length ?? 0),
    },
  };
}
