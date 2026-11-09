import { setMatchStatusAction } from "@/app/admin/(protected)/finansirane/actions";
import { MATCH_STATUSES, MATCH_STATUS_LABEL, type MatchStatus } from "@/lib/finansirane/finansirane-rules";
import { cn } from "@/lib/utils";

export const MATCH_STATUS_TONE: Record<MatchStatus, string> = {
  nov: "border-sky-400/50 text-sky-200 bg-sky-400/10",
  kazano: "border-violet-400/50 text-violet-200 bg-violet-400/10",
  interes: "border-amber-400/50 text-amber-200 bg-amber-400/10",
  kandidatstva: "border-orange-400/50 text-orange-200 bg-orange-400/10",
  spechelen: "border-emerald-400/60 text-emerald-200 bg-emerald-400/15",
  ne: "border-white/20 text-[var(--color-text-tertiary)] bg-white/5",
};

/** Статусът на съвпадението — бутон за всеки, текущият е светнат. Без JS: server action. */
export function MatchStatusForm({ id, status }: { id: string; status: MatchStatus }) {
  return (
    <form action={setMatchStatusAction} className="flex flex-wrap gap-1">
      <input type="hidden" name="id" value={id} />
      {MATCH_STATUSES.map((s) => (
        <button
          key={s}
          type="submit"
          name="status"
          value={s}
          disabled={s === status}
          aria-pressed={s === status}
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
            s === status
              ? cn(MATCH_STATUS_TONE[s], "font-semibold")
              : "border-white/10 text-[var(--color-text-tertiary)] hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-text-primary)]"
          )}
        >
          {MATCH_STATUS_LABEL[s]}
        </button>
      ))}
    </form>
  );
}
