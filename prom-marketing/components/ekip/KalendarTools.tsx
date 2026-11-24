"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveMeetUrlAction } from "@/app/ekip/kalendar/actions";
import type { EkipActionResult } from "@/lib/team/types";

/** Бутон „Копирай“ за линк — с обратна връзка. */
export function CopyLink({ url, label = "📋 Копирай" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        } catch {
          setDone(false);
        }
      }}
      className="rounded-md border border-[var(--color-accent-cyan)]/50 px-2.5 py-1 text-xs font-semibold text-[var(--color-accent-cyan)]"
    >
      {done ? "✓ копирано" : label}
    </button>
  );
}

/** „Моят постоянен Meet линк“ — формата на клоузъра. */
export function MeetUrlForm({ current }: { current: string | null }) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(saveMeetUrlAction, null);
  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input
        name="meet_url"
        defaultValue={current ?? ""}
        inputMode="url"
        placeholder="https://meet.google.com/abc-defg-hij"
        className="min-w-[240px] flex-1 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm"
      />
      <Save />
      {state?.ok && <span className="text-xs text-emerald-300">✅ {state.message}</span>}
      {state?.error && <span className="text-xs text-red-300">{state.error}</span>}
    </form>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-xl border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50">
      {pending ? "Записва…" : "Запази"}
    </button>
  );
}
