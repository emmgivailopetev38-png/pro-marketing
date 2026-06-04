"use client";
import Link from "next/link";
import type { ManualReviewRow, ManualReviewStatus } from "@/lib/crm/types";
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
} from "@/app/admin/(protected)/manual-review/actions";

export interface ReviewItem extends ManualReviewRow {
  contact_name?: string | null;
  invoice_number?: string | null;
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
        </div>
      ))}
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
