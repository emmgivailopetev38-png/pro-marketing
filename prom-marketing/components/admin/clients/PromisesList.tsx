"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPromiseAction, togglePromiseAction } from "@/app/admin/(protected)/clients/[id]/actions";
import { REMIND_PRESETS, type PromiseRow } from "@/lib/contacts/dnevnik";
import { fmtSofia } from "@/lib/team/time";

const WHO = { them: { icon: "🤝", label: "Той обеща" }, us: { icon: "🫡", label: "Аз обещах" } } as const;

/**
 * Обещанията — кой какво дължи. Отмятат се с едно докосване; изпълнените се
 * свиват под „показани“. С `compact` е за списъка за проследяване: само
 * отворените, най-много `max`.
 */
export function PromisesList({
  contactId,
  promises,
  compact = false,
  max = 4,
  allowAdd = !compact,
  nowIso,
}: {
  contactId: string;
  promises: PromiseRow[];
  compact?: boolean;
  max?: number;
  allowAdd?: boolean;
  /** „Сега“ идва от сървъра: часовникът не се пипа по време на рендър. */
  nowIso?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);
  const open = promises.filter((p) => !p.done_at);
  const done = promises.filter((p) => p.done_at);
  const shown = compact ? open.slice(0, max) : open;

  function toggle(p: PromiseRow) {
    const fd = new FormData();
    fd.set("promise_id", p.id);
    fd.set("contact_id", contactId);
    fd.set("done", p.done_at ? "0" : "1");
    start(async () => {
      await togglePromiseAction(fd);
      router.refresh();
    });
  }

  if (open.length === 0 && done.length === 0 && !allowAdd) return null;

  return (
    <div className={compact ? "text-xs" : "text-sm"}>
      {shown.length === 0 && !compact && (
        <p className="text-xs text-[var(--color-text-tertiary)]">Няма отворени обещания. Запиши разговор — обещанията излизат оттам.</p>
      )}
      <ul className="space-y-1">
        {shown.map((p) => (
          <PromiseItem key={p.id} p={p} pending={pending} nowIso={nowIso} onToggle={() => toggle(p)} />
        ))}
      </ul>
      {compact && open.length > max && (
        <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">+ още {open.length - max} в картона</p>
      )}
      {!compact && done.length > 0 && (
        <button
          type="button"
          onClick={() => setShowDone((v) => !v)}
          className="mt-2 text-[11px] text-[var(--color-text-tertiary)] underline-offset-2 hover:underline"
        >
          {showDone ? "▾ скрий изпълнените" : `▸ изпълнени · ${done.length}`}
        </button>
      )}
      {!compact && showDone && (
        <ul className="mt-1 space-y-1 opacity-60">
          {done.map((p) => (
            <PromiseItem key={p.id} p={p} pending={pending} nowIso={nowIso} onToggle={() => toggle(p)} />
          ))}
        </ul>
      )}
      {allowAdd && (
        <div className="mt-2">
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-[11px] text-[var(--color-accent-cyan)] underline-offset-2 hover:underline"
            >
              + добави обещание
            </button>
          ) : (
            <form
              action={async (fd) => {
                await addPromiseAction(fd);
                setAdding(false);
                router.refresh();
              }}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-2"
            >
              <input type="hidden" name="contact_id" value={contactId} />
              <select name="who" className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                <option value="them">🤝 Той обеща</option>
                <option value="us">🫡 Аз обещах</option>
              </select>
              <input
                name="text"
                required
                placeholder="какво точно"
                className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs"
              />
              <select name="due_preset" className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs">
                <option value="">без срок</option>
                {REMIND_PRESETS.map((r) => (
                  <option key={r.key} value={r.key}>
                    до {r.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-md border border-[var(--color-accent-cyan)]/50 px-2 py-1 text-xs text-[var(--color-accent-cyan)]">
                Запиши
              </button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs text-[var(--color-text-tertiary)]">
                отказ
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function PromiseItem({
  p,
  pending,
  nowIso,
  onToggle,
}: {
  p: PromiseRow;
  pending: boolean;
  nowIso?: string;
  onToggle: () => void;
}) {
  const who = WHO[p.who];
  // ISO низовете са в UTC и се сравняват лексикографски — без часовник по
  // време на рендър, значи сървърът и браузърът рисуват едно и също.
  const overdue = !p.done_at && !!p.due_at && !!nowIso && p.due_at < nowIso;
  return (
    <li className="flex items-start gap-2">
      <input
        type="checkbox"
        checked={!!p.done_at}
        disabled={pending}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent-cyan)]"
        aria-label={p.done_at ? "Върни като неизпълнено" : "Отбележи като изпълнено"}
      />
      <span className={p.done_at ? "line-through" : ""}>
        <span className="mr-1 text-[var(--color-text-tertiary)]" title={who.label}>
          {who.icon}
        </span>
        {p.text}
        {p.due_at && !p.done_at && (
          <span className={`ml-2 text-[10px] ${overdue ? "text-red-300" : "text-[var(--color-text-tertiary)]"}`}>
            до {fmtSofia(p.due_at)}
          </span>
        )}
      </span>
    </li>
  );
}
