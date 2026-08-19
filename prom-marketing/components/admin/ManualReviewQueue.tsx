"use client";
import { useState } from "react";
import Link from "next/link";
import type { ManualReviewRow, ManualReviewStatus, AgentRuleScope } from "@/lib/crm/types";
import {
  MANUAL_REVIEW_TYPE_LABEL,
  SEVERITY_COLOR,
  MANUAL_REVIEW_STATUS_LABEL,
  MANUAL_REVIEW_STATUS_COLOR,
} from "@/lib/crm/labels";
import {
  resolveManualReview,
  matchToContactByEmail,
  createFollowupFromItem,
  teachAndResolveAction,
} from "@/app/admin/(protected)/manual-review/actions";

export interface ReviewItem extends ManualReviewRow {
  contact_name?: string | null;
  invoice_number?: string | null;
}

const SCOPE_LABEL: Record<AgentRuleScope, string> = {
  postalion: "Пощальон",
  accountant: "Счетоводител",
  sales: "Продавач",
  ads: "Рекламен",
  auditor: "Одитор",
  all: "Всички",
  voice: "Глас",
};

/**
 * Препоръка по тип на проверката: какъв урок да получи кой работник.
 * Това е „препоръката с бутон" — отваря готова форма, която Ивайло потвърждава.
 */
type Suggestion = { scope: AgentRuleScope; title: string; lesson: string; cta: string };
function suggestFor(type: string): Suggestion {
  switch (type) {
    case "email_parse_error":
      return { scope: "postalion", title: "Спам/промо имейл", cta: "💡 Научи: това е спам → IGNORE",
        lesson: "Имейли от този подател/тема са спам или промо — IGNORE, не създавай лийд и не ескалирай." };
    case "ambiguous_pdf":
      return { scope: "accountant", title: "Неясен документ", cta: "💡 Научи: това не е фактура",
        lesson: "Документ като този не е фактура (напр. shipping/нотификация) — не записвай разход; ескалирай само при реална сума + доставчик." };
    case "missing_contact":
      return { scope: "postalion", title: "Липсващ контакт", cta: "💡 Научи: създай контакт",
        lesson: "За подател като този създавай контакт автоматично и записвай активност, вместо да ескалираш." };
    case "duplicate_invoice":
      return { scope: "accountant", title: "Дублирана фактура", cta: "💡 Научи: анулирай дубликата",
        lesson: "Фактура с дублиран номер/сума/клиент — не добавяй втора; анулирай дубликата (PATCH status=cancelled)." };
    case "payment_match":
    case "invoice_match":
      return { scope: "accountant", title: "Правило за засичане", cta: "💡 Научи: как се засича",
        lesson: "Плащане/фактура като това се свързва по: <впиши признака> (помни правилото за ≥2 сигнала)." };
    case "bank_statement_error":
      return { scope: "accountant", title: "Парс на извлечение", cta: "💡 Научи: как се чете",
        lesson: "Банково извлечение като това се парсва така: <впиши как се чете точно>." };
    case "recurring_billing_issue":
      return { scope: "accountant", title: "Правило за абонамент", cta: "💡 Научи: как се таксува",
        lesson: "Абонамент като този се таксува така: <впиши кога/колко/на кого>." };
    default:
      return { scope: "all", title: "Урок от ръчна проверка", cta: "🎓 Научи Хермес", lesson: "" };
  }
}

function relative(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `преди ${Math.max(1, Math.round(diff / 60))} мин`;
  if (diff < 86400) return `преди ${Math.round(diff / 3600)} ч`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" });
}

export function ManualReviewQueue({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-10 text-center text-sm text-[var(--color-text-tertiary)]">
        ✅ Няма отворени неща за ръчна проверка.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <div
          key={it.id}
          className="rounded-xl border border-[var(--color-border-default)] p-4"
          style={{ background: "rgba(13,18,33,0.4)" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: SEVERITY_COLOR[it.severity] }}
                  title={`Сериозност: ${it.severity}`}
                />
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {MANUAL_REVIEW_TYPE_LABEL[it.type] ?? it.type}
                </span>
                {it.status !== "open" && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${MANUAL_REVIEW_STATUS_COLOR[it.status] ?? "#64748b"}22`,
                      color: MANUAL_REVIEW_STATUS_COLOR[it.status] ?? "#64748b",
                    }}
                  >
                    {MANUAL_REVIEW_STATUS_LABEL[it.status] ?? it.status}
                  </span>
                )}
                <span className="font-medium text-[var(--color-text-primary)]">{it.title}</span>
              </div>
              {it.description && (
                <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">{it.description}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-[var(--color-text-tertiary)]">
                {it.contact_name && it.related_contact_id && (
                  <Link href={`/admin/clients/${it.related_contact_id}`} className="hover:text-[var(--color-accent-cyan)]">
                    👤 {it.contact_name}
                  </Link>
                )}
                {it.invoice_number && <span>🧾 {it.invoice_number}</span>}
                <span>{relative(it.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
            {!it.related_contact_id && (
              <form action={matchToContactByEmail} className="inline-flex items-center gap-1">
                <input type="hidden" name="item_id" value={it.id} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="имейл на контакт"
                  className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60"
                />
                <button
                  type="submit"
                  className="rounded-md border border-cyan-500/40 px-2.5 py-1 text-xs text-cyan-300 transition-colors hover:bg-cyan-500/10"
                >
                  🔗 Свържи
                </button>
              </form>
            )}
            {it.related_contact_id && (
              <ActionButton itemId={it.id} action={createFollowupFromItem} className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10">
                📞 Създай follow-up
              </ActionButton>
            )}
            {it.status !== "needs_user" && (
              <ResolveButton itemId={it.id} status="needs_user" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">
                ⏳ Чакам Ивайло
              </ResolveButton>
            )}
            {it.status !== "blocked" && (
              <ResolveButton itemId={it.id} status="blocked" className="border-red-500/40 text-red-300 hover:bg-red-500/10">
                ⛔ Блокирай
              </ResolveButton>
            )}
            <ResolveButton itemId={it.id} status="resolved" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">
              ✓ Решено
            </ResolveButton>
            <ResolveButton itemId={it.id} status="ignored" className="ml-auto border-white/10 text-[var(--color-text-tertiary)] hover:bg-white/5">
              ✕ Игнорирай
            </ResolveButton>
          </div>

          {/* Учебен цикъл: препоръка по тип + „Научи Хермес" */}
          <TeachSection item={it} />
        </div>
      ))}
    </div>
  );
}

function TeachSection({ item }: { item: ReviewItem }) {
  const sug = suggestFor(item.type);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2.5 border-t border-white/5 pt-2.5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/[0.06] px-2.5 py-1 text-xs font-medium text-amber-200 transition hover:bg-amber-500/15"
          title="Реши проверката и остави урок, който работникът чете всеки цикъл"
        >
          {sug.cta}
        </button>
      ) : (
        <form action={teachAndResolveAction} className="rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-3">
          <input type="hidden" name="item_id" value={item.id} />
          <input type="hidden" name="status" value="resolved" />
          <p className="mb-2 text-[11px] text-amber-200/90">
            🎓 Урокът се записва като правило и работникът го прилага от следващия цикъл — повече няма да пита за това.
          </p>
          <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Кой работник</span>
              <select name="scope" defaultValue={sug.scope} className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60">
                {(Object.keys(SCOPE_LABEL) as AgentRuleScope[]).map((s) => (
                  <option key={s} value={s}>{SCOPE_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Заглавие на урока</span>
              <input name="title" defaultValue={sug.title} className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Шаблон/тригер (по желание — подател, ключова дума)</span>
              <input name="trigger_pattern" placeholder="напр. @insights.veed.io" className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Урок (какво да прави работникът)</span>
              <textarea name="lesson" required rows={2} defaultValue={sug.lesson} className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60" />
            </label>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button type="submit" className="rounded-md border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/25">
              🎓 Научи + реши
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
              Отказ
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ResolveButton({
  itemId,
  status,
  className,
  children,
}: {
  itemId: string;
  status: ManualReviewStatus;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={resolveManualReview} className="inline">
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors ${className ?? ""}`}>
        {children}
      </button>
    </form>
  );
}

function ActionButton({
  itemId,
  action,
  className,
  children,
}: {
  itemId: string;
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="item_id" value={itemId} />
      <button type="submit" className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors ${className ?? ""}`}>
        {children}
      </button>
    </form>
  );
}
