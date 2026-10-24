import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { ATTEMPT_TYPES } from "@/lib/contacts/followup";
import { rankTopCalls, type TopCallCandidate, type TopCallsResult } from "./top-calls-rules";

/**
 * Четенето за „📞 Топ 10 за днес": просрочените и днешните напомняния с
 * последната активност на всеки. Правилата са в `top-calls-rules.ts`.
 */
export async function loadTopCalls(now: Date = new Date(), limit = 10): Promise<TopCallsResult> {
  const sb = createServiceClient();
  const until = new Date(now.getTime() + 24 * 3_600_000).toISOString();
  const { data: rows, error } = await sb
    .from("contacts")
    .select("id, full_name, company, phone, email, stage, followup_status, deal_value_eur, next_followup_at, last_heard_from_at")
    .not("next_followup_at", "is", null)
    .lte("next_followup_at", until)
    .not("stage", "in", "(won,lost)")
    .order("next_followup_at", { ascending: true })
    .limit(600);
  if (error) throw new Error(error.message);

  const base = (rows ?? []) as Array<Omit<TopCallCandidate, "last_attempt_at" | "last_activity">>;
  const lastAttempt = new Map<string, string>();
  const lastActivity = new Map<string, { type: string; occurred_at: string }>();
  const nowIso = now.toISOString();
  for (let i = 0; i < base.length; i += 150) {
    const ids = base.slice(i, i + 150).map((c) => c.id);
    const { data: acts } = await sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at")
      .in("contact_id", ids)
      .lte("occurred_at", nowIso)
      .order("occurred_at", { ascending: false })
      .limit(6000);
    for (const a of (acts ?? []) as Array<{ contact_id: string; activity_type: string; occurred_at: string }>) {
      if (!lastActivity.has(a.contact_id)) lastActivity.set(a.contact_id, { type: a.activity_type, occurred_at: a.occurred_at });
      if (!lastAttempt.has(a.contact_id) && (ATTEMPT_TYPES as readonly string[]).includes(a.activity_type)) {
        lastAttempt.set(a.contact_id, a.occurred_at);
      }
    }
  }

  const candidates: TopCallCandidate[] = base.map((c) => ({
    ...c,
    last_attempt_at: lastAttempt.get(c.id) ?? null,
    last_activity: lastActivity.get(c.id) ?? null,
  }));
  return rankTopCalls(candidates, now, limit);
}
