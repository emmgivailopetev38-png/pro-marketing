"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { meetingRecordingAction } from "@/app/ekip/sreshti-actions";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * 🎥 Линкът от записа на срещата (10.11.2026) — Fathom / Meet / Drive. Записите се анализират после
 * (какво казва човекът, къде губим сделката). Има ли линк — показва го; няма ли — поле + бутон.
 */
export function MeetingRecording({ bookingId, url }: { bookingId: string; url: string | null }) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(meetingRecordingAction, null);
  const [open, setOpen] = useState(false);
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-emerald-300 underline">
        🎥 Записът ✓
      </a>
    );
  }
  if (state?.ok) {
    return <p className="mt-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">🎥 {state.message}</p>;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 rounded-lg border border-amber-400/50 px-2.5 py-1 text-xs font-semibold text-amber-200"
      >
        🎥 Запис — добави линка
      </button>
    );
  }
  return (
    <form action={action} className="mt-1 flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input
        name="url"
        type="url"
        required
        autoFocus
        placeholder="https://fathom.video/… или линк от Meet/Drive"
        className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-2.5 py-1 text-xs"
      />
      <SaveBtn />
      {state?.error && <span className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300">{state.error}</span>}
    </form>
  );
}

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-lg border border-emerald-400/50 px-2.5 py-1 text-xs font-semibold text-emerald-300 disabled:opacity-50">
      {pending ? "…" : "Запази"}
    </button>
  );
}
