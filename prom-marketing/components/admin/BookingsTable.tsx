"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { bookingStatusAction } from "@/app/admin/(protected)/bookings/actions";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export interface BookingRow {
  id: string;
  cal_booking_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  created_at: string;
  business: string | null;
  automation_goal: string | null;
  services_interested: string[] | null;
  timeline: string | null;
  meeting_url?: string | null;
}

type Tab = "upcoming" | "past";

export function BookingsTable({ upcoming, past }: { upcoming: BookingRow[]; past: BookingRow[] }) {
  "use no memo";

  const [tab, setTab] = useState<Tab>("upcoming");
  const [sorting, setSorting] = useState<SortingState>([{ id: "scheduled_at", desc: false }]);
  const [filter, setFilter] = useState("");

  const rows = tab === "upcoming" ? upcoming : past;

  // Upcoming sorts ASC (nearest first), Archive sorts DESC (latest first).
  useEffect(() => {
    setSorting([{ id: "scheduled_at", desc: tab === "past" }]);
  }, [tab]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.attendee_name.toLowerCase().includes(q) ||
      r.attendee_email.toLowerCase().includes(q) ||
      (r.attendee_phone ?? "").toLowerCase().includes(q) ||
      (r.business ?? "").toLowerCase().includes(q) ||
      (r.automation_goal ?? "").toLowerCase().includes(q)
    );
  }, [rows, filter]);

  const columns = useMemo<ColumnDef<BookingRow>[]>(() => [
    {
      accessorKey: "attendee_name",
      header: "Име",
      cell: (info) => (
        <div>
          <p className="font-medium">{info.getValue<string>()}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{info.row.original.attendee_email}</p>
        </div>
      ),
    },
    { accessorKey: "attendee_phone", header: "Телефон", cell: (info) => info.getValue() ?? "—" },
    {
      accessorKey: "business",
      header: "Бизнес",
      cell: (info) => info.getValue<string | null>() ?? "—",
    },
    {
      accessorKey: "services_interested",
      header: "Интерес",
      cell: (info) => {
        const v = info.getValue<string[] | null>();
        if (!v || v.length === 0) return "—";
        return (
          <div className="flex flex-wrap gap-1">
            {v.map((s) => (
              <span key={s} className="rounded-full bg-[var(--color-accent-cyan)]/10 px-2 py-0.5 text-[10px] text-[var(--color-accent-cyan)]">
                {s}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "timeline",
      header: "Кога",
      cell: (info) => info.getValue<string | null>() ?? "—",
    },
    {
      accessorKey: "scheduled_at",
      header: "Час",
      cell: (info) => format(new Date(info.getValue<string>()), "d MMM yyyy, HH:mm", { locale: bg }),
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: (info) => {
        const s = info.getValue<string>();
        const label =
          s === "confirmed" ? "потвърдена" :
          s === "completed" ? "проведена" :
          s === "cancelled" ? "отказана" :
          s === "no_show" ? "не се яви" :
          s === "accepted" ? "приета" :
          s === "pending" ? "чака потвърждение" :
          s === "rescheduled" ? "разместена" : s;
        const tone =
          s === "confirmed" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
          s === "completed" ? "bg-sky-500/15 text-sky-300 border-sky-500/30" :
          s === "cancelled" || s === "no_show" ? "bg-red-500/15 text-red-300 border-red-500/30" :
          s === "accepted" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
          "bg-amber-500/15 text-amber-300 border-amber-500/30";
        return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${tone}`}>{label}</span>;
      },
    },
    {
      id: "result",
      header: "Резултат",
      cell: (info) => {
        const r = info.row.original;
        const past = new Date(r.scheduled_at).getTime() < Date.now();
        if (r.status === "cancelled") return <span className="text-[var(--color-text-tertiary)]">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {past && r.status !== "completed" && <StatusBtn id={r.id} status="completed" label="✅ Проведена" />}
            {past && r.status !== "no_show" && <StatusBtn id={r.id} status="no_show" label="🙈 Не се яви" />}
            {!past && <StatusBtn id={r.id} status="cancelled" label="❌ Отказана" />}
          </div>
        );
      },
    },
    {
      accessorKey: "meeting_url",
      header: "Линк",
      cell: (info) => {
        const url = info.getValue<string | null | undefined>();
        if (!url) return <span className="text-[var(--color-text-tertiary)]">—</span>;
        return (
          <a href={url} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] hover:underline">
            Отвори
          </a>
        );
      },
    },
  ], []);

  // TanStack Table intentionally returns non-memoizable helper functions; keep
  // the component outside React Compiler optimization for this integration.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const exportCSV = () => {
    const header = ["Име", "Имейл", "Телефон", "Бизнес", "Цел / Болка", "Услуги", "Кога", "Час", "Минути", "Статус"];
    const lines = [header.join(",")].concat(
      filtered.map((r) =>
        [
          r.attendee_name,
          r.attendee_email,
          r.attendee_phone ?? "",
          r.business ?? "",
          r.automation_goal ?? "",
          (r.services_interested ?? []).join("; "),
          r.timeline ?? "",
          r.scheduled_at,
          r.duration_minutes,
          r.status,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
    );
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] p-1">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "upcoming"
                ? "bg-[var(--color-accent-cyan)] text-black"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Предстоящи · {upcoming.length}
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === "past"
                ? "bg-[var(--color-accent-cyan)] text-black"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Архив · {past.length}
          </button>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Търси по име, имейл или телефон"
          className="flex-1 min-w-[240px] rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <Button variant="outline" onClick={exportCSV}>Експорт CSV</Button>
      </div>

      <div className="glass overflow-hidden rounded-xl">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()} className="cursor-pointer select-none">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc" ? " ↑" : h.column.getIsSorted() === "desc" ? " ↓" : ""}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-[var(--color-text-tertiary)]">
                  {tab === "upcoming" ? "Няма предстоящи срещи" : "Няма приключени срещи"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
        <span>
          Страница {table.getState().pagination.pageIndex + 1} от {table.getPageCount() || 1}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Предишна
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Следваща
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * „Проведена“ / „Не се яви“ / „Отказана“ — една форма, едно натискане.
 * „Не се яви“ праща картона при човека за срещите с готово съобщение за Viber.
 */
function StatusBtn({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={bookingStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] whitespace-nowrap text-[var(--color-text-secondary)] hover:border-[var(--color-accent-cyan)]/60 hover:text-[var(--color-text-primary)]"
      >
        {label}
      </button>
    </form>
  );
}
