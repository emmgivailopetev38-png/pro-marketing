"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CONTACT_STAGES,
  STAGE_COLOR,
  STAGE_LABEL,
  type ContactRow,
  type ContactStage,
} from "@/lib/contacts/types";

const SOURCE_LABEL: Record<string, string> = {
  meta_lead: "Meta",
  cal_booking: "Cal.com",
  email: "Имейл",
  manual: "Ръчно",
  website_form: "Сайт",
};

// Pipeline-prioritized stage order (closest to deal first).
const STAGE_ORDER: ContactStage[] = [
  "won",
  "negotiating",
  "offer_sent",
  "presentation_sent",
  "discovery",
  "contacted",
  "lead",
  "lost",
];

interface ActivityCounts {
  total: number;
  lastTitle: string | null;
  lastAt: string | null;
  lastType: string | null;
}

export function ClientsTable({ initialRows }: { initialRows: ContactRow[] }) {
  const [rows, setRows] = useState<ContactRow[]>(initialRows);
  const [stageFilter, setStageFilter] = useState<ContactStage | "all">("all");
  const [search, setSearch] = useState("");
  const [activityByContact, setActivityByContact] = useState<Map<string, ActivityCounts>>(new Map());
  const [filesByContact, setFilesByContact] = useState<Map<string, number>>(new Map());

  // Initial fetch of activity + file aggregates, then realtime live updates.
  useEffect(() => {
    const supabase = createClient();

    async function loadAggregates() {
      const [{ data: acts }, { data: files }] = await Promise.all([
        supabase
          .from("contact_activities")
          .select("contact_id, title, occurred_at, activity_type")
          .order("occurred_at", { ascending: false })
          .limit(2000),
        supabase.from("contact_files").select("contact_id"),
      ]);

      const am = new Map<string, ActivityCounts>();
      for (const a of (acts ?? []) as Array<{
        contact_id: string;
        title: string;
        occurred_at: string;
        activity_type: string;
      }>) {
        const prev = am.get(a.contact_id) ?? { total: 0, lastTitle: null, lastAt: null, lastType: null };
        prev.total += 1;
        if (!prev.lastAt) {
          prev.lastTitle = a.title;
          prev.lastAt = a.occurred_at;
          prev.lastType = a.activity_type;
        }
        am.set(a.contact_id, prev);
      }
      setActivityByContact(am);

      const fm = new Map<string, number>();
      for (const f of (files ?? []) as Array<{ contact_id: string }>) {
        fm.set(f.contact_id, (fm.get(f.contact_id) ?? 0) + 1);
      }
      setFilesByContact(fm);
    }

    void loadAggregates();

    // Subscribe to contacts table
    const contactsCh = supabase
      .channel("contacts-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((r) => r.id !== (payload.old as ContactRow).id);
            }
            const next = payload.new as ContactRow;
            const idx = prev.findIndex((r) => r.id === next.id);
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
        }
      )
      .subscribe();

    // Subscribe to activities for live last-activity updates
    const actsCh = supabase
      .channel("activities-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contact_activities" },
        (payload) => {
          const a = payload.new as {
            contact_id: string;
            title: string;
            occurred_at: string;
            activity_type: string;
          };
          setActivityByContact((prev) => {
            const next = new Map(prev);
            const cur = next.get(a.contact_id) ?? { total: 0, lastTitle: null, lastAt: null, lastType: null };
            next.set(a.contact_id, {
              total: cur.total + 1,
              lastTitle: a.title,
              lastAt: a.occurred_at,
              lastType: a.activity_type,
            });
            return next;
          });
        }
      )
      .subscribe();

    // Subscribe to files for live file count
    const filesCh = supabase
      .channel("files-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_files" },
        (payload) => {
          setFilesByContact((prev) => {
            const next = new Map(prev);
            if (payload.eventType === "INSERT") {
              const f = payload.new as { contact_id: string };
              next.set(f.contact_id, (next.get(f.contact_id) ?? 0) + 1);
            } else if (payload.eventType === "DELETE") {
              const f = payload.old as { contact_id: string };
              const cur = next.get(f.contact_id) ?? 0;
              if (cur <= 1) next.delete(f.contact_id);
              else next.set(f.contact_id, cur - 1);
            }
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(contactsCh);
      void supabase.removeChannel(actsCh);
      void supabase.removeChannel(filesCh);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (stageFilter !== "all" && r.stage !== stageFilter) return false;
      if (!q) return true;
      return [r.full_name, r.email, r.phone, r.company]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
    // Sort by stage priority, then by last activity
    return list.sort((a, b) => {
      const ai = STAGE_ORDER.indexOf(a.stage);
      const bi = STAGE_ORDER.indexOf(b.stage);
      if (ai !== bi) return ai - bi;
      const aAct = activityByContact.get(a.id)?.lastAt ?? a.updated_at;
      const bAct = activityByContact.get(b.id)?.lastAt ?? b.updated_at;
      return new Date(bAct).getTime() - new Date(aAct).getTime();
    });
  }, [rows, stageFilter, search, activityByContact]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    for (const s of CONTACT_STAGES) counts[s] = 0;
    for (const r of rows) counts[r.stage] = (counts[r.stage] ?? 0) + 1;
    return counts;
  }, [rows]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Търси по име, имейл, телефон, фирма…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <StageChip
            label="Всички"
            count={stageCounts.all}
            active={stageFilter === "all"}
            color="#7da8cc"
            onClick={() => setStageFilter("all")}
          />
          {STAGE_ORDER.map((s) => (
            <StageChip
              key={s}
              label={STAGE_LABEL[s]}
              count={stageCounts[s]}
              active={stageFilter === s}
              color={STAGE_COLOR[s]}
              onClick={() => setStageFilter(s)}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="cc-panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-deep)] text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Име · Фирма</th>
              <th className="px-4 py-3 font-medium">Контакти</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Източник</th>
              <th className="px-4 py-3 font-medium" title="Файлове · Активности">📎 · 📊</th>
              <th className="px-4 py-3 font-medium">Последна активност</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {filtered.map((r) => {
              const act = activityByContact.get(r.id);
              const fileCount = filesByContact.get(r.id) ?? 0;
              return (
                <tr key={r.id} className="transition-colors hover:bg-[var(--color-bg-deep)]/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${r.id}`}
                      className="font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent-cyan)]"
                    >
                      {r.full_name || "—"}
                    </Link>
                    {r.company && (
                      <div className="text-xs text-[var(--color-text-tertiary)]">{r.company}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {r.email && <div className="font-mono text-xs">{r.email}</div>}
                    {r.phone && <div className="font-mono text-xs">{r.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
                      style={{
                        background: `${STAGE_COLOR[r.stage]}22`,
                        color: STAGE_COLOR[r.stage],
                      }}
                    >
                      {STAGE_LABEL[r.stage]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-tertiary)]">
                    {SOURCE_LABEL[r.source] ?? r.source}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={fileCount > 0 ? "text-[var(--color-accent-cyan)]" : "text-[var(--color-text-tertiary)]"}
                        title={`${fileCount} файла в архива`}
                      >
                        📎 {fileCount}
                      </span>
                      <span
                        className={act && act.total > 0 ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"}
                        title={`${act?.total ?? 0} активности`}
                      >
                        📊 {act?.total ?? 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {act?.lastTitle ? (
                      <>
                        <div
                          className="line-clamp-1 text-[var(--color-text-secondary)]"
                          title={act.lastTitle}
                        >
                          {act.lastTitle}
                        </div>
                        <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                          {formatRelative(act.lastAt!)}
                        </div>
                      </>
                    ) : (
                      <div className="text-[var(--color-text-tertiary)]">{formatRelative(r.updated_at)}</div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  Няма контакти, отговарящи на филтрите.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
        Показани: {filtered.length} от {rows.length} · 🟢 Live обновяване (контакти, активности, файлове) · Сортирано по приоритет → последна активност
      </p>
    </div>
  );
}

function StageChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={{
        borderColor: active ? color : "var(--color-border-default)",
        background: active ? `${color}1a` : "transparent",
        color: active ? color : "var(--color-text-secondary)",
      }}
    >
      {label}
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return "току що";
  if (diffSec < 3600) return `преди ${Math.round(diffSec / 60)} мин`;
  if (diffSec < 86400) return `преди ${Math.round(diffSec / 3600)} ч`;
  if (diffSec < 7 * 86400) return `преди ${Math.round(diffSec / 86400)} дни`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short" });
}
