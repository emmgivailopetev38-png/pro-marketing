import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { parseThreadKey, summarizeThreads, unreadCount, type MessageLite, type ThreadKind, type ThreadSummary } from "./messages-rules";
import { participantKey } from "./roles";
import type { TeamActor } from "./session";

/**
 * Съобщенията през CRM-а — четене и писане. Правилата са в messages-rules.ts.
 *
 * Разговорът с Иван не минава по Viber, а тук: има нишка за всеки картон и
 * проект (за да стои до работата), лична нишка с всеки и една обща. Клиентът
 * вижда от нишката на картона си само отметнатото, а каквото напише той,
 * влиза със знак „от клиента“.
 */

const COLS = "id, thread_key, thread_kind, thread_ref, author_key, author_name, body, mentions, client_visible, from_client, created_at";

export interface Person {
  key: string;
  slug: string;
  name: string;
  email: string | null;
}

/** Всички участници: Ивайло + активните от екипа. */
export async function participants(): Promise<Person[]> {
  const sb = createServiceClient();
  const { data } = await sb.from("team_members").select("id, slug, full_name, email").eq("active", true).order("created_at");
  const owner: Person = {
    key: "owner",
    slug: "ivailo",
    name: process.env.ADMIN_ACTOR || "Ивайло",
    email: process.env.EMAIL_REPLY_TO?.trim() || "emmgivailopetev38@gmail.com",
  };
  return [owner, ...((data ?? []) as Array<{ id: string; slug: string; full_name: string; email: string }>).map((m) => ({ key: m.id, slug: m.slug, name: m.full_name, email: m.email }))];
}

export function actorKey(actor: TeamActor): string {
  return participantKey(actor.member);
}

export async function lastReads(participant: string): Promise<Map<string, string>> {
  const sb = createServiceClient();
  const { data } = await sb.from("team_thread_reads").select("thread_key, last_read_at").eq("participant_key", participant);
  return new Map(((data ?? []) as Array<{ thread_key: string; last_read_at: string }>).map((r) => [r.thread_key, r.last_read_at]));
}

async function titleFn(sb: ReturnType<typeof createServiceClient>, keys: string[], people: Person[]): Promise<(key: string) => string> {
  const contactIds: string[] = [];
  const projectIds: string[] = [];
  const taskIds: string[] = [];
  for (const k of keys) {
    const t = parseThreadKey(k);
    if (t.kind === "contact" && t.ref) contactIds.push(t.ref);
    if (t.kind === "project" && t.ref) projectIds.push(t.ref);
    if (t.kind === "task" && t.ref) taskIds.push(t.ref);
  }
  const [{ data: contacts }, { data: projects }, { data: tasks }] = await Promise.all([
    contactIds.length ? sb.from("contacts").select("id, full_name, company").in("id", contactIds) : Promise.resolve({ data: [] }),
    projectIds.length ? sb.from("projects").select("id, title").in("id", projectIds) : Promise.resolve({ data: [] }),
    taskIds.length ? sb.from("project_tasks").select("id, title").in("id", taskIds) : Promise.resolve({ data: [] }),
  ]);
  const cn = new Map(((contacts ?? []) as Array<{ id: string; full_name: string | null; company: string | null }>).map((c) => [c.id, c.full_name ?? c.company ?? "клиент"]));
  const pn = new Map(((projects ?? []) as Array<{ id: string; title: string }>).map((p) => [p.id, p.title]));
  const tn = new Map(((tasks ?? []) as Array<{ id: string; title: string }>).map((t) => [t.id, t.title]));
  const personName = new Map(people.map((p) => [p.key, p.name]));
  return (key: string) => {
    const t = parseThreadKey(key);
    if (t.kind === "general") return "👥 Целият екип";
    if (t.kind === "direct") return `💬 ${t.participants.map((p) => personName.get(p) ?? "—").join(" · ")}`;
    if (t.kind === "contact") return `👤 ${cn.get(t.ref ?? "") ?? "картон"}`;
    if (t.kind === "project") return `🛠 ${pn.get(t.ref ?? "") ?? "проект"}`;
    return `✅ ${tn.get(t.ref ?? "") ?? "задача"}`;
  };
}

/** Нишките на един човек, с непрочетено; личните с всеки съществуват и празни. */
export async function loadThreads(actor: TeamActor): Promise<{ threads: ThreadSummary[]; people: Person[]; me: string }> {
  const sb = createServiceClient();
  const me = actorKey(actor);
  const [people, reads, { data }] = await Promise.all([
    participants(),
    lastReads(me),
    sb.from("team_messages").select(COLS).order("created_at", { ascending: false }).limit(1500),
  ]);
  const messages = ((data ?? []) as MessageLite[]).slice().reverse();
  const keys = [...new Set(messages.map((m) => m.thread_key))];
  const title = await titleFn(sb, keys, people);
  const threads = summarizeThreads(messages, me, reads, title);
  // Общата и личните нишки се показват и когато са празни — за да има откъде да се започне.
  const have = new Set(threads.map((t) => t.key));
  if (!have.has("general")) threads.push({ key: "general", kind: "general", ref: null, title: title("general"), last: null, unread: 0, total: 0 });
  for (const p of people) {
    if (p.key === me) continue;
    const key = `direct:${[me, p.key].sort().join("|")}`;
    if (!have.has(key)) threads.push({ key, kind: "direct", ref: null, title: `💬 ${p.name}`, last: null, unread: 0, total: 0 });
  }
  return { threads, people, me };
}

export async function loadThread(key: string, actor: TeamActor): Promise<{ messages: MessageLite[]; title: string }> {
  const sb = createServiceClient();
  const t = parseThreadKey(key);
  const me = actorKey(actor);
  if (t.kind === "direct" && !t.participants.includes(me)) return { messages: [], title: "—" };
  const [people, { data }] = await Promise.all([participants(), sb.from("team_messages").select(COLS).eq("thread_key", key).order("created_at", { ascending: true }).limit(500)]);
  const title = await titleFn(sb, [key], people);
  return { messages: (data ?? []) as MessageLite[], title: title(key) };
}

/** Съобщенията по картон — за нишката в картона и за портала. */
export async function contactMessages(contactId: string, opts?: { clientOnly?: boolean }): Promise<MessageLite[]> {
  const sb = createServiceClient();
  let q = sb.from("team_messages").select(COLS).eq("thread_key", `contact:${contactId}`).order("created_at", { ascending: true }).limit(300);
  if (opts?.clientOnly) q = q.or("client_visible.eq.true,from_client.eq.true");
  const { data } = await q;
  return (data ?? []) as MessageLite[];
}

export async function markRead(participant: string, key: string): Promise<void> {
  const sb = createServiceClient();
  await sb
    .from("team_thread_reads")
    .upsert({ participant_key: participant, thread_key: key, last_read_at: new Date().toISOString() }, { onConflict: "participant_key,thread_key" })
    .then(() => null, () => null);
}

export async function postMessage(input: {
  key: string;
  authorKey: string;
  authorName: string;
  body: string;
  mentions?: string[];
  clientVisible?: boolean;
  fromClient?: boolean;
}): Promise<{ id: string | null; error: string | null; kind: ThreadKind; ref: string | null }> {
  const body = input.body.trim();
  const t = parseThreadKey(input.key);
  if (!body) return { id: null, error: "Празно съобщение", kind: t.kind, ref: t.ref };
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("team_messages")
    .insert({
      thread_key: input.key,
      thread_kind: t.kind,
      thread_ref: t.ref,
      author_key: input.authorKey,
      author_name: input.authorName,
      body: body.slice(0, 4000),
      mentions: input.mentions ?? [],
      client_visible: input.clientVisible ?? false,
      from_client: input.fromClient ?? false,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "insert failed", kind: t.kind, ref: t.ref };
  await markRead(input.authorKey, input.key);
  // По картон: следа в хронологията, за да се вижда и от Хермес.
  if (t.kind === "contact" && t.ref) {
    await sb
      .from("contact_activities")
      .insert({
        contact_id: t.ref,
        activity_type: input.fromClient ? "client_message" : "team_message",
        title: input.fromClient ? `💬 Клиентът написа: ${short(body)}` : `💬 ${input.authorName}: ${short(body)}`,
        body,
        occurred_at: new Date().toISOString(),
        metadata: { message_id: data.id, client_visible: input.clientVisible ?? false, from_client: input.fromClient ?? false, team: true },
        created_by: input.authorName,
      })
      .then(() => null, () => null);
  }
  return { id: data.id as string, error: null, kind: t.kind, ref: t.ref };
}

export async function setClientVisible(messageId: string, visible: boolean): Promise<{ error: string | null }> {
  const sb = createServiceClient();
  const { error } = await sb.from("team_messages").update({ client_visible: visible }).eq("id", messageId);
  return { error: error?.message ?? null };
}

/** Общо непрочетени за човек — за значката в шапката. */
export async function unreadTotal(participant: string): Promise<number> {
  const sb = createServiceClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [reads, { data }] = await Promise.all([
    lastReads(participant),
    sb.from("team_messages").select("thread_key, author_key, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(1000),
  ]);
  const list = ((data ?? []) as Array<{ thread_key: string; author_key: string; created_at: string }>).filter((m) => {
    const t = parseThreadKey(m.thread_key);
    return t.kind !== "direct" || t.participants.includes(participant);
  });
  return unreadCount(list, participant, reads);
}

function short(s: string, n = 70): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}
