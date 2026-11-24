"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { videoFeedbackAction } from "@/app/ekip/materiali/actions";
import type { EkipActionResult } from "@/lib/team/types";

/** Формата „Предложи корекция или ново видео“ — отива при Ивайло в „Съобщения“. */
export function VideoFeedback({ videos }: { videos: string[] }) {
  const [state, action] = useActionState<EkipActionResult | null, FormData>(videoFeedbackAction, null);
  if (state?.ok) {
    return <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">✅ {state.message}</p>;
  }
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name="kind" value="korekcia" defaultChecked /> Корекция на видео
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name="kind" value="novo" /> Ново видео, което да направим
        </label>
      </div>
      <select name="which" defaultValue="" className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm">
        <option value="">Кое видео (ако е корекция)</option>
        {videos.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
      <textarea
        name="text"
        rows={4}
        required
        placeholder="Какво да се промени — или какво видео да направим, за кого и какво да каже. Пример: „видео 3 мин за собственици на автосервиз: как Ели вдига телефона, докато са под колата“."
        className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm"
      />
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="rounded-xl border border-[var(--color-accent-cyan)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-accent-cyan)] disabled:opacity-50">
      {pending ? "Праща…" : "Прати на Ивайло"}
    </button>
  );
}
