import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { ZV_ACTIVITY_TYPES, classify, type ZvAct, type ZvContact, type ZvRow } from "@/lib/zvanene/rules";
import { ZvaneneList } from "@/components/admin/ZvaneneList";

export const dynamic = "force-dynamic";

/**
 * „📞 Звънене“ — една страница за прозвъняване: новите лийдове, на които не сме се
 * чули, писаните без отговор, топлите и старите. Номерът звъни през Мака/iPhone,
 * полето под него се пише с Wispr Flow (или само, докато говориш), а бутонът за
 * резултата записва обаждането в картона.
 */
export default async function ZvanenePage() {
  const sb = createServiceClient();
  const now = new Date();

  const [contacts, acts] = await Promise.all([
    allRows<ZvContact>((from, to) =>
      sb
        .from("contacts")
        .select("id, full_name, company, phone, stage, followup_status, next_followup_at, created_at")
        .not("stage", "in", "(won,lost)")
        .not("phone", "is", null)
        .or("followup_status.is.null,followup_status.neq.not_interested")
        .order("created_at", { ascending: false })
        .range(from, to)
    ),
    allRows<ZvAct>((from, to) =>
      sb
        .from("contact_activities")
        .select("contact_id, activity_type, title, body, occurred_at, created_by")
        .in("activity_type", ZV_ACTIVITY_TYPES)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
  ]);

  const byContact = new Map<string, ZvAct[]>();
  for (const a of acts.rows) {
    const list = byContact.get(a.contact_id);
    if (list) list.push(a);
    else byContact.set(a.contact_id, [a]);
  }

  const rows: ZvRow[] = [];
  for (const c of contacts.rows) {
    const r = classify(c, byContact.get(c.id) ?? [], now);
    if (r) rows.push(r);
  }
  rows.sort((a, b) => a.sort - b.sort);

  const error = contacts.error ?? acts.error;

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-5 p-4 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-5">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Продажби</p>
          <h1 className="cc-title mt-2 font-display text-3xl font-bold md:text-4xl">📞 Звънене</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Натисни номера → звъни през iPhone. Говори — полето се пише само (или задръж Fn за Wispr Flow). Натисни
            какво стана → влиза в картона и датата за следващо чуване се слага сама.
          </p>
          {error ? <p className="mt-2 text-sm text-rose-300">⚠️ Част от данните не се заредиха: {error}</p> : null}
        </header>

        <ZvaneneList rows={rows} />
      </div>
    </div>
  );
}
