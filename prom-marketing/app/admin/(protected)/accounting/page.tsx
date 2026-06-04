import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import type { InvoiceRow, PaymentRow } from "@/lib/crm/types";
import { KpiCard } from "@/components/admin/KpiCard";
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL, formatMoney, formatDate } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

const UNPAID = ["sent", "awaiting_payment", "partially_paid", "overdue"];
const MONTHS_BG = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];

export default async function AccountingPage() {
  const sb = createServiceClient();
  const now = new Date();
  const monthOf = (iso: string | null | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.getFullYear() * 12 + d.getMonth();
  };
  const curMonth = now.getFullYear() * 12 + now.getMonth();

  const [{ data: inv }, { data: pay }, { data: rec }, { data: review }, { data: exp }] = await Promise.all([
    sb.from("invoices").select("*").order("issue_date", { ascending: false }),
    sb.from("payments").select("*").order("paid_at", { ascending: false }),
    sb.from("recurring_services").select("service_type, active, excluded_from_auto_send"),
    sb.from("manual_review_items").select("id, status").in("status", ["open", "needs_user", "blocked"]),
    sb.from("expenses").select("amount_gross, status, expense_date"),
  ]);

  const invoices = (inv ?? []) as InvoiceRow[];
  const payments = (pay ?? []) as PaymentRow[];
  const recurring = (rec ?? []) as Array<{ service_type: string; active: boolean; excluded_from_auto_send: boolean }>;
  const expenses = (exp ?? []) as Array<{ amount_gross: number | null; status: string; expense_date: string | null }>;

  // Revenue + payments — this month vs last month.
  const sumInvoices = (m: number) =>
    invoices
      .filter((i) => monthOf(i.issue_date) === m && !["cancelled", "excluded"].includes(i.status))
      .reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const sumPayments = (m: number) =>
    payments
      .filter((p) => p.match_status !== "ignored" && monthOf(p.paid_at ?? p.created_at) === m)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const revenueThis = sumInvoices(curMonth);
  const revenueLast = sumInvoices(curMonth - 1);
  const paidThis = sumPayments(curMonth);
  const paidLast = sumPayments(curMonth - 1);

  const sumExpenses = (m: number) =>
    expenses
      .filter((e) => e.status !== "cancelled" && monthOf(e.expense_date) === m)
      .reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);
  const expensesThis = sumExpenses(curMonth);
  const expensesLast = sumExpenses(curMonth - 1);
  const profitThis = paidThis - expensesThis;
  const marginPct = paidThis > 0 ? Math.round((profitThis / paidThis) * 100) : 0;

  // 6-month paid trend.
  const trend = Array.from({ length: 6 }, (_, idx) => {
    const m = curMonth - (5 - idx);
    return { m, value: sumPayments(m), label: MONTHS_BG[((m % 12) + 12) % 12] };
  });
  const trendMax = Math.max(1, ...trend.map((t) => t.value));

  const unpaidList = invoices.filter((i) => UNPAID.includes(i.status));
  const unpaidTotal = unpaidList.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const overdueList = unpaidList.filter((i) => i.due_date && new Date(i.due_date) < now);

  const awaitingConfirmation = payments.filter((p) => p.match_status === "unmatched").length;
  const ambiguous = payments.filter((p) => p.match_status === "ambiguous").length;

  const gpsSent = invoices.filter((i) => i.invoice_type === "gps_fee" && monthOf(i.issue_date) === curMonth).length;
  const gpsActive = recurring.filter((r) => r.service_type === "gps" && r.active && !r.excluded_from_auto_send).length;
  const gpsNotSent = Math.max(0, gpsActive - gpsSent);

  const accountantDocs = invoices.filter((i) => i.source === "accountant_email" && monthOf(i.created_at) === curMonth).length;
  const bankStatements = new Set(
    payments.filter((p) => p.bank_statement_file && monthOf(p.created_at) === curMonth).map((p) => p.bank_statement_file)
  ).size;
  const manualOpen = (review ?? []).length;

  const attention = overdueList.length + awaitingConfirmation + ambiguous + manualOpen;

  return (
    <div className="space-y-8 p-6 md:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
            ProMarketing · Счетоводство
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold">Счетоводно табло</h1>
          <p className="mt-1 text-sm capitalize text-[var(--color-text-secondary)]">
            {now.toLocaleDateString("bg-BG", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NavPill href="/admin/invoices" label="🧾 Фактури" />
          <NavPill href="/admin/payments" label="💰 Плащания" />
          <NavPill href="/admin/recurring" label="🔁 Абонаменти" />
          <NavPill href="/admin/manual-review" label={`🔍 Проверка · ${manualOpen}`} />
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

      {/* KPIs */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          Този месец
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Очакван приход" value={formatMoney(revenueThis)} hint={`минал месец ${formatMoney(revenueLast)}`} color="#facc15" />
          <KpiCard label="Получени плащания" value={formatMoney(paidThis)} hint={`минал месец ${formatMoney(paidLast)}`} color="#22c55e" />
          <KpiCard label="Разходи" value={formatMoney(expensesThis)} hint={`минал месец ${formatMoney(expensesLast)}`} color="#fb923c" href="/admin/expenses" />
          <KpiCard label="Печалба / марж" value={formatMoney(profitThis)} hint={`${marginPct}% марж`} color={profitThis >= 0 ? "#22c55e" : "#ef4444"} />
          <KpiCard label="Неплатени" value={formatMoney(unpaidTotal)} hint={`${unpaidList.length} фактури`} color="#fb923c" href="/admin/invoices" />
          <KpiCard label="Просрочени" value={overdueList.length} hint="минал падеж" color={overdueList.length > 0 ? "#ef4444" : "#22c55e"} href="/admin/invoices" />
          <KpiCard label="Чакат потвърждение" value={awaitingConfirmation} hint="незасечени плащания" color="#7da8cc" href="/admin/payments" />
          <KpiCard label="Неясни плащания" value={ambiguous} hint="за ръчна проверка" color={ambiguous > 0 ? "#fb923c" : "#22c55e"} href="/admin/manual-review" />
          <KpiCard label="GPS изпратени" value={gpsSent} hint="този месец" color="#06b6d4" href="/admin/recurring" />
          <KpiCard label="GPS неизпратени" value={gpsNotSent} hint="активни абонаменти" color={gpsNotSent > 0 ? "#facc15" : "#22c55e"} href="/admin/recurring" />
          <KpiCard label="Док. от счетоводител" value={accountantDocs} hint="получени" color="#a78bfa" />
          <KpiCard label="Банкови извлечения" value={bankStatements} hint="обработени" color="#a78bfa" />
          <KpiCard label="Ръчна проверка" value={manualOpen} hint="отворени" color={manualOpen > 0 ? "#ef4444" : "#22c55e"} href="/admin/manual-review" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue trend */}
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5">
          <h3 className="mb-4 font-display text-base font-semibold">📈 Плащания · 6 месеца</h3>
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

        {/* Unpaid invoices */}
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">⏳ Неплатени фактури</h3>
            <Link href="/admin/invoices" className="text-xs text-[var(--color-accent-cyan)] hover:underline">
              всички →
            </Link>
          </div>
          {unpaidList.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">Няма неплатени фактури. 🎉</p>
          ) : (
            <ul className="space-y-2">
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
      </div>

      {/* How it works */}
      <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5">
        <h3 className="mb-3 font-display text-base font-semibold">🤖 Как работи (Hermes + ти)</h3>
        <ul className="grid gap-2 text-sm text-[var(--color-text-secondary)] md:grid-cols-2">
          <li>• Hermes чете Gmail на всеки 15 мин и пълни фактури/плащания тук автоматично.</li>
          <li>{'• Фактура се маркира „платена" само при ≥2 сигнала — иначе идва в „Ръчна проверка".'}</li>
          <li>• Ти добавяш ръчно фактура/плащане от съответната страница, когато трябва.</li>
          <li>• Банковите извлечения отиват към счетоводителя; GPS фактурите — към клиентите.</li>
          <li>{'• Приключени клиенти (Borima Trans) → „Авто-фактури: ИЗКЛ" в Абонаменти.'}</li>
          <li>• Всичко е вързано към контакт и се вижда в неговия профил.</li>
        </ul>
      </section>
    </div>
  );
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent-cyan)]/60"
    >
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
