"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { meetingOutcomeAction } from "@/app/ekip/sreshti-actions";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Резултатът от минала среща, с едно докосване от водещия ѝ: ✅ проведена или
 * 🙈 не се яви. „Не се яви“ пуска Ели за нов час (до 4 опита за 7 дни) — затова
 * не се отбелязва „Загубен“: така Ели спира.
 */
export function MeetingOutcome({ bookingId, name, when }: { bookingId: string; name: string; when: string }) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(meetingOutcomeAction, null);
  if (state?.ok) {
    return (
      <p className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">✅ {state.message}</p>
    );
  }
  return (
    <form action={action} className="mt-1 flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="booking_id" value={bookingId} />
      <OutcomeBtn value="completed" cls="border-emerald-400/50 text-emerald-300">
        ✅ Проведена
      </OutcomeBtn>
      <OutcomeBtn
        value="no_show"
        cls="border-rose-400/40 text-rose-200"
        confirmText={`${name || "Човекът"} не се яви на срещата (${when})? Ели ще му звъни за нов час — веднага и в следващите дни.`}
      >
        🙈 Не се яви — Ели да звъни
      </OutcomeBtn>
      {state?.error && <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">{state.error}</span>}
    </form>
  );
}

function OutcomeBtn({ value, cls, confirmText, children }: { value: string; cls: string; confirmText?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="outcome"
      value={value}
      disabled={pending}
      onClick={(e) => (confirmText && !window.confirm(confirmText) ? e.preventDefault() : undefined)}
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${cls}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
