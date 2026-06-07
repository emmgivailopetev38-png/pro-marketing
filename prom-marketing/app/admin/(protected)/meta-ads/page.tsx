import { createServiceClient } from "@/lib/supabase/service";
import type { MetaAdsReportRow } from "@/lib/crm/types";
import { KpiCard } from "@/components/admin/KpiCard";
import { formatMoney, formatDate } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

export default async function MetaAdsPage() {
  const sb = createServiceClient();
  const { data } = await sb
    .from("meta_ads_reports")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(200);
  const allRows = (data ?? []) as MetaAdsReportRow[];
  const rows = allRows.filter((r) => r.raw?.audit_status !== "archived_duplicate");
  const archivedRows = allRows.length - rows.length;

  // "Today" = most recent canonical report_date present. Keep currencies/account owners separate.
  const latestDate = rows[0]?.report_date ?? null;
  const today = rows.filter((r) => r.report_date === latestDate);
  const spendByCurrency = today.reduce((acc, r) => {
    const cur = r.currency || "EUR";
    acc[cur] = (acc[cur] ?? 0) + (Number(r.spend) || 0);
    return acc;
  }, {} as Record<string, number>);
  const spendHint = Object.entries(spendByCurrency).map(([cur, amount]) => formatMoney(amount, cur)).join(" + ") || "—";
  const leads = today.reduce((s, r) => s + (Number(r.leads) || 0), 0);
  const accountLabel = (r: MetaAdsReportRow) => r.raw?.account_owner === "client" ? "клиент" : r.raw?.account_owner === "own" ? "ProMarketing" : "акаунт";

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Реклами</p>
        <h1 className="cc-title mt-2 font-display text-4xl font-bold">Meta реклами</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Сутрешният анализ от Hermes — структуриран тук. {latestDate ? `Последно: ${formatDate(latestDate)}` : ""}
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Hermes чете сутрешния анализ от пощата ти и го праща тук структуриран по отделни Meta акаунти. IVO 1AD и Vanq Biznes/Vanya не се смесват; Vanq е клиентски акаунт от 01.05.2026. {archivedRows > 0 ? `${archivedRows} стари дублиращи справки са архивирани от одита.` : ""}
      </p>

      {/* Meta performance today */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          {latestDate ? `Днес · ${formatDate(latestDate)}` : "Днес"}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Разход" value={spendHint} hint={`${today.length} отделни акаунта`} color="#facc15" />
          <KpiCard label="Лийдове" value={leads} hint="общо, без смесване на валути" color="#06b6d4" />
          <KpiCard label="Акаунти" value={today.length} hint="IVO / клиентски" color="#a78bfa" />
          <KpiCard label="Архивирани дубликати" value={archivedRows} hint="скрити от KPI" color="#64748b" />
        </div>
      </section>

      {/* History */}
      <section className="cc-panel p-5">
        <h3 className="mb-4 font-display text-base font-semibold">📊 История по кампании</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Няма справки още. Hermes ще ги добавя всяка сутрин от анализа в пощата ти.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Дата</th>
                  <th className="px-3 py-2 font-medium">Кампания</th>
                  <th className="px-3 py-2 font-medium text-right">Разход</th>
                  <th className="px-3 py-2 font-medium text-right">Лийдове</th>
                  <th className="px-3 py-2 font-medium text-right">CPL</th>
                  <th className="px-3 py-2 font-medium">Качество / Препоръки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-default)]">
                {rows.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--color-text-tertiary)]">{formatDate(r.report_date)}</td>
                    <td className="px-3 py-2 text-[var(--color-text-primary)]">
                      <div>{r.campaign || "(всички)"}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{accountLabel(r)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">{formatMoney(r.spend, r.currency)}</td>
                    <td className="px-3 py-2 text-right">{r.leads ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{r.cpl != null ? formatMoney(r.cpl, r.currency) : "—"}</td>
                    <td className="px-3 py-2 text-[11px] text-[var(--color-text-secondary)]">
                      {r.quality_notes && <div>🎯 {r.quality_notes}</div>}
                      {r.recommendations && <div className="mt-0.5 text-[var(--color-accent-cyan)]">→ {r.recommendations}</div>}
                      {!r.quality_notes && !r.recommendations && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
