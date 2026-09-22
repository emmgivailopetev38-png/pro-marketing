"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { recordDnevnikAction, type DnevnikResult } from "@/app/admin/(protected)/clients/[id]/actions";
import { CHANNELS, MOODS, REMIND_PRESETS } from "@/lib/contacts/dnevnik";

const FIELD =
  "mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-cyan)]/60";

/**
 * „Записах разговор“ — една форма за всичко, което Ивайло иска да помни:
 * откъде, как се чувстваше човекът, какво говорихме, какво обеща той, какво
 * обещах аз, какво стана и кога да го чуя пак. С `compact` (в списъка за
 * проследяване) настроението и напомнянето са отпред, останалото се разгъва.
 */
export function DnevnikForm({
  contactId,
  compact = false,
  defaultChannel = "phone",
  onSaved,
}: {
  contactId: string;
  compact?: boolean;
  defaultChannel?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<DnevnikResult | null, FormData>(recordDnevnikAction, null);
  const [channel, setChannel] = useState(defaultChannel);
  const [mood, setMood] = useState<string>("");
  const [remind, setRemind] = useState<string>("none");
  const [more, setMore] = useState(!compact);
  const [round, setRound] = useState(0);

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
        ✅ {state.message}
        <button
          type="button"
          onClick={() => {
            setRound((r) => r + 1);
            router.refresh();
            onSaved?.();
          }}
          className="ml-3 rounded-md border border-emerald-400/40 px-2 py-0.5 text-xs"
        >
          готово
        </button>
      </div>
    );
  }

  return (
    <form key={round} action={formAction} className="space-y-3">
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="mood" value={mood} />
      <input type="hidden" name="remind_preset" value={remind} />

      <div className="flex flex-wrap gap-1.5">
        {CHANNELS.map((c) => (
          <Chip key={c.key} active={channel === c.key} onClick={() => setChannel(c.key)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">Как се чувстваше</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <Chip key={m.key} active={mood === m.key} color={m.color} onClick={() => setMood(mood === m.key ? "" : m.key)}>
              {m.emoji} {m.label}
            </Chip>
          ))}
        </div>
      </div>

      <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        Какво говорихме
        <textarea name="talked" rows={compact ? 2 : 3} placeholder="с негови думи, ако може: „…“" className={FIELD} />
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          🤝 Той обеща
          <textarea name="they_promised" rows={2} placeholder="по едно на ред — стават обещания за отмятане" className={FIELD} />
        </label>
        <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          🫡 Аз обещах
          <textarea name="we_promised" rows={2} placeholder="по едно на ред" className={FIELD} />
        </label>
      </div>

      {!more ? (
        <button type="button" onClick={() => setMore(true)} className="text-xs text-[var(--color-accent-cyan)] underline-offset-2 hover:underline">
          + какво стана, следваща стъпка, дата на разговора
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            📌 Какво стана
            <textarea name="happened" rows={2} placeholder="изходът от разговора" className={FIELD} />
          </label>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ➡️ Следваща стъпка
            <textarea name="next_step" rows={2} placeholder="какво следва и кой го прави" className={FIELD} />
          </label>
          <label className="block text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Кога беше разговорът (ако не е сега)
            <input type="datetime-local" name="occurred_at" className={FIELD} />
          </label>
        </div>
      )}

      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-2">
        <p className="text-[11px] uppercase tracking-wider text-sky-200/80">🔔 Да го чуя пак</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Chip active={remind === "none"} onClick={() => setRemind("none")}>
            без напомняне
          </Chip>
          {REMIND_PRESETS.map((r) => (
            <Chip key={r.key} active={remind === r.key} onClick={() => setRemind(r.key)}>
              {r.label}
            </Chip>
          ))}
          <input
            type="datetime-local"
            name="remind_at"
            title="или точен ден и час"
            className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitBtn />
        {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      </div>
    </form>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const accent = color ?? "var(--color-accent-cyan)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={{
        borderColor: active ? accent : "var(--color-border-default)",
        background: active ? `${color ? `${color}22` : "rgba(0,212,255,0.10)"}` : "transparent",
        color: active ? accent : "var(--color-text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "…" : "✍️ Запиши разговора"}
    </button>
  );
}
