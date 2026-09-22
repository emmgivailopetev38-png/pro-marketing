"use client";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { postMessageAction, toggleClientVisibleAction } from "@/app/ekip/saobshtenia/actions";
import type { MessageLite, ThreadSummary } from "@/lib/team/messages-rules";
import type { EkipActionResult } from "@/lib/team/types";

/**
 * Съобщенията — списък с нишки и разговорът. Едно и също за /ekip и /admin.
 * По картон има отметка „клиентът го вижда“ — така обновлението към клиента
 * се пише веднъж и стои и в CRM-а, и в портала му.
 */

const FIELD =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

function Send() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] disabled:opacity-50">
      {pending ? "…" : "Изпрати"}
    </button>
  );
}

export function MessagesPanel({
  threads,
  current,
  messages,
  title,
  me,
  base,
  templates = [],
  contactId,
}: {
  threads: ThreadSummary[];
  current: string | null;
  messages: MessageLite[];
  title: string;
  me: string;
  base: string;
  /** готови текстове към клиента — само по картон */
  templates?: Array<{ id: string; label: string; text: string }>;
  contactId?: string | null;
}) {
  const [res, act] = useActionState(postMessageAction, null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isContact = current?.startsWith("contact:") ?? false;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, current]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-1 lg:max-h-[70vh] lg:overflow-y-auto">
        {threads.map((t) => (
          <Link
            key={t.key}
            href={`${base}?t=${encodeURIComponent(t.key)}`}
            className={`block rounded-xl border px-3 py-2 text-sm ${t.key === current ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/10" : "border-white/10 hover:bg-white/5"}`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate">{t.title}</span>
              {t.unread > 0 && <span className="shrink-0 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{t.unread}</span>}
            </span>
            {t.last && (
              <span className="mt-0.5 block truncate text-[11px] text-[var(--color-text-tertiary)]">
                {t.last.author_name}: {t.last.body}
              </span>
            )}
          </Link>
        ))}
      </aside>

      <section className="flex min-h-[50vh] flex-col rounded-2xl border border-white/10 bg-white/[0.02]">
        {!current ? (
          <p className="p-6 text-sm text-[var(--color-text-tertiary)]">Избери нишка отляво. „Целият екип“ е за общите неща; личните са само между вас двамата; по картон стои до работата.</p>
        ) : (
          <>
            <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <h2 className="truncate text-sm font-semibold">{title}</h2>
              {isContact && contactId && (
                <Link href={`/admin/clients/${contactId}`} className="text-xs text-[var(--color-text-tertiary)] underline-offset-2 hover:underline">
                  картонът
                </Link>
              )}
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.length === 0 && <p className="text-xs text-[var(--color-text-tertiary)]">Още нищо тук. Напиши първото.</p>}
              {messages.map((m) => {
                const mine = m.author_key === me;
                return (
                  <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? "ml-auto bg-[var(--color-accent-cyan)]/15" : m.from_client ? "bg-amber-400/10" : "bg-white/5"}`}>
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                      {m.from_client ? "🧑‍💼 " : ""}
                      {m.author_name} · {fmt(m.created_at)}
                      {m.client_visible && !m.from_client && <span title="Клиентът го вижда"> · 👁</span>}
                    </p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    {isContact && !m.from_client && contactId && (
                      <form action={toggleClientVisibleAction} className="mt-1">
                        <input type="hidden" name="message_id" value={m.id} />
                        <input type="hidden" name="contact_id" value={contactId} />
                        <input type="hidden" name="visible" value={m.client_visible ? "0" : "1"} />
                        <button type="submit" className="text-[10px] text-[var(--color-text-tertiary)] underline-offset-2 hover:underline">
                          {m.client_visible ? "скрий от клиента" : "покажи на клиента"}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <form action={act} className="space-y-2 border-t border-white/10 p-3">
              <input type="hidden" name="thread_key" value={current} />
              <input type="hidden" name="thread_title" value={title} />
              {templates.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (bodyRef.current) bodyRef.current.value = t.text;
                      }}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)]"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
              <textarea ref={bodyRef} name="body" rows={3} required placeholder="Пиши тук. @Иван или @Ивайло, за да получат писмо." className={FIELD} />
              <div className="flex flex-wrap items-center gap-3">
                <Send />
                {isContact && (
                  <label className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                    <input type="checkbox" name="client_visible" value="1" /> 👁 клиентът да го види в портала си
                  </label>
                )}
                {res && <span className={`text-xs ${res.ok ? "text-emerald-300" : "text-red-300"}`}>{res.message ?? res.error}</span>}
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
