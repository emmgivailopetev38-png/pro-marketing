import "server-only";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { unsubscribeUrl } from "@/lib/email/unsubscribe-token";
import { KINO } from "./config";
import { kinoTimeline, premiereLabels, sofiaParts } from "./time";
import { buildFlowStages, activeStages, inAudience, smsText, type FlowStage } from "./schedule";
import { flowEmail, type KinoEmailCtx } from "./emails";
import { seatFor, normalizePhone } from "./people";
import { isDbConfigured, kinoLinks, firstName, SCREENING } from "./server";
import { sendSms, smsStatus } from "./sms";

/**
 * Kino Flow — напомнянията преди и след премиерата. Моделът е Webinar Flow
 * (lib/webinar/flow.ts): кронът се върти, всяка стъпка има прозорец, а една
 * активност `kino_email_<стъпка>` / `kino_sms_<стъпка>` на човек = едно писмо.
 *
 * ⚠ ИЗКЛЮЧЕН, докато Ивайло не каже „давай“: KINO_FLOW_ENABLED=1 във Vercel.
 * Без флага кронът само казва какво би пратил (виж /admin/kino → „Загряване“).
 */

export function kinoFlowEnabled(): boolean {
  return process.env.KINO_FLOW_ENABLED === "1";
}

export function kinoStages(): FlowStage[] {
  const tl = kinoTimeline();
  const p = sofiaParts(tl.premiereMs);
  return buildFlowStages(tl, { hour: p.hour, minute: p.minute });
}

export interface KinoFlowResult {
  ran: boolean;
  reason?: string;
  stagesActive: string[];
  sent: Array<{ stage: string; channel: "email" | "sms"; count: number }>;
  skipped: string[];
  errors: string[];
}

interface Person {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const CHUNK = 100;
const BUDGET_MS = 240_000;

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function idsWithActivity(contactIds: string[], type: string, filter?: (m: Record<string, unknown>) => boolean): Promise<Set<string>> {
  const sb = createServiceClient();
  const out = new Set<string>();
  for (const part of chunks(contactIds, 300)) {
    // PostgREST връща най-много 1000 реда — по страници (виж lib/supabase/all-rows.ts).
    const { rows: data, error } = await allRows<{ id: string; contact_id: string; metadata: unknown }>((from, to) =>
      sb.from("contact_activities").select("id, contact_id, metadata").eq("activity_type", type).in("contact_id", part).order("id").range(from, to),
    );
    // Непълен списък = опасен списък („вече пратени“ празен → всички пак;
    // „отписани“ празен → писма до отписали се). Затова грешката спира всичко.
    if (error) throw new Error(`${type}: ${error}`);
    for (const r of data) {
      const m = (r.metadata ?? {}) as Record<string, unknown>;
      if (!filter || filter(m)) out.add(r.contact_id as string);
    }
  }
  return out;
}

/** Едно завъртане. Вика се от /api/cron/kino-flow (на 15 минути). */
export async function runKinoFlow(now = new Date()): Promise<KinoFlowResult> {
  try {
    return await runKinoFlowOnce(now);
  } catch (e) {
    return { ran: true, stagesActive: [], sent: [], skipped: [], errors: [`спряно: ${e instanceof Error ? e.message : String(e)}`] };
  }
}

async function runKinoFlowOnce(now: Date): Promise<KinoFlowResult> {
  const started = Date.now();
  const base: KinoFlowResult = { ran: false, stagesActive: [], sent: [], skipped: [], errors: [] };
  if (!kinoFlowEnabled()) return { ...base, reason: "Изключено: KINO_FLOW_ENABLED не е 1" };
  if (!isDbConfigured()) return { ...base, reason: "Няма Supabase env" };

  const stages = activeStages(kinoStages(), now.getTime());
  if (stages.length === 0) return { ...base, ran: true, reason: "Няма активни стъпки в този час" };

  const sb = createServiceClient();
  const errors: string[] = [];
  const skipped: string[] = [];

  // Записаните за ТАЗИ прожекция.
  const { rows: regs, error: regsErr } = await allRows<{ id: string; contact_id: string; metadata: unknown }>((from, to) =>
    sb.from("contact_activities").select("id, contact_id, metadata").eq("activity_type", "kino_registration").order("id").range(from, to),
  );
  if (regsErr) return { ...base, ran: true, stagesActive: stages.map((s) => s.id), errors: [regsErr] };
  const ids = [
    ...new Set(
      (regs ?? [])
        .filter((r) => ((r.metadata ?? {}) as Record<string, unknown>).screening === SCREENING)
        .map((r) => r.contact_id as string),
    ),
  ];
  if (ids.length === 0) return { ...base, ran: true, stagesActive: stages.map((s) => s.id), reason: "Няма записани" };

  const people: Person[] = [];
  for (const part of chunks(ids, 300)) {
    const { data } = await sb.from("contacts").select("id, full_name, email, phone").in("id", part);
    people.push(...((data ?? []) as Person[]));
  }

  const optedOut = await idsWithActivity(ids, "note", (m) => m.email_opt_out === true);
  const entered = await idsWithActivity(ids, "kino_watch", (m) => m.screening === SCREENING && m.milestone === "entered");
  // „Купил“ за напомнянията = платил потока ИЛИ капаро: на тях им звъним, не им пишем „затваряме“.
  const bought = new Set([
    ...(await idsWithActivity(ids, "kino_payment", (m) => m.screening === SCREENING)),
    ...(await idsWithActivity(ids, "kino_deposit", (m) => m.screening === SCREENING)),
  ]);

  const labels = premiereLabels();
  const resendKey = process.env.RESEND_API_KEY;
  const resend = resendKey ? new Resend(resendKey) : null;
  const from = process.env.EMAIL_FROM || "ProMarketing <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  const sms = smsStatus();
  const sent: KinoFlowResult["sent"] = [];

  for (const stage of stages) {
    const audience = people.filter(
      (p) => !optedOut.has(p.id) && inAudience(stage.audience, { entered: entered.has(p.id), bought: bought.has(p.id) }),
    );

    // ── имейл ──
    if (stage.channels.includes("email")) {
      if (!resend) {
        skipped.push(`${stage.id}: няма RESEND_API_KEY`);
      } else {
        const done = await idsWithActivity(ids, `kino_email_${stage.id}`);
        const todo = audience.filter((p) => p.email && !done.has(p.id));
        let count = 0;
        for (const part of chunks(todo, CHUNK)) {
          if (Date.now() - started > BUDGET_MS) {
            skipped.push(`${stage.id}: времето свърши — останалите на следващото завъртане`);
            break;
          }
          const mails = part.flatMap((p) => {
            const links = kinoLinks(p.id);
            if (!links) return [];
            const ctx: KinoEmailCtx = {
              name: firstName(p.full_name),
              links,
              labels,
              seat: seatFor(p.id),
              viberUrl: KINO.viberClubUrl,
              unsubscribeUrl: unsubscribeUrl(p.id),
            };
            const m = flowEmail(stage.id, ctx);
            return m ? [{ person: p, mail: m }] : [];
          });
          if (mails.length === 0) continue;
          const { data, error } = await resend.batch.send(
            mails.map(({ person, mail }) => ({
              from,
              to: person.email!,
              subject: mail.subject,
              html: mail.html,
              text: mail.text,
              ...(replyTo ? { replyTo } : {}),
            })),
            // Ключът пази само от двойно завъртане в същите 15 минути; следващото
            // завъртане е с нов ключ — иначе отказ от Resend би се „запомнил“.
            { batchValidation: "permissive", idempotencyKey: `kino-${stage.id}-${part[0].id}-${part.length}-${Math.floor(now.getTime() / 900_000)}` },
          );
          if (error) {
            errors.push(`${stage.id}: ${error.message}`);
            continue; // без активност → опит пак на следващото завъртане
          }
          const failed = new Set(((data as { errors?: Array<{ index: number }> } | null)?.errors ?? []).map((e) => e.index));
          const okRows = mails
            .filter((_, i) => !failed.has(i))
            .map(({ person, mail }) => ({
              contact_id: person.id,
              activity_type: `kino_email_${stage.id}`,
              title: `📧 Кино: ${mail.subject}`,
              created_by: "kino_flow",
              metadata: { funnel: "kino", screening: SCREENING, stage: stage.id },
            }));
          if (okRows.length) {
            const { error: insErr } = await sb.from("contact_activities").insert(okRows);
            if (insErr) errors.push(`${stage.id}: запис ${insErr.message}`);
          }
          count += okRows.length;
          if (failed.size) errors.push(`${stage.id}: ${failed.size} писма отказани от Resend`);
        }
        sent.push({ stage: stage.id, channel: "email", count });
      }
    }

    // ── SMS ──
    if (stage.channels.includes("sms")) {
      if (!sms.enabled) {
        skipped.push(`${stage.id}: SMS изключени (${sms.reason})`);
      } else {
        const done = await idsWithActivity(ids, `kino_sms_${stage.id}`);
        let count = 0;
        for (const p of audience) {
          if (!p.phone || done.has(p.id)) continue;
          // Старите картони пазят „0888 …“ — към Twilio отива +359…
          const ph = normalizePhone(p.phone);
          if (!ph.ok || !ph.bg) continue;
          if (Date.now() - started > BUDGET_MS) {
            skipped.push(`${stage.id}: SMS — времето свърши`);
            break;
          }
          const links = kinoLinks(p.id);
          const body = links ? smsText(stage.id, links.short.replace(/^https?:\/\//, ""), { day: labels.short.split(" · ")[0], time: labels.time }) : null;
          if (!body) continue;
          const r = await sendSms(ph.e164, body);
          if (!r.ok) {
            errors.push(`${stage.id} SMS → ${p.id}: ${r.error}`);
            continue;
          }
          await sb.from("contact_activities").insert({
            contact_id: p.id,
            activity_type: `kino_sms_${stage.id}`,
            title: `💬 Кино SMS: ${body}`,
            created_by: "kino_flow",
            metadata: { funnel: "kino", screening: SCREENING, stage: stage.id, sms_id: r.id ?? null },
          });
          count++;
        }
        sent.push({ stage: stage.id, channel: "sms", count });
      }
    }
  }

  return { ran: true, stagesActive: stages.map((s) => s.id), sent, skipped, errors };
}
