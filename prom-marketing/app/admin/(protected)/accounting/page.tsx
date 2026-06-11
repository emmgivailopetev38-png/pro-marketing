import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import type { InvoiceRow, PaymentRow } from "@/lib/crm/types";
import { KpiCard } from "@/components/admin/KpiCard";
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL, EXPENSE_CATEGORY_LABEL, formatMoney, formatDate } from "@/lib/crm/labels";
import {
  computeAccountingMetrics,
  resolvePeriod,
  type InvoiceLike,
  type PaymentLike,
  type ExpenseLike,
} from "@/lib/crm/accounting-metrics";

export const dynamic = "force-dynamic";

const UNPAID = ["sent", "awaiting_payment", "partially_paid", "overdue"];
const MONTHS_BG = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];

// Период-превключвателят е чисто server-side: всеки таб е линк с ?period=…,
// без client JS. resolvePeriod + computeAccountingMetrics вършат сметките.
const PERIOD_TABS: Array<{ key: string; label: string }> = [
  { key: "month", label: "Месец" },
  { key: "last_month", label: "Минал месец" },
  { key: "quarter", label: "Тримесечие" },
  { key: "ytd", label: "YTD" },
  { key: "all", label: "Всичко" },
];

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const sb = createServiceClient();
  const now = new Date();

  const monthOf = (iso: string | null | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear() * 12 + d.getMonth();
  };
  const curMonth = now.getFullYear() * 12 + now.getMonth();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const inYtd = (iso: string | null | undefined) => !!iso && new Date(iso) >= startOfYear && new Date(iso) <= now;

  const [{ data: inv }, { data: pay }, { data: rec }, { data: review }, { data: exp }] = await Promise.all([
    sb.from("invoices").select("*").order("issue_date", { ascending: false }),
    sb.from("payments").select("*").order("paid_at", { ascending: false }),
    sb.from("recurring_services").select("service_type, active, excluded_from_auto_send, amount, currency, billing_period"),
    sb.from("manual_review_items").select("id, status").in("status", ["open", "needs_user", "blocked"]),
    // Звезда — нужни са vat_amount, amount_net, category, is_personal за коректните ДДС/лични сметки.
    sb.from("expenses").select("*"),
  ]);

  const invoices = (inv ?? []) as InvoiceRow[];
  const payments = (pay ?? []) as PaymentRow[];
  const recurring = (rec ?? []) as Array<{ service_type: string; active: boolean; excluded_from_auto_send: boolean; amount: number | null; currency: string | null; billing_period: string | null }>;

  // ── Единственият източник на агрегатна логика: lib/crm/accounting-metrics ──
  const period = resolvePeriod({ period: params.period, from: params.from, to: params.to, now });
  const m = computeAccountingMetrics({
    invoices: invoices as unknown as InvoiceLike[],
    payments: payments as unknown as PaymentLike[],
    expenses: (exp ?? []) as unknown as ExpenseLike[],
    period,
    now,
  });

  // Линк-хелпър за таб — пази евентуален custom range извън пресетите.
  const periodHref = (key: string) => `?period=${key}`;
  const activeKey = period.key === "range" ? "" : period.key;
  const fmtMoneyShort = (v: number) => formatMoney(v);
  const vatHint = `изх. ${fmtMoneyShort(m.vat_output)} − вх. ${fmtMoneyShort(m.vat_input)}`;

  // ── Year-to-date paid trend — една лента на месец (отделно от периода) ──
  const sumPaymentsMonth = (mm: number) =>
    payments
      .filter((p) => p.match_status !== "ignored" && monthOf(p.paid_at ?? p.created_at) === mm)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const trend = Array.from({ length: now.getMonth() + 1 }, (_, idx) => {
    const mm = now.getFullYear() * 12 + idx;
    return { m: mm, value: sumPaymentsMonth(mm), label: MONTHS_BG[idx] };
  });
  const trendMax = Math.max(1, ...trend.map((t) => t.value));

  // ── Оперативни сигнали (не са част от метрик-контракта) ──
  const unpaidList = invoices.filter((i) => UNPAID.includes(i.status));
  const overdueList = unpaidList.filter((i) => i.due_date && new Date(i.due_date) < now);
  const awaitingConfirmation = payments.filter((p) => p.match_status === "unmatched").length;
  const ambiguous = payments.filter((p) => p.match_status === "ambiguous").length;

  const ytdInvoices = invoices.filter((i) => inYtd(i.issue_date) && !["draft", "cancelled", "excluded"].includes(i.status));
  const gpsInvoicesYtd = ytdInvoices.filter((i) => i.invoice_type === "gps_fee" || /gps/i.test(i.service_type ?? ""));
  const gpsSent = gpsInvoicesYtd.length;
  const gpsRevenueYtd = gpsInvoicesYtd.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const gpsActive = recurring.filter((r) => r.service_type === "gps" && r.active && !r.excluded_from_auto_send).length;
  const gpsNotSent = Math.max(0, gpsActive - gpsInvoicesYtd.filter((i) => monthOf(i.issue_date) === curMonth).length);

  const accountantDocs = invoices.filter((i) => i.source === "accountant_email" && inYtd(i.created_at)).length;
  const bankStatements = new Set(
    payments.filter((p) => p.bank_statement_file && inYtd(p.created_at)).map((p) => p.bank_statement_file)
  ).size;
  const manualOpen = (review ?? []).length;

  const attention = overdueList.length + awaitingConfirmation + ambiguous + manualOpen;

  // Бизнес vs лични — за малката разбивка в „Лични покупки".
  const totalSpend = m.business_expenses_gross + m.personal_expenses;
  const personalShare = totalSpend > 0 ? Math.round((m.personal_expenses / totalSpend) * 100) : 0;
  const catMax = Math.max(1, ...m.by_category.map((c) => c.gross));

  return (
    <div className="space-y-8 p-6 md:p-10">
      <header className="cc-panel cc-panel-accent overflow-hidden p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Счетоводство</p>
            <h1 className="cc-title mt-2 font-display text-4xl font-bold">Счетоводно табло</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Период: <span className="text-[var(--color-text-primary)]">{m.period.label}</span> · всичко в EUR · ДДС 20%
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NavPill href="/admin/invoices" label="🧾 Фактури" />
            <NavPill href="/admin/payments" label="💰 Плащания" />
            <NavPill href="/admin/expenses" label="🧷 Разходи" />
            <NavPill href="/admin/recurring" label="🔁 Абонаменти" />
            <NavPill href="/admin/manual-review" label={`🔍 Проверка · ${manualOpen}`} />
          </div>
        </div>

        {/* Период-превключвател — server-side линкове, без client JS */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {PERIOD_TABS.map((t) => {
            const active = t.key === activeKey;
            return (
              <Link
                key={t.key}
                href={periodHref(t.key)}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-lg border border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-accent-cyan)]"
                    : "rounded-lg border border-[var(--color-border-default)] bg-white/[0.02] px-3.5 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent-cyan)]/40 hover:text-[var(--color-text-primary)]"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Requires attention */}
      {attention > 0 && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
          <h2 className="mb-3 font-display text-base font-semibold text-amber-200">⚠️ Изисква внимание</h2>
          <div className="flex flex-wrap gap-2">
            {overdueList.length > 0 && (
              <AttentionChip href="/admin/invoices" label={`${overdueList.length} просрочени фактури`} />
            )}
            {awaitingConfirmation > 0 && (
              <AttentionChip href="/admin/payments" label={`${awaitingConfirmation} незасечени плащания`} />
            )}
            {ambiguous > 0 && <AttentionChip href="/admin/manual-review" label={`${ambiguous} неясни плащания`} />}
            {manualOpen > 0 && <AttentionChip href="/admin/manual-review" label={`${manualOpen} за ръчна проверка`} />}
          </div>
        </section>
      )}

      {/* Парични KPI-та за избрания период */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          Пари · {m.period.label}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <KpiCard
            label="Приход (начислен)"
            value={formatMoney(m.revenue_accrued)}
            hint={`без ДДС ${formatMoney(m.revenue_net)} · ${m.counts.invoices} фактури`}
            color="#facc15"
          />
          <KpiCard
            label="Получени плащания"
            value={formatMoney(m.payments_received)}
            hint={`${m.counts.payments} плащания · касова база`}
            color="#22c55e"
            href="/admin/payments"
          />
          <KpiCard
            label="Бизнес разходи"
            value={formatMoney(m.business_expenses_gross)}
            hint={`без ДДС ${formatMoney(m.business_expenses_net)} · ${m.counts.expenses} бр.`}
            color="#fb923c"
            href="/admin/expenses"
          />
          <KpiCard
            label="ДДС за внасяне"
            value={formatMoney(m.vat_due)}
            hint={vatHint}
            color={m.vat_due > 0 ? "#ef4444" : "#22c55e"}
          />
          <KpiCard
            label="Печалба (касова) / марж"
            value={formatMoney(m.profit_cash)}
            hint={`${m.margin_cash_pct.toFixed(0)}% марж · плащания − бизнес разходи`}
            color={m.profit_cash >= 0 ? "#22c55e" : "#ef4444"}
          />
          <KpiCard
            label="Печалба (начислена)"
            value={formatMoney(m.profit_accrued)}
            hint="начислен приход − бизнес разходи"
            color={m.profit_accrued >= 0 ? "#34d399" : "#ef4444"}
          />
          <KpiCard
            label="Печалба без ДДС"
            value={formatMoney(m.profit_net)}
            hint="нето база (без ДДС)"
            color={m.profit_net >= 0 ? "#2dd4bf" : "#ef4444"}
          />
          <KpiCard
            label="Лични покупки"
            value={formatMoney(m.personal_expenses)}
            hint={`${m.counts.personal_count} тегления · извън печалбата`}
            color="#a78bfa"
            href="/admin/expenses?view=personal"
          />
        </div>
      </section>

      {/* Оперативни KPI-та (състояние, не пари за периода) */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          Оперативно · сега / YTD
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Неплатени" value={formatMoney(m.unpaid.gross_total)} hint={`${m.unpaid.count} фактури`} color="#fb923c" href="/admin/invoices" />
          <KpiCard label="Просрочени" value={m.unpaid.overdue_count} hint="минал падеж" color={m.unpaid.overdue_count > 0 ? "#ef4444" : "#22c55e"} href="/admin/invoices" />
          <KpiCard label="Чакат потвърждение" value={awaitingConfirmation} hint="незасечени плащания" color="#7da8cc" href="/admin/payments" />
          <KpiCard label="Неясни плащания" value={ambiguous} hint="за ръчна проверка" color={ambiguous > 0 ? "#fb923c" : "#22c55e"} href="/admin/manual-review" />
          <KpiCard label="GPS фактури YTD" value={gpsSent} hint={formatMoney(gpsRevenueYtd)} color="#06b6d4" href="/admin/gps" />
          <KpiCard label="GPS неизпратени" value={gpsNotSent} hint="активни абонаменти този месец" color={gpsNotSent > 0 ? "#facc15" : "#22c55e"} href="/admin/recurring" />
          <KpiCard label="Док. от счетоводител" value={accountantDocs} hint="получени YTD" color="#a78bfa" />
          <KpiCard label="Банкови извлечения" value={bankStatements} hint="обработени YTD" color="#a78bfa" />
          <KpiCard label="Ръчна проверка" value={manualOpen} hint="отворени" color={manualOpen > 0 ? "#ef4444" : "#22c55e"} href="/admin/manual-review" />
        </div>
      </section>

      {/* Лични покупки — изрично отделени от бизнеса */}
      <section className="cc-panel p-5" style={{ ["--cc" as string]: "#a78bfa" }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">💼 Лични покупки (тегления на собственика)</h3>
          <Link href="/admin/expenses?view=personal" className="text-xs text-[var(--color-accent-cyan)] hover:underline">
            всички →
          </Link>
        </div>
        <p className="mb-4 max-w-3xl text-sm text-[var(--color-text-secondary)]">
          Това са покупки, платени през фирмата, но за лична употреба. Те <b className="text-violet-300">НЕ са бизнес разход</b>:
          не намаляват печалбата/маржа и не дават приспадаемо ДДС. Водят се отделно само за прозрачност на касата.
        </p>
        <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-center">
          <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.07] p-4">
            <p className="hud text-violet-300/80">Лични тегления · {m.period.label}</p>
            <p className="cc-kpi-value mt-2 font-mono text-3xl font-bold tabular-nums" style={{ ["--kpi" as string]: "#a78bfa" }}>
              {formatMoney(m.personal_expenses)}
            </p>
            <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{m.counts.personal_count} покупки</p>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>Бизнес разходи</span>
              <span>Лични</span>
            </div>
            <div className="flex h-5 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full bg-orange-500/70"
                style={{ width: `${100 - personalShare}%` }}
                title={`Бизнес ${formatMoney(m.business_expenses_gross)}`}
              />
              <div
                className="h-full bg-violet-500/70"
                style={{ width: `${personalShare}%` }}
                title={`Лични ${formatMoney(m.personal_expenses)}`}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[var(--color-text-secondary)]">
              <span>🟧 {formatMoney(m.business_expenses_gross)} ({100 - personalShare}%)</span>
              <span>🟪 {formatMoney(m.personal_expenses)} ({personalShare}%)</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Разходи по категории */}
        <section className="cc-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">🧮 Разходи по категории</h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">само бизнес</span>
          </div>
          {m.by_category.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Няма бизнес разходи в периода.</p>
          ) : (
            <div className="space-y-2.5">
              {m.by_category.map((c) => (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-[var(--color-text-secondary)]" title={EXPENSE_CATEGORY_LABEL[c.category] ?? c.category}>
                    {EXPENSE_CATEGORY_LABEL[c.category] ?? c.category}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-black/30">
                    <div
                      className="h-full rounded bg-orange-500/70"
                      style={{ width: `${Math.max(2, Math.round((c.gross / catMax) * 100))}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-mono text-[10px] text-[var(--color-text-tertiary)]">{c.share_pct.toFixed(0)}%</span>
                  <span className="w-24 text-right font-mono text-[11px] text-[var(--color-text-secondary)]">{formatMoney(c.gross)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Revenue trend */}
        <section className="cc-panel p-5">
          <h3 className="mb-4 font-display text-base font-semibold">📈 Плащания · от януари до сега</h3>
          <div className="space-y-2">
            {trend.map((t) => (
              <div key={t.m} className="flex items-center gap-3">
                <span className="w-8 font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">{t.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-black/30">
                  <div
                    className="h-full rounded bg-emerald-500/70"
                    style={{ width: `${Math.round((t.value / trendMax) * 100)}%` }}
                  />
                </div>
                <span className="w-24 text-right font-mono text-[11px] text-[var(--color-text-secondary)]">
                  {formatMoney(t.value)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Unpaid invoices */}
      <section className="cc-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">⏳ Неплатени фактури</h3>
          <Link href="/admin/invoices" className="text-xs text-[var(--color-accent-cyan)] hover:underline">
            всички →
          </Link>
        </div>
        {unpaidList.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">Няма неплатени фактури. 🎉</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {unpaidList.slice(0, 8).map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  {i.contact_id ? (
                    <Link href={`/admin/clients/${i.contact_id}`} className="text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">
                      {i.client_name || i.client_email || "—"}
                    </Link>
                  ) : (
                    <span className="text-amber-300/80">{i.client_name || i.client_email || "— без контакт"}</span>
                  )}
                  <span className="ml-2 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    {i.invoice_number || "(без номер)"} · падеж {formatDate(i.due_date)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(i.amount_gross, i.currency)}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: `${INVOICE_STATUS_COLOR[i.status]}22`, color: INVOICE_STATUS_COLOR[i.status] }}
                  >
                    {INVOICE_STATUS_LABEL[i.status] ?? i.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* How it works */}
      <section className="cc-panel p-5">
        <h3 className="mb-3 font-display text-base font-semibold">🤖 Как работи (Hermes + ти)</h3>
        <ul className="grid gap-2 text-sm text-[var(--color-text-secondary)] md:grid-cols-2">
          <li>• Hermes чете Gmail на всеки 15 мин и пълни фактури/плащания тук автоматично.</li>
          <li>{'• Фактура се маркира „платена" само при ≥2 сигнала — иначе идва в „Ръчна проверка".'}</li>
          <li>• Приходът „начислен" е по дата на издаване; „касов" е по реално получените плащания.</li>
          <li>{'• ДДС за внасяне = изходящо (от фактури) − входящо (само от бизнес разходи). Личните покупки НЕ дават приспадане.'}</li>
          <li>• Банковите извлечения отиват към счетоводителя; GPS фактурите се изпращат само след одобрение.</li>
          <li>• Всичко е вързано към контакт и се вижда в неговия профил.</li>
        </ul>
      </section>
    </div>
  );
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="cc-btn">
      {label}
    </Link>
  );
}

function AttentionChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-amber-500/20"
    >
      {label} →
    </Link>
  );
}
