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
};

export function ClientsTable({ initialRows }: { initialRows: ContactRow[] }) {
  const [rows, setRows] = useState<ContactRow[]>(initialRows);
  const [stageFilter, setStageFilter] = useState<ContactStage | "all">("all");
  const [search, setSearch] = useState("");

  // Live updates via Supabase realtime — applies inserts/updates/deletes in place.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
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
            return copy.sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (stageFilter !== "all" && r.stage !== stageFilter) return false;
      if (!q) return true;
      return [r.full_name, r.email, r.phone, r.company]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [rows, stageFilter, search]);

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
          placeholder="Търси по име, имейл, телефон…"
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
          {CONTACT_STAGES.map((s) => (
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
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-default)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-deep)] text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Име</th>
              <th className="px-4 py-3 font-medium">Контакти</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Източник</th>
              <th className="px-4 py-3 font-medium">Стойност</th>
              <th className="px-4 py-3 font-medium">Последна активност</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {filtered.map((r) => (
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
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
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
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
                  {r.deal_value_eur ? `${r.deal_value_eur.toLocaleString("bg-BG")} €` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-tertiary)]">
                  {formatRelative(r.updated_at)}
                </td>
              </tr>
            ))}
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
        Показани: {filtered.length} от {rows.length} · 🟢 Live обновяване активно
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
