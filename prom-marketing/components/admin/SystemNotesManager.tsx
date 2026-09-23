"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ownerCreateNoteAction, replyNoteAction, setNoteStatusAction } from "@/app/admin/(protected)/belezhki/actions";
import type { SystemNote } from "@/lib/team/system-notes";

/**
 * Таблото на Ивайло с бележките от екипа: групи нови / видени / направени /
 * отхвърлени, филтър по човек и област, бутоните за статус и отговорът под
 * всяка. Най-отгоре — собствена бележка.
 */

export interface AreaOption {
  key: string;
  label: string;
}

export interface AuthorOption {
  key: string;
  name: string;
}

const FIELD =
  "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-cyan)]/60";

const GROUPS: Array<{ status: string; title: string; tone: string; empty: string }> = [
  { status: "new", title: "Нови · чакат поглед", tone: "text-[var(--color-accent-cyan)]", empty: "Няма нови — всичко е прегледано." },
  { status: "seen", title: "Видени · чакат решение", tone: "text-amber-300", empty: "" },
  { status: "done", title: "Направени", tone: "text-emerald-300", empty: "" },
  { status: "dismissed", title: "Отхвърлени", tone: "text-[var(--color-text-tertiary)]", empty: "" },
];

const STATUS_BUTTONS: Record<string, { status: string; label: string; tone: string }> = {
  seen: { status: "seen", label: "Видяна", tone: "border-amber-400/50 text-amber-300 hover:bg-amber-400/10" },
  done: { status: "done", label: "Направено", tone: "border-emerald-400/50 text-emerald-300 hover:bg-emerald-400/10" },
  dismissed: { status: "dismissed", label: "Отхвърлена", tone: "border-rose-400/40 text-rose-300 hover:bg-rose-400/10" },
  new: { status: "new", label: "Върни при новите", tone: "border-white/15 text-[var(--color-text-secondary)] hover:bg-white/5" },
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

function Btn({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] disabled:opacity-50">
      {pending ? "…" : children}
    </button>
  );
}

function StatusButton({ status, label, tone }: { status: string; label: string; tone: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name="status" value={status} disabled={pending} className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${tone}`}>
      {label}
    </button>
  );
}

function Result({ res }: { res: { ok: boolean; message?: string; error?: string } | null }) {
  if (!res) return null;
  return <span className={`text-xs ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</span>;
}

function NoteCard({ n, areaLabel }: { n: SystemNote; areaLabel: (key: string) => string }) {
  const [st, stAct] = useActionState(setNoteStatusAction, null);
  const [rp, rpAct] = useActionState(replyNoteAction, null);
  const [replying, setReplying] = useState(false);
  const mine = n.author_key === "owner";

  // Кои бутони има смисъл да стоят: не и този за текущия статус.
  const buttons = (n.status === "new" ? ["seen", "done", "dismissed"] : n.status === "seen" ? ["done", "dismissed"] : n.status === "done" ? ["dismissed", "new"] : ["done", "new"]).map(
    (k) => STATUS_BUTTONS[k]
  );

  return (
    <li className="rounded-md border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] text-[var(--color-text-tertiary)]">
        <span className={`text-sm font-semibold ${mine ? "text-[var(--color-accent-cyan)]" : "text-[var(--color-text-primary)]"}`}>{n.author_name}</span>
        <span>{fmt(n.created_at)}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5">{areaLabel(n.area)}</span>
        {n.page && <span title="От кой екран е писана">📍 {n.page}</span>}
        {n.resolved_at && <span>· приключена {fmt(n.resolved_at)}</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{n.text}</p>
      {n.owner_reply && (
        <div className="mt-2 rounded-md border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm">
          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-300">Твоят отговор</p>
          <p className="mt-0.5 whitespace-pre-wrap">{n.owner_reply}</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form action={stAct} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={n.id} />
          {buttons.map((b) => (
            <StatusButton key={b.status} {...b} />
          ))}
        </form>
        <button
          type="button"
          onClick={() => setReplying((v) => !v)}
          className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-white/5"
        >
          {replying ? "Скрий" : n.owner_reply ? "Промени отговора" : "Отговори"}
        </button>
        <Result res={st} />
      </div>
      {replying && (
        <form action={rpAct} className="mt-2 space-y-2">
          <input type="hidden" name="id" value={n.id} />
          <textarea
            name="reply"
            rows={3}
            maxLength={4000}
            defaultValue={n.owner_reply ?? ""}
            placeholder={mine ? "Бележка към самия себе си — какво реши." : "Кратко и по същество — човекът ще го получи по имейл."}
            className={`${FIELD} w-full`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Btn>Запази отговора</Btn>
            <Result res={rp} />
          </div>
        </form>
      )}
    </li>
  );
}

export function SystemNotesManager({
  notes,
  areas,
  authors,
  ownerName,
}: {
  notes: SystemNote[];
  areas: ReadonlyArray<AreaOption>;
  authors: AuthorOption[];
  ownerName: string;
}) {
  const [create, createAct] = useActionState(ownerCreateNoteAction, null);
  const [who, setWho] = useState("");
  const [area, setArea] = useState("");
  const pageRef = useRef<HTMLInputElement>(null);

  // Откъде е дошъл Ивайло — ако е от друг екран на CRM-а, бележката го помни.
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
  const filtered = notes.filter((n) => (!who || n.author_key === who) && (!area || n.area === area));
  const countBy = (pred: (n: SystemNote) => boolean) => notes.filter(pred).length;

  return (
    <div className="space-y-6">
      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">Моя бележка</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">Каквото ти хрумне за системата — тук, при другите, за да не се губи.</p>
        <form action={createAct} className="mt-3 grid gap-2 md:grid-cols-[260px_1fr]">
          <input ref={pageRef} type="hidden" name="page" defaultValue="/admin/belezhki" />
          <select name="area" defaultValue="crm" className={FIELD}>
            {areas.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
          <textarea name="text" required rows={2} maxLength={4000} placeholder="Например: в картона ми трябва бутон за…" className={`${FIELD} md:row-span-2`} />
          <div className="flex items-center gap-2">
            <Btn>Запиши</Btn>
            <Result res={create} />
          </div>
        </form>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={who === ""} onClick={() => setWho("")}>
            всички · {notes.length}
          </FilterChip>
          {authors.map((a) => {
            const c = countBy((n) => n.author_key === a.key);
            if (c === 0 && a.key !== "owner") return null;
            return (
              <FilterChip key={a.key} active={who === a.key} onClick={() => setWho(a.key)}>
                {a.key === "owner" ? ownerName : a.name} · {c}
              </FilterChip>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={area === ""} onClick={() => setArea("")}>
            всички области
          </FilterChip>
          {areas.map((a) => (
            <FilterChip key={a.key} active={area === a.key} onClick={() => setArea(a.key)}>
              {a.label} · {countBy((n) => n.area === a.key)}
            </FilterChip>
          ))}
        </div>
      </section>

      {GROUPS.map((g) => {
        const list = filtered.filter((n) => n.status === g.status);
        if (list.length === 0 && !g.empty) return null;
        return (
          <section key={g.status} className="cc-panel p-5">
            <h2 className={`font-display text-lg font-bold ${g.tone}`}>
              {g.title} · {list.length}
            </h2>
            {list.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">{g.empty}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {list.map((n) => (
                  <NoteCard key={n.id} n={n} areaLabel={areaLabel} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {notes.length === 0 && (
        <p className="cc-panel p-6 text-center text-sm text-[var(--color-text-tertiary)]">
          Още никой не е писал. Екипът вижда „Бележки“ в менюто на /ekip — първата ще дойде и в Telegram.
        </p>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active ? "border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)] hover:border-white/25"
      }`}
    >
      {children}
    </button>
  );
}
