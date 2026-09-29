"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { prospectAction } from "@/app/ekip/studeni-actions";
import { MEETING_MINUTES } from "@/lib/cal/types";
import { RETRY_PRESETS, RETRY_PRESET_LABEL, TALKED_AFTER_DAYS, TALKED_DEFAULT_DAYS } from "@/lib/team/retry-rules";
import { PROSPECT_STATUS_LABEL, phoneDisplay, telHref, type Prospect } from "@/lib/team/prospects-rules";
import type { EkipActionResult } from "@/lib/team/types";

const FIELD =
  "mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

/** Утре в дадения час по часовника на телефона — стойност за datetime-local. */
function tomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

function site(url: string): { href: string; label: string } {
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return { href, label: url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "") };
}

/**
 * Студената фирма — една карта, една фирма. Отгоре: кой е, телефонът с едно
 * докосване и готовото начало на разговора. Бутоните са същите като при
 * лийдовете, за да не се учи нищо ново; „говорихме“ и „среща“ правят картон.
 */
export function ProspectCard({ prospect: p }: { prospect: Prospect }) {
  const [state, formAction] = useActionState<EkipActionResult | null, FormData>(prospectAction, null);
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<string>("3h");
  const tel = telHref(p.phone);
  const again = p.status === "no_answer" || p.status === "callback";

  if (state?.ok) {
    return (
      <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        ✅ {p.company}: {state.message}
      </article>
    );
  }

  return (
    <article
      id={`studena-${p.id}`}
      className={`scroll-mt-20 rounded-2xl border p-4 ${
        again ? "border-amber-400/25 bg-amber-400/[0.04]" : "border-sky-400/20 bg-sky-400/[0.03] shadow-[0_10px_40px_-30px_rgba(56,189,248,0.6)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[var(--color-text-primary)]">{p.company}</h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            {[p.city, p.sector].filter(Boolean).join(" · ")}
            {p.decision_maker ? ` · решава: ${p.decision_maker}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right text-[11px] text-[var(--color-text-tertiary)]">
          ❄️ студено{p.score ? ` · ${p.score}/100` : ""}
          {again && p.next_call_at && (
            <p className="text-amber-200">
              {PROSPECT_STATUS_LABEL[p.status]} · {when(p.next_call_at)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {tel ? (
          <a
            href={tel}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-bold"
            style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
          >
            📞 {phoneDisplay(p.phone)}
          </a>
        ) : (
          <span className="text-sm text-rose-300">Няма телефон</span>
        )}
        {p.website && (
          <a href={site(p.website).href} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-accent-cyan)] underline">
            🌐 {site(p.website).label}
          </a>
        )}
        {p.email && <span className="text-xs text-[var(--color-text-tertiary)]">✉️ {p.email}</span>}
      </div>

      {p.opener && (
        <div className="mt-3 rounded-xl border border-sky-400/25 bg-sky-400/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-wider text-sky-200/80">💬 Как започваш</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-primary)]">{p.opener}</p>
        </div>
      )}

      {(p.offer || p.gaps || p.buying_signal) && (
        <details className="mt-2 rounded-xl border border-white/10 p-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text-secondary)]">🎯 Какво да им предложиш</summary>
          {p.offer && <p className="mt-2 whitespace-pre-line text-[var(--color-text-secondary)]">{p.offer}</p>}
          {p.gaps && (
            <p className="mt-2 whitespace-pre-line text-[var(--color-text-secondary)]">
              <b className="text-[var(--color-text-primary)]">Пропуски:</b> {p.gaps}
            </p>
          )}
          {p.buying_signal && (
            <p className="mt-2 text-[var(--color-text-secondary)]">
              <b className="text-[var(--color-text-primary)]">Сигнал:</b> {p.buying_signal}
            </p>
          )}
        </details>
      )}

      {p.email_draft && (
        <details className="mt-2 rounded-xl border border-white/10 p-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-[var(--color-text-secondary)]">✉️ Готово писмо след разговора</summary>
          {p.email_subject && <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">Тема: {p.email_subject}</p>}
          <p className="mt-1 whitespace-pre-line text-[var(--color-text-secondary)]">{p.email_draft}</p>
          <CopyBtn text={[p.email_subject ? `Тема: ${p.email_subject}` : null, p.email_draft].filter(Boolean).join("\n\n")} />
        </details>
      )}

      {p.last_note && <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">📝 Последно: {p.last_note}</p>}

      {state && !state.ok && (
        <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{state.error}</p>
      )}

      <form action={formAction} className="mt-3 border-t border-white/5 pt-3">
        <input type="hidden" name="prospect_id" value={p.id} />
        {!open ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <SubmitBtn action="no_answer" className="border-white/15 text-[var(--color-text-secondary)]">
                📵 Не вдигна
              </SubmitBtn>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-accent-cyan)]/50 px-3 py-2 text-sm font-semibold text-[var(--color-accent-cyan)]"
              >
                💬 Говорихме…
              </button>
              <SubmitBtn action="not_interested" className="border-white/15 text-[var(--color-text-tertiary)]">
                ✋ Не се интересува
              </SubmitBtn>
            </div>
            <RetryPicker preset={preset} onPreset={setPreset} />
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-[11px] text-[var(--color-text-tertiary)]">
              Какво каза — за картона и за Ивайло
              <textarea name="note" rows={2} placeholder="напр. „губят поръчки, защото никой не вдига след 18:00“" className={FIELD} />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2">
                <label className="text-[11px] text-emerald-200/80">
                  📅 Среща с Ивайло ({MEETING_MINUTES} мин) на
                  <input type="datetime-local" name="meeting_at" defaultValue={tomorrowAt(11)} className={FIELD} />
                </label>
                <input type="email" name="email" defaultValue={p.email ?? ""} placeholder="имейл — за поканата с Meet линк" className={`${FIELD} text-xs`} />
                <label className="mt-1.5 flex items-start gap-2 text-[11px] leading-snug text-emerald-200/80">
                  <input type="checkbox" name="invite" value="1" defaultChecked className="mt-0.5 accent-emerald-400" />
                  <span>📨 Покана с Meet линк по имейл (през Cal.com)</span>
                </label>
                <div className="mt-2">
                  <SubmitBtn action="meeting" className="w-full border-emerald-400/50 text-emerald-200">
                    📅 Записах среща
                  </SubmitBtn>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-white/10 p-2">
                <label className="block text-[11px] text-[var(--color-text-tertiary)]">
                  💬 Говорихме, без среща — пак след
                  <select name="talked_after" defaultValue={String(TALKED_DEFAULT_DAYS)} className={FIELD}>
                    {TALKED_AFTER_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d} дни
                      </option>
                    ))}
                  </select>
                </label>
                <SubmitBtn action="talked" className="w-full border-[var(--color-accent-cyan)]/50 text-[var(--color-accent-cyan)]">
                  💬 Говорихме
                </SubmitBtn>
                <label className="block text-[11px] text-[var(--color-text-tertiary)]">
                  ⏰ „Звъннете ми по-късно“ — на
                  <input type="datetime-local" name="retry_at" defaultValue={tomorrowAt(10)} className={FIELD} />
                </label>
                <SubmitBtn action="callback" className="w-full border-amber-400/40 text-amber-200">
                  ⏰ Звънни пак тогава
                </SubmitBtn>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <SubmitBtn action="not_interested" className="border-white/15 text-[var(--color-text-tertiary)]">
                ✋ Не се интересува
              </SubmitBtn>
              <SubmitBtn action="bad_number" className="border-rose-400/30 text-rose-200">
                ❌ Грешен номер
              </SubmitBtn>
              <button type="button" onClick={() => setOpen(false)} className="px-2 text-xs text-[var(--color-text-tertiary)] underline">
                затвори
              </button>
            </div>
          </div>
        )}
      </form>
    </article>
  );
}

function RetryPicker({ preset, onPreset }: { preset: string; onPreset: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] text-[var(--color-text-tertiary)]">⏱ Не вдигна → звъня пак:</span>
      <select
        name="retry_preset"
        value={preset}
        onChange={(e) => onPreset(e.target.value)}
        aria-label="Кога да звънна пак"
        className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
      >
        {RETRY_PRESETS.map((x) => (
          <option key={x} value={x}>
            {RETRY_PRESET_LABEL[x]}
          </option>
        ))}
      </select>
      {preset === "custom" && (
        <input
          type="datetime-local"
          name="retry_at_custom"
          defaultValue={tomorrowAt(10)}
          aria-label="Точен час за повторното звънене"
          className="rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
        />
      )}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => setDone(true)).catch(() => {});
      }}
      className="mt-2 rounded-md border border-white/15 px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
    >
      {done ? "✓ Копирано" : "📋 Копирай писмото"}
    </button>
  );
}

function SubmitBtn({ action, className, children }: { action: string; className?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="action"
      value={action}
      disabled={pending}
      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${className ?? ""}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
