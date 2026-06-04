"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { DocumentRow } from "@/lib/crm/types";
import {
  DOC_TYPE_LABEL,
  PAYMENT_MATCH_STATUS_LABEL,
  PAYMENT_MATCH_STATUS_COLOR,
  formatDate,
} from "@/lib/crm/labels";

export interface DocRow extends DocumentRow {
  contact_name?: string | null;
  invoice_number?: string | null;
}

type FilterKey = "all" | "unmatched" | "invoice" | "bank_statement" | "receipt" | "photo";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Всички" },
  { key: "unmatched", label: "За свързване" },
  { key: "invoice", label: "Фактури" },
  { key: "bank_statement", label: "Извлечения" },
  { key: "receipt", label: "Талони" },
  { key: "photo", label: "Снимки" },
];

export function DocumentsTable({ rows }: { rows: DocRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>;
    c.all = rows.length;
    c.unmatched = rows.filter((r) => r.match_status === "unmatched").length;
    c.invoice = rows.filter((r) => r.doc_type === "invoice").length;
    c.bank_statement = rows.filter((r) => r.doc_type === "bank_statement").length;
    c.receipt = rows.filter((r) => r.doc_type === "receipt").length;
    c.photo = rows.filter((r) => r.doc_type === "photo").length;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "unmatched") return r.match_status === "unmatched";
        if (filter !== "all") return r.doc_type === filter;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return [r.title, r.file_name, r.ocr_text, r.contact_name, r.invoice_number]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      });
  }, [rows, filter, search]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Търси по заглавие, текст (OCR), клиент…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
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
      </div>

      <div className="space-y-2">
        {visible.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-border-default)] p-3 text-sm"
            style={{ background: "rgba(13,18,33,0.4)" }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {DOC_TYPE_LABEL[r.doc_type] ?? r.doc_type}
                </span>
                <span className="truncate text-[var(--color-text-primary)]">{r.title || r.file_name || "(документ)"}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-[var(--color-text-tertiary)]">
                {r.contact_id && r.contact_name && (
                  <Link href={`/admin/clients/${r.contact_id}`} className="hover:text-[var(--color-accent-cyan)]">
                    👤 {r.contact_name}
                  </Link>
                )}
                {r.invoice_number && <span>🧾 {r.invoice_number}</span>}
                <span>{formatDate(r.created_at)}</span>
                <span>{r.source}</span>
              </div>
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
          </div>
        ))}
        {visible.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            Няма документи за този филтър. Hermes ще качва тук фактури, талони, извлечения и снимки от пощата.
          </p>
        )}
      </div>
    </div>
  );
}
