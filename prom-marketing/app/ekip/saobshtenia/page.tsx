import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { actorKey, loadThread, loadThreads, markRead } from "@/lib/team/messages";
import { parseThreadKey } from "@/lib/team/messages-rules";
import { templatesFor } from "@/lib/team/service-types";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { createServiceClient } from "@/lib/supabase/service";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { MessagesPanel } from "@/components/ekip/MessagesPanel";

export const dynamic = "force-dynamic";

/** „Съобщения“ — разговорите на екипа през CRM-а. `?t=` е нишката. */
export default async function SaobshteniaPage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "saobshtenia")) redirect(homeFor(actor.member));

  const sp = await searchParams;
  const current = (Array.isArray(sp.t) ? sp.t[0] : sp.t ?? "").trim() || null;
  const [{ threads, me }, nav] = await Promise.all([loadThreads(actor), ekipNav(actor)]);
  let messages: Awaited<ReturnType<typeof loadThread>>["messages"] = [];
  let title = "";
  let templates: Array<{ id: string; label: string; text: string }> = [];
  let contactId: string | null = null;
  if (current) {
    const t = await loadThread(current, actor);
    messages = t.messages;
    title = t.title;
    await markRead(actorKey(actor), current);
    const parsed = parseThreadKey(current);
    if (parsed.kind === "contact" && parsed.ref) {
      contactId = parsed.ref;
      const sb = createServiceClient();
      const { data: p } = await sb.from("projects").select("service_type").eq("contact_id", parsed.ref).neq("status", "cancelled").order("created_at", { ascending: false }).limit(1).maybeSingle();
      templates = templatesFor((p?.service_type as string | null) ?? null).map((x) => ({ id: x.id, label: x.label, text: x.text }));
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="saobshtenia" unread={nav.unread} />
      <main className="px-4 py-4">
        <MessagesPanel threads={threads} current={current} messages={messages} title={title} me={me} base="/ekip/saobshtenia" templates={templates} contactId={contactId} />
      </main>
    </div>
  );
}
