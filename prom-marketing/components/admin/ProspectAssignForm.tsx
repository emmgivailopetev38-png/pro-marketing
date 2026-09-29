"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { assignProspectsAction } from "@/app/admin/(protected)/studeni/actions";
import type { EkipActionResult } from "@/lib/team/types";

const field = "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

function Go() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-full px-4 py-2 text-sm font-bold disabled:opacity-60" style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}>
      {pending ? "…" : "Дай"}
    </button>
  );
}

/** „Дай [30] от [София] на [Елена]“ — един ред, едно натискане. */
export function ProspectAssignForm({
  members,
  cities,
}: {
  members: Array<{ id: string; name: string }>;
  cities: Array<{ city: string; free: number }>;
}) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(assignProspectsAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <span>Дай</span>
      <input name="count" type="number" min={1} max={500} defaultValue={30} className={`${field} w-20`} aria-label="Колко фирми" />
      <span>от</span>
      <select name="city" defaultValue="" className={field} aria-label="От кой град">
        <option value="">всички градове (по реда)</option>
        {cities
          .filter((c) => c.free > 0)
          .map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} · {c.free} свободни
            </option>
          ))}
      </select>
      <span>на</span>
      <select name="member_id" defaultValue={members[0]?.id ?? ""} className={field} aria-label="На кого">
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <Go />
      {state && <span className={`text-xs ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>{state.ok ? state.message : state.error}</span>}
    </form>
  );
}
