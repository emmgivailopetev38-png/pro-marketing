"use client";
import { useMemo, useState } from "react";
import type { AgentRuleRow, AgentRuleScope } from "@/lib/crm/types";
import { formatDate } from "@/lib/crm/labels";
import { toggleAgentRuleAction, createAgentRuleAction } from "@/app/admin/(protected)/agent-rules/actions";

const SCOPE_LABEL: Record<AgentRuleScope, string> = {
  postalion: "Пощальон",
  accountant: "Счетоводител",
  sales: "Продавач",
  ads: "Рекламен",
  auditor: "Одитор",
  all: "Всички",
  voice: "Глас",
};
const SCOPE_COLOR: Record<string, string> = {
  postalion: "#22d3ee",
  accountant: "#facc15",
  sales: "#a78bfa",
  ads: "#fb923c",
  auditor: "#34d399",
  voice: "#f472b6",
  all: "#7da8cc",
};
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function AgentRulesList({ rows }: { rows: AgentRuleRow[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => Number(b.active) - Number(a.active) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [rows]
  );

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Ново правило"}
        </button>
      </div>

      {showCreate && (
        <form action={createAgentRuleAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Кой работник</span>
              <select name="scope" defaultValue="all" className={inputCls}>
                {(Object.keys(SCOPE_LABEL) as AgentRuleScope[]).map((s) => (
                  <option key={s} value={s}>{SCOPE_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Заглавие</span>
              <input name="title" required className={inputCls} placeholder="напр. Спам подател" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Тригер (по желание)</span>
              <input name="trigger_pattern" className={inputCls} placeholder="напр. @insights.veed.io" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Урок (какво да прави)</span>
              <textarea name="rule" required rows={2} className={inputCls} placeholder="Какво трябва да прави работникът при този случай." />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">Запази</button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">Отказ</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {sorted.map((r) => (
          <article key={r.id} className="cc-panel p-4" style={{ ["--cc" as string]: SCOPE_COLOR[r.scope], opacity: r.active ? 1 : 0.55 }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${SCOPE_COLOR[r.scope]}22`, color: SCOPE_COLOR[r.scope] }}>
                    {SCOPE_LABEL[r.scope] ?? r.scope}
                  </span>
                  <span className="font-display text-[15px] font-semibold text-[var(--color-text-primary)]">{r.title}</span>
                  {!r.active && <span className="text-[10px] text-[var(--color-text-tertiary)]">· изключено</span>}
                </div>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{r.rule}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-[var(--color-text-tertiary)]">
                  {r.trigger_pattern && <span className="font-mono">⊳ {r.trigger_pattern}</span>}
                  {r.source_review_type && <span>от: {r.source_review_type}</span>}
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </div>
              <form action={toggleAgentRuleAction} className="shrink-0">
                <input type="hidden" name="rule_id" value={r.id} />
                <input type="hidden" name="active" value={(!r.active).toString()} />
                <button
                  type="submit"
                  className={
                    r.active
                      ? "rounded-md border border-white/10 px-3 py-1.5 text-xs text-[var(--color-text-tertiary)] transition hover:bg-white/5"
                      : "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                  }
                >
                  {r.active ? "Изключи" : "Включи"}
                </button>
              </form>
            </div>
          </article>
        ))}
        {rows.length === 0 && (
          <div className="cc-panel px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
            Още няма правила. Реши ръчна проверка с „🎓 Научи Хермес" — урокът ще се появи тук.
          </div>
        )}
      </div>
    </div>
  );
}
