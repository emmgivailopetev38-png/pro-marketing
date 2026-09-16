"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ekipAction } from "@/app/ekip/actions";
import { guessBusinessOption } from "@/lib/leads/form-labels";
import { BUSINESS_OPTIONS, type EkipActionResult, type QueueLead } from "@/lib/team/types";

const CAL_URL = "https://cal.com/promarketing/consultation";

function ago(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `преди ${Math.max(1, Math.round(diff / 60))} мин`;
  if (diff < 86400) return `преди ${Math.round(diff / 3600)} ч`;
  if (diff < 7 * 86400) return `преди ${Math.round(diff / 86400)} дни`;
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "short", timeZone: "Europe/Sofia" });
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Sofia",
  });
}

/** Утре в 10:00 по часовника на телефона — стойност за datetime-local. */
function tomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`;
}

const SOURCE_LABEL: Record<string, string> = {
  meta_lead: "Meta реклама",
  website_form: "Формата на сайта",
  voice_web: "Гласовият агент (сайт)",
  voice_phone: "Гласовият агент (телефон)",
  site_chatbot: "Чатботът",
  facebook_messenger: "Messenger",
  hermes: "Хермес",
  manual: "Ръчно",
};

function splitBusiness(b: string | null): { option: string; detail: string } {
  if (!b) return { option: "", detail: "" };
  const [first, ...rest] = b.split(" · ");
  if ((BUSINESS_OPTIONS as readonly string[]).includes(first)) return { option: first, detail: rest.join(" · ") };
  return { option: guessBusinessOption(b), detail: b };
}

export function LeadCard({ lead, mode }: { lead: QueueLead; mode: "fresh" | "retry" }) {
  const [state, formAction] = useActionState<EkipActionResult | null, FormData>(ekipAction, null);
  const [open, setOpen] = useState(mode === "retry");

  const fromForm = lead.form_answers.find((a) => a.question === "С какво се занимава")?.answer ?? null;
  const saved = splitBusiness(lead.business);
  const defaultOption = lead.business ? saved.option : fromForm ? guessBusinessOption(fromForm) : "";
  const defaultDetail = lead.business ? saved.detail : fromForm && defaultOption === "Друго" ? fromForm : "";

  const name = lead.full_name?.trim() || "Без име";
  const calParams = new URLSearchParams();
  if (lead.full_name) calParams.set("name", lead.full_name);
  if (lead.email) calParams.set("email", lead.email);
  calParams.set("attendeePhoneNumber", lead.phone);
  const calUrl = `${CAL_URL}?${calParams.toString()}`;

  if (state?.ok) {
    return (
      <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        ✅ {name}: {state.message}
      </article>
    );
  }

  return (
    <article
      id={`lead-${lead.id}`}
      className="scroll-mt-20 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_40px_-30px_rgba(6,182,212,0.6)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-[var(--color-text-primary)]">{name}</h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
            {SOURCE_LABEL[lead.source] ?? lead.source}
            {lead.ad_name ? ` · ${lead.ad_name}` : ""} · {ago(lead.created_at)}
          </p>
        </div>
        {mode === "retry" && lead.next_followup_at && (
          <span className="shrink-0 rounded-full border border-amber-400/40 px-2 py-0.5 text-[11px] text-amber-300">
            ⏰ {when(lead.next_followup_at)}
          </span>
        )}
      </div>

      <a
        href={`tel:${lead.phone}`}
        className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-lg font-bold tracking-wide"
        style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
      >
        📞 {lead.phone}
      </a>

      {(lead.form_answers.length > 0 || lead.company || lead.email) && (
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          {lead.form_answers.map((a) => (
            <div key={a.question} className="contents">
              <dt className="text-[var(--color-text-tertiary)]">{a.question}</dt>
              <dd className="font-medium text-[var(--color-text-primary)]">{a.answer}</dd>
            </div>
          ))}
          {lead.company && (
            <div className="contents">
              <dt className="text-[var(--color-text-tertiary)]">Фирма</dt>
              <dd className="text-[var(--color-text-primary)]">{lead.company}</dd>
            </div>
          )}
          {lead.email && (
            <div className="contents">
              <dt className="text-[var(--color-text-tertiary)]">Имейл</dt>
              <dd className="font-mono text-xs text-[var(--color-text-secondary)]">{lead.email}</dd>
            </div>
          )}
        </dl>
      )}

      {lead.notes && (
        <p className="mt-2 whitespace-pre-line rounded-lg bg-black/25 p-2 text-xs text-[var(--color-text-secondary)]">
          {lead.notes}
        </p>
      )}

      {lead.last_attempt && (
        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
          Последно: {lead.last_attempt.title} · {when(lead.last_attempt.at)}
          {lead.last_attempt.by ? ` · ${lead.last_attempt.by}` : ""}
          {lead.attempts > 1 ? ` · ${lead.attempts} опита` : ""}
        </p>
      )}

      <form action={formAction} className="mt-3 border-t border-white/5 pt-3">
        <input type="hidden" name="contact_id" value={lead.id} />

        {!open ? (
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
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-[var(--color-text-tertiary)]">
                С какво се занимава
                <select
                  name="business"
                  defaultValue={defaultOption}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60"
                >
                  <option value="">— избери —</option>
                  {BUSINESS_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--color-text-tertiary)]">
                По-точно (с две думи)
                <input
                  name="business_detail"
                  defaultValue={defaultDetail}
                  placeholder="напр. фризьорски салон в Русе"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60"
                />
              </label>
            </div>
            <label className="block text-xs text-[var(--color-text-tertiary)]">
              Какво каза (една реплика стига)
              <textarea
                name="note"
                rows={2}
                placeholder="напр. „губя по 2 часа на ден в отговори на запитвания“"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60"
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2">
                <label className="text-[11px] text-emerald-200/80">
                  📅 Среща с Ивайло на
                  <input
                    type="datetime-local"
                    name="meeting_at"
                    defaultValue={tomorrowAt(11)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                {!lead.email && (
                  <input
                    type="email"
                    name="email"
                    placeholder="имейл за поканата (по желание)"
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                  />
                )}
                <SubmitBtn action="meeting" className="mt-2 w-full border-emerald-400/60 bg-emerald-500/15 text-emerald-200">
                  ✅ Записах среща
                </SubmitBtn>
              </div>
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-2">
                <label className="text-[11px] text-sky-200/80">
                  🔁 Да звънна пак на
                  <input
                    type="datetime-local"
                    name="retry_at"
                    defaultValue={tomorrowAt(10)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-[var(--color-text-primary)]"
                  />
                </label>
                <SubmitBtn action="callback" className="mt-2 w-full border-sky-400/60 bg-sky-500/15 text-sky-200">
                  🔁 Говорихме, чуване пак
                </SubmitBtn>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <SubmitBtn action="no_answer" className="border-white/15 text-[var(--color-text-secondary)]">
                📵 Не вдигна
              </SubmitBtn>
              <SubmitBtn action="note" className="border-white/15 text-[var(--color-text-secondary)]">
                📝 Само бележка
              </SubmitBtn>
              <SubmitBtn action="not_interested" className="border-white/15 text-[var(--color-text-tertiary)]">
                ✕ Не се интересува
              </SubmitBtn>
              <SubmitBtn action="wrong_number" className="border-white/15 text-[var(--color-text-tertiary)]">
                ⛔ Грешен номер
              </SubmitBtn>
              <a
                href={calUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-accent-cyan)]/60"
                title="Записва в календара на Ивайло и праща покана с Meet линк на човека"
              >
                🗓 В календара с покана
              </a>
            </div>
          </div>
        )}

        {state?.error && (
          <p className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{state.error}</p>
        )}
      </form>
    </article>
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
