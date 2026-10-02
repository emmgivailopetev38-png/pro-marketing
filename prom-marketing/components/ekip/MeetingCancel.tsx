"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { meetingCancelAction } from "@/app/ekip/sreshti-actions";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * „❌ Отказа“ до напомнянето за срещата: човекът е казал, че няма да дойде.
 * Едно докосване (с потвърждение) — срещата става отменена, напомнянията за нея
 * спират сами и картата му отива в „❌ Отказаха срещата“ за нов час.
 */
export function MeetingCancel({ bookingId, name, when }: { bookingId: string; name: string; when: string }) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(meetingCancelAction, null);
  if (state?.ok) {
    return (
      <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        ✅ {state.message}
      </p>
    );
  }
  return (
    <form action={action} className="inline">
      <input type="hidden" name="booking_id" value={bookingId} />
      <CancelBtn confirmText={`${name || "Човекът"} няма да дойде (${when})? Срещата се отменя и напомнянията за нея спират.`} />
      {state?.error && (
        <span className="ml-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">{state.error}</span>
      )}
    </form>
  );
}

function CancelBtn({ confirmText }: { confirmText: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => (window.confirm(confirmText) ? undefined : e.preventDefault())}
      className="rounded-lg border border-rose-400/40 px-2.5 py-1 text-xs text-rose-200 disabled:opacity-50"
    >
      {pending ? "…" : "❌ Отказа — няма да дойде"}
    </button>
  );
}
