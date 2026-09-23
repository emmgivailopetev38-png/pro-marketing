"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { viberSentAction } from "@/app/ekip/sreshti-actions";
import { viberChatLink, type MeetingMsgKind } from "@/lib/team/sreshta-saobshtenia";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Готово съобщение към човека: текстът (на „Вие“ или на „ти“, редактира се),
 * „Копирай“, „Отвори Viber“ (схемата отваря точния чат по номер, но не носи
 * текст — затова са две докосвания) и „Изпратих“, което го записва.
 */
export function MessageBox({
  title,
  formal,
  informal,
  phone,
  bookingId,
  contactId,
  kind,
}: {
  title: string;
  formal: string;
  informal: string;
  phone: string | null;
  bookingId: string | null;
  contactId: string | null;
  kind: MeetingMsgKind;
}) {
  const [useFormal, setUseFormal] = useState(true);
  const [text, setText] = useState(formal);
  const [copied, setCopied] = useState(false);
  const [state, action] = useActionState<EkipActionResult | null, FormData>(viberSentAction, null);
  const viber = viberChatLink(phone);

  function pick(f: boolean) {
    setUseFormal(f);
    setText(f ? formal : informal);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // без clipboard API текстът си стои в полето — маркира се и се копира на ръка
    }
  }

  if (state?.ok) {
    return (
      <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
        ✅ {title}: {state.message}
      </p>
    );
  }

  const tab = (active: boolean) =>
    `rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-fuchsia-400/25 text-fuchsia-100" : "text-fuchsia-200/60"}`;

  return (
    <div className="mt-3 rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/[0.06] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-fuchsia-200">{title}</p>
        <div className="flex gap-1">
          <button type="button" onClick={() => pick(true)} className={tab(useFormal)}>
            Вие
          </button>
          <button type="button" onClick={() => pick(false)} className={tab(!useFormal)}>
            ти
          </button>
        </div>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm leading-snug text-[var(--color-text-primary)] outline-none focus:border-fuchsia-400/60"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-fuchsia-400/50 bg-fuchsia-500/15 px-3 py-2 text-sm font-semibold text-fuchsia-100"
        >
          📋 {copied ? "Копирано" : "Копирай"}
        </button>
        {viber && (
          <a href={viber} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            💜 Отвори Viber
          </a>
        )}
        <form action={action} className="ml-auto">
          <input type="hidden" name="booking_id" value={bookingId ?? ""} />
          <input type="hidden" name="contact_id" value={contactId ?? ""} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="text" value={text} />
          <SentBtn />
        </form>
      </div>
      {state?.error && (
        <p className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{state.error}</p>
      )}
    </div>
  );
}

function SentBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-emerald-400/60 bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
    >
      {pending ? "…" : "✅ Изпратих"}
    </button>
  );
}
