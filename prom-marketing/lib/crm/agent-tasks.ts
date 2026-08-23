import { createServiceClient } from "@/lib/supabase/service";

/**
 * Опашката глас → Хермес.
 *
 * Хермес не се вика по HTTP от Vercel, а сам взима задача оттук. Причината е
 * скучна и важна: гласовият разговор не бива да чака сървър. Записът е мигновен,
 * агентът казва „предадох го" и затваря; ако VPS-ът в този момент се рестартира,
 * задачата просто чака следващата минута вместо да се загуби.
 */

export interface AgentTask {
  id: string;
  source: string;
  task: string;
  context: Record<string, unknown> | null;
  status: string;
  result: string | null;
  error: string | null;
  requested_by: string | null;
  created_at: string;
}

export async function queueAgentTask(input: {
  task: string;
  source?: "voice" | "admin" | "automation";
  context?: Record<string, unknown>;
  requested_by?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await createServiceClient()
    .from("agent_tasks")
    .insert({
      task: input.task.trim(),
      source: input.source ?? "voice",
      context: input.context ?? null,
      requested_by: input.requested_by ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "insert failed" };
  return { id: String(data.id), error: null };
}

/**
 * Взима най-старата чакаща задача и я маркира „в ход" в едно движение.
 * Условието `.eq("status", "queued")` при обновяването е ключово: ако два
 * работника питат едновременно, вторият получава нула реда и си тръгва
 * празен, вместо двамата да свършат една и съща работа два пъти.
 */
export async function claimNextAgentTask(): Promise<AgentTask | null> {
  const sb = createServiceClient();
  const { data: next } = await sb
    .from("agent_tasks")
    .select("id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return null;

  const { data, error } = await sb
    .from("agent_tasks")
    .update({ status: "running", claimed_at: new Date().toISOString() })
    .eq("id", next.id)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as AgentTask;
}

export async function finishAgentTask(args: {
  id: string;
  status: "done" | "failed";
  result?: string;
  error?: string;
}): Promise<{ error: string | null }> {
  const { error } = await createServiceClient()
    .from("agent_tasks")
    .update({
      status: args.status,
      result: args.result ?? null,
      error: args.error ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", args.id);
  return { error: error?.message ?? null };
}

export async function listAgentTasks(opts: { status?: string; limit?: number }): Promise<AgentTask[]> {
  let q = createServiceClient()
    .from("agent_tasks")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 20, 100));
  if (opts.status) q = q.eq("status", opts.status);
  const { data } = await q;
  return (data ?? []) as unknown as AgentTask[];
}

/**
 * Задача, която стои „в ход" повече от 15 минути, е останала от убит процес
 * (`hermes update` рестартира gateway-а по средата). Връща я в опашката,
 * иначе виси вечно и Ивайло никога не разбира защо няма отговор.
 */
export async function requeueStaleAgentTasks(olderThanMinutes = 15): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60000).toISOString();
  const { data } = await createServiceClient()
    .from("agent_tasks")
    .update({ status: "queued", claimed_at: null })
    .eq("status", "running")
    .lt("claimed_at", cutoff)
    .select("id");
  return (data ?? []).length;
}
