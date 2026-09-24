"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ekipAction } from "@/app/ekip/actions";
import { guessBusinessOption } from "@/lib/leads/form-labels";
import { BUSINESS_OPTIONS, type EkipActionResult, type LeadCardMode, type QueueLead } from "@/lib/team/types";
import { MEETING_MINUTES } from "@/lib/cal/types";
import { RETRY_PRESETS, RETRY_PRESET_LABEL, TALKED_AFTER_DAYS, TALKED_DEFAULT_DAYS } from "@/lib/team/retry-rules";
import { meetingMessage } from "@/lib/team/sreshta-saobshtenia";
import { canGiveUp } from "@/lib/team/queue-rules";
import { MessageBox } from "./MessageBox";

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

/** Етапът с думи — само в търсачката, където излизат и хора извън опашката. */
const STAGE_LABEL: Record<string, string> = {
  lead: "нов лийд",
  contacted: "говорено",
  discovery: "среща уговорена",
  presentation_sent: "презентация пратена",
  offer_sent: "оферта пратена",
  negotiating: "преговори",
  won: "клиент",
  lost: "отказал / затворен",
};

function splitBusiness(b: string | null): { option: string; detail: string } {
  if (!b) return { option: "", detail: "" };
  const [first, ...rest] = b.split(" · ");
  if ((BUSINESS_OPTIONS as readonly string[]).includes(first)) return { option: first, detail: rest.join(" · ") };
  return { option: guessBusinessOption(b), detail: b };
}

const FIELD =
  "mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

/**
 * Една карта = един човек = един разговор. `mode` казва откъде идва картата и
 * кои бутони са отпред: при „чака обратно обаждане“ първият бутон е
 * „Върна обаждане“, защото точно това се случва — човекът звъни десет минути
 * след „Не вдигна“ и срещата трябва да се запише от същата карта.
 */
export function LeadCard({ lead, mode, setterName = "Димитър" }: { lead: QueueLead; mode: LeadCardMode; setterName?: string }) {
  const [state, formAction] = useActionState<EkipActionResult | null, FormData>(ekipAction, null);
  // При отказана или пропусната среща формата е отворена веднага — целта е нов час, не бутон.
  const [open, setOpen] = useState(mode === "retry" || mode === "cancelled" || mode === "noshow");
  const [preset, setPreset] = useState<string>("3h");
  const waiting = mode === "waiting";
  const given = mode === "given";
  const cancelled = mode === "cancelled";
  const noshow = mode === "noshow";
  const fromIvailo = given || cancelled || noshow;
  const noAnswers = lead.no_answers ?? 0;
  // Два пъти не вдигна → третото обаждане може да е последното.
  const giveUp = canGiveUp(noAnswers) && lead.stage !== "lost" && lead.stage !== "won";
  const notes = lead.team_notes ?? [];

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

  if (state?.ok && !state.keep) {
    return (
      <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        ✅ {name}: {state.message}
      </article>
    );
  }

  return (
    <article
      id={`lead-${lead.id}`}
      className={`scroll-mt-20 rounded-2xl border p-4 ${
        cancelled || noshow
          ? "border-rose-400/30 bg-rose-400/[0.05]"
          : waiting
            ? "border-amber-400/25 bg-amber-400/[0.04]"
            : given
              ? "border-violet-400/25 bg-violet-400/[0.04]"
              : "border-white/10 bg-white/[0.04] shadow-[0_10px_40px_-30px_rgba(6,182,212,0.6)]"
      }`}
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
        {waiting && lead.next_followup_at && (
          <span className="shrink-0 rounded-full border border-amber-400/40 px-2 py-0.5 text-[11px] text-amber-300">
            📵 пак {when(lead.next_followup_at)}
          </span>
        )}
        {given && (
          <span className="shrink-0 rounded-full border border-violet-400/40 px-2 py-0.5 text-[11px] text-violet-200">
            🤝 от Ивайло
          </span>
        )}
        {cancelled && (
          <span className="shrink-0 rounded-full border border-rose-400/45 px-2 py-0.5 text-[11px] text-rose-200">
            ❌ отказа срещата
          </span>
        )}
        {noshow && (
          <span className="shrink-0 rounded-full border border-rose-400/45 px-2 py-0.5 text-[11px] text-rose-200">
            🙈 не се яви{lead.missed_at ? ` · ${when(lead.missed_at)}` : ""}
          </span>
        )}
        {mode === "search" && (
          <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
            {STAGE_LABEL[lead.stage] ?? lead.stage}
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

      {lead.business && mode !== "fresh" && (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">🧭 {lead.business}</p>
      )}

      {fromIvailo && lead.given_reason && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            cancelled || noshow
              ? "border-rose-400/30 bg-rose-400/[0.07] text-rose-100"
              : "border-violet-400/25 bg-violet-400/[0.06] text-violet-100"
          }`}
        >
          {lead.given_reason}
        </p>
      )}

      {noshow && lead.missed_at && (
        <MessageBox
          title="💜 Готово съобщение след пропуснатата среща"
          formal={meetingMessage("noshow", { name: lead.full_name, whenIso: lead.missed_at, meetingUrl: lead.missed_url ?? null, setterName, formal: true })}
          informal={meetingMessage("noshow", { name: lead.full_name, whenIso: lead.missed_at, meetingUrl: lead.missed_url ?? null, setterName, formal: false })}
          phone={lead.phone}
          bookingId={lead.missed_booking_id ?? null}
          contactId={lead.id}
          kind="noshow"
        />
      )}

      {lead.notes && (
        <p className="mt-2 whitespace-pre-line rounded-lg bg-black/25 p-2 text-xs text-[var(--color-text-secondary)]">
          {lead.notes}
        </p>
      )}

      {notes.length > 0 && (
        <ul aria-label="Бележки" className="mt-2 space-y-1.5">
          {notes.map((n, i) => (
            <li key={`${n.at}-${i}`} className="rounded-lg border border-sky-400/20 bg-sky-400/[0.05] px-3 py-2 text-xs">
              <p className="line-clamp-4 whitespace-pre-line text-[var(--color-text-primary)]">📝 {n.body}</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                {n.by ?? "—"} · {when(n.at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {lead.last_attempt && (
        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
          Последно: {lead.last_attempt.title} · {when(lead.last_attempt.at)}
          {lead.last_attempt.by ? ` · ${lead.last_attempt.by}` : ""}
          {lead.attempts > 1 ? ` · ${lead.attempts} опита` : ""}
          {noAnswers > 1 ? ` · ${noAnswers} × не вдигна` : ""}
        </p>
      )}

      {state?.ok && state.keep && (
        <p className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          ✅ {state.message}
        </p>
      )}

      <form action={formAction} className="mt-3 border-t border-white/5 pt-3">
        <input type="hidden" name="contact_id" value={lead.id} />

        {!open ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {waiting ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold"
                    style={{ background: "var(--color-accent-cyan)", color: "var(--color-bg-void)" }}
                  >
                    💬 Върна обаждане / говорихме…
                  </button>
                  <SubmitBtn action="no_answer" className="border-white/15 text-[var(--color-text-secondary)]">
                    📵 Пак не вдигна
                  </SubmitBtn>
                  <SubmitBtn action="hide" className="border-white/15 text-[var(--color-text-tertiary)]">
                    🙈 Скрий
                  </SubmitBtn>
                  {giveUp && <GiveUpBtn name={name} noAnswers={noAnswers} />}
                </>
              ) : (
                <>
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
                  {giveUp && <GiveUpBtn name={name} noAnswers={noAnswers} />}
                </>
              )}
            </div>
            {giveUp && (
              <p className="text-[11px] leading-snug text-rose-200/70">
                📵 Не вдигна {noAnswers} пъти. Ако и сега не вдигне — „🚫 Спираме да звъним“: картата се затваря и никой няма
                да му звъни повече.
              </p>
            )}
            {/* Кога да звънне пак — на самата карта, без да се отваря цялата форма. */}
            <RetryPicker preset={preset} onPreset={setPreset} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-xs text-[var(--color-text-tertiary)]">
                С какво се занимава
                <select name="business" defaultValue={defaultOption} className={FIELD}>
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
                  className={FIELD}
                />
              </label>
            </div>
            <label className="block text-xs text-[var(--color-text-tertiary)]">
              Какво каза (една реплика стига)
              <textarea
                name="note"
                rows={2}
                placeholder="напр. „губя по 2 часа на ден в отговори на запитвания“"
                className={FIELD}
              />
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2">
                <label className="text-[11px] text-emerald-200/80">
                  📅 Среща с Ивайло ({MEETING_MINUTES} мин) на
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
                    placeholder="имейл — за поканата с Meet линк"
                    className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-[var(--color-text-primary)]"
                  />
                )}
                <label className="mt-1.5 flex items-start gap-2 text-[11px] leading-snug text-emerald-200/80">
                  <input type="checkbox" name="invite" value="1" defaultChecked className="mt-0.5 accent-emerald-400" />
                  <span>📨 Покана с Meet линк по имейл (през Cal.com). Ти получаваш готово съобщение за Viber с линка.</span>
                </label>
                <p className="mt-1 text-[10px] leading-snug text-emerald-200/50">
                  Без имейл няма линк — Ивайло звъни по телефона в уговорения час.
                </p>
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

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-2">
              <label className="min-w-0 flex-1 text-[11px] leading-snug text-amber-200/80">
                🗣 Говорихме, но не насрочихме среща — не знае кога ще му е удобно. Картата остава под ръка и излиза пак след
                <select
                  name="talked_after"
                  defaultValue={String(TALKED_DEFAULT_DAYS)}
                  className="mx-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-[var(--color-text-primary)]"
                >
                  {TALKED_AFTER_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d} дни
                    </option>
                  ))}
                </select>
              </label>
              <SubmitBtn action="talked" className="border-amber-400/60 bg-amber-500/15 text-amber-200">
                🗣 Говорихме, без среща засега
              </SubmitBtn>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 p-2">
              <p className="min-w-0 flex-1 text-[11px] leading-snug text-violet-200/80">
                🤝 Иска да се чуе направо с Ивайло — ще дойде на място, пита за цени, не иска час сега. Ивайло получава
                известие и човекът влиза в неговия списък; при теб картата изчезва.
              </p>
              <SubmitBtn action="handoff" className="border-violet-400/60 bg-violet-500/15 text-violet-200">
                🤝 Ивайло да му звънне
              </SubmitBtn>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 p-2">
              <div className="flex flex-wrap items-center gap-2">
                <RetryPicker preset={preset} onPreset={setPreset} />
                <SubmitBtn action="no_answer" className="border-white/15 text-[var(--color-text-secondary)]">
                  📵 Не вдигна
                </SubmitBtn>
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)]">
                След 7 дни без резултат картата се връща на Ивайло сама, с цялата история.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <SubmitBtn action="note" className="border-white/15 text-[var(--color-text-secondary)]">
                📝 Само бележка
              </SubmitBtn>
              {waiting && (
                <SubmitBtn action="hide" className="border-white/15 text-[var(--color-text-tertiary)]">
                  🙈 Скрий
                </SubmitBtn>
              )}
              <SubmitBtn action="not_interested" className="border-white/15 text-[var(--color-text-tertiary)]">
                ✕ Не се интересува
              </SubmitBtn>
              <SubmitBtn action="wrong_number" className="border-white/15 text-[var(--color-text-tertiary)]">
                ⛔ Грешен номер
              </SubmitBtn>
              {giveUp && <GiveUpBtn name={name} noAnswers={noAnswers} />}
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

/**
 * „Не вдигна — кога пак?“ Стои и на затворената карта (първо обаждане, „пак не
 * вдигна“), и в отворената форма: Димитър иска да каже „в четвъртък“ с едно
 * докосване, без да отваря целия панел. Полетата се четат само от действието
 * „Не вдигна“ (app/ekip/actions.ts); за другите бутони са безобидни.
 */
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
        {RETRY_PRESETS.map((p) => (
          <option key={p} value={p}>
            {RETRY_PRESET_LABEL[p]}
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

/** Затваря картата на човек, който не вдига — с потвърждение, защото е краен изход. */
function GiveUpBtn({ name, noAnswers }: { name: string; noAnswers: number }) {
  return (
    <SubmitBtn
      action="give_up"
      confirmText={`${name} не вдигна ${noAnswers} пъти. Спираме да му звъним? Картата излиза от всички списъци.`}
      className="border-rose-400/40 text-rose-200"
    >
      🚫 Спираме да звъним
    </SubmitBtn>
  );
}

function SubmitBtn({
  action,
  className,
  confirmText,
  children,
}: {
  action: string;
  className?: string;
  confirmText?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="action"
      value={action}
      disabled={pending}
      onClick={confirmText ? (e) => (window.confirm(confirmText) ? undefined : e.preventDefault()) : undefined}
      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${className ?? ""}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
