"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createNoteAction } from "@/app/ekip/belezhki/actions";
import type { SystemNote } from "@/lib/team/system-notes";

/**
 * Бележките за системата — формата и списъкът на собствените бележки със
 * статуса и отговора на Ивайло. Етикетите идват като props: модулът с
 * правилата е само за сървъра.
 */

export interface AreaOption {
  key: string;
  label: string;
}

const FIELD =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]";

const STATUS_CLASS: Record<string, string> = {
  new: "border-[var(--color-accent-cyan)]/50 text-[var(--color-accent-cyan)]",
  seen: "border-amber-400/50 text-amber-300",
  done: "border-emerald-400/50 text-emerald-300",
  dismissed: "border-white/15 text-[var(--color-text-tertiary)]",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] disabled:opacity-50">
      {pending ? "…" : "Запиши бележката"}
    </button>
  );
}

export function NotesPanel({
  notes,
  areas,
  statusLabel,
  page,
}: {
  notes: SystemNote[];
  areas: ReadonlyArray<AreaOption>;
  statusLabel: Record<string, string>;
  /** екранът, от който се пише — влиза в бележката, за да се знае откъде е */
  page: string;
}) {
  const [res, act] = useActionState(createNoteAction, null);
  const pageRef = useRef<HTMLInputElement>(null);

  // Ако човекът е дошъл от друг наш екран (картона, задачите), той е по-полезен
  // от самата страница с бележките — „тук ми трябва бутон“ значи там.
  useEffect(() => {
    try {
      const from = document.referrer ? new URL(document.referrer) : null;
      if (from && from.origin === window.location.origin && from.pathname !== window.location.pathname && pageRef.current) {
        pageRef.current.value = from.pathname;
      }
    } catch {
      /* без referrer — остава текущата страница */
    }
  }, []);

  const areaLabel = (key: string) => areas.find((a) => a.key === key)?.label ?? key;

  return (
    <div className="space-y-5">
      <form action={act} className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <input ref={pageRef} type="hidden" name="page" defaultValue={page} />
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">За какво е</span>
          <select name="area" defaultValue="crm" className={FIELD}>
            {areas.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Бележката</span>
          <textarea
            name="text"
            required
            rows={4}
            maxLength={4000}
            placeholder="Какво ти пречи или какво би било по-лесно? Например: „в картона ми трябва бутон за…“"
            className={FIELD}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Submit />
          {res && <span className={`text-xs ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</span>}
        </div>
      </form>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Моите бележки · {notes.length}</h2>
        {notes.length === 0 ? (
          <p className="rounded-2xl border border-white/10 p-4 text-center text-sm text-[var(--color-text-secondary)]">
            Още нямаш бележки. Първото, което ти хрумне, е добро начало.
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--color-text-tertiary)]">
                  <span className={`rounded-full border px-2 py-0.5 font-semibold ${STATUS_CLASS[n.status] ?? STATUS_CLASS.dismissed}`}>
                    {statusLabel[n.status] ?? n.status}
                  </span>
                  <span>{areaLabel(n.area)}</span>
                  <span>{fmt(n.created_at)}</span>
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{n.text}</p>
                {n.owner_reply && (
                  <div className="mt-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-amber-300">Отговор от Ивайло</p>
                    <p className="mt-0.5 whitespace-pre-wrap">{n.owner_reply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
