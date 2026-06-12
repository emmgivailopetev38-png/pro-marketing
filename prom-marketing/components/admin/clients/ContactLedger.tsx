"use client";
import { useState } from "react";
import Link from "next/link";
import type {
  InvoiceRow,
  PaymentRow,
  ManualReviewRow,
  OfferRow,
  ProjectRow,
  ProjectTaskRow,
  RecurringServiceRow,
} from "@/lib/crm/types";
import {
  INVOICE_TYPE_LABEL,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_COLOR,
  PAYMENT_MATCH_STATUS_LABEL,
  PAYMENT_MATCH_STATUS_COLOR,
  MANUAL_REVIEW_TYPE_LABEL,
  SEVERITY_COLOR,
  OFFER_STATUS_LABEL,
  OFFER_STATUS_COLOR,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_COLOR,
  RECURRING_SERVICE_TYPE_LABEL,
  formatMoney,
  formatDate,
} from "@/lib/crm/labels";

type Tab = "invoices" | "payments" | "offers" | "projects" | "recurring" | "review";

export function ContactLedger({
  invoices,
  payments,
  reviews,
  offers = [],
  projects = [],
  tasks = [],
  recurring = [],
}: {
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  reviews: ManualReviewRow[];
  offers?: OfferRow[];
  projects?: ProjectRow[];
  tasks?: ProjectTaskRow[];
  recurring?: RecurringServiceRow[];
}) {
  const [tab, setTab] = useState<Tab>("invoices");

  const unpaid = invoices
    .filter((i) => ["sent", "awaiting_payment", "partially_paid", "overdue"].includes(i.status))
    .reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const paidTotal = payments
    .filter((p) => p.match_status !== "ignored")
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const tabs: Array<{ key: Tab; label: string; count: number }> = [
    { key: "invoices", label: "🧾 Фактури", count: invoices.length },
    { key: "payments", label: "💰 Плащания", count: payments.length },
    { key: "offers", label: "📝 Оферти", count: offers.length },
    { key: "projects", label: "🏗 Проекти", count: projects.length },
    { key: "recurring", label: "🔁 Абонаменти", count: recurring.length },
    { key: "review", label: "🔍 Проверка", count: reviews.length },
  ];

  return (
    <section
      className="rounded-lg border border-[var(--color-border-default)] p-5"
      style={{ background: "rgba(13,18,33,0.4)" }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={{
                borderColor: tab === t.key ? "var(--color-accent-cyan)" : "var(--color-border-default)",
                background: tab === t.key ? "rgba(0,212,255,0.10)" : "transparent",
                color: tab === t.key ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
              }}
            >
              {t.label}
              <span className="font-mono text-[10px] opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-[11px] text-[var(--color-text-tertiary)]">
          <span>
            Дължи: <span className="font-medium text-amber-300">{formatMoney(unpaid)}</span>
          </span>
          <span>
            Платил: <span className="font-medium text-emerald-300">{formatMoney(paidTotal)}</span>
          </span>
        </div>
      </div>

      {tab === "invoices" && <InvoicesList rows={invoices} />}
      {tab === "payments" && <PaymentsList rows={payments} />}
      {tab === "offers" && <OffersList rows={offers} />}
      {tab === "projects" && <ProjectsList rows={projects} tasks={tasks} />}
      {tab === "recurring" && <RecurringList rows={recurring} />}
      {tab === "review" && <ReviewList rows={reviews} />}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-dashed border-[var(--color-border-default)] p-6 text-center text-xs text-[var(--color-text-tertiary)]">
      {text}
    </p>
  );
}

function InvoicesList({ rows }: { rows: InvoiceRow[] }) {
  if (rows.length === 0) return <Empty text="Няма фактури за този контакт." />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <span className="font-mono text-xs text-[var(--color-text-primary)]">{r.invoice_number || "(без номер)"}</span>
            <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)]">
              {INVOICE_TYPE_LABEL[r.invoice_type] ?? r.invoice_type} · {formatDate(r.issue_date)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(r.amount_gross, r.currency)}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${INVOICE_STATUS_COLOR[r.status]}22`, color: INVOICE_STATUS_COLOR[r.status] }}
            >
              {INVOICE_STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PaymentsList({ rows }: { rows: PaymentRow[] }) {
  if (rows.length === 0) return <Empty text="Няма регистрирани плащания." />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(r.amount, r.currency)}</span>
            <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)]">
              {formatDate(r.paid_at)}
              {r.counterparty_name ? ` · ${r.counterparty_name}` : ""}
            </span>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: `${PAYMENT_MATCH_STATUS_COLOR[r.match_status]}22`,
              color: PAYMENT_MATCH_STATUS_COLOR[r.match_status],
            }}
          >
            {PAYMENT_MATCH_STATUS_LABEL[r.match_status] ?? r.match_status}
          </span>
        </li>
      ))}
    </ul>
  );
}

function OffersList({ rows }: { rows: OfferRow[] }) {
  if (rows.length === 0) return <Empty text="Няма оферти за този контакт." />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            {r.url ? (
              <a href={r.url} target="_blank" rel="noreferrer" className="text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">
                {r.title} ↗
              </a>
            ) : (
              <span className="text-[var(--color-text-primary)]">{r.title}</span>
            )}
            <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)]">
              {formatDate(r.sent_at ?? r.created_at)}
              {r.valid_until ? ` · валидна до ${formatDate(r.valid_until)}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(r.amount_gross, r.currency)}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `${OFFER_STATUS_COLOR[r.status]}22`, color: OFFER_STATUS_COLOR[r.status] }}
            >
              {OFFER_STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
        </li>
      ))}
      <li className="pt-1 text-right">
        <Link href="/admin/offers" className="text-[11px] text-[var(--color-accent-cyan)] hover:underline">
          всички оферти →
        </Link>
      </li>
    </ul>
  );
}

function ProjectsList({ rows, tasks }: { rows: ProjectRow[]; tasks: ProjectTaskRow[] }) {
  if (rows.length === 0) return <Empty text="Няма проекти за този контакт." />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const pt = tasks.filter((t) => t.project_id === r.id);
        const done = pt.filter((t) => t.status === "done").length;
        return (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <span className="text-[var(--color-text-primary)]">{r.title}</span>
              <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)]">
                {pt.length > 0 ? `задачи ${done}/${pt.length}` : "без задачи"}
                {r.due_date ? ` · срок ${formatDate(r.due_date)}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {r.amount_gross != null && (
                <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(r.amount_gross, r.currency)}</span>
              )}
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: `${PROJECT_STATUS_COLOR[r.status]}22`, color: PROJECT_STATUS_COLOR[r.status] }}
              >
                {PROJECT_STATUS_LABEL[r.status] ?? r.status}
              </span>
            </div>
          </li>
        );
      })}
      <li className="pt-1 text-right">
        <Link href="/admin/projects" className="text-[11px] text-[var(--color-accent-cyan)] hover:underline">
          всички проекти →
        </Link>
      </li>
    </ul>
  );
}

function RecurringList({ rows }: { rows: RecurringServiceRow[] }) {
  if (rows.length === 0) return <Empty text="Няма абонаменти за този контакт." />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <span className="text-[var(--color-text-primary)]">
              {RECURRING_SERVICE_TYPE_LABEL[r.service_type] ?? r.service_type}
            </span>
            <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)]">
              {r.billing_period === "monthly" ? "месечно" : r.billing_period === "yearly" ? "годишно" : "еднократно"}
              {r.billing_day ? ` · ${r.billing_day}-то число` : ""}
              {r.excluded_from_auto_send ? " · авто-фактури: ИЗКЛ" : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(r.amount, r.currency)}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: r.active ? "#22c55e22" : "#9ca3af22",
                color: r.active ? "#22c55e" : "#9ca3af",
              }}
            >
              {r.active ? "Активен" : "Спрян"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReviewList({ rows }: { rows: ManualReviewRow[] }) {
  if (rows.length === 0) return <Empty text="Няма отворени неща за проверка." />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-2 rounded-md border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: SEVERITY_COLOR[r.severity] }} />
            <span className="truncate text-[var(--color-text-primary)]">{r.title}</span>
          </div>
          <span className="flex-shrink-0 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
            {MANUAL_REVIEW_TYPE_LABEL[r.type] ?? r.type}
          </span>
        </li>
      ))}
      <li className="pt-1 text-center">
        <Link href="/admin/manual-review" className="text-[11px] text-[var(--color-accent-cyan)] hover:underline">
          Към ръчната проверка →
        </Link>
      </li>
    </ul>
  );
}
