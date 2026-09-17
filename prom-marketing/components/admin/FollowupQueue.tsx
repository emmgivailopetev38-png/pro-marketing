"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  STAGE_COLOR,
  STAGE_LABEL,
  FOLLOWUP_STATUS_COLOR,
  FOLLOWUP_STATUS_LABEL,
  ACTIVITY_LABEL,
  type ContactRow,
} from "@/lib/contacts/types";
import type { FollowupState } from "@/lib/contacts/followup";
import { REMIND_PRESETS, moodOf, type DnevnikEntry, type PromiseRow } from "@/lib/contacts/dnevnik";
import { fmtSofia } from "@/lib/team/time";
import { followupQuickAction } from "@/app/admin/(protected)/follow-up/actions";
import { ContactPhoto } from "./clients/ContactPhoto";
import { DnevnikEntryView } from "./clients/DnevnikEntryView";
import { DnevnikForm } from "./clients/DnevnikForm";
import { PromisesList } from "./clients/PromisesList";

export interface FollowupRow extends ContactRow {
  last_sent_type: string | null;
  last_sent_at: string | null;
  last_attempt_at: string | null;
  /** къде стои обещаното обаждане — по правилата в lib/contacts/followup.ts */
  state: FollowupState;
  photo_src: string | null;
  last_dnevnik: { at: string; entry: DnevnikEntry } | null;
  dnevnik_count: number;
  open_promises: PromiseRow[];
}

// Pipeline priority: negotiating → offer_sent → presentation_sent → contacted → rest.
const STAGE_PRIORITY: Record<string, number> = {
  negotiating: 0,
  offer_sent: 1,
  presentation_sent: 2,
  discovery: 3,
  contacted: 4,
  lead: 5,
  won: 6,
  lost: 7,
};

const STATE_PRIORITY: Record<FollowupState, number> = { overdue: 0, due_today: 1, future: 2, none: 3, fulfilled: 4 };

function isSentNotHeard(r: FollowupRow): boolean {
  if (!r.last_sent_at) return false;
  if (!r.last_heard_from_at) return true;
  return new Date(r.last_heard_from_at) < new Date(r.last_sent_at);
}

function relative(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `преди ${Math.max(1, Math.round(diff / 60))} мин`;
  if (diff < 86400) return `преди ${Math.round(diff / 3600)} ч`;
  if (diff < 7 * 86400) return `преди ${Math.round(diff / 86400)} дни`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: "Europe/Sofia" });
}

function daysOverdue(iso: string): number {
  return Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function isHot(r: FollowupRow): boolean {
  const s = moodOf(r.mood)?.score ?? 0;
  return s >= 4;
}

type FilterKey = "all" | "overdue" | "today" | "sent_not_heard" | "needs_call" | "promises" | "hot" | "ready";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Всички" },
  { key: "overdue", label: "Просрочени" },
  { key: "today", label: "За днес" },
  { key: "needs_call", label: "Да се чуят" },
  { key: "promises", label: "С обещания" },
  { key: "hot", label: "🔥 Запалени" },
  { key: "sent_not_heard", label: "Изпратено, но не чуто" },
  { key: "ready", label: "Готови за затваряне" },
];

function matches(r: FollowupRow, f: FilterKey): boolean {
  switch (f) {
    case "overdue":
      return r.state === "overdue";
    case "today":
      return r.state === "due_today";
    case "sent_not_heard":
      return isSentNotHeard(r);
    case "needs_call":
      return r.followup_status === "needs_call" || r.state === "overdue" || r.state === "due_today";
    case "promises":
      return r.open_promises.length > 0;
    case "hot":
      return isHot(r);
    case "ready":
      return r.followup_status === "ready_to_close";
    default:
      return true;
  }
}

export function FollowupQueue({ rows, nowIso }: { rows: FollowupRow[]; nowIso: string }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    const out = {} as Record<FilterKey, number>;
    for (const f of FILTERS) out[f.key] = rows.filter((r) => matches(r, f.key)).length;
    return out;
  }, [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => matches(r, filter)).filter((r) => {
      if (!needle) return true;
      return [r.full_name, r.company, r.email, r.phone, r.business].some((v) => (v ?? "").toLowerCase().includes(needle));
    });
    return list.sort((a, b) => {
      const as = STATE_PRIORITY[a.state];
      const bs = STATE_PRIORITY[b.state];
      if (as !== bs) return as - bs;
      if (a.state === "overdue" && b.state === "overdue") {
        return new Date(a.next_followup_at ?? 0).getTime() - new Date(b.next_followup_at ?? 0).getTime();
      }
      const ap = STAGE_PRIORITY[a.stage] ?? 9;
      const bp = STAGE_PRIORITY[b.stage] ?? 9;
      if (ap !== bp) return ap - bp;
      const aAt = a.last_dnevnik?.at ?? a.last_sent_at ?? a.updated_at;
      const bAt = b.last_dnevnik?.at ?? b.last_sent_at ?? b.updated_at;
      return new Date(bAt).getTime() - new Date(aAt).getTime();
    });
  }, [rows, filter, q]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: filter === f.key ? "var(--color-accent-cyan)" : "var(--color-border-default)",
              background: filter === f.key ? "rgba(0,212,255,0.10)" : "transparent",
              color: filter === f.key ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
            }}
          >
            {f.label}
            <span className="font-mono text-[10px] opacity-70">{counts[f.key]}</span>
          </button>
        ))}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="търси име, фирма, телефон…"
          className="ml-auto w-full rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60 sm:w-64"
        />
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <FollowupCard key={r.id} row={r} nowIso={nowIso} />
        ))}
        {visible.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            Няма контакти за този филтър.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
        Показани: {visible.length} от {rows.length} · подредени: просрочени → за днес → етап на сделката → последен разговор
      </p>
    </div>
  );
}

function StateChip({ r }: { r: FollowupRow }) {
  if (!r.next_followup_at) return null;
  const when = fmtSofia(r.next_followup_at);
  switch (r.state) {
    case "overdue":
      return <span className="font-medium text-red-300">⏰ просрочен от {daysOverdue(r.next_followup_at)} дни · {when}</span>;
    case "due_today":
      return <span className="font-medium text-amber-300">⏰ днес · {when}</span>;
    case "fulfilled":
      return <span className="text-emerald-300">✓ чут след напомнянето</span>;
    default:
      return <span className="text-[var(--color-text-tertiary)]">🔔 да го чуя {when}</span>;
  }
}

function FollowupCard({ row: r, nowIso }: { row: FollowupRow; nowIso: string }) {
  const [writing, setWriting] = useState(false);
  const overdue = r.state === "overdue";
  const mood = moodOf(r.mood);
  return (
    <div
      className="rounded-xl border p-4 transition-colors"
      style={{
        borderColor: overdue ? "rgba(239,68,68,0.4)" : r.state === "due_today" ? "rgba(251,191,36,0.4)" : "var(--color-border-default)",
        background: overdue ? "rgba(239,68,68,0.05)" : "rgba(13,18,33,0.4)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ContactPhoto contactId={r.id} name={r.full_name} src={r.photo_src} mood={r.mood} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/admin/clients/${r.id}`}
                className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-cyan)]"
              >
                {r.full_name || r.email || "—"}
              </Link>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: `${STAGE_COLOR[r.stage]}22`, color: STAGE_COLOR[r.stage] }}
              >
                {STAGE_LABEL[r.stage]}
              </span>
              {r.followup_status && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `${FOLLOWUP_STATUS_COLOR[r.followup_status]}22`,
                    color: FOLLOWUP_STATUS_COLOR[r.followup_status],
                  }}
                >
                  {FOLLOWUP_STATUS_LABEL[r.followup_status]}
                </span>
              )}
              {mood && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${mood.color}22`, color: mood.color }}>
                  {mood.emoji} {mood.label}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-[var(--color-text-tertiary)]">
              {r.company && <span>🏢 {r.company}</span>}
              {r.business && <span>🧭 {r.business}</span>}
              {r.phone && <span className="font-mono">{r.phone}</span>}
              {r.email && <span className="font-mono">{r.email}</span>}
              {r.last_heard_from_at && <span>чут {relative(r.last_heard_from_at)}</span>}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px]">
          <StateChip r={r} />
          {r.last_sent_at && (
            <p className="text-[var(--color-text-secondary)]">
              {ACTIVITY_LABEL[r.last_sent_type ?? ""] ?? "Изпратено"} · {relative(r.last_sent_at)}
            </p>
          )}
        </div>
      </div>

      {(r.last_dnevnik || r.open_promises.length > 0) && (
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {r.last_dnevnik && (
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Последен разговор · {fmtSofia(r.last_dnevnik.at)}
                {r.dnevnik_count > 1 ? ` · общо ${r.dnevnik_count}` : ""}
              </p>
              <DnevnikEntryView entry={r.last_dnevnik.entry} compact />
            </div>
          )}
          {r.open_promises.length > 0 && (
            <div className="rounded-lg border border-white/5 bg-black/20 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                Кой какво дължи · {r.open_promises.length}
              </p>
              <PromisesList contactId={r.id} promises={r.open_promises} compact max={3} nowIso={nowIso} />
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={() => setWriting((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold"
          style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
        >
          ✍️ Записах разговор
        </button>
        <QuickButton contactId={r.id} action="mark_called" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10">
          📞 Чух го
        </QuickButton>
        <QuickButton contactId={r.id} action="ready_to_buy" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">
          🎉 Готов да купи
        </QuickButton>
        <Link
          href={`/admin/email?to=${encodeURIComponent(r.email ?? "")}`}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent-cyan)]/60 hover:text-[var(--color-accent-cyan)]"
        >
          ✉️ Имейл
        </Link>
        <span className="mx-1 text-[10px] text-[var(--color-text-tertiary)]">🔔 да го чуя:</span>
        {REMIND_PRESETS.map((p) => (
          <RemindButton key={p.key} contactId={r.id} preset={p.key} label={p.label} />
        ))}
        <QuickButton contactId={r.id} action="not_interested" className="ml-auto border-white/10 text-[var(--color-text-tertiary)] hover:bg-white/5">
          ✕ Не се интересува
        </QuickButton>
      </div>

      {writing && (
        <div className="mt-3 rounded-lg border border-[var(--color-accent-cyan)]/30 p-3" style={{ background: "rgba(0,212,255,0.04)" }}>
          <DnevnikForm contactId={r.id} compact onSaved={() => setWriting(false)} />
        </div>
      )}
    </div>
  );
}

function QuickButton({
  contactId,
  action,
  className,
  children,
}: {
  contactId: string;
  action: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={followupQuickAction} className="inline">
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors ${className ?? ""}`}>
        {children}
      </button>
    </form>
  );
}

function RemindButton({ contactId, preset, label }: { contactId: string; preset: string; label: string }) {
  return (
    <form action={followupQuickAction} className="inline">
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="action" value="remind_preset" />
      <input type="hidden" name="preset" value={preset} />
      <button
        type="submit"
        className="inline-flex items-center rounded-md border border-sky-500/40 px-2 py-1 text-[11px] text-sky-300 transition-colors hover:bg-sky-500/10"
      >
        {label}
      </button>
    </form>
  );
}
