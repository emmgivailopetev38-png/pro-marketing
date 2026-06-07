import { createServiceClient } from "@/lib/supabase/service";
import type { ContactRow } from "@/lib/contacts/types";
import { FollowupQueue, type FollowupRow } from "@/components/admin/FollowupQueue";

export const dynamic = "force-dynamic";

// Activity types that count as "we sent them something" — the trigger for the
// follow-up layer (requirement: everyone we emailed / sent a presentation,
// offer or proforma to).
const SENT_TYPES = [
  "email_sent",
  "offer_sent",
  "presentation_sent",
  "proforma_sent",
  "contract_sent",
];

const FUNNEL_STAGES = ["contacted", "presentation_sent", "offer_sent", "negotiating"];

export default async function FollowupPage() {
  const sb = createServiceClient();

  const [{ data: contacts }, { data: acts }] = await Promise.all([
    sb.from("contacts").select("*").neq("stage", "lost").order("updated_at", { ascending: false }),
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at")
      .in("activity_type", SENT_TYPES)
      .order("occurred_at", { ascending: false }),
  ]);

  const allContacts = (contacts ?? []) as ContactRow[];

  // Last "sent" activity per contact.
  const lastSent = new Map<string, { type: string; at: string }>();
  for (const a of (acts ?? []) as Array<{ contact_id: string; activity_type: string; occurred_at: string }>) {
    if (!lastSent.has(a.contact_id)) lastSent.set(a.contact_id, { type: a.activity_type, at: a.occurred_at });
  }

  const rows: FollowupRow[] = allContacts
    .filter((c) => FUNNEL_STAGES.includes(c.stage) || c.followup_status != null || lastSent.has(c.id))
    .map((c) => ({
      ...c,
      last_sent_type: lastSent.get(c.id)?.type ?? null,
      last_sent_at: lastSent.get(c.id)?.at ?? null,
    }));

  return (
    <div className="cc-bg min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Sales follow-up</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всички, на които сме изпратили имейл, презентация, оферта или проформа — и какво следва.
          </p>
        </header>

        <FollowupQueue rows={rows} />
      </div>
    </div>
  );
}
