import { requireTeamActor } from "@/lib/team/session";
import { actorKey, loadThread, loadThreads, markRead } from "@/lib/team/messages";
import { parseThreadKey } from "@/lib/team/messages-rules";
import { templatesFor } from "@/lib/team/service-types";
import { createServiceClient } from "@/lib/supabase/service";
import { MessagesPanel } from "@/components/ekip/MessagesPanel";

export const dynamic = "force-dynamic";

/** Съобщенията — същият панел, в админ обвивката. */
export default async function AdminSaobshteniaPage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const actor = await requireTeamActor();
  const sp = await searchParams;
  const current = (Array.isArray(sp.t) ? sp.t[0] : sp.t ?? "").trim() || null;
  const { threads, me } = await loadThreads(actor);
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
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Съобщения</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Разговорът с екипа минава оттук, не по Viber: обща нишка, лична с всеки и нишка по всеки картон и проект. По
            картон отметката „клиентът го вижда“ праща същото и в портала му.
          </p>
        </header>
        <MessagesPanel threads={threads} current={current} messages={messages} title={title} me={me} base="/admin/saobshtenia" templates={templates} contactId={contactId} />
      </div>
    </div>
  );
}
