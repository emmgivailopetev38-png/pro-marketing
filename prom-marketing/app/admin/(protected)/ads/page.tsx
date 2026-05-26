import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

interface CampaignSnapshot {
  id: string;
  ad_account_id: string;
  ad_account_name: string | null;
  campaign_id: string;
  campaign_name: string | null;
  objective: string | null;
  status: string | null;
  effective_status: string | null;
  start_time: string | null;
  amount_spent: string | null;
  amount_spent_cents: number | null;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  ctr_pct: number | null;
  cpm_usd: number | null;
  cpl_usd: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  currency: string | null;
  synced_at: string;
}

export default async function MetaAdsPage() {
  const supabase = createServiceClient();
  const { data: rows } = await supabase
    .from("meta_campaigns_snapshot")
    .select("*")
    .order("leads", { ascending: false });

  const campaigns = (rows ?? []) as CampaignSnapshot[];

  // Aggregate totals
  const totals = campaigns.reduce(
    (acc, c) => ({
      spent: acc.spent + (c.amount_spent_cents ?? 0),
      impressions: acc.impressions + (c.impressions ?? 0),
      reach: acc.reach + (c.reach ?? 0),
      clicks: acc.clicks + (c.clicks ?? 0),
      leads: acc.leads + (c.leads ?? 0),
    }),
    { spent: 0, impressions: 0, reach: 0, clicks: 0, leads: 0 }
  );

  const avgCPL = totals.leads > 0 ? (totals.spent / 100) / totals.leads : 0;
  const avgCTR = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const active = campaigns.filter((c) => c.effective_status === "ACTIVE");
  const paused = campaigns.filter((c) => c.effective_status === "PAUSED");
  const lastSync = campaigns[0]?.synced_at;

  return (
    <div className="p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            Meta Ads · в реално време
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-editorial)] text-3xl font-bold md:text-4xl">
            Кампании
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Live performance на всички активни и паузирани кампании
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Последен sync
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {lastSync
              ? new Date(lastSync).toLocaleString("bg-BG", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </p>
        </div>
      </header>

      {/* Top stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Активни кампании" value={`${active.length}`} hint={`+ ${paused.length} паузирани`} color="#22c55e" />
        <StatCard
          label="Общо лидове"
          value={totals.leads.toLocaleString("bg-BG")}
          hint={`${totals.clicks.toLocaleString("bg-BG")} кликове`}
          color="#facc15"
        />
        <StatCard
          label="Похарчени"
          value={`$${(totals.spent / 100).toFixed(2)}`}
          hint={`${totals.impressions.toLocaleString("bg-BG")} импресии`}
          color="#06b6d4"
        />
        <StatCard
          label="Среден CPL"
          value={`$${avgCPL.toFixed(2)}`}
          hint="на лид"
          color={avgCPL < 5 ? "#22c55e" : avgCPL < 10 ? "#facc15" : "#ef4444"}
        />
        <StatCard
          label="Среден CTR"
          value={`${avgCTR.toFixed(2)}%`}
          hint={`reach ${totals.reach.toLocaleString("bg-BG")}`}
          color="#a78bfa"
        />
      </div>

      {/* Active campaigns */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <span>🟢</span> Активни ({active.length})
        </h2>
        <CampaignTable campaigns={active} />
      </section>

      {/* Paused campaigns */}
      {paused.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <span>⏸️</span> Паузирани ({paused.length})
          </h2>
          <CampaignTable campaigns={paused} />
        </section>
      )}

      {campaigns.length === 0 && (
        <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
          Все още няма синхронизирани кампании. Помоли AI в чата за „sync на Meta кампаниите".
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: "var(--color-border-default)",
        background: "rgba(13,18,33,0.4)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{hint}</p>
    </div>
  );
}

function CampaignTable({ campaigns }: { campaigns: CampaignSnapshot[] }) {
  if (campaigns.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border-default)] p-6 text-center text-xs text-[var(--color-text-tertiary)]">
        Празно.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border-default)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--color-bg-deep)] text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-4 py-3 font-medium">Кампания</th>
            <th className="px-4 py-3 font-medium text-right">Похарчени</th>
            <th className="px-4 py-3 font-medium text-right">Импресии</th>
            <th className="px-4 py-3 font-medium text-right">Reach</th>
            <th className="px-4 py-3 font-medium text-right">Кликове</th>
            <th className="px-4 py-3 font-medium text-right">Лиди</th>
            <th className="px-4 py-3 font-medium text-right">CTR</th>
            <th className="px-4 py-3 font-medium text-right">CPM</th>
            <th className="px-4 py-3 font-medium text-right">CPL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-default)]">
          {campaigns.map((c) => {
            const cplGood = c.cpl_usd != null && c.cpl_usd < 5;
            const cplOk = c.cpl_usd != null && c.cpl_usd < 10;
            return (
              <tr key={c.id} className="hover:bg-[var(--color-bg-deep)]/40">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {c.campaign_name ?? "—"}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)]">
                    {c.start_time
                      ? `Старт: ${new Date(c.start_time).toLocaleDateString("bg-BG", { day: "2-digit", month: "short", year: "numeric" })}`
                      : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                  {c.amount_spent ?? "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                  {(c.impressions ?? 0).toLocaleString("bg-BG")}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                  {(c.reach ?? 0).toLocaleString("bg-BG")}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                  {(c.clicks ?? 0).toLocaleString("bg-BG")}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className="rounded-full px-2 py-1 font-mono text-xs font-bold"
                    style={{
                      background: c.leads > 0 ? "rgba(250,204,21,0.15)" : "transparent",
                      color: c.leads > 0 ? "#facc15" : "var(--color-text-tertiary)",
                    }}
                  >
                    {c.leads ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                  {c.ctr_pct != null ? `${c.ctr_pct.toFixed(2)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-[var(--color-text-secondary)]">
                  {c.cpm_usd != null ? `$${c.cpm_usd.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {c.cpl_usd != null ? (
                    <span
                      className="rounded-full px-2 py-1 font-mono text-xs font-bold"
                      style={{
                        background: cplGood ? "rgba(34,197,94,0.15)" : cplOk ? "rgba(250,204,21,0.15)" : "rgba(239,68,68,0.15)",
                        color: cplGood ? "#22c55e" : cplOk ? "#facc15" : "#ef4444",
                      }}
                    >
                      ${c.cpl_usd.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-tertiary)]">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
