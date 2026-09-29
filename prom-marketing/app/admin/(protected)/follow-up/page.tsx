import { createServiceClient } from "@/lib/supabase/service";
import type { ContactRow } from "@/lib/contacts/types";
import { followupState } from "@/lib/contacts/followup";
import { entryFromMetadata } from "@/lib/contacts/dnevnik";
import { openPromisesByContact, photoSrcMany } from "@/lib/contacts/dnevnik-repository";
import { ASSIGN_TYPE, summarizeAttempts, type AttemptRow } from "@/lib/team/queue-rules";
import { loadRotationPool } from "@/lib/team/routing";
import { FollowupQueue, type FollowupRow } from "@/components/admin/FollowupQueue";

export const dynamic = "force-dynamic";

// Activity types that count as "we sent them something" — the trigger for the
// follow-up layer (requirement: everyone we emailed / sent a presentation,
// offer or proforma to).
const SENT_TYPES = ["email_sent", "offer_sent", "presentation_sent", "proforma_sent", "contract_sent"];
const ATTEMPTS = ["call", "meeting"];
const FUNNEL_STAGES = ["contacted", "discovery", "presentation_sent", "offer_sent", "negotiating"];

/**
 * Проследяването — дневникът на всички връзки на едно място: снимка, как се е
 * чувствал човекът последния път, какво сме говорили, кой какво дължи и кога
 * да го чуя пак. Данните за всяка карта се събират тук, на сървъра, за да
 * излязат с едно зареждане.
 */
export default async function FollowupPage() {
  const sb = createServiceClient();
  const now = new Date();

  const [{ data: contacts }, { data: sentActs }, { data: attemptActs }, { data: dnevnikActs }, { data: teamActs }] =
    await Promise.all([
    sb.from("contacts").select("*").neq("stage", "lost").order("updated_at", { ascending: false }),
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at")
      .in("activity_type", SENT_TYPES)
      .order("occurred_at", { ascending: false })
      .limit(5000),
    sb
      .from("contact_activities")
      .select("contact_id, occurred_at")
      .in("activity_type", ATTEMPTS)
      .lte("occurred_at", now.toISOString())
      .order("occurred_at", { ascending: false })
      .limit(5000),
    sb
      .from("contact_activities")
      .select("contact_id, occurred_at, metadata")
      .eq("metadata->>kind", "dnevnik")
      .order("occurred_at", { ascending: false })
      .limit(3000),
    // Кой е даден на екипа и още не е докоснат — за да не звъннем и двамата.
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
      .or(`activity_type.eq.${ASSIGN_TYPE},metadata->>team.eq.true`)
      .order("occurred_at", { ascending: false })
      .limit(2000),
  ]);

  const atTeam = summarizeAttempts((teamActs ?? []) as AttemptRow[]);

  const allContacts = (contacts ?? []) as ContactRow[];

  const lastSent = new Map<string, { type: string; at: string }>();
  for (const a of (sentActs ?? []) as Array<{ contact_id: string; activity_type: string; occurred_at: string }>) {
    if (!lastSent.has(a.contact_id)) lastSent.set(a.contact_id, { type: a.activity_type, at: a.occurred_at });
  }
  const lastAttempt = new Map<string, string>();
  for (const a of (attemptActs ?? []) as Array<{ contact_id: string; occurred_at: string }>) {
    if (!lastAttempt.has(a.contact_id)) lastAttempt.set(a.contact_id, a.occurred_at);
  }
  const lastDnevnik = new Map<string, FollowupRow["last_dnevnik"]>();
  const dnevnikCount = new Map<string, number>();
  for (const a of (dnevnikActs ?? []) as Array<{ contact_id: string; occurred_at: string; metadata: Record<string, unknown> | null }>) {
    dnevnikCount.set(a.contact_id, (dnevnikCount.get(a.contact_id) ?? 0) + 1);
    if (lastDnevnik.has(a.contact_id)) continue;
    const entry = entryFromMetadata(a.metadata);
    if (entry) lastDnevnik.set(a.contact_id, { at: a.occurred_at, entry });
  }

  const picked = allContacts.filter(
    (c) =>
      FUNNEL_STAGES.includes(c.stage) ||
      c.followup_status != null ||
      c.next_followup_at != null ||
      lastSent.has(c.id) ||
      lastDnevnik.has(c.id)
  );

  const [promises, photos, pool] = await Promise.all([
    openPromisesByContact(picked.map((c) => c.id)),
    photoSrcMany(picked.map((c) => c.photo_url ?? null)),
    loadRotationPool(),
  ]);
  // Един човек на звъненето — бутонът казва името му; повече — „екипа“: картонът
  // отива при човека, при когото е влязъл по ротацията (виж lib/team/routing-rules.ts).
  const setterName = pool.length === 1 ? pool[0].full_name : pool.length > 1 ? "екипа" : null;

  const rows: FollowupRow[] = picked.map((c) => ({
    ...c,
    last_sent_type: lastSent.get(c.id)?.type ?? null,
    last_sent_at: lastSent.get(c.id)?.at ?? null,
    last_attempt_at: lastAttempt.get(c.id) ?? null,
    state: followupState(c, lastAttempt.get(c.id) ?? null, now),
    photo_src: c.photo_url ? (photos.get(c.photo_url) ?? null) : null,
    last_dnevnik: lastDnevnik.get(c.id) ?? null,
    dnevnik_count: dnevnikCount.get(c.id) ?? 0,
    open_promises: promises.get(c.id) ?? [],
    at_team: atTeam.get(c.id)?.given?.to ?? null,
  }));

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Sales follow-up</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Всеки, с когото сме в разговор: как се чувстваше последния път, какво говорихме, кой какво дължи и кога да го
            чуя пак.
          </p>
        </header>

        <FollowupQueue rows={rows} nowIso={now.toISOString()} setterName={setterName} />
      </div>
    </div>
  );
}
