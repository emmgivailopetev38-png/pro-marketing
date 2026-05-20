import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { LeadsActions } from "@/components/admin/LeadsActions";
import { LeadSourcesForm } from "@/components/admin/LeadSourcesForm";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  meta_lead_id: string;
  form_name: string | null;
  campaign_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  imported_at: string;
  created_time: string | null;
}

interface SourceRow {
  id: string;
  label: string;
  csv_url: string;
  form_id: string | null;
  enabled: boolean;
  last_synced_at: string | null;
  last_sync_count: number;
  last_sync_error: string | null;
}

export default async function LeadsPage() {
  const supabase = await createClient();
  const [{ data: leads }, { data: sources }] = await Promise.all([
    supabase
      .from("meta_leads")
      .select("id, meta_lead_id, form_name, campaign_name, full_name, email, phone, imported_at, created_time")
      .order("imported_at", { ascending: false })
      .limit(200),
    supabase
      .from("meta_lead_sources")
      .select("id, label, csv_url, form_id, enabled, last_synced_at, last_sync_count, last_sync_error")
      .order("added_at", { ascending: true }),
  ]);

  const leadRows = (leads ?? []) as LeadRow[];
  const sourceRows = (sources ?? []) as SourceRow[];

  return (
    <div className="space-y-10 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Meta лийдове</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Лийдове от Facebook / Instagram Lead Ads, синхронизирани от Google Sheets
          </p>
        </div>
        <LeadsActions />
      </header>

      <section className="glass rounded-xl p-6">
        <h2 className="mb-1 font-display text-xl font-bold">Източници (Google Sheets)</h2>
        <p className="mb-5 text-xs text-[var(--color-text-tertiary)]">
          {`Един източник на лийд форма. Споделете Google Sheet-а като „Anyone with the link can view".`}
        </p>
        <div className="space-y-3">
          {sourceRows.length === 0 && (
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Все още няма източници. Добави първия по-долу.
            </p>
          )}
          {sourceRows.map((s) => (
            <div
              key={s.id}
              className="flex flex-col gap-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {s.label}{" "}
                  {!s.enabled && (
                    <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                      изключено
                    </span>
                  )}
                </p>
                <p className="break-all text-xs text-[var(--color-text-tertiary)]">{s.csv_url}</p>
                {s.last_sync_error && (
                  <p className="mt-1 text-xs text-red-300">⚠ {s.last_sync_error}</p>
                )}
              </div>
              <div className="shrink-0 text-right text-xs text-[var(--color-text-secondary)]">
                {s.last_synced_at ? (
                  <>
                    <div>{format(new Date(s.last_synced_at), "d MMM HH:mm", { locale: bg })}</div>
                    <div className="text-[var(--color-text-tertiary)]">
                      +{s.last_sync_count} нови
                    </div>
                  </>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">никога</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-[var(--color-border-default)] pt-6">
          <LeadSourcesForm />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-bold">
          Последни 200 лийда
        </h2>
        <div className="glass overflow-hidden rounded-xl">
          <ul className="divide-y divide-[var(--color-border-default)]">
            {leadRows.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{l.full_name ?? "—"}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {l.email ?? "—"}
                    {l.phone && (
                      <>
                        {" · "}
                        <span className="font-mono">{l.phone}</span>
                      </>
                    )}
                  </p>
                  {(l.form_name || l.campaign_name) && (
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {l.form_name ?? l.campaign_name}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-[var(--color-text-secondary)]">
                  {format(new Date(l.created_time ?? l.imported_at), "d MMM yyyy, HH:mm", { locale: bg })}
                </div>
              </li>
            ))}
            {leadRows.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                {`Все още няма лийдове. Добави източник и натисни „Синхронизирай сега".`}
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
